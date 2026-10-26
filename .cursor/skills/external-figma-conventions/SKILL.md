---
name: external-figma-conventions
description: >-
  外部チーム／他デザイナーのFigmaを読み、案件固有の作り・突合せ方針を
  .cursor/external/ に残す。共通figma/ルールは更新しない。external-figma-conventions、
  Figma作法メモ、他流儀デザインの実装前調査の依頼時に使用する。確認は最後に1回。
  コード規約差分はexternal-project-rules。
disable-model-invocation: true
---

# external-figma-conventions

外部チームや他流儀の Figma 向けに、**案件メモ**（作り方・実装突合せ方針）を  
**`.cursor/external/figma-conventions-<key>.md`** に残す。

実装は行わない。共通の `.cursor/rules/figma/` および **共有 `rules/` / `skills/` は更新しない**。

コード側の案件差分は **`@external-project-rules`**（`.cursor/external/project-rules-*.md`）。

実装時は本メモを正本の一部として読む（`@figma-page-implement` / `@figma-batch-implement` / `@figma-coding` 等）。

## やること / やらないこと

| やる | やらない |
|------|----------|
| Figma（＋任意で対応実装）の観察 | 途中での逐次 AskQuestion |
| 案件メモ案の作成 | 確認前のメモ最終確定（下書きは可） |
| **最後に1回**確認してから `.cursor/external/` に保存 | 共通 `figma/*.mdc` や共有 `rules/` / `skills/` の書き換え |
| 汎用化に値する発見を「昇格候補」に書く | 実装・カタログ生成・pages.php 編集 |

## 確認モード

| モード | いつ | 動き |
|--------|------|------|
| **confirm-end**（既定） | 通常 | メモ案まで完走 → **最後に1回** AskQuestion → OK なら保存 |
| **auto** | 「確認不要」「そのまま保存」等 | 承認なしで保存 |

## 実行フロー

```
- [ ] Step 1: Figma URL・memo-key・モード・（任意）対応実装パスを確認
- [ ] Step 2: Figma MCP で構造・Variables・命名を観察
- [ ] Step 3: 任意で対応実装と突合（class・余白・画像の対応）
- [ ] Step 4: メモ案を作成（共通ルールとの差分・この案件の正を明記）
- [ ] Step 5: confirm-end なら AskQuestion。auto ならスキップ
- [ ] Step 6: `.cursor/external/figma-conventions-<key>.md` に保存
- [ ] Step 7: パスと要約を報告。実装には進まない
```

## Step 1: 入力

- **Source**: Figma キャンバス／代表フレーム URL（巨大ファイル全体は避ける）
- **memo-key**: 未指定なら fileKey 先頭またはキャンバス名を slug 化
- **任意**: 既に近い実装があるページの PHP/SCSS パス（突合せ用）
- **任意**: 先に `@external-project-rules` 済みなら、その成果物パスを参照してよい

## Step 2〜3: 観察項目

短く根拠付きでメモる（無いものは「なし／不明」）:

| 項目 | 見るもの |
|------|----------|
| フレーム命名 | `pc-*` / `sp-*` 等の有無 |
| セクション | section-space Variables / `SECTION(...)` / ギャップのみ |
| コンテナ | container Variables / `CONTAINER(...)` |
| 分類・部品 | `{分類} {名}`、header/footer、独自命名 |
| 画像 | `@EXP` / `@EXP:PNG` / `@EXP:SVG` / 無名／既存ファイル前提か |
| テキスト | `TEXT` / `el_textBase` 等 |
| その他トークン | `BG` / `none` / `slot` / 独自 |
| 突合（任意） | Figma ↔ 実装の class・余白の対応例 |

共通ルール（Variables 主・命名は保険・interpretation）との **ズレ**を必ず書く。

## Step 4〜6: メモ

パス: **`.cursor/external/figma-conventions-<memo-key>.md`**  
（下書きを `tmp` に置いてもよいが、確定版は必ず上記）

```markdown
# Figma conventions (external): <memo-key>

- Source: <Figma URL>
- Paired code: <paths or none>
- Updated at: <datetime>
- Applies to: この案件の Figma 実装（共通 figma/ より本メモの「この案件では」を優先）

## This project reads Figma as

| Topic | How to read (this project) | vs shared figma/ rules |
|-------|----------------------------|-------------------------|
| Section / ly_section | … | align / differ |
| Container | … | … |
| Components | … | … |
| Assets | … | … |
| Other | … | … |

## Do / Don't (implementation)

- Do: …
- Don't: …

## Open questions

- （無ければなし）

## Promote to shared figma/? (candidates only)

- （繰り返すなら共通ルール化候補。本スキルでは適用しない）
```

### Step 5: 最後の確認（confirm-end）

**`AskQuestion` 1回**: このメモを `.cursor/external/` に保存する / 修正して再提示 / キャンセル。

## 実装スキルからの参照（利用側）

実装・バッチ開始時に同 key または最新の `figma-conventions-*.md` があれば **Read** し、`Request notes` または計画にパスを残す。  
**「この案件では」行は、共有 `figma/` より優先**（矛盾時はメモ側。Open questions があれば短く警告）。

## 完了報告

- メモパス
- 共有ルールとの主な差分（3点以内）
- 次: `@figma-batch-implement` / `@figma-page-implement` / `@figma-coding`（必要なら先に `@external-project-rules`）
