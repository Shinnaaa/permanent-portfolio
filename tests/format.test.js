import { describe, expect, it } from "vitest";
import { currentYearMonth, formatPercent, parseExpression, todayISO } from "../src/lib/format";

describe("parseExpression", () => {
  it.each([
    ["50000", 50000],
    ["-120", -120],
    ["50,000", 50000],
    ["5万", 50000],
    ["1.5万+3000", 18000],
    ["1.2k", 1200],
    ["2M", 2000000],
    ["50000+3000*2", 56000],
    ["(1000+500)/3", 500],
    ["12000円", 12000],
    ["$1,500", 1500],
    ["€200+50", 250],
  ])("%s → %s", (input, expected) => {
    expect(parseExpression(input)).toBeCloseTo(expected);
  });

  // The result is evaluated with Function(), so anything beyond arithmetic must be refused.
  it.each(["alert(1)", "constructor", "1;2", "this", "1e3", "k", "window.x", "[]+[]", "0x10", "`1`", "1,2)//", "5万万"])(
    "rejects %s",
    (input) => {
      expect(parseExpression(input)).toBeNull();
    }
  );

  it("returns null for empty or non-string input", () => {
    expect(parseExpression("")).toBeNull();
    expect(parseExpression("   ")).toBeNull();
    expect(parseExpression(42)).toBeNull();
    expect(parseExpression("1/0")).toBeNull();
  });
});

describe("dates", () => {
  it("uses the local calendar, not UTC", () => {
    const lateEvening = new Date(2026, 0, 31, 23, 30); // local time
    expect(todayISO(lateEvening)).toBe("2026-01-31");
    expect(currentYearMonth(lateEvening)).toBe("2026-01");
  });
});

it("formats percentages", () => {
  expect(formatPercent(0.1234)).toBe("12.3%");
  expect(formatPercent(0.25, 0)).toBe("25%");
  expect(formatPercent(NaN)).toBe("—");
});
