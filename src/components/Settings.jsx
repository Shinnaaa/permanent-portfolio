import { useState } from "react";
import { CURRENCY_CODES } from "../lib/currency";
import { CATEGORY_KEYS, formatPercent } from "../lib/format";
import { useLocale } from "../locale";

const TARGET_FIELDS = [
  { key: "targetStocks", cat: "stocks" },
  { key: "targetBonds", cat: "bonds" },
  { key: "targetGold", cat: "gold" },
  { key: "targetCash", cat: "cash" },
];

export default function Settings({ settings, onSave, onReset, sync, syncStatus, syncError, onConnectSync, onDisconnectSync, onManualPull }) {
  const { t, catLabel } = useLocale();
  const [local, setLocal] = useState({ ...settings, notes: { ...settings.notes } });
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);

  const targetSum = local.targetStocks + local.targetBonds + local.targetGold + local.targetCash;
  const targetsValid = Math.abs(targetSum - 1) < 0.001;

  const setPercentField = (key, raw) => {
    const num = raw === "" ? 0 : Number(raw);
    if (!isNaN(num)) setLocal({ ...local, [key]: num / 100 });
  };

  return (
    <div className="settings">
      <div className="update-head">
        <h1>{t("set.title")}</h1>
        <p className="update-sub">{t("set.sub")}</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{t("set.general")}</h2>
        </div>
        <div className="set-row">
          <div className="set-meta">
            <div className="set-label">{t("set.currency")}</div>
            <div className="set-en">{t("set.currencyHint")}</div>
          </div>
          <div className="upd-input-wrap">
            <select
              className="upd-input set-select"
              value={local.currency}
              onChange={(e) => setLocal({ ...local, currency: e.target.value })}
            >
              {CURRENCY_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{t("cloud.title")}</h2>
          <span className={`card-sub sync-status-${syncStatus}`}>
            {sync.enabled
              ? syncStatus === "syncing"
                ? t("cloud.statusSyncing")
                : syncStatus === "err"
                ? t("cloud.statusError")
                : sync.lastSyncAt
                ? t("sync.lastSync", { time: new Date(sync.lastSyncAt).toLocaleString() })
                : t("cloud.statusConnected")
              : t("cloud.statusOff")}
          </span>
        </div>
        {sync.enabled ? (
          <>
            <p className="sync-text">
              {t("cloud.connectedTo", { id: `${sync.gistId.slice(0, 8)}…` })}
              {sync.lastSyncAt && t("cloud.lastSync", { time: new Date(sync.lastSyncAt).toLocaleString() })}
            </p>
            <p className="sync-text" style={{ fontSize: 13, color: "#7a7368" }}>
              {t("cloud.autoBody")}
            </p>
            <div className="sync-actions">
              <button className="btn-ghost" onClick={onManualPull} disabled={syncStatus === "syncing"}>
                {t("cloud.pull")}
              </button>
              <button className="btn-ghost danger" onClick={onDisconnectSync}>
                {t("cloud.disconnect")}
              </button>
            </div>
            {syncError && <div className="sync-error">{syncError}</div>}
          </>
        ) : (
          <>
            <p className="sync-text">{t("cloud.intro")}</p>
            <ol className="sync-steps">
              <li>
                {t("cloud.step1")}{" "}
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
                  github.com/settings/personal-access-tokens
                </a>
              </li>
              <li>{t("cloud.step2")}</li>
              <li>{t("cloud.step3")}</li>
              <li>
                <strong>{t("cloud.step4")}</strong>
              </li>
              <li>{t("cloud.step5")}</li>
              <li>{t("cloud.step6")} →</li>
            </ol>
            <div className="set-row sync-input-row">
              <div className="upd-input-wrap" style={{ flex: 1 }}>
                <input
                  type={showToken ? "text" : "password"}
                  className="upd-input"
                  placeholder="github_pat_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="upd-cur-label"
                  style={{ cursor: "pointer", background: "none", border: "none", borderLeft: "1px solid #2a2823" }}
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? t("cloud.hide") : t("cloud.show")}
                </button>
              </div>
            </div>
            <div className="sync-actions">
              <button className="btn-primary" disabled={!tokenInput || syncStatus === "syncing"} onClick={() => onConnectSync(tokenInput.trim())}>
                {syncStatus === "syncing" ? t("cloud.connecting") : t("cloud.connect")}
              </button>
            </div>
            {syncError && <div className="sync-error">{syncError}</div>}
          </>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{t("set.targets")}</h2>
          <span className={`card-sub ${targetsValid ? "" : "warn"}`}>
            {t("set.sum", { pct: formatPercent(targetSum) })} {targetsValid ? "✓" : t("set.mustBe100")}
          </span>
        </div>
        {TARGET_FIELDS.map((field) => (
          <div key={field.key} className="set-row">
            <div className="set-meta">
              <div className="set-label">{catLabel(field.cat)}</div>
            </div>
            <div className="upd-input-wrap">
              <input
                type="number"
                step="1"
                inputMode="decimal"
                className="upd-input"
                value={(local[field.key] * 100).toFixed(1)}
                onChange={(e) => setPercentField(field.key, e.target.value)}
              />
              <span className="upd-cur-label">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{t("set.threshold")}</h2>
        </div>
        <div className="set-row">
          <div className="set-meta">
            <div className="set-label">{t("set.tolerance")}</div>
            <div className="set-en">{t("set.toleranceHint")}</div>
          </div>
          <div className="upd-input-wrap">
            <input
              type="number"
              step="1"
              inputMode="decimal"
              className="upd-input"
              value={(local.threshold * 100).toFixed(1)}
              onChange={(e) => setPercentField("threshold", e.target.value)}
            />
            <span className="upd-cur-label">%</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{t("set.notes")}</h2>
        </div>
        <p className="sync-text">{t("set.notesHint")}</p>
        {CATEGORY_KEYS.map((key) => (
          <div key={key} className="set-row">
            <div className="set-meta">
              <div className="set-label">{catLabel(key)}</div>
            </div>
            <div className="upd-input-wrap">
              <input
                type="text"
                className="upd-input set-text"
                maxLength={40}
                value={local.notes[key]}
                onChange={(e) => setLocal({ ...local, notes: { ...local.notes, [key]: e.target.value } })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="update-actions">
        <button className="btn-primary" disabled={!targetsValid} onClick={() => onSave(local)}>
          {t("set.save")}
        </button>
      </div>

      <div className="card danger-card">
        <div className="card-head">
          <h2>{t("set.data")}</h2>
        </div>
        <p className="sync-text">{t("set.dataHint")}</p>
        <div className="sync-actions">
          <button className="btn-ghost danger" onClick={onReset}>
            {t("set.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
