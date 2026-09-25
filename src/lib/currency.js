// Currency handling. Every amount in the app is a plain number in the user's
// chosen currency; nothing is converted. `unit` is a round amount worth very
// roughly US$70 in that currency, used to scale presets, sample data and the
// rounding step so they look natural whichever currency is picked.

export const CURRENCIES = {
  JPY: { unit: 10000 },
  CNY: { unit: 500 },
  USD: { unit: 100 },
  EUR: { unit: 100 },
  GBP: { unit: 100 },
  HKD: { unit: 500 },
  TWD: { unit: 2000 },
  KRW: { unit: 100000 },
  SGD: { unit: 100 },
  AUD: { unit: 100 },
  CAD: { unit: 100 },
  CHF: { unit: 100 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES);

const LOCALES = { en: "en-US", zh: "zh-CN", ja: "ja-JP" };

export function localeFor(lang) {
  return LOCALES[lang] || LOCALES.en;
}

function unitOf(currency) {
  return (CURRENCIES[currency] || CURRENCIES.USD).unit;
}

// Presets for "Allocate new funds" and for the quick +/− popover.
export function allocatePresets(currency) {
  return [5, 10, 20, 50].map((n) => n * unitOf(currency));
}

export function adjustPresets(currency) {
  return [1, 3, 5, 10].map((n) => n * unitOf(currency));
}

export function defaultAllocateAmount(currency) {
  return 10 * unitOf(currency);
}

// Allocation suggestions are rounded to this step (¥100, $1, …).
export function roundingStep(currency) {
  return Math.max(1, unitOf(currency) / 100);
}

// A sensible first guess from the browser language; the user can change it in Settings.
export function defaultCurrencyFor(browserLanguage = "") {
  const tag = browserLanguage.toLowerCase();
  const byPrefix = [
    ["ja", "JPY"],
    ["zh-tw", "TWD"],
    ["zh-hant", "TWD"],
    ["zh-hk", "HKD"],
    ["zh", "CNY"],
    ["ko", "KRW"],
    ["en-gb", "GBP"],
    ["en-au", "AUD"],
    ["en-ca", "CAD"],
    ["en-sg", "SGD"],
    ["de-ch", "CHF"],
    ["de", "EUR"],
    ["fr", "EUR"],
    ["es", "EUR"],
    ["it", "EUR"],
    ["nl", "EUR"],
    ["pt-pt", "EUR"],
  ];
  const hit = byPrefix.find(([prefix]) => tag.startsWith(prefix));
  return hit ? hit[1] : "USD";
}

const formatters = new Map();

function formatter(lang, currency, compact) {
  const key = `${lang}|${currency}|${compact}`;
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat(localeFor(lang), {
        style: "currency",
        currency,
        maximumFractionDigits: compact ? 1 : 0,
        minimumFractionDigits: 0,
        ...(compact ? { notation: "compact" } : {}),
      })
    );
  }
  return formatters.get(key);
}

// ja-JP formats yen with the full-width "￥", which the display serif lacks and
// renders with a wide gap; the half-width sign reads the same.
const halfWidthYen = (text) => text.replace(/\uFFE5/g, "¥");

export function formatMoney(value, currency, lang) {
  if (value == null || isNaN(value)) return "—";
  return halfWidthYen(formatter(lang, currency, false).format(Math.round(value)));
}

// "¥5万" in Chinese/Japanese, "¥50K" in English.
export function formatMoneyCompact(value, currency, lang) {
  if (value == null || isNaN(value)) return "—";
  return halfWidthYen(formatter(lang, currency, true).format(value));
}

export function currencySymbol(currency, lang) {
  const part = formatter(lang, currency, false)
    .formatToParts(0)
    .find((p) => p.type === "currency");
  return part ? halfWidthYen(part.value) : currency;
}
