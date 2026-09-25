import { describe, expect, it } from "vitest";
import { computeAllocation } from "../src/lib/allocate";
import { computePortfolio } from "../src/lib/compute";
import { DEFAULT_SETTINGS } from "../src/lib/storage";

const settings = { ...DEFAULT_SETTINGS, notes: { ...DEFAULT_SETTINGS.notes, stocks: "NISA" } };
const holdings = { stocks: 400000, bonds: 200000, gold: 200000, cash: 200000 };
const NOW = new Date(2026, 8, 20);

describe("computePortfolio", () => {
  const { total, cats, balanceScore, totalDev } = computePortfolio(holdings, settings, [], NOW);

  it("derives shares, deviation and actions", () => {
    expect(total).toBe(1000000);
    const stocks = cats.find((c) => c.key === "stocks");
    expect(stocks.share).toBeCloseTo(0.4);
    expect(stocks.dev).toBeCloseTo(0.15);
    expect(stocks.action).toBe("reduce");
    expect(stocks.note).toBe("NISA");
    expect(cats.find((c) => c.key === "bonds").action).toBe("hold");
  });

  it("scores balance from total deviation", () => {
    expect(totalDev).toBeCloseTo(0.15);
    expect(balanceScore).toBeCloseTo(0.7);
    expect(computePortfolio({ stocks: 1, bonds: 1, gold: 1, cash: 1 }, settings, [], NOW).balanceScore).toBe(1);
  });

  it("compares with the latest snapshot from an earlier month", () => {
    const snapshots = [
      { ym: "2026-07", stocks: 100000, bonds: 100000, gold: 100000, cash: 100000 },
      { ym: "2026-08", stocks: 200000, bonds: 200000, gold: 200000, cash: 200000 },
      { ym: "2026-09", stocks: 1, bonds: 1, gold: 1, cash: 1 },
    ];
    const { mom } = computePortfolio(holdings, settings, snapshots, NOW);
    expect(mom.ym).toBe("2026-08");
    expect(mom.delta).toBe(200000);
    expect(mom.deltaPct).toBeCloseTo(0.25);
  });

  it("handles an empty portfolio", () => {
    const empty = computePortfolio({ stocks: 0, bonds: 0, gold: 0, cash: 0 }, settings, [], NOW);
    expect(empty.total).toBe(0);
    expect(empty.cats.every((c) => c.share === 0)).toBe(true);
    expect(empty.mom).toBeNull();
  });
});

describe("computeAllocation", () => {
  const { total, cats } = computePortfolio(holdings, settings, [], NOW);
  const sum = (s) => s.reduce((acc, x) => acc + x.amount, 0);

  it("smart mode fills the underweight classes first and sums exactly", () => {
    const { suggestions } = computeAllocation(123456, "smart", total, cats);
    expect(sum(suggestions)).toBe(123456);
    expect(suggestions.find((s) => s.key === "stocks").amount).toBe(0);
  });

  it("spills beyond the gaps by target weight", () => {
    const { suggestions, projection } = computeAllocation(1000000, "smart", total, cats);
    expect(sum(suggestions)).toBe(1000000);
    // Gaps are measured against the current total, so the result moves every class
    // towards its target without promising to land inside the threshold.
    for (const p of projection) expect(Math.abs(p.newShare - p.target)).toBeLessThan(Math.abs(p.share - p.target) + 1e-9);
  });

  it("proportional mode splits by target weight", () => {
    const { suggestions } = computeAllocation(1000, "proportional", total, cats);
    expect(suggestions.map((s) => s.amount)).toEqual([250, 250, 250, 250]);
  });

  it("rounds to the currency's step", () => {
    const { suggestions } = computeAllocation(1003, "smart", 10000, computePortfolio({ stocks: 4000, bonds: 2000, gold: 2000, cash: 2000 }, settings, [], NOW).cats, 1);
    expect(sum(suggestions)).toBe(1003);
    expect(suggestions.every((s) => Number.isInteger(s.amount))).toBe(true);
  });

  it("returns nothing for a non-positive amount", () => {
    expect(computeAllocation(0, "smart", total, cats).suggestions).toBeNull();
  });
});
