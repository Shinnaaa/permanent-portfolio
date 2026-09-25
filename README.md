<p align="center">
  <a href="README.md"><img alt="English" src="https://img.shields.io/badge/English-1f2328?style=for-the-badge"></a>
  <a href="docs/README.zh-CN.md"><img alt="简体中文" src="https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-eaeef2?style=for-the-badge"></a>
  <a href="docs/README.ja.md"><img alt="日本語" src="https://img.shields.io/badge/%E6%97%A5%E6%9C%AC%E8%AA%9E-eaeef2?style=for-the-badge"></a>
</p>

<h1 align="center">Permanent Portfolio</h1>

<p align="center">
  Track and rebalance a Harry Browne permanent portfolio — stocks, long-term bonds, gold and cash.<br>
  Runs entirely in your browser. No account, no server; your numbers stay with you.
</p>

<p align="center">
  <a href="https://shinnaaa.github.io/permanent-portfolio/"><b>Open the app →</b></a>
</p>

<p align="center">
  <a href="https://github.com/Shinnaaa/permanent-portfolio/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Shinnaaa/permanent-portfolio/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61dafb">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-green"></a>
</p>

<p align="center"><img src="docs/images/dashboard.png" alt="Dashboard with sample data" width="860"></p>

---

## The strategy

In 1981 Harry Browne proposed holding four assets in equal parts: **stocks** for prosperity, **long-term bonds** for deflation, **gold** for inflation and **cash** for recession. Whatever the economy does, one of them tends to carry the portfolio. The only maintenance is rebalancing when one part drifts too far from 25%.

This app does the bookkeeping for that: you enter what each part is worth, it tells you how far off you are, what to buy or trim, and how to split new money.

## Features

- **Rebalance at a glance.** Share, target and deviation for each class, a 0–100 balance score, and concrete "add / reduce" amounts once a class leaves your threshold (±5% by default).
- **Allocate new money.** Enter an amount and get a split that fills the most underweight classes first (or strictly by target weight), rounded to tidy numbers and summing exactly to your input.
- **Monthly history.** Every save keeps a snapshot for that month; charts show total value and how the mix drifted over time.
- **Quick maths in every amount field.** Type `50000+3200`, `1.5k`, or `12万` and it's evaluated for you.
- **Any currency, three languages.** 12 currencies (JPY, CNY, USD, EUR, GBP, …) and an English / 中文 / 日本語 interface, both guessed from your browser on first visit.
- **Your targets, your notes.** Change the 25/25/25/25 split and the threshold; label each class with where you hold it ("NISA", "Broker A").
- **Privacy mode.** One click blurs the amounts on the overview, tables and allocation results, for checking your portfolio in public.
- **Backups and sync.** Export/import JSON, or sync across devices through a secret GitHub Gist in your own account.
- **Installable.** Add it to your phone's home screen; it's laid out for small screens too.

<p align="center">
  <img src="docs/images/allocate.png" alt="Allocate new funds" width="49%">
  <img src="docs/images/history.png" alt="History charts" width="49%">
</p>
<p align="center"><img src="docs/images/mobile.png" alt="Mobile, Japanese interface" width="260"></p>

## Your data

There is no backend. Everything is stored in your browser's `localStorage` and never leaves it, unless you turn on **Gist sync**: then the app writes to a *secret* Gist in your own GitHub account, using a fine-grained token that is kept in your browser and sent only to `api.github.com`. Disconnecting removes the token.

A backup file looks like this, so you can also read or generate it with other tools:

```json
{
  "version": 3,
  "holdings": { "stocks": 184000, "bonds": 135000, "gold": 118000, "cash": 160000, "updatedAt": "2026-09-25T…" },
  "settings": { "currency": "JPY", "targetStocks": 0.25, "targetBonds": 0.25, "targetGold": 0.25, "targetCash": 0.25,
                "threshold": 0.05, "notes": { "stocks": "NISA", "bonds": "", "gold": "", "cash": "" } },
  "snapshots": [{ "ym": "2026-09", "date": "2026-09-25", "stocks": 184000, "bonds": 135000, "gold": 118000, "cash": 160000 }]
}
```

Amounts are plain numbers in `settings.currency`; nothing is converted.

---

## Development

```bash
npm install
npm run dev       # dev server with hot reload
npm test          # unit tests (Vitest)
npm run lint      # oxlint
npm run build     # production build in dist/
```

### Host your own copy

Fork the repository, then in **Settings → Pages** choose **GitHub Actions** as the source. Every push to `main` runs lint, tests and the build, then deploys. If you rename the repository, change `base` in [`vite.config.js`](vite.config.js) to `/<new-name>/`.

### Project layout

```
src/
  App.jsx            state, persistence, Gist sync, header and routing between tabs
  locale.js          language + currency context used by every component
  components/        Dashboard, Onboarding, UpdateForm, AllocateFunds, History, Settings, …
  lib/               pure logic, no React:
    compute.js         shares, deviations, actions, balance score, month-over-month change
    allocate.js        splitting new money (smart / proportional)
    currency.js        formatting and currency-scaled presets
    format.js          expression parser for amount fields, dates, percentages
    storage.js         localStorage, data migration (normalizeData)
    i18n.js            English / Chinese / Japanese strings
    sample.js          sample data for trying the app
    gistSync.js        GitHub Gist API
tests/               Vitest suites for everything in lib/
```

The logic in `src/lib` is framework-free and covered by tests; components only render what it computes.

## License

[MIT](LICENSE)
