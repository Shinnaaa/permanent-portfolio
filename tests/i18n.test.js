import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANGUAGES, MESSAGES, detectLanguage, translate } from "../src/lib/i18n";

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("messages", () => {
  const keys = Object.keys(MESSAGES.en);

  it.each(LANGUAGES.map((l) => l.code))("%s has every key with the same placeholders", (code) => {
    for (const key of keys) {
      expect(MESSAGES[code][key], `${code}: ${key}`).toBeTypeOf("string");
      expect(placeholders(MESSAGES[code][key]), `${code}: ${key}`).toEqual(placeholders(MESSAGES.en[key]));
    }
    expect(Object.keys(MESSAGES[code]).sort()).toEqual([...keys].sort());
  });

  it("every key used in the source exists", () => {
    const dir = join(__dirname, "../src");
    const files = [];
    const walk = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(join(d, e.name)) : files.push(join(d, e.name))));
    walk(dir);
    const used = new Set();
    for (const file of files.filter((f) => f.endsWith(".jsx"))) {
      for (const m of readFileSync(file, "utf8").matchAll(/\bt\("([\w.]+)"/g)) used.add(m[1]);
    }
    for (const key of used) expect(keys, key).toContain(key);
  });
});

it("fills placeholders and falls back to English", () => {
  expect(translate("zh", "reb.add", { amount: "¥1" })).toBe("＋ 增加 ¥1");
  expect(translate("xx", "nav.update")).toBe("Update");
  expect(translate("en", "no.such.key")).toBe("no.such.key");
});

it("detects the language from the browser", () => {
  expect(detectLanguage(["ja-JP", "en"])).toBe("ja");
  expect(detectLanguage(["fr-FR", "zh-CN"])).toBe("zh");
  expect(detectLanguage(["fr-FR"])).toBe("en");
});
