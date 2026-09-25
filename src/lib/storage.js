import { CATEGORY_KEYS } from "./format";
import { CURRENCY_CODES } from "./currency";

const DATA_KEY = "pp:data:v1";
const SYNC_KEY = "pp:sync:v1";
const LANG_KEY = "pp:lang";
const PRIVACY_KEY = "pp:privacy";

// v2: single currency implied to be JPY. v3: explicit settings.currency and per-class notes.
export const DATA_VERSION = 3;

// Every holding is the current market value in settings.currency, entered
// overwrite-style (whatever the brokerage app shows today). FX moves and
// interest simply show up as month-over-month change, like market moves.
export const DEFAULT_HOLDINGS = {
  stocks: 0,
  bonds: 0,
  gold: 0,
  cash: 0,
  updatedAt: null,
};

export const DEFAULT_SETTINGS = {
  targetStocks: 0.25,
  targetBonds: 0.25,
  targetGold: 0.25,
  targetCash: 0.25,
  threshold: 0.05,
  currency: "USD",
  // Optional free text shown under each class name, e.g. "NISA" or "Broker A".
  notes: { stocks: "", bonds: "", gold: "", cash: "" },
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Brings data from any source (localStorage, Gist, an imported file, any
// version) to the current shape. `fallbackCurrency` applies only to data that
// never had one and isn't from v1/v2, i.e. a brand-new user.
export function normalizeData(raw, fallbackCurrency = "USD") {
  const data = raw && typeof raw === "object" ? raw : {};
  const version = Number(data.version) || 0;
  const hasContent = Boolean(data.holdings || data.snapshots || data.settings);

  const holdings = { ...DEFAULT_HOLDINGS, ...(data.holdings || {}) };
  for (const key of CATEGORY_KEYS) holdings[key] = toNumber(holdings[key]);

  const rawSettings = data.settings || {};
  const legacyCurrency = hasContent && version < 3 ? "JPY" : fallbackCurrency;
  const currency = CURRENCY_CODES.includes(rawSettings.currency) ? rawSettings.currency : legacyCurrency;
  const settings = {
    ...DEFAULT_SETTINGS,
    ...rawSettings,
    currency,
    notes: { ...DEFAULT_SETTINGS.notes, ...(rawSettings.notes || {}) },
  };

  const snapshots = Array.isArray(data.snapshots)
    ? data.snapshots
        .filter((s) => s && typeof s.ym === "string")
        .map((s) => ({ ...s, ...Object.fromEntries(CATEGORY_KEYS.map((k) => [k, toNumber(s[k])])) }))
        .sort((a, b) => a.ym.localeCompare(b.ym))
    : [];

  return { version: DATA_VERSION, holdings, settings, snapshots, sample: Boolean(data.sample) };
}

export function hasHoldings(holdings) {
  return CATEGORY_KEYS.some((k) => holdings[k] > 0);
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Load failed", err);
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Save failed", err);
  }
}

export function loadPortfolioData() {
  return readJSON(DATA_KEY);
}

export function savePortfolioData(data) {
  writeJSON(DATA_KEY, data);
}

export function clearPortfolioData() {
  try {
    localStorage.removeItem(DATA_KEY);
  } catch {
    // ignore
  }
}

const EMPTY_SYNC = { token: "", gistId: "", enabled: false, lastSyncAt: null };

export function loadSyncSettings() {
  return readJSON(SYNC_KEY) || { ...EMPTY_SYNC };
}

export function saveSyncSettings(settings) {
  writeJSON(SYNC_KEY, settings);
}

export function loadPreference(name, fallback) {
  const key = name === "lang" ? LANG_KEY : PRIVACY_KEY;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function savePreference(name, value) {
  const key = name === "lang" ? LANG_KEY : PRIVACY_KEY;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}
