# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A tracker for Harry Browne's permanent portfolio (stocks / long-term bonds /
gold / cash, 25% each by default). React 19 + Vite + Recharts, no backend.
State lives in `localStorage`; optional cross-device sync goes to a secret
GitHub Gist, called directly from the browser with a token the user pastes into
Settings. Deployed to GitHub Pages at `/permanent-portfolio/` (`base` in
`vite.config.js` must match the repository name).

History: the source was reconstructed in 2026-07 from a minified single-file
build (verified pixel- and behavior-identical), then generalised in 2026-09
from the author's personal setup (hard-coded JPY, the author's accounts and
holdings as defaults, Chinese-only helper text) into a public app. Don't
reintroduce personal defaults; user-specific things belong in their data.

## Commands

```
npm install
npm run dev       # Vite dev server
npm test          # Vitest (tests/)
npm run lint      # oxlint — CI requires zero warnings
npm run build     # production build to dist/
npm run preview   # serve the build at /permanent-portfolio/
```

CI (`.github/workflows/ci.yml`) runs lint → test → build on every push and PR,
and deploys `main` to Pages.

## Architecture

- `src/App.jsx` — owns all state (`holdings`, `settings`, `snapshots`, the
  `isSample` flag, sync state, UI language) and the effects that persist it.
  Every way data comes in (localStorage, Gist pull, JSON import) goes through
  `applyData(normalizeData(...))`. No router: `activeTab` is a string.
- `src/locale.js` — `LocaleContext` with `t`, `money`, `moneyCompact`,
  `symbol`, `catLabel`. Components get language and currency only from here.
- `src/lib/` — pure, React-free, all covered by `tests/`:
  - `compute.js` — dashboard view model: shares, deviation, action, balance
    score, month-over-month change. Takes `now` for testability.
  - `allocate.js` — splits new money (smart water-filling / proportional).
    Rounds to `roundTo` (from `currency.roundingStep`) and nudges the largest
    class so the parts sum exactly to the input. Gaps are measured against the
    current total, by design.
  - `currency.js` — `Intl.NumberFormat` wrappers and a per-currency `unit`
    (≈US$70) that scales presets, sample data and rounding. Yen is normalised
    to the half-width "¥" (the display serif lacks "￥").
  - `format.js` — category keys/colours, percent/date helpers (local time, not
    UTC) and `parseExpression`, which evaluates user input with `Function()`
    behind a strict regex gate. Keep the gate airtight; add a test for any new
    syntax.
  - `storage.js` — localStorage keys (`pp:data:v1`, `pp:sync:v1`, `pp:lang`,
    `pp:privacy`) and `normalizeData`, the single migration point.
  - `i18n.js` — `en` / `zh` / `ja` strings. Tests fail if a key is missing in
    any language or placeholders differ, and if a component uses an unknown key.
  - `sample.js` — six months of sample data scaled to the chosen currency.
  - `gistSync.js` — GitHub Gist REST calls.
- `src/index.css` — one global stylesheet, BEM-ish prefixes per section
  (`upd-*`, `reb-*`, `qa-*`, `onboard-*`, …).

### Data model (version 3)

- `holdings`: `{ stocks, bonds, gold, cash, updatedAt }` — current market
  values in `settings.currency`, entered overwrite-style. No FX conversion, no
  transaction log; FX moves and interest show up as ordinary monthly change.
- `settings`: `{ targetStocks, targetBonds, targetGold, targetCash, threshold,
  currency, notes: { stocks, bonds, gold, cash } }`.
- `snapshots`: one per calendar month, `{ ym, date, stocks, bonds, gold, cash }`.
- `sample`: true while the sample data is shown; saving real values replaces
  the sample history.

Version 2 data (before currencies existed) is migrated as JPY. When changing
the shape, bump `DATA_VERSION` and handle the old shape in `normalizeData`,
with a test.

## Conventions

- Keep `lib/*` pure; components take computed values as props or from the
  locale context.
- All user-visible text goes through `t()` and exists in all three languages.
- Format money only with `money` / `moneyCompact` from the context — never
  inline `toLocaleString` or a currency symbol.
