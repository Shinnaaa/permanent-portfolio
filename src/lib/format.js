export const CATEGORY_KEYS = ["stocks", "bonds", "gold", "cash"];

export const CATEGORY_COLORS = {
  stocks: "#c8a96a",
  bonds: "#6a8caa",
  gold: "#b8694e",
  cash: "#7a8b6f",
};

export function formatPercent(value, digits = 1) {
  if (value == null || isNaN(value)) return "—";
  return (value * 100).toFixed(digits) + "%";
}

// Local calendar date/month (not UTC: in UTC+9 a morning save would otherwise land on yesterday).
function localParts(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return { y, m, d };
}

export function todayISO(date) {
  const { y, m, d } = localParts(date);
  return `${y}-${m}-${d}`;
}

export function currentYearMonth(date) {
  const { y, m } = localParts(date);
  return `${y}-${m}`;
}

const MULTIPLIERS = { 万: 1e4, k: 1e3, K: 1e3, m: 1e6, M: 1e6 };

// Parses a numeric expression typed into an amount field: arithmetic, thousands
// separators, a trailing currency sign, and the shorthands 万 (x10,000),
// k (x1,000) and m (x1,000,000). Returns null unless the input is a safe
// arithmetic expression, because the result is evaluated with `Function`.
export function parseExpression(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (!/^[\d+\-*/.() \t万kKmM円元¥$€£,]+$/.test(trimmed)) return null;

  let expr = trimmed.replace(/[,円元¥$€£]/g, "");
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*([万kKmM])/g, (_, num, suffix) => `(${num}*${MULTIPLIERS[suffix]})`);
  // Only digits and operators may remain before evaluation, and no comment
  // markers: "12)//" would otherwise comment out the closing ")" of the wrapper.
  if (!/^[\d+\-*/.() \t]+$/.test(expr) || /\/[/*]/.test(expr)) return null;

  try {
    const result = Function(`"use strict"; return (${expr});`)();
    return typeof result !== "number" || !isFinite(result) ? null : result;
  } catch {
    return null;
  }
}
