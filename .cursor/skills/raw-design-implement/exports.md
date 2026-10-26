# exports（入力配置）

`@raw-design-implement` のデザイン資料置き場。  
`pages/`（`@subpage-design-implement` 用 brief／wireframe）とは分ける。`pages` 改名は将来対応。

## ディレクトリ

```text
.cursor/design/exports/<page-slug>/
  {base}.png                 … デザイン正本（必須。見た目）
  {base}-annotate.png        … 色枠付き（任意）
  {base}.json                … イラレ書き出し等の補助 JSON（任意）
  notes.md                   … 任意メモ
```

- PC/SP は `{slug}-pc` / `{slug}-sp` など **ベース名でペア**にする
- 解析計画・進捗はここではなく **`.cursor/tmp/`**（例: `raw-design-plans/<slug>.json`）

## ファイルの役割

| ファイル | 役割 |
|----------|------|
| 正本画像（`-annotate` 無し） | 見た目の正。枠の色は無視して読む前提でも可（注釈は別ファイル推奨） |
| `*-annotate.*` | 実装対象の宣言（[annotate.md](annotate.md)） |
| AI/PSD 由来 JSON | **テキスト `contents` の正本**、色・bounds・textStyle の補強。構造の主正本にはしない |
| `.ai` / `.psd` | エージェント入力にしない（人がスクリプト実行する元） |

## annotate 判定（必須ロジック）

同一画面の正本に対し:

| 状況 | 判定 |
|------|------|
| 対応する `*-annotate.*` がある | `annotate: on`。**枠内のみ**実装対象。枠外は後手動アセット前提 |
| 無い | **その旨をユーザーに通知**し、`annotate: off`（AI が全体を推定。uncertain 多め） |
| 依頼で明示上書き | 依頼優先（例: annotate 無視） |

`annotate: on` なのに枠が1つも読めない → 実装せず確認。

命名例:

```text
about-pc.png
about-pc-annotate.png
about-pc.json
about-sp.png
about-sp-annotate.png
```

`*-annotate` は拡張子直前のサフィックス。正本単体のファイル名に `annotate` を含めない。

## 補助 JSON（イラレ / フォトショ）

| アプリ | スクリプト（スキル内正本） |
|--------|----------------------------|
| Illustrator | [scripts/export_artboard_to_json.illustrator.js](scripts/export_artboard_to_json.illustrator.js) |
| Photoshop | [scripts/export_artboard_to_json.photoshop.js](scripts/export_artboard_to_json.photoshop.js) |

- 運用コピー: `_docs/_raw-design-implement/` にも同名で置いてよい（正本は skills 側）
- アクティブ／選択したアートボード（PS は複数時ダイアログ）
- テキスト照合: 緑枠／計画ノードの位置と JSON `bounds` を突き合わせ、`contents` / `textStyle` を採用
- JSON に無い文字（アウトライン化・ラスタライズ済み）→ 画像から読むか人手
- Photoshop は **テキストレイヤーのまま**であること（ラスタライズ文字は取れない）

## 置かない場所

| 置かない | 理由 |
|----------|------|
| `assets/images/` | 公開アセット |
| `resources/_origin/` | 実装用変換入力 |
| `_docs/capture/` | 実装後キャプチャ |
| `.cursor/design/pages/*/refs/` | subpage 用（wireframe） |
