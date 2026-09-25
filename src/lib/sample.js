import { CURRENCIES } from "./currency";
import { currentYearMonth, todayISO } from "./format";

// Six months of made-up history for trying the app, in round amounts of the
// chosen currency. It starts cash-heavy and drifts towards the 25% targets,
// so every chart has something to show.
const MONTHS = [
  { stocks: 120, bonds: 60, gold: 50, cash: 270 },
  { stocks: 150, bonds: 80, gold: 70, cash: 230 },
  { stocks: 165, bonds: 100, gold: 85, cash: 200 },
  { stocks: 158, bonds: 118, gold: 96, cash: 185 },
  { stocks: 176, bonds: 128, gold: 104, cash: 170 },
  { stocks: 184, bonds: 135, gold: 118, cash: 160 },
];

function monthsBack(now, n) {
  return new Date(now.getFullYear(), now.getMonth() - n, 15);
}

export function sampleData(currency, now = new Date()) {
  const unit = (CURRENCIES[currency] || CURRENCIES.USD).unit;
  const scale = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v * unit]));

  const snapshots = MONTHS.map((row, i) => {
    const date = monthsBack(now, MONTHS.length - 1 - i);
    return { ym: currentYearMonth(date), date: todayISO(date), ...scale(row) };
  });
  const latest = scale(MONTHS[MONTHS.length - 1]);

  return {
    holdings: { ...latest, updatedAt: now.toISOString() },
    snapshots,
    sample: true,
  };
}
