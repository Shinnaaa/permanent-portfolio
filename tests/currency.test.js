import { describe, expect, it } from "vitest";
import {
  CURRENCY_CODES,
  adjustPresets,
  allocatePresets,
  currencySymbol,
  defaultCurrencyFor,
  formatMoney,
  formatMoneyCompact,
  roundingStep,
} from "../src/lib/currency";

describe("formatMoney", () => {
  it("formats whole amounts in the chosen currency and language", () => {
    expect(formatMoney(132110, "JPY", "ja")).toBe("¥132,110");
    expect(formatMoney(1234.6, "USD", "en")).toBe("$1,235");
    expect(formatMoney(-500, "EUR", "en")).toBe("-€500");
    expect(formatMoney(null, "USD", "en")).toBe("—");
  });

  it("disambiguates yen and yuan when the language would otherwise be ambiguous", () => {
    expect(formatMoney(100, "JPY", "zh")).toContain("JP");
    expect(formatMoney(100, "CNY", "zh")).toBe("¥100");
  });

  it("uses 万 in Chinese/Japanese and K in English for compact amounts", () => {
    expect(formatMoneyCompact(50000, "JPY", "ja")).toBe("¥5万");
    expect(formatMoneyCompact(50000, "USD", "en")).toBe("$50K");
  });
});

describe("presets scale with the currency", () => {
  it("keeps presets in round, similar real-world amounts", () => {
    expect(allocatePresets("JPY")).toEqual([50000, 100000, 200000, 500000]);
    expect(allocatePresets("USD")).toEqual([500, 1000, 2000, 5000]);
    expect(adjustPresets("CNY")).toEqual([500, 1500, 2500, 5000]);
    expect(roundingStep("JPY")).toBe(100);
    expect(roundingStep("USD")).toBe(1);
  });

  it("has a symbol for every supported currency", () => {
    for (const code of CURRENCY_CODES) expect(currencySymbol(code, "en")).toBeTruthy();
  });
});

it("guesses a currency from the browser language", () => {
  expect(defaultCurrencyFor("ja-JP")).toBe("JPY");
  expect(defaultCurrencyFor("zh-CN")).toBe("CNY");
  expect(defaultCurrencyFor("zh-TW")).toBe("TWD");
  expect(defaultCurrencyFor("en-GB")).toBe("GBP");
  expect(defaultCurrencyFor("de-DE")).toBe("EUR");
  expect(defaultCurrencyFor("en-US")).toBe("USD");
  expect(defaultCurrencyFor("")).toBe("USD");
});
