---
name: figma-style-coding
description: >-
  figmaMCPで既存テンプレートにスタイル（SCSS）を実装する。通常はデザイン通り・キーも数値も丸め禁止・非整備の丸めはセクション余白のみ・Variables/TextStyleは突合・BP間は同一キー。
  PHP未整備なら止め、先にfigma-template-codingを促す。スタイルのみ・CSS実装の依頼時に使用する。
disable-model-invocation: true
---

# figma-style-coding

既存の PHP/HTML（テンプレート済み）に対し、figmaMCP で **スタイルのみ**実装するワークフローです。

## 前提チェック（必須）

対象ページ／部品の **PHP/HTML が未整備**なら実装を中止し、先に `@figma-template-coding`（または `@figma-coding`）を促す。スタイルスキル内でテンプレを新規作成しない。

## 必須参照

**開始時に Read する。** 条件に合わないファイルは読まない（曖昧なら読む側）。

**常時**

- **`figma/style.mdc`**（本工程の正）
- `project/css/scss.mdc`（カラー・margin・テキストの折り返し・コンテナ余白・aspect-ratio）
- `frontend-base/css.mdc`（プロパティ順・**Figma 値コメント禁止**）

**条件付き**

| 参照 | いつ Read |
|------|-----------|
| `figma/figma-rule.mdc` | class・余白トークンの確認が必要、または **このターンで未 Read** |
| **`figma/responsive.mdc`** | 両デザイン、またはレスポンシブ実装するとき |
| `project/css/responsive.mdc` | 同上（あれば） |
| `figma/inside-stroke.mdc` | Inside stroke と padding が同居するノードがある |
| `project/javascript/swiper.mdc` | Swiper 明示時 |

**同ターン免除**: `@figma-coding` のテンプレ直後など、**このセクションのこのチャットターンで既に Read 済み**のファイルは再 Read しない。常時の `style.mdc` / `scss.mdc` / `frontend-base/css.mdc` はスタイル工程で未読なら必ず Read。page-implement 外ではソフト停止・新規チャット・次セクション・スタイル単独依頼で免除なし（正本: [figma-coding](../figma-coding/SKILL.md)「同ターン再読免除」）。

**ページ実装セッション免除**: 親が `@figma-page-implement` のとき、同一チャット・ソフト停止までは [figma-coding](../figma-coding/SKILL.md)「ページ実装セッション再読免除」。既読の必須参照は次セクションでも再 Read しない。本 SKILL は同型連続の2本目以降は再 Read 不要。**Step 5b（両デザイン）は免除しない**。巨大ルールは各 `.mdc` 冒頭の **Read map**（必要 § のみ）。

## 実行フロー

```
- [ ] Step 0: 対象 PHP/HTML の存在を確認（無ければ中止）
- [ ] Step 1: Figma URL・対象範囲（PC/SP・両フレーム有無）を確認
- [ ] Step 2: 既存 _variables.scss（`$media-query-strategy`・`$font-configs`・`$base_font` 含む）/ 既存 SCSS 慣習を確認。**フォント §6 ゲート**（`figma/style.mdc`）未充足なら **Step 5 に進まない**（CDN/`files` 既存なら AskQuestion なしで configs 最小追記可。`$base_font` 未設定時のみ本文ファミリーで一度セット。読み込み未決は C-6）
- [ ] Step 3: figmaMCP でスタイル値を取得（Variables またはノード実測）。**アノテーションがあれば確認**し、スタイルに効く指示（**UI**：レスポンシブ・z-index・疑似・モーション等）を反映（正本: figma-rule「アノテーション」）。**同型連続の2本目以降**は `figma-page-implement`「同型セクション連続（MCP）」（差分のみならフルダンプ回避・`excludeScreenshot: true` 既定）
- [ ] Step 4: Variables/TextStyle 突合・不足キーは Figma 値で追記（キーも数値も丸め禁止・未適用は個別実装 — `figma/style.mdc` §1）。新規ファミリーは §6 ゲートに従い `$font-configs` 追記＋読み込み確認（直書き `font-family` で迂回しない）
- [ ] Step 5a: ファースト側（strategy の default）のスタイルを実装
- [ ] Step 5b: 両デザイン時 — `figma/responsive.mdc` 再 Read ＋ **もう一方フレームで MCP 再取得** → 項目突合して @include で上書き（**Figma 同値なら SP も同値／縮小禁止**・セッション免除対象外）
- [ ] Step 5c: 片側のみ時 — もう一方は基本対応（余白は原則ひと段階・据え置き禁止／PC のみ時の SP テキスト寄せを含む）
- [ ] Step 6: style.mdc §7 チェック（数値突合・丸めなし・コンテナは Variables 直値／欠落時のみ列＋padding）＋ responsive 方針
- [ ] Step 6（フォント完了ゲート・必須）: 対象ファミリーがすべて `$font-configs` にある／**`$base_font` が案件値**（`sans-serif` のみ・`$base_font_key: null` は不可）／別ファミリーは `$_family`+`$_font-key`。未充足なら完了報告しない
```

### Step 5b（両デザイン・コンテキスト）

ファースト側の実装が長いと、もう一方に入る前に方針が薄れやすい。上書き開始直前に次を行う（省略禁止・セッション免除対象外）:

1. `figma/responsive.mdc`（必要なら `project/css/responsive.mdc`）を **再 Read**
2. もう一方のフレームで figmaMCP（`get_design_context` 等）を **再取得**（ルール再読・PC 実装の記憶だけでは不十分）
3. セレクタ単位で項目突合して `@include` 上書き（正本: `figma/responsive.mdc`「両デザイン」スタイル工程・項目リスト）。**片側用の基本対応は使わない**。**Figma で PC＝SP なら実装も同値**（トークン SP 枠が小さいときは MQ でフレーム値へ補正）

## 実装要点

- **バリアント／状態スタイル**: `__*`・`:disabled` / `:checked`・`hover` 等はテンプレで付いた構造（**選択中バリアント**）に合わせ、差分はメイン側の種類分を実装（正本: `figma-rule.mdc`「インスタンス・メインコンポーネント・バリアント」）。インスタンスだけの色上書き等は部品本体を壊さずページ側で局所対応
- **通常はデザイン通り**（依頼に「非整備」明示がなければ通常扱い）。**キーも数値も丸め禁止**（近い・きれいな数への寄せ禁止）。Variables / Text Styles 適用箇所は **キーと値を突合**。未適用箇所は個別実装または不足キーをデザイン値で追記。値ずれの既存キーは画面実装で書き換えず `@figma-tokens-setup` / `@figma-tokens-sync`。**片側・依頼明示の非整備でも丸め可は `$section-sizes` のみ**。その他余白は Figma 通り（正本: `figma/style.mdc` §1）
- **ブレイクポイント間は同一キー**（PC で `paragraph/l` なら SP も `paragraph/l`。キー切替は原則 NG — 同 §1）
- **レスポンシブ**: スタイル工程では原則対応。**両デザイン＝ファースト側→もう一方フレーム再取得→項目突合して上書き（SP も PC と同水準でデザイン通り。基本対応禁止。Figma 同値なら SP も同値／縮小禁止）**／片側のみ＝もう一方は基本対応（**余白は原則ひと段階・据え置き禁止**、例外あり）。**PC のみ時は長いリード・説明文の SP 左寄せ** — `figma/responsive.mdc`。HTML が要る差分が出たらテンプレに戻す（解析漏れ）。詳細は `figma/responsive.mdc`「差分先行」
- カラー: `$color-palette` → `$colors` → **`get-color()`**（実装から palette 直参照禁止。**CSS の役割と group 一致**・同色でも `text` を border 流用しない。Semantic 明示適用時はキー突合 — `project/css/scss.mdc`「カラー」）
- フォント: **`$font-configs` / `$base_font` ゲート**（未充足ならスタイル数値に進まない。完了時も Step 6 フォント完了ゲート。正本: `figma/style.mdc` §6）
- **`font()`**: 直指定は size / line / space / weight を引数で完結（直後の `letter-spacing` 等重ね書き禁止。**`$_space` は `letterSpacing.unit` 正**・見た目で PIXELS 推測禁止 — 正本: `project/css/scss.mdc`「値とmixin / function」）
- テキスト上下トリミング（Dev Mode の `leading-trim` 等）: `@include text-trimming`（正本: `figma/style.mdc` §4）
- テキストに `flex-shrink: 0` / `white-space: nowrap` を付けない（MCP 出力も転記しない。正本: `scss.mdc`「テキストの折り返し」）
- 比率固定（装飾・正方形）は `width` と `height` の両方指定禁止。一方 + `aspect-ratio`。画像は枠でトリミングする箇所だけ（正本: `scss.mdc`「aspect-ratio」）
- コンテナ: `$container-sizes` 正。**`container/*-space` / `*-max` があるときは直値**（`scss.mdc`）。Variables 欠落・非整備算出時は列幅＋padding フォールバック（`figma-rule.mdc`「セクション・コンテナ余白」）
- 余白 class: **Variables（section-space / container）を主**。任意の `SECTION(...)` / `CONTAINER(...)` は保険。**非整備は算出値を `$section-sizes` / `$container-sizes` に最小追記**してから `ly_*`（既存キー値は変更しない）
- エントリへの `@use` 手書き不要（`npm run dev` 前提）
- 一括基盤更新が必要なら `@figma-tokens-setup` を案内

## 完了報告（フォント）

短く報告に含める: 対象ファミリー ⊆ `$font-configs`／`$base_font_key`・`$base_font`（案件値）／新規追記・読み込みの有無。ゲート未通過なら完了扱いにしない。