import { describe, expect, it } from "vitest";
import { DATA_VERSION, hasHoldings, normalizeData } from "../src/lib/storage";
import { sampleData } from "../src/lib/sample";

describe("normalizeData", () => {
  it("gives a new user empty holdings in the fallback currency", () => {
    const data = normalizeData(null, "EUR");
    expect(data.version).toBe(DATA_VERSION);
    expect(hasHoldings(data.holdings)).toBe(false);
    expect(data.settings.currency).toBe("EUR");
    expect(data.settings.notes).toEqual({ stocks: "", bonds: "", gold: "", cash: "" });
    expect(data.snapshots).toEqual([]);
  });

  it("treats v2 data (before currencies existed) as JPY", () => {
    const v2 = {
      version: 2,
      holdings: { stocks: 100, bonds: 50, gold: 50, cash: 300, updatedAt: "2026-07-01" },
      settings: { targetStocks: 0.25, targetBonds: 0.25, targetGold: 0.25, targetCash: 0.25, threshold: 0.05 },
      snapshots: [{ ym: "2026-07", date: "2026-07-01", stocks: 100, bonds: 50, gold: 50, cash: 300 }],
    };
    const data = normalizeData(v2, "USD");
    expect(data.settings.currency).toBe("JPY");
    expect(data.holdings.stocks).toBe(100);
    expect(data.snapshots).toHaveLength(1);
  });

  it("keeps an explicit currency and fills missing fields", () => {
    const data = normalizeData({ version: 3, settings: { currency: "GBP", threshold: 0.1 } }, "USD");
    expect(data.settings.currency).toBe("GBP");
    expect(data.settings.threshold).toBe(0.1);
    expect(data.settings.targetStocks).toBe(0.25);
  });

  it("repairs bad values instead of crashing", () => {
    const data = normalizeData({ holdings: { stocks: "abc", bonds: "12" }, snapshots: [{ ym: "2026-02", stocks: "5" }, null, { foo: 1 }] });
    expect(data.holdings.stocks).toBe(0);
    expect(data.holdings.bonds).toBe(12);
    expect(data.snapshots).toEqual([{ ym: "2026-02", stocks: 5, bonds: 0, gold: 0, cash: 0 }]);
    expect(normalizeData({ settings: { currency: "XYZ" } }, "USD").settings.currency).not.toBe("XYZ");
  });
});

describe("sampleData", () => {
  it("builds six months ending this month, in round amounts of the currency", () => {
    const data = sampleData("USD", new Date(2026, 8, 20));
    expect(data.sample).toBe(true);
    expect(data.snapshots.map((s) => s.ym)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(data.holdings.stocks).toBe(18400);
    expect(sampleData("JPY", new Date(2026, 8, 20)).holdings.stocks).toBe(1840000);
  });

  it("round-trips through normalizeData", () => {
    const data = normalizeData({ ...sampleData("JPY"), settings: { currency: "JPY" }, version: 3 });
    expect(data.sample).toBe(true);
    expect(hasHoldings(data.holdings)).toBe(true);
  });
});
