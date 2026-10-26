---
name: external-project-rules
description: >-
  外部チーム／他案件の既存ソースや.sample-codeを解釈し、案件固有のコーディング規約差分を
  .cursor/external/ に残す。共有の project/ 等は更新しない。external-project-rules、
  規約同期、既存コードからルール化、案件切替時のルール更新の依頼時に使用する。
  確認は最後に1回。figma作法メモはexternal-figma-conventions。
disable-model-invocation: true
---

# external-project-rules

外部チーム実装や案件切替向けに、**既存コードを正**として案件差分を  
**`.cursor/external/project-rules-<key>.md`** に残す。

**共有の `.cursor/rules/project/` / `frontend-base/` / `skills/` は更新しない**  
（進行中に共通ツリーをまるっと差し替えできるようにするため）。

Figma 作法の案件メモは **`@external-figma-conventions`**（本スキルでは作らない）。  
共通ルール編集が必要なときは別途 `@management-rule`（本スキルの対象外）。

## やること / やらないこと

| やる | やらない |
|------|----------|
| 既存ソース／`.sample-code` の観察と規約抽出 | 途中での逐次 AskQuestion |
| 現行共有 `project/` 等との差分整理 | 確認前の成果物最終確定（下書きは可） |
| **最後に1回**確認してから `.cursor/external/` に保存 | **共有 `rules/` / `skills/` の編集** |
| Open questions を成果物に集約 | 推測での破壊的全置換・共通への昇格適用 |

## 確認モード

| モード | いつ | 動き |
|--------|------|------|
| **confirm-end**（既定） | 通常 | 調査〜差分案まで完走 → **最後に1回** AskQuestion → OK なら保存 |
| **auto** | 依頼で「確認不要」「そのまま保存」等 | 承認なしで `.cursor/external/` に保存 |

途中確認はしない。曖昧点は Open questions に溜める。

## 実行フロー

```
- [ ] Step 1: 入力・モード（confirm-end / auto）・対象範囲を確認
- [ ] Step 2: 既存コード／sample を観察（代表ページ・modules・scss・js）
- [ ] Step 3: 現行共有 project/（必要なら frontend-base/）を Read し差分を整理
- [ ] Step 4: 差分案を作成（下書き可）
- [ ] Step 5: confirm-end なら AskQuestion（一括承認）。auto ならスキップ
- [ ] Step 6: 承認後（または auto）に `.cursor/external/project-rules-<key>.md` へ保存
- [ ] Step 7: パスと要約を報告。共有 rules/skills は触らない
```

## Step 1: 入力

- **コード正本**: テーマルート／`resources` 配下の実装。多い・代表的なものを優先
- **参考**: `.sample-code/`（あれば。既存実装が進んでいれば **既存コードを優先**）
- **key**: 未指定ならテーマ名または project slug。無ければ `default`
- **範囲**（未指定なら下記ドメインを一通り）:
  - class / 命名（`naming`）
  - HTML・PHP コメント、テンプレ（`template/`）
  - section / container / 余白 class の使い方
  - コンポーネント切り出し（blocks / elements）
  - SCSS・変数・mixin・function・プロパティ順
  - JS 配置・命名・`createPage` 等
  - ディレクトリ・ファイル構成（`structure.mdc`）
- **任意**: 対応する Figma URL → 本スキル完了後に `@external-figma-conventions` を案内（同時実行はユーザー明示時のみ）

## Step 2〜3: 観察と差分

観察の目安（全部を網羅しなくてよい。根拠付きで）:

| 領域 | 見る場所の例 |
|------|----------------|
| 命名・DOM | `page-*.php`、modules、既存 class |
| 余白 | `ly_section` / `ly_container` / `ut_space` の有無と付け方 |
| SCSS | `_variables.scss`、pages / modules の書き方、`get-color` 等 |
| JS | `src/js/pages` / modules / features |
| 構成 | 共有 `project/structure.mdc` と実ディレクトリ |

差分の種類を明記する: **追加（この案件では）** / **共有と異なる** / **変更なし** / **要判断（Open questions）**。

## Step 4〜6: 成果物

パス: **`.cursor/external/project-rules-<key>.md`**  
（下書きを `tmp` に置いてもよいが、確定版は必ず上記。共有 `rules/` には書かない）

```markdown
# Project rules (external): <key>

- Sources: <paths>
- Compared at: <datetime>
- Applies to: この案件の実装（共有 project/ より本ファイルの「この案件では」を優先）

## This project differs from shared project/

| Area | This project | vs shared project/ |
|------|--------------|--------------------|
| naming | … | align / differ |
| template / PHP | … | … |
| SCSS | … | … |
| JS | … | … |
| structure | … | … |
| Other | … | … |

## Do / Don't (implementation)

- Do: …
- Don't: …

## Open questions

- （無ければなし）

## Promote to shared project/? (candidates only)

- （繰り返すなら共通ルール化候補。本スキルでは適用しない。無ければなし）
```

### Step 5: 最後の確認（confirm-end）

**`AskQuestion` 1回**:

- この内容で `.cursor/external/` に保存する
- 修正してから再提示（続けてチャットで指示）
- キャンセル

チャットではパス予定と、主な差分を箇条書きで示す（質問本文に長文を詰め込まない）。

## Step 6: 保存

- 承認内容のみ `.cursor/external/project-rules-<key>.md` に書く
- **`.cursor/rules/` / `.cursor/skills/` は編集しない**
- Figma 実装スキルへの規約ベタ書きはしない（本ファイルへの参照を正とする）

## 実装スキルからの参照（利用側）

実装開始時に同 key または最新の `project-rules-*.md` があれば **Read** し、`Request notes` または計画にパスを残す。  
**「この案件では」行は、共有 `project/` より優先**（矛盾時は本ファイル側。Open questions があれば短く警告）。

## 完了報告

- 成果物パス
- 共有ルールとの主な差分（3点以内）
- 触っていないこと: 共有 `rules/` / `skills/`
- 次: 必要なら `@external-figma-conventions`、その後 `@figma-batch-implement` / `@figma-coding` 等
