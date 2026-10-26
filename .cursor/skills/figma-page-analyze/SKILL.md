---
name: figma-page-analyze
description: >-
  ページフレーム全体のFigmaを解析し、セクション構成と実装計画ファイルを作成する（実装はしない）。
  ページ全体実装の解析フェーズ、figma-page-analyze、セクション分割計画の依頼時に使用する。
  通常はfigma-page-implementのPhase 1から呼ばれる。セクション単体の実装には使わない。
disable-model-invocation: true
---

# figma-page-analyze

ページフレーム全体を解析し、**セクション単位の実装計画**をファイルに保存する。**実装は行わない**。

計画ファイルは `@figma-page-implement` の **正本**（依頼条件・進捗・再開用）。会話記憶には依存しない。

セクション URL での実装依頼は本スキルを使わず、`@figma-coding` / `@figma-template-coding` / `@figma-style-coding` を直接使う。  
ページ全体の実装まで行う場合は `@figma-page-implement`（本スキルを Phase 1 で呼ぶ）。

## 位置づけ

- `@figma-page-implement` の **Phase 1**（初回または明示やり直し時）
- 「解析だけ」運用は想定しない（検証時の直接呼び出しは可）
- 新規ルールは作らない。判定は既存 `figma/` を参照

## 必須参照

- `figma/figma-rule.mdc`（分類命名・**Variables 主の余白**・任意の `SECTION(...)` 等・**アノテーション**）
- `figma/interpretation.mdc`（命名が薄いときの推定）
- `figma/responsive.mdc`（PC/SP 判定・両デザイン時は **差分先行**＝テンプレ影響差分の洗い出し）

## やること / やらないこと

| やる | やらない |
|------|----------|
| 渡されたページフレームの解析 | PHP/HTML/SCSS の実装 |
| セクション分割・実装順・スキル指定 | アセット書き出し・crop |
| 両デザイン時はテンプレ影響差分の明示 | 想定 PHP パスの確定 |
| 依頼条件の Request notes 記録 | 既存部品再利用の先出し調査（実装時に `figma-rule` で判定） |
| アノテーション確認（UX／機能仕様は Request notes。重いものは Notes） | 原稿アノテーションの計画への長文転記（実装時 TODO） |
| Status / Progress 初期化を含む計画保存 | スタイル数値差の詳細列挙（スタイル工程向け） |
| 不明点の記録 | |

## 実行フロー

```
- [ ] Step 1: Figma URL・対象フレーム（PC/SP/両方）・依頼スキル範囲・Request notes を確認
- [ ] Step 2: page-slug をフレーム名から決定
- [ ] Step 3: figmaMCP で構造取得（主に get_metadata。必要なら screenshot）
- [ ] Step 4: セクション分割（命名優先 → 薄いとき推定 → 不明点に記録）
- [ ] Step 5: 実装順・各セクションのスキルを決定
- [ ] Step 6: 計画ファイルを保存（同 slug は上書き。Status は全 pending）
- [ ] Step 7: 保存パスと要約を短く報告（実装には進まない）
```

## Step 1: 入力確認

- **対象**: 渡されたページフレームのみ。PC のみ / SP のみ / 両方は、渡されたデザインで決める。渡されていない側は解析しない
- **両フレームがあるとき**: セクション対応を取り、`figma/responsive.mdc`「差分先行」に従い **テンプレ影響差分** を計画に書く（下記 Template DOM diffs）
- **スキル範囲**:
  - 依頼がテンプレのみ → 各セクション `@figma-template-coding`
  - スタイルのみ → 各セクション `@figma-style-coding`（通常はページ全体解析では稀）
  - 一式、または特に指定なし → 各セクション `@figma-coding`
- **Request notes**: 依頼文から、実装時に必要な条件だけ短く残す（JS／Swiper 明示、**アノテーション UX／機能仕様**、テンプレのみ、除外セクション、PHP パス指定など）。無ければ「なし」

## Step 2: page-slug

- Figma の **ページフレーム名**を slug 化する（英語名前提）
- 例: `about` → `about`、`Page About` → `page-about`
- 小文字・スペースや `/` は `-`・連続 `-` は1つに

## Step 3〜4: セクション分割

優先順位:

1. レイヤー名の `SECTION(...)`・section-space・明確なセクション境界（整備）
2. `figma-rule.mdc` の分類命名で区切れる塊
3. 命名が薄い／Variables 未適用（非整備）は `interpretation.mdc` で境界推定し、**余白・コンテナ幅の算出根拠を不明点または Notes に書く**（`figma-rule.mdc`「セクション・コンテナ余白」。計画は止めずに出す）

各セクションに少なくとも次を付与する:

- 表示名（レイヤー名または推定名）
- node-id（URL 用。`-` ↔ `:` は既存 Figma URL 慣習に合わせる）
- 対象デバイス（pc / sp / both — 渡されたフレームに存在するか）

両フレームがあるときは対応セクションを突き合わせ、**テンプレ影響差分**を Template DOM diffs に書く（`figma/responsive.mdc`「差分先行」）。スタイル数値差はここに書かない。

アノテーション（正本: `figma-rule.mdc`「アノテーション」）を確認する。**UX / 機能仕様**（動き・機能が要る他要件も含む）は Request notes に短く残す（JS 工程をスキップしないため）。同一工程では重いものは Notes にセクションと要約を書く。**原稿**は計画に長文転記しない（実装時 TODO）。

## Step 5: 実装順

- 基本はページ上から下（視覚順）
- header / footer がページ内に含まれる場合は計画に含め、共通部品扱いかは実装時の `figma-rule` に委ねる
- 依存が明らかな場合のみ順を入れ替え、理由を計画に1行書く

## Step 6: 計画ファイル

- パス: `.cursor/tmp/figma-plans/<page-slug>.md`
- ディレクトリが無ければ作成
- **同じ page-slug は上書き**（タイムスタンプ付き新規は作らない）
- **上書き時**: 全セクション `Status` を `pending` に初期化する（再開用の進捗は捨てる。やり直し意図）
- git 管理外（`.gitignore` 済み）

### Status 値

| 値 | 意味 |
|----|------|
| `pending` | 未実施 |
| `done` | 当該セクションの実装スキル完了 |
| `blocked` | ブロッカーで停止（理由は Progress） |

### ファイルテンプレート

次の見出し構成で書く（余分な長文は避ける）:

```markdown
# Figma page plan: <page-slug>

- Source: <Figma URL>
- Frames: <pc / sp / both と node-id>
- Skill default: <figma-coding | figma-template-coding | …>
- Request notes: <JS明示・アノテーション UX／機能仕様・テンプレのみ・除外・パス指定など。無ければなし>
- Analyzed at: <ISO8601 or local datetime>

## Sections (implementation order)

| # | Name | node-id | Device | Skill | Status |
|---|------|---------|--------|-------|--------|
| 1 | … | … | pc | figma-coding | pending |
| 2 | … | … | both | figma-coding | pending |

## Template DOM diffs

（両デザイン時のみ。片側のみなら「なし」）

| # / Section | Diff | Template? | Note |
|-------------|------|-----------|------|
| … | 改行 / 要素有無 / DOM 構造 / 画像出し分け / 表示切替 等 | yes / no（style-only） | …

## Notes

- （実装順の入れ替え理由、**重い UX／機能仕様**の要約など。無ければ「なし」）

## Open questions

- （分割が推定の箇所・不明点。SP のみダミー文言で PC 正とする判断など。無ければ「なし」）

## Progress

- Last done: （なし）
- Blocked: （なし）
- Resume: `@figma-page-implement` + page-slug `<page-slug>`（または本計画パス）
```

## 完了報告

- 保存したファイルパス
- セクション数と実装順の要約（表または短い箇条書き）
- Open questions があれば要点のみ
- **実装には進まない**。次は `@figma-page-implement` またはユーザー指示でセクション実装
