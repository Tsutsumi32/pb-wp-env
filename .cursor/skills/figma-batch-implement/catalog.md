# 画面カタログ（figma-batch-implement 内）

`@figma-batch-implement` の **Phase 0-catalog** から参照する。実装はしない。索引のみ。

探索ヒューリスティクスの詳細は [project-page-info/figma-discovery.md](../project-page-info/figma-discovery.md) を参照（手順は複写しない）。`pages.php` 等の設定は `@project-page-info`（別成果物）。

## 用語

| 用語 | 意味 |
|------|------|
| **screen** | 実装単位の Web 画面（PC/SP ペアは 1 screen） |
| **canvas page** | Figma 左パネルのページ（キャンバスタブ） |
| **catalog** | screen の Name / slug / URL / node-id の一覧 |

## やること / やらないこと

| やる | やらない |
|------|----------|
| Figma から screen 候補を列挙 | PHP/HTML/SCSS の実装 |
| PC/SP ペアリング | `pages.php` の編集 |
| カタログ MD の保存・上書き | バッチ実装の実行（保存後は batch-implement 本体へ戻る） |
| ユーザー確認後に確定保存 | 小さな部品・コンポーネント集の自動採用 |

## 実行フロー

```
- [ ] Step 1: Source（Figma キャンバス／ファイル URL）・catalog-key を確認
- [ ] Step 2: Figma MCP で構造取得（キャンバス URL ならその node をルート）
- [ ] Step 3: screen 候補を列挙（discovery ヒューリスティクス＋下記ヒント）
- [ ] Step 4: PC/SP をペアリング。page-slug を付与
- [ ] Step 5: 候補を表で提示し AskQuestion で採用確定（推定を選択肢に含める）
- [ ] Step 6: カタログファイルを保存（上書き可）
- [ ] Step 7: パスと件数を短く報告。batch-implement のキュー化へ戻る
```

再取得（更新）時も同じ流れ。既存カタログがあれば差分（追加・削除・node-id 変化）を Step 5 前に短く示す。

**unattended**: AskQuestion せず、高 confidence の `pc-*` / `sp-*` ペアを採用して保存。根拠をバッチ計画 Progress に残す。

## Step 1: 入力

- **Source**: キャンバス URL 推奨（巨大ファイル全体は避ける）。fileKey + 必要なら node-id
- **catalog-key**: ファイル名用。未指定なら fileKey 先頭またはキャンバス名を slug 化
- パス: `.cursor/tmp/figma-plans/_catalog-<catalog-key>.md`

## Step 3: 候補の拾い方

### 主パターン（本プロジェクトの既定）

Figma 側はだいたい次の命名になっている前提で拾う（**最優先・confidence: high**）。

| フレーム名 | 意味 |
|------------|------|
| `pc-<slug>` | 各画面の **PC** デザイン（例: `pc-about`） |
| `sp-<slug>` | 各画面の **SP** デザイン（例: `sp-about`） |

- `<slug>` が同じものを **1 screen** にペアする（`pc-about` + `sp-about` → page-slug `about`）
- PC のみ／SP のみの画面もあり得る（片方だけカタログ行に載せ、空欄側は「なし」）
- `pc-` / `sp-` の大文字小文字ゆれは同一視してよい

詳細・他案件向けの補助ヒューリスティクスは `figma-discovery.md`（design セクション配下、番号付き本番など）。主パターンで足りるときはそちらを深追いしすぎない。

### 補助・除外

| 優先 | 例 |
|------|-----|
| 補助（主が無いとき） | `page-*`、番号付き本番（`00_*` 等）、明確なページ FRAME |
| 除外しやすい | `Components`、`XD Components`、案（`A案` 等）、明らかに小さいアイコン／部品 FRAME、`_` 始まり、**`cms`（更新管理仕様。screen 行には載せない）** |

主パターン以外は confidence を下げ、Step 5 で人が決める。

## Step 4: PC/SP ペアと slug

1. **第一**: `pc-<slug>` と `sp-<slug>` を `<slug>` で突き合わせる
2. それでも余るフレームは discovery や名前類似・同一親配下でペア候補を作る（confidence を下げる）
3. 片方しか無い screen は、空欄の Device 側を「なし」（片側デザイン扱い）
4. **page-slug**: 原則は `pc-` / `sp-` を除いた `<slug>`（既に slug 形式ならそのまま。必要なら小文字化）
5. Name（表示名）: slug またはフレーム名から人が分かる短い名（Step 5 で修正可）
6. Figma URL: `...?node-id=` は `-` 区切り（`1234-5678`）。カタログでは URL 用を正とする

## Step 5: 確認（必須・interactive）

- チャットで候補を **表**（Name / slug / PC / SP / confidence）
- **`AskQuestion`**（`allow_multiple: true`）で採用 screen を確定。推定・現状カタログ行を選択肢に含める
- 除外・追加・slug 修正は「その他」または再提示

**確定前にカタログを最終保存しない**（下書き提示のみ可）。

## Step 6: ファイルテンプレート

```markdown
# Figma screen catalog: <catalog-key>

- Source: <Figma URL>
- fileKey: <…>
- Updated at: <datetime>
- Notes: （探索メモ。無ければなし）
- CMS frame: <url or none>（名前に cms を含む仕様フレーム。詳細は project-page-info/cms-frame.md）

## Screens

| # | Name | page-slug | PC node-id | PC URL | SP node-id | SP URL | confidence | Note |
|---|------|-----------|------------|--------|------------|--------|------------|------|
| 1 | About | about | 1:2 | https://…?node-id=1-2 | 3:4 | https://…?node-id=3-4 | high | |
| 2 | Contact | contact | 5:6 | https://… | | | medium | SP なし |

## Excluded (optional)

| Name | node-id | Reason |
|------|---------|--------|
| … | … | Components 等 |
```

Status / 実装進捗は持たない（バッチ計画側）。

## 完了報告

- カタログパス
- 採用 screen 数（PC+SP / PC のみ / SP のみの内訳を短く）
- 次: batch-implement のキュー化（Phase 0 続き）へ戻る
