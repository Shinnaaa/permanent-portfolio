import { CATEGORY_KEYS, currentYearMonth } from "./format";

// Derives the dashboard view model (totals, per-category rebalance state,
// balance score, and month-over-month change) from raw holdings/settings/snapshots.
export function computePortfolio(holdings, settings, snapshots, now = new Date()) {
  const values = { stocks: holdings.stocks || 0, bonds: holdings.bonds || 0, gold: holdings.gold || 0, cash: holdings.cash || 0 };
  const targets = {
    stocks: settings.targetStocks,
    bonds: settings.targetBonds,
    gold: settings.targetGold,
    cash: settings.targetCash,
  };
  const total = values.stocks + values.bonds + values.gold + values.cash;

  const cats = CATEGORY_KEYS.map((key) => {
    const value = values[key];
    const target = targets[key];
    const share = total > 0 ? value / total : 0;
    const targetAmt = total * target;
    const diff = targetAmt - value;
    const dev = share - target;
    const inThreshold = Math.abs(dev) < settings.threshold;
    const action = inThreshold ? "hold" : diff > 0 ? "add" : "reduce";
    const note = (settings.notes && settings.notes[key]) || "";
    return { key, note, value, target, share, targetAmt, diff, dev, inThreshold, action };
  });

  const totalDev = cats.reduce((sum, c) => sum + Math.abs(c.dev), 0) / 2;
  const balanceScore = Math.max(0, 1 - totalDev / 0.5);

  const sorted = [...snapshots].sort((a, b) => a.ym.localeCompare(b.ym));
  const thisMonth = currentYearMonth(now);
  const priorSnapshot = [...sorted].reverse().find((s) => s.ym !== thisMonth) || null;

  let mom = null;
  if (priorSnapshot) {
    const priorTotal = priorSnapshot.stocks + priorSnapshot.bonds + priorSnapshot.gold + priorSnapshot.cash;
    if (priorTotal > 0) {
      mom = {
        ym: priorSnapshot.ym,
        priorTotal,
        delta: total - priorTotal,
        deltaPct: (total - priorTotal) / priorTotal,
      };
    }
  }

  return { total, cats, totalDev, balanceScore, mom };
}
