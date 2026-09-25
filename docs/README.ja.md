<p align="center">
  <a href="../README.md"><img alt="English" src="https://img.shields.io/badge/English-eaeef2?style=for-the-badge"></a>
  <a href="README.zh-CN.md"><img alt="简体中文" src="https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-eaeef2?style=for-the-badge"></a>
  <a href="README.ja.md"><img alt="日本語" src="https://img.shields.io/badge/%E6%97%A5%E6%9C%AC%E8%AA%9E-1f2328?style=for-the-badge"></a>
</p>

<h1 align="center">Permanent Portfolio</h1>

<p align="center">
  ハリー・ブラウンの恒久ポートフォリオ（株式・長期債券・金・現金）を記録し、リバランスを支援します。<br>
  すべてブラウザ内で動作し、アカウントもサーバーも不要。データはあなたの手元に残ります。
</p>

<p align="center">
  <a href="https://shinnaaa.github.io/permanent-portfolio/"><b>アプリを開く →</b></a>
</p>

<p align="center">
  <a href="https://github.com/Shinnaaa/permanent-portfolio/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Shinnaaa/permanent-portfolio/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61dafb">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff">
  <a href="../LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-green"></a>
</p>

<p align="center"><img src="images/dashboard.png" alt="サンプルデータの概要画面" width="860"></p>

---

## 戦略について

1981 年、ハリー・ブラウンは 4 つの資産を均等に持つことを提案しました。好景気には**株式**、デフレには**長期債券**、インフレには**金**、不況には**現金**。経済がどの局面にあっても、どれかがポートフォリオを支えます。必要な手入れは、どれかが 25% から大きくずれたときのリバランスだけです。

このアプリはその記録係です。各資産の評価額を入力すると、目標からのずれ、買い増し・売却すべき額、新しい資金の配分を示します。

## 機能

- **リバランスがひと目でわかる。** 各資産の比率・目標・乖離と 0〜100 のバランススコア。閾値（既定 ±5%）を超えると「いくら追加／削減するか」を具体的に表示します。
- **新規資金の配分。** 金額を入力すると、最も不足している資産から優先して（または目標比率どおりに）配分。きりのよい数字に丸めつつ、合計は入力額とぴったり一致します。
- **月次の履歴。** 保存するたびにその月のスナップショットを記録し、総資産と配分の推移をグラフで表示します。
- **金額欄で計算できる。** `50000+3200`、`12万`、`1.5k` などを入力すると自動で計算します。
- **どの通貨でも、3 言語で。** 12 通貨（JPY・CNY・USD・EUR・GBP など）と English / 中文 / 日本語 の UI に対応。初回はブラウザの設定から自動で選びます。
- **目標とメモは自由に。** 25/25/25/25 の目標比率や閾値を変更でき、各資産に保有口座のメモ（「NISA」「A 証券」など）を付けられます。
- **プライバシーモード。** ワンクリックで概要・表・配分結果の金額をぼかします。人前で確認するときに。
- **バックアップと同期。** JSON の書き出し／読み込みに加え、あなた自身の GitHub アカウントの非公開 Gist で端末間同期もできます。
- **インストール可能。** スマートフォンのホーム画面に追加でき、小さな画面向けのレイアウトも用意しています。

<p align="center">
  <img src="images/allocate.png" alt="新規資金の配分" width="49%">
  <img src="images/history.png" alt="履歴グラフ" width="49%">
</p>
<p align="center"><img src="images/mobile.png" alt="スマートフォン（日本語 UI）" width="260"></p>

## データについて

バックエンドはありません。データはすべてブラウザの `localStorage` に保存され、端末の外には出ません。例外は **Gist 同期**を有効にした場合で、あなたの GitHub アカウントの*非公開* Gist に書き込みます。使用する fine-grained トークンはブラウザ内にのみ保存され、`api.github.com` 以外には送信されません。同期を解除するとトークンは削除されます。

バックアップファイルは次の形式なので、ほかのツールで読み書きすることもできます。

```json
{
  "version": 3,
  "holdings": { "stocks": 184000, "bonds": 135000, "gold": 118000, "cash": 160000, "updatedAt": "2026-09-25T…" },
  "settings": { "currency": "JPY", "targetStocks": 0.25, "targetBonds": 0.25, "targetGold": 0.25, "targetCash": 0.25,
                "threshold": 0.05, "notes": { "stocks": "NISA", "bonds": "", "gold": "", "cash": "" } },
  "snapshots": [{ "ym": "2026-09", "date": "2026-09-25", "stocks": 184000, "bonds": 135000, "gold": 118000, "cash": 160000 }]
}
```

金額はすべて `settings.currency` の通貨での数値で、為替換算は行いません。

---

## 開発

```bash
npm install
npm run dev       # 開発サーバー（ホットリロード）
npm test          # ユニットテスト（Vitest）
npm run lint      # oxlint
npm run build     # 本番ビルド（dist/ に出力）
```

### 自分のコピーを公開する

リポジトリを Fork し、**Settings → Pages** でソースを **GitHub Actions** に設定します。以降は `main` への push のたびに lint・テスト・ビルドが走り、自動でデプロイされます。リポジトリ名を変えた場合は、[`vite.config.js`](../vite.config.js) の `base` を `/<新しい名前>/` に変更してください。

### ディレクトリ構成

```
src/
  App.jsx            状態・永続化・Gist 同期・ヘッダーとタブ切り替え
  locale.js          全コンポーネントに渡す言語と通貨のコンテキスト
  components/        Dashboard・Onboarding・UpdateForm・AllocateFunds・History・Settings など
  lib/               React に依存しない純粋なロジック：
    compute.js         比率・乖離・アクション・バランススコア・前月比
    allocate.js        新規資金の配分（smart / proportional）
    currency.js        金額の書式と、通貨に合わせたプリセット
    format.js          金額欄の式の解析・日付・パーセント
    storage.js         localStorage とデータ移行（normalizeData）
    i18n.js            英語・中国語・日本語の文言
    sample.js          お試し用のサンプルデータ
    gistSync.js        GitHub Gist API
tests/               lib/ の全モジュールを対象とした Vitest のテスト
```

`src/lib` のロジックはフレームワークに依存せず、すべてテストで検証しています。コンポーネントは計算結果を描画するだけです。

## ライセンス

[MIT](../LICENSE)
