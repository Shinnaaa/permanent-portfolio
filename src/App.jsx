import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dashboard from "./components/Dashboard";
import Onboarding from "./components/Onboarding";
import UpdateForm from "./components/UpdateForm";
import AllocateFunds from "./components/AllocateFunds";
import Settings from "./components/Settings";
import History from "./components/History";
import { computePortfolio } from "./lib/compute";
import { defaultCurrencyFor } from "./lib/currency";
import { CATEGORY_KEYS, todayISO, currentYearMonth } from "./lib/format";
import { LANGUAGES, detectLanguage } from "./lib/i18n";
import { sampleData } from "./lib/sample";
import {
  DATA_VERSION,
  DEFAULT_HOLDINGS,
  DEFAULT_SETTINGS,
  clearPortfolioData,
  hasHoldings,
  loadPortfolioData,
  loadPreference,
  loadSyncSettings,
  normalizeData,
  savePortfolioData,
  savePreference,
  saveSyncSettings,
} from "./lib/storage";
import { getOrCreateGist, readGist, updateGist, verifyToken, GIST_FILENAME } from "./lib/gistSync";
import { LocaleContext, makeLocale } from "./locale";

const browserLanguages = typeof navigator !== "undefined" ? navigator.languages || [navigator.language] : [];
const FALLBACK_CURRENCY = defaultCurrencyFor(browserLanguages[0] || "");

export default function App() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, currency: FALLBACK_CURRENCY });
  const [snapshots, setSnapshots] = useState([]);
  const [isSample, setIsSample] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [privacy, setPrivacy] = useState(() => loadPreference("privacy", "0") === "1");
  const [lang, setLang] = useState(() => loadPreference("lang", null) || detectLanguage(browserLanguages));
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const locale = useMemo(() => makeLocale(lang, settings.currency), [lang, settings.currency]);
  const { t } = locale;

  const [sync, setSync] = useState(loadSyncSettings);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncError, setSyncError] = useState(null);
  const skipNextPush = useRef(false);
  const hasSyncedOnce = useRef(false);
  const [toast, setToast] = useState(null);

  const changeLang = (code) => {
    setLang(code);
    savePreference("lang", code);
  };

  const togglePrivacy = () => {
    const next = !privacy;
    setPrivacy(next);
    savePreference("privacy", next ? "1" : "0");
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Replaces all portfolio state with already-normalized data. `fromRemote`
  // suppresses the echo push right after pulling from the Gist.
  const applyData = useCallback((data, { fromRemote = false } = {}) => {
    if (fromRemote) skipNextPush.current = true;
    setHoldings(data.holdings);
    setSettings(data.settings);
    setSnapshots(data.snapshots);
    setIsSample(data.sample);
  }, []);

  // Load persisted data once on mount.
  useEffect(() => {
    const stored = loadPortfolioData();
    if (stored) applyData(normalizeData(stored, FALLBACK_CURRENCY));
    setLoaded(true);
  }, [applyData]);

  // Pull once from Gist on first load if sync is enabled.
  useEffect(() => {
    if (!loaded || !sync.enabled || !sync.token || !sync.gistId || hasSyncedOnce.current) return;
    hasSyncedOnce.current = true;
    (async () => {
      setSyncStatus("syncing");
      try {
        const { data, updatedAt } = await readGist(sync.token, sync.gistId);
        applyData(normalizeData(data, settings.currency), { fromRemote: true });
        const nextSync = { ...sync, lastSyncAt: updatedAt };
        setSync(nextSync);
        saveSyncSettings(nextSync);
        setSyncStatus("ok");
      } catch (err) {
        setSyncStatus("err");
        setSyncError(err.message);
      }
    })();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- pull once per sync configuration, not on every state change
  }, [loaded, sync.enabled, sync.token, sync.gistId]);

  const payload = useCallback(
    () => ({ version: DATA_VERSION, holdings, settings, snapshots, sample: isSample, savedAt: new Date().toISOString() }),
    [holdings, settings, snapshots, isSample]
  );

  // Persist to localStorage on every change, once initial load has happened.
  useEffect(() => {
    if (!loaded) return;
    savePortfolioData(payload());
  }, [payload, loaded]);

  // Debounced push to Gist. Skipped once right after a pull, so we don't
  // immediately echo back what we just received.
  useEffect(() => {
    if (!loaded || !sync.enabled || !sync.token || !sync.gistId) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const { updatedAt } = await updateGist(sync.token, sync.gistId, payload());
        const nextSync = { ...sync, lastSyncAt: updatedAt };
        setSync(nextSync);
        saveSyncSettings(nextSync);
        setSyncStatus("ok");
        setSyncError(null);
      } catch (err) {
        setSyncStatus("err");
        setSyncError(err.message);
      }
    }, 1500);
    return () => clearTimeout(timer);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `sync` changes on every push (lastSyncAt); depending on it would loop
  }, [payload, loaded, sync.enabled, sync.token, sync.gistId]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ ...payload(), exportedAt: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `portfolio-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t("toast.exported"));
  };

  const triggerImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid file");
      if (!window.confirm(t("confirm.import"))) {
        e.target.value = "";
        return;
      }
      applyData(normalizeData(parsed, settings.currency));
      showToast(t("toast.imported"));
    } catch (err) {
      showToast(t("toast.importFailed", { msg: err.message }), "err");
    }
    e.target.value = "";
  };

  const connectSync = useCallback(
    async (token) => {
      if (!token) return;
      setSyncStatus("syncing");
      setSyncError(null);
      try {
        await verifyToken(token);
        const gist = await getOrCreateGist(token, sync.gistId);
        const nextSync = { token, gistId: gist.id, enabled: true, lastSyncAt: gist.updated_at };
        setSync(nextSync);
        saveSyncSettings(nextSync);

        const remoteData = JSON.parse(gist.files[GIST_FILENAME].content || "{}");
        const remoteHasData = remoteData.holdings && hasHoldings(normalizeData(remoteData).holdings);
        const localHasData = hasHoldings(holdings) || snapshots.length > 0;

        const pullRemote = () => applyData(normalizeData(remoteData, settings.currency), { fromRemote: true });
        const pushLocal = () => updateGist(token, gist.id, payload());

        if (remoteHasData && localHasData) {
          if (window.confirm(t("confirm.syncConflict"))) pullRemote();
          else await pushLocal();
        } else if (remoteHasData) {
          pullRemote();
        } else if (localHasData) {
          await pushLocal();
        }

        hasSyncedOnce.current = true;
        setSyncStatus("ok");
        showToast(t("toast.syncConnected"));
      } catch (err) {
        setSyncStatus("err");
        setSyncError(err.message);
        showToast(t("toast.connectFailed", { msg: err.message }), "err");
      }
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `t` only changes with the language; a stale label is harmless here
    [sync.gistId, holdings, snapshots, settings.currency, payload, applyData]
  );

  const disconnectSync = () => {
    if (!window.confirm(t("confirm.disconnect"))) return;
    const nextSync = { token: "", gistId: "", enabled: false, lastSyncAt: null };
    setSync(nextSync);
    saveSyncSettings(nextSync);
    setSyncStatus("idle");
    showToast(t("toast.disconnected"));
  };

  const manualPull = async () => {
    if (!sync.token || !sync.gistId) return;
    setSyncStatus("syncing");
    try {
      const { data, updatedAt } = await readGist(sync.token, sync.gistId);
      applyData(normalizeData(data, settings.currency), { fromRemote: true });
      const nextSync = { ...sync, lastSyncAt: updatedAt };
      setSync(nextSync);
      saveSyncSettings(nextSync);
      setSyncStatus("ok");
      showToast(t("toast.pulled"));
    } catch (err) {
      setSyncStatus("err");
      setSyncError(err.message);
      showToast(t("toast.pullFailed", { msg: err.message }), "err");
    }
  };

  const handleSaveUpdate = (update) => {
    const nextHoldings = { ...editingSnapshot, ...update, updatedAt: new Date().toISOString() };
    setHoldings(nextHoldings);
    const ym = currentYearMonth();
    const snapshot = { ym, date: todayISO(), ...Object.fromEntries(CATEGORY_KEYS.map((k) => [k, nextHoldings[k]])) };
    // Real numbers replace the made-up sample history rather than mixing with it.
    const kept = isSample ? [] : snapshots.filter((s) => s.ym !== ym);
    setSnapshots([...kept, snapshot].sort((a, b) => a.ym.localeCompare(b.ym)));
    setIsSample(false);
    setActiveTab("dashboard");
    showToast(t("toast.saved"));
  };

  const loadSample = () => {
    const sample = sampleData(settings.currency);
    setHoldings(sample.holdings);
    setSnapshots(sample.snapshots);
    setIsSample(true);
    showToast(t("toast.sampleLoaded"));
  };

  const clearSample = () => {
    setHoldings(DEFAULT_HOLDINGS);
    setSnapshots([]);
    setIsSample(false);
  };

  const resetAll = () => {
    if (!window.confirm(t("confirm.reset"))) return;
    clearPortfolioData();
    setHoldings(DEFAULT_HOLDINGS);
    setSnapshots([]);
    setSettings({ ...DEFAULT_SETTINGS, currency: settings.currency });
    setIsSample(false);
    setActiveTab("dashboard");
    showToast(t("toast.reset"));
  };

  const computed = useMemo(() => computePortfolio(holdings, settings, snapshots), [holdings, settings, snapshots]);

  const openUpdate = () => {
    setEditingSnapshot({ ...holdings });
    setActiveTab("update");
  };

  const goTo = (tab) => {
    if (tab === "update") openUpdate();
    else setActiveTab(tab);
    setMenuOpen(false);
  };

  if (!loaded) {
    return (
      <div className="pp-loading">
        <div>{t("loading")}</div>
      </div>
    );
  }

  const isEmpty = !hasHoldings(holdings);
  const tabs = ["dashboard", "update", "allocate", "history", "settings"];
  const tabLabel = { dashboard: "nav.overview", update: "nav.update", allocate: "nav.allocate", history: "nav.history", settings: "nav.settings" };

  return (
    <LocaleContext.Provider value={locale}>
      <div className="pp-app" data-privacy={privacy ? "1" : "0"}>
        <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={handleImportFile} />
        <header className="pp-header">
          <div className="pp-header-inner">
            <div className="pp-brand">
              <div className="pp-brand-mark">PP</div>
              <div className="pp-brand-text">
                <div className="pp-brand-title">Permanent Portfolio</div>
                <div className="pp-brand-sub">
                  {t("brand.sub")} · {todayISO()}
                </div>
              </div>
            </div>
            <nav className="pp-nav">
              <div className="pp-tabs">
                {tabs.map((tab) => (
                  <button key={tab} className={activeTab === tab ? "on" : ""} onClick={() => goTo(tab)}>
                    {t(tabLabel[tab])}
                  </button>
                ))}
              </div>
              <div className="pp-tools">
                {sync.enabled && (
                  <button
                    className={`sync-pill sync-${syncStatus}`}
                    onClick={manualPull}
                    title={syncError || (sync.lastSyncAt ? t("sync.lastSync", { time: new Date(sync.lastSyncAt).toLocaleString() }) : t("sync.clickToPull"))}
                  >
                    <span className="sync-dot" />
                    <span className="sync-text">
                      {syncStatus === "syncing" ? t("sync.syncing") : syncStatus === "err" ? t("sync.error") : t("sync.synced")}
                    </span>
                  </button>
                )}
                <div className="pp-lang" role="group" aria-label={t("nav.language")}>
                  {LANGUAGES.map((l) => (
                    <button key={l.code} className={lang === l.code ? "on" : ""} title={l.name} onClick={() => changeLang(l.code)}>
                      {l.short}
                    </button>
                  ))}
                </div>
                <div className="pp-tools-inline">
                  <button className={`ic privacy-toggle ${privacy ? "on" : ""}`} title={privacy ? t("privacy.show") : t("privacy.hide")} onClick={togglePrivacy}>
                    {privacy ? "◐" : "○"}
                  </button>
                  <button className="ic" title={t("data.export")} onClick={exportJSON}>
                    ↓
                  </button>
                  <button className="ic" title={t("data.import")} onClick={triggerImportClick}>
                    ↑
                  </button>
                </div>
                <button className={`ic pp-menu-btn ${menuOpen ? "on" : ""}`} title={t("nav.more")} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
                  ⋯
                </button>
              </div>
            </nav>
            {menuOpen && (
              <>
                <div className="pp-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="pp-menu" role="menu">
                  <button className={`pp-menu-item ${privacy ? "on" : ""}`} onClick={() => { togglePrivacy(); setMenuOpen(false); }}>
                    <span className="pp-menu-icon">{privacy ? "◐" : "○"}</span>
                    <span className="pp-menu-label">{privacy ? t("privacy.show") : t("privacy.hide")}</span>
                    <span className="pp-menu-sub">{privacy ? t("privacy.on") : t("privacy.off")}</span>
                  </button>
                  <button className="pp-menu-item" onClick={() => { exportJSON(); setMenuOpen(false); }}>
                    <span className="pp-menu-icon">↓</span>
                    <span className="pp-menu-label">{t("data.export")}</span>
                    <span className="pp-menu-sub">{t("data.exportSub")}</span>
                  </button>
                  <button className="pp-menu-item" onClick={() => { triggerImportClick(); setMenuOpen(false); }}>
                    <span className="pp-menu-icon">↑</span>
                    <span className="pp-menu-label">{t("data.import")}</span>
                    <span className="pp-menu-sub">{t("data.importSub")}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="pp-main">
          {isSample && activeTab !== "settings" && (
            <div className="sample-banner">
              <span>{t("sample.banner")}</span>
              <button className="btn-ghost" onClick={clearSample}>
                {t("sample.clear")}
              </button>
            </div>
          )}
          {activeTab === "dashboard" &&
            (isEmpty ? (
              <Onboarding
                onCurrencyChange={(currency) => setSettings({ ...settings, currency })}
                onEnter={openUpdate}
                onSample={loadSample}
              />
            ) : (
              <Dashboard computed={computed} holdings={holdings} settings={settings} onUpdate={openUpdate} />
            ))}
          {activeTab === "update" && (
            <UpdateForm editing={editingSnapshot} notes={settings.notes} onSave={handleSaveUpdate} onCancel={() => setActiveTab("dashboard")} />
          )}
          {activeTab === "settings" && (
            <Settings
              settings={settings}
              onSave={(s) => {
                setSettings(s);
                showToast(t("toast.settingsSaved"));
              }}
              onReset={resetAll}
              sync={sync}
              syncStatus={syncStatus}
              syncError={syncError}
              onConnectSync={connectSync}
              onDisconnectSync={disconnectSync}
              onManualPull={manualPull}
            />
          )}
          {activeTab === "allocate" && <AllocateFunds key={settings.currency} computed={computed} />}
          {activeTab === "history" && (
            <History
              snapshots={snapshots}
              onClear={() => {
                if (window.confirm(t("confirm.clearSnapshots"))) {
                  setSnapshots([]);
                  showToast(t("toast.snapshotsCleared"));
                }
              }}
              onExport={exportJSON}
              onImport={triggerImportClick}
            />
          )}
        </main>

        <footer className="pp-footer">
          <span>Harry Browne · 1981</span>
          <span className="pp-dot">·</span>
          <span>{t("footer.classes")}</span>
          <span className="pp-dot">·</span>
          <span>{holdings.updatedAt ? t("footer.lastUpdate", { date: holdings.updatedAt.slice(0, 10) }) : t("footer.never")}</span>
          <span className="pp-dot">·</span>
          <span>{t("footer.storage")}</span>
        </footer>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    </LocaleContext.Provider>
  );
}
