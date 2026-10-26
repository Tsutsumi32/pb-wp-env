# Cursor 設定（ルール・スキル）

このディレクトリは [Cursor](https://cursor.com/) のエージェント向け設定です。

```
.cursor/
├── README.md          # 本ファイル
├── rules/             # 共有コーディング規約（.mdc）※まるっと差し替え可
├── skills/            # 共有作業ワークフロー（各 SKILL.md）※同上
├── external/          # 案件固有オーバーライド（project-rules / figma-conventions）
├── design/            # 下層・raw-design 資料
├── figma-tokens/      # トークン JSON
└── tmp/               # 作業用スクラッチ（計画 MD 等）
```

案件差分は **`external/`** に置き、`rules/` / `skills/` には書かない（共通ツリーの差し替えを妨げない）。

---

## ルール（`rules/`）

| パス | 内容 |
|------|------|
| `cursour-allways-rules.mdc` | 日本語対話、削除確認、ビルド非実行など |
| `rule-management.mdc` | ルール・スキル管理方針 |
| `frontend-base/` | HTML / CSS(SCSS) / JavaScript 共通 |
| `project/` | 構成・テンプレート・SCSS・JS・下層デザイン資料原則（`design-subpage`） |
| `figma/` | figmaMCP 実装（**共通＋フォールバック**。テンプレ／スタイルで参照を分ける） |

### `figma/` の役割

| ファイル | 役割 |
|----------|------|
| `index.mdc` | エントリ・スキル対応表 |
| `figma-rule.mdc` | 構造・命名・分類・レイアウトトークン・slot / 画像 DOM |
| `assets.mdc` | 画像/SVG（既存最優先・`@exp` / `@exp:png` / `@exp:svg`・矩形写真のみ JPG・使用箇所命名） |
| `interpretation.mdc` | 命名不足時の構造推定 |
| `style.mdc` | スタイル実装（変数推奨・既存慣習優先） |
| `responsive.mdc` / `inside-stroke.mdc` | 共通 |

ルール更新時は `rules/rule-management.mdc` と `@management-rule` を参照。

---

## スキル（`skills/`）

チャットで **@メンション** するか、依頼文で明示してください（多くは `disable-model-invocation: true`）。

### Figma 画面実装

| スキル | 用途 |
|--------|------|
| **`figma-page-implement`** | ページ全体の監督（計画正本・再開・セクション再ブート・完了時コンソール＋大差検知。見た目の自動修正はしない） |
| **`figma-page-analyze`** | ページフレーム全体の解析→実装計画（実装しない。`figma-page-implement` Phase 1） |
| **`figma-batch-implement`** | 複数 screen（必要なら Phase 0-catalog で索引生成）→ page-implement（明示時のみ `unattended`＝AskQuestion 無し） |
| **`figma-coding`** | テンプレ→スタイル。依頼で JS 明示時は `figma-js-coding`→lint。直呼びのセルフチェックは `browser-check.md` |
| **`figma-template-coding`** | PHP/HTML＋画像＋`@generate-scssfile`（スタイルなし） |
| **`figma-style-coding`** | スタイルのみ（PHP 未整備なら中止してテンプレを促す） |
| **`figma-js-coding`** | JS のみ（明示時。通常は `figma-coding` から） |
| **`figma-tokens-setup`** | **必ずリセット** → JSON 同期 / 何もしない（基盤の初回／全面。過不足は画面実装時） |
| **`figma-tokens-sync`** | JSON 鮮度ゲート → Code↔JSON の diff → pull（JSON→Code）/ push（Code→Figma MCP） |

### 外部チーム対策

| スキル | 用途 |
|--------|------|
| **`external-project-rules`** | 既存ソース → `.cursor/external/project-rules-*.md`（共有 `project/` は不変。確認は最後1回）。後からの追加・案件切替も同じ |
| **`external-figma-conventions`** | 他流儀 Figma の作法メモ → `.cursor/external/figma-conventions-*.md`（共有 figma/ は不変）。後からの追記も同じ |

既存コードを観察せずルール本文だけ手書きする場合は `@management-rule`。

### 下層ページ（情報起点）

| スキル | 用途 |
|--------|------|
| **`subpage-design-implement`** | 手動 brand＋抽出＋`components.md`（積極利用・必須ではない）＋brief から下層を実装 |

### その他（主要）

| スキル | 用途 |
|--------|------|
| `project-env-setup` | 新規クライアント初期セットアップ（A/B/C。B-1 はサンプル掃除。仕上げ meta は pre-launch） |
| `project-page-info` | ページ情報（固定は ensure／追記。動的は指定フレーム。WP は create をエージェント実行）。ゲートは `pages-ensure.md` |
| `reset-scss-variables` | トークン一部リセット（通常は tokens-setup が呼ぶ） |
| `generate-scssfile` | SCSS クラス骨組み（単独、または `@figma-template-coding` 内） |
| `coading` | 通常コーディング（非 Figma） |
| `pre-launch-check` | 公開前最終確認（meta／サイトマップ→WP固有→不要コード→仮・画像・href→誤字→人手表示／動作） |
| `management-rule` | ルール・スキル編集 |

---

## 案件を一通り実装する流れ（通常）

新規〜公開前までをまとめて進めるときの本線は次の **3 段**です（いずれも対話あり・AskQuestion 前提）。

```
1. @project-env-setup     … 環境・サンプル掃除・トークン方針・フォント等（A/B/C。Figma URL 不要）
2. @figma-batch-implement … 画面実装（必要なら Phase 0-catalog）※（unattended）で全自動(AskQuestionなし)
3. @pre-launch-check      … 公開前確認（meta・不要コード・人手検証など）
```

| 段 | やること | やらないこと |
|----|----------|--------------|
| env-setup | 初期設定を 1 Step ずつ確定 | 下層の一括 pages 登録（実装時 ensure）・公開前仕上げ |
| batch-implement | キューどおり screen 実装。未登録は ensure | lint/commit の自動実行・見た目の自動判定 |
| pre-launch | 公開前チェックリスト | 環境初期のやり直し |

PC 自分作業ではこの順を崩さない。画面だけ追加・修正するときは 2 だけ、公開直前だけなら 3 だけでよい。

---

## 依頼の仕方（Figma）

| やりたいこと | 指定 |
|--------------|------|
| 複数画面のカタログ＋実装 | `@figma-batch-implement` + キャンバス URL（Phase 0-catalog） |
| 複数／単一画面のバッチ実装 | `@figma-batch-implement` + 対象（カタログ名 or URL。未登録はまとめて ensure） |
| バッチ全自動（AskQuestion 無し） | 下記「全自動モード」 |
| 外部コード規約の同期（初回／後からの追加・案件切替） | `@external-project-rules` |
| 外部 Figma 作法メモ（初回／後からの追記） | `@external-figma-conventions` + Figma URL |
| 下層ページ（資料起点・デザインから実装） | `@subpage-design-implement` + page-slug（省略時は候補＋AskQuestion。`components.md` 積極利用・必須ではない） |
| ページ全体の実装（解析→セクション連続） | `@figma-page-implement` + ページフレーム URL（未登録は内部で pages ensure） |
| ページ全体＋ JS／Swiper 等 | 上記 + 「○○は Swiper」など要件を明示（`figma-coding` に引き継がれる） |
| ページ全体の解析・実装計画のみ | `@figma-page-analyze` + ページフレーム URL（計画は `.cursor/tmp/figma-plans/`） |
| テンプレ＋スタイル（JS なし） | `@figma-coding` + Figma URL |
| テンプレ＋スタイル＋ JS／Swiper | `@figma-coding` + Figma URL + 要件を明示 |
| セクション等のテンプレのみ | `@figma-template-coding` + Figma URL |
| スタイルのみ（PHP 既存） | `@figma-style-coding` + Figma URL |
| JS のみ（稀） | `@figma-js-coding` + 対象・要件 |
| レスポンシブ不要 | 上記いずれか + 「レスポンシブ不要」と明示 |
| トークン基盤（初回／全面） | `@figma-tokens-setup`（リセット後に方式を選択） |
| トークン差分同期（pull / push） | `@figma-tokens-sync`（Figma 変更後は先に `.cursor/figma-tokens/` を Export） |
| pages 情報（固定は ensure。更新管理は cms フレーム／推定確認） | `@project-page-info` + `cms-frame.md`（実装前は各実装スキルが委譲） |
| 環境〜スタイル一式 | `@project-env-setup`（B-1: サンプル掃除。下層は ensure） |

前提: **`npm run dev` 起動中**（SCSS エントリの `@use` 手書きは不要）。コーディング依頼時にエージェントがビルドを走らせる必要はない（`cursour-allways-rules.mdc`）。実装後のブラウザ確認は原則しない。Figma 専用スキルは Phase 3 / `figma-coding` 直呼びでコンソールと大差検知（報告のみ・自動修正しない。数pxは無視。正本: `figma-coding/browser-check.md`）。ページが揃ったときの確認（そのページの vnu と HTML / SCSS / JS の規約）は `figma-page-implement/page-check.md`。微差の見た目は人が行い、ずれは再指摘する。

`.sample-code/` は参考（任意）。**既存コードがあれば読まない**。読むときは該当断片のみ（正本: `@coading`）。

---

## `@figma-batch-implement` 全自動モード（unattended）

**段 2（画面実装）だけ**を AskQuestion 無しで進める別経路。通常の 3 段フローを置き換えない。  
正本: `skills/figma-batch-implement/unattended.md`。

| 項目 | 内容 |
|------|------|
| 前提 | `@project-env-setup` 済み（トークン方針・サンプル掃除など）。勝手に有効化しない |
| 対象外 | `@project-env-setup` / `@pre-launch-check`（対話・人手確認のまま） |
| 起動 | 計画または依頼に `Interaction: unattended`（または「全自動」明示） |
| 振る舞い | AskQuestion しない。キュー確認省略。推定で ensure。ラン上限（既定 2 screen）で停止＋Resume paste |
| Docker / WP-CLI | ローカル／CI 前提。Cloud 等で失敗してもコード実装は続行可（Progress に残す） |

### 使い方

1. （推奨）先にカタログとバッチ計画を用意する（通常フローで Phase 0 まででも可）
2. 計画に次を書く（または依頼文に同趣旨を書く）

```markdown
- Interaction: unattended
- Run budget: 2
```

3. チャットまたは Automations で起動する例:

```text
@figma-batch-implement
計画: .cursor/tmp/figma-plans/_batch-<key>.md
Interaction: unattended
pending から続行。AskQuestion 禁止。
上限 2 screen。終わったら計画更新して停止。
```

4. 停止後は計画の **Resume paste** を次ランに貼る（`Interaction: unattended` を含める）
5. 全 screen `done` のあと、公開前は通常どおり **`@pre-launch-check`**（unattended にしない）

PC で自分が進めるときは **Interaction を書かず interactive**（AskQuestion・ソフト停止あり）のまま使う。

---

## Figma プラグイン

`figma-plugins/scss-variables-sync/` で `.cursor/figma-tokens/*.json` と Figma Variables を同期します。

- **基盤の全面**: Export → `.cursor/figma-tokens/` → `@figma-tokens-setup`（JSON 同期）
- **差分の継続同期**: Export（鮮度ゲート）→ `@figma-tokens-sync`（diff / pull / push）。push 後は再 Export で JSON を追従
