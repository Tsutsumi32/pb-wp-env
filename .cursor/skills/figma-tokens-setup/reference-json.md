# JSON 一括同期リファレンス

突合せの共通ルールは `figma/style.mdc` §2〜6。以下は JSON エクスポート時の手順詳細。

## JSON 配置先

- **正**: `.cursor/figma-tokens/`（例: `_PrimitiveColor.json`, `SemanticColor.json`, `Font.json`, `Device.json`, `TextStyles.json`, `EffectStyles.json`, `Space.json`）
- プラグイン Export の解凍先も同ディレクトリ（`.cursor/figma-tokens/README.md`）
- `_docs/figma/` は使わない

## サンプル値の除去（共通）

`@figma-tokens-setup` の一括設定では、**テンプレート初期状態のサンプル値を残さず**、案件で採用した値のみで map を構成する。

### 原則

- **追記のみにしない**。調査・JSON の結果で対象 map を **丸ごと差し替え** る
- テンプレート由来のキー（例: `roboto`, サンプル `etc/*` / `head/*`, 旧案件の `brand-*` / `neutral-*` パレット）が残っていないことを反映前に確認する
- `@reset-scss-variables` 直後は `$color-palette` / `$font-configs` が空・`$colors` は分類キー残し（`ui` 以外は空・`ui` は既存値のまま）・`$base_font` は `sans-serif`。本ルールで **案件値へ上書き置換** する（`$colors` の `ui` も SemanticColor があれば差し替え）

### 置換対象（案件値のみ残す）

| 変数 / ファイル | 操作 |
|-----------------|------|
| `$color-palette`, `$colors` | 案件の色のみ（`sample*` 等の仮名は使わない。`project/css/scss.mdc`「カラー」） |
| `$font-weight-key`, `$font-configs`, `$base_font`, `$base_font_key` | 案件フォントのみ |
| `$text-styles` | 案件スタイルのみ |
| `$section-sizes`, `$content-space`, `$container-sizes`, `$border-radiuses`, `$border-width` | 案件レイアウトトークンのみ |
| `$effects`, `mixins/base/_effects.scss` の `$_effect-styles` | 案件エフェクトのみ |

### 触らない（インフラ・後続 Step で調整）

| 範囲 | 理由 |
|------|------|
| size / breakpoint / style-settings | `@reset-scss-variables` 保持。`@project-env-setup` C-2〜C-5 で調整 |
| `$font-path-base`、色・フォントの各 `@function` 定義 | テンプレートの仕組み |
| `$font-s-base`, `$image-paths`, `$heights`, `$transitions`, `$z-indexes` | 案件トークン外 |

### 確認

反映後、除去したサンプルキー例を完了報告に 1〜2 件記載する（例: `roboto`、旧 `brand-01`）。

## PrimitiveColor（`_PrimitiveColor.json`）

- 対象: `variables` の `type: "COLOR"` のみ
- 更新: `$color-palette`（`_variables.scss`）
- `name` → キー（`/` は `-`）。値は `resolvedValuesByMode`
- JSON の内容のみで構成し、テンプレート由来のサンプルキーは残さない
- 16進は小文字に正規化。重複キーなしを確認

## SemanticColor（`SemanticColor.json`）

- `$colors` をモード別 map（初期モードキー `'default'`）。**テンプレート由来のセマンティックキーは残さない**（上記「サンプル値の除去」）
- `name` の `/` → `group` / `name`
- Alias → `get-color-palette('<primitive-key>')`（`/` → `-`）
- 直接値は16進正規化
- `ui/*` → フラット変数（`$color-select-text` 等、style.mdc §6 参照）
- `$color-base-text` ← `text/base`、`$color-body-bg` ← `background/canvas`
- **UI フラット変数のコメント解除**: Figma `SemanticColor` に `ui/*` が定義されているキーについて、`_variables.scss` の対応行のコメントを外す（未定義キーはコメントアウトのまま）

| Figma キー | `_variables.scss` |
|------------|-------------------|
| `ui/select-text` | `$color-select-text` |
| `ui/select-bg` | `$color-select-bg` |
| `ui/focus-outline` | `$color-focus-outline` |
| `ui/scroll-track` | `$color-scroll-track` |
| `ui/scroll-handle` | `$color-scroll-handle` |

## Font（`Font.json`）

**一括同期の必須対象。** カラー・タイポのみ更新して本節を省略しない。

- `modes` の `font-family` をフォント種キー（例: `noto-sans-jp`）
- `font-weight:xxxx` → `$font-weight-key`
- `$font-configs` に Font.json のファミリーのみ定義（全 weight・`fallback`）
- **`$base_font` / `$base_font_key`**: **Font 投入時に一度だけ**、主要本文スタイル（`paragraph/*` 等）のファミリーで `get-font-family($base_font_key)` を設定する。画面実装では再判定しない。`$text-styles` には `font` を置かない（同一スタイルをファミリーだけ差し替えて使うため）
- **未使用フォントの削除**: **Font.json の `modes` に無い**テンプレート由来フォント（旧案件の `noto-sans-jp` 等）のみ `$font-configs` から削除する。**Font.json の modes に含まれるファミリーは、`$text-styles` 未参照でも残す**（命名スタイル未適用の個別指定テキストで `get-font-family()` を使うため）
- **`files`**: Google Fonts 準拠のファイル名（例: `ZenKakuGothicNew-Medium.woff2`）。**実体配置・CDN**は `@project-env-setup` C-6（調査 → AskQuestion）。CDN 前提のときは `files: ()`（空）。サブセットは手動

手順:

1. `Font.json` から `$font-weight-key` と `$font-configs` を更新する
2. `TextStyles.json` から `$text-styles` を更新する（下記「テキストスタイル」）
3. Font.json の `modes` に無いテンプレート由来エントリのみ `$font-configs` から削除する
4. 本文スタイル（`paragraph/*` 等）のファミリーで `$base_font_key` / `$base_font` を **一度**更新する（以降の画面実装では変えない）

**JSON 同期の完了禁止条件**: `$font-configs` が空、`$base_font_key` が null、または `$base_font` が汎用 `sans-serif` のみのまま → **同期未完了**として手順 1〜4 に戻る（正本: `@figma-tokens-setup` SKILL「Step 3 完了ゲート」）。

### フォント実体の準備

SCSS 変数（`$font-configs`）更新後、**ブラウザ向けの読み込み**を用意する。正本は `@project-env-setup` [reference.md](../project-env-setup/reference.md)「C-6 フォント読み込み」。

1. 各ファミリーについて `@fontsource` 対応有無・CDN 可否・現状の `files` / `FONT_TAGS` を調査する
2. **AskQuestion** で方式を確定（@fontsource セルフホスト / CDN / 手動配置 / デバイスフォント / スキップ）。自動で優先しない
3. 承認後に配置または `FONT_TAGS` 更新。不要実体の削除は C-6 と同方針
4. **サブセット化は実行しない**（ユーザー手動）

**不要フォント実体の削除**（`@project-env-setup` C-6 と同一）:

- `{フロント}/assets/fonts/` 直下・`_source/`・`ttf/` 等にある `.woff2` / `.woff` / `.ttf` のうち、**現行 `$font-configs` の `files` と `fonts.config.json` の `input` / `output` に無いもの**を削除する
- 空になった旧ディレクトリ（例: テンプレ由来の `ttf/`）も削除する
- `font-subset/` 内の `chars_*.txt` / `fonts.config.json` は削除しない

## Device（`Device.json`）

- `$media-query-strategy` に従い default / ブレイクポイント上書き
- 更新 map: `$section-sizes`, `$content-space`, `$container-sizes`, `$border-radiuses`, `$border-width`, `$design-size-pc`, `$design-size-sp`, `$design-container-pc`（テンプレート由来キーは残さない）
- キー統合・padding / max-width の正本: `project/css/scss.mdc`「コンテナ・セクション余白」

### Device（コンテナ）— `$container-sizes`

**一括同期の必須対象。** カラー・タイポのみ更新して本節を省略しない。

| Figma 変数（`Device.json`） | SCSS | 備考 |
|-----------------------------|------|------|
| `container/{size}-space` | `$container-sizes` の `'padding'` | キー名は `{size}`（`s` / `m` / `l` 等） |
| `container/{size}-max` | `$container-sizes` の `'max-width'` | 上限なし相当（例: `99999`）は `null` |

手順:

1. `Device.json` の `container/*-space` / `container/*-max` を列挙する（同一 `{size}` で組にする）
2. 各変数の `resolvedValuesByMode`（または `valuesByMode`）から PC / SP の数値を取得する
3. `$media-query-strategy` が `pc-first` なら `'default'` = PC（mode `20:0`）、`get-breakpoint-key('sp')` = SP（mode `20:1`）
4. 数値は **単位なし**（`s()` 適用前提）。**Figma 値をそのまま** `'padding'` / `'max-width'` に入れる（**加減算・丸め禁止**。正本: `figma/style.mdc` §1・`scss.mdc`）
5. `*-max` が上限なし相当のときは `'max-width': null`
6. Variables が無いキーだけ、`scss.mdc` のフォールバック（PC padding 40・列幅＋padding）を使う。**Variables があるキーに列＋padding を加算しない**

### Device（余白）— `$section-sizes` / `$content-space`

**一括同期の必須対象。** カラー・タイポのみ更新して本節を省略しない。

| Figma 変数（`Device.json`） | SCSS | 備考 |
|-----------------------------|------|------|
| `space/section-space/s` 〜 `l` | `$section-sizes` | キー名は末尾（`s` / `m` / `l`）。`ly_section __*` に対応 |
| `space/content-space/xs` 〜 `xl` | `$content-space` | キー名は末尾（`xs` / `s` / `m` / `l` / `xl`） |

手順:

1. `Device.json` の `space/section-space/*` / `space/content-space/*` を列挙する
2. 各変数の `resolvedValuesByMode` の **`aliasName`**（例: `space/120`）から実数 px を取得する（`Space.json` の Primitive 参照）
3. `$media-query-strategy` が `pc-first` なら `'default'` = PC（mode `20:0`）、`get-breakpoint-key('sp')` = SP（mode `20:1`）
4. 数値は **単位なし**（`s()` 適用前提）。Figma Variables の値を **そのまま** `$section-sizes` / `$content-space` に反映する（近い既存キーへの丸めはしない。正本: `figma/style.mdc` §1）
5. セクション上下別指定が必要な場合のみ、`$section-sizes` の値を map（`'top'` / `'bottom'`）にする

## テキストスタイル（`TextStyles.json`）

**一括同期の必須対象。** `Font.json` と合わせて更新する。

- 対象: Figma のローカルテキストスタイル（`head/*`, `paragraph/*`, `etc/*` など）
- 更新: `$text-styles`（`_variables.scss`）。テンプレート由来のスタイルキーは残さない
- `key` は先頭 `_` 除去済み（例: `etc/_s` → `etc/s`）。`fontName.style` / `fontSize` / `lineHeight` / `letterSpacing` を参照
- 1スタイルあたり必須: `weight`, `size`, `line`, `space`（`style.mdc` §4）。**`font` は同期しない**（ファミリーは Figma バリアブルモード / 実装時の `$_family` で上書き）
- **`line`（行間）の小数桁**: Code へ書く値は **Figma の行高（PIXELS なら px 相当・単位なし／PERCENT なら `%` 付き）をそのまま**。小数第3位を四捨五入し小数第2位まで（浮動小数の桁あふれ対策。`figma/style.mdc` §1 の近いキー／きれいな数への丸め禁止とは別）。**CSS の倍率（`1.5` 等）へ換算してから書かない**（`font()` が単位なしを `÷ size` するため。正本: `project/css/scss.mdc`「`font()` 直指定の引数」）
  - 例（PIXELS）: `21.666…` → `21.67`、`24` → `24`（不要な末尾 0 は付けない）
  - 比較・pull（`@figma-tokens-sync`）も **丸め後を正**とする。Code が長桁で丸め後が同じなら `変更`（桁揃え・**pull のみ**。Figma へは push しない）
- **`space`（文字間）**: **`letterSpacing.unit` を正**とする。数値の見た目で PIXELS と推測しない。Dev Mode / MCP の CSS 換算（`em` / `px`）は書かず、生の `unit` + `value` に合わせる（正本: `project/css/scss.mdc`「`font()` 直指定の引数」）
  - **PERCENT** → `$text-styles` の `space` は単位なしの `value`（例: `3`、`1.8`）。`font()` が `÷ $font-letter-spacing-unit`（既定 100）× `1em`
  - **PIXELS** → `space` は `px` 付き（例: `1.8px`）。実装直指定も同じ
  - 例: `{ unit: "PERCENT", value: 1.8 }` → `'space': 1.8`（`1.8px` にしない）

## エフェクトスタイル（`EffectStyles.json`）

- 対象: Figma のローカルエフェクトスタイル（`dropshadow/*` など）
- 更新: `$effects`（type/pattern）と `mixins/_effects.scss` の `set-effect()`（`style.mdc` §5）。テンプレート由来のエフェクトは残さない
- `effects` 配列の `DROP_SHADOW` / `INNER_SHADOW` 等を参照
