---
name: generate-scssfile
description: >-
  指定PHPから un_/bl_/el_/header_/footer_ クラスを抽出し、空の SCSS 骨組みを生成する。
  @figma-template-coding の Step でも使用。SCSSファイル生成、クラス定義のみ、pages.php の assets_name、ネスト規則を依頼されたときに使用する。
disable-model-invocation: true
---

# generate-scssfile

実行時に指定された対象 PHP ファイルを確認し、必要な SCSS ファイル（クラス定義のみ）を生成してください。

## 他スキルとの関係

- **`@figma-template-coding`**: テンプレート実装の Step 6 で本スキルを実行する（空 `{}` のみ。スタイルは書かない）
- **`@raw-design-implement`**: テンプレート後の Step 6 で本スキルを実行する（空 `{}`）。続く Step で AI JSON 由来の `font()` 値直指定等を追記することがある（正本: 当該スキル `tokens.md`）
- **スタイル実装**: `@figma-style-coding` / `@figma-coding` のスタイル工程、または手動
- **エントリへの `@use`**: `common.scss` 等への部品追記は **手動不要**（依頼者側の `npm run dev` / watch が追従。エージェントは `scss-index` を実行しない）。ページ先頭の `@use './initpage'` と部品先頭の `@use '../../foundation/'` は本スキルの生成ルールどおり記載する

前提：
- 画面固有のクラスは `un_` で始まるものです。このクラスはページ専用ファイルに記載します。
- `bl_` / `el_` で始まるクラスはそれぞれ block / element です。`el_` は `modules/elements/_<elementName>.scss` に記載する（`common.scss` への `@use` 手動追記は不要 — `project/css/scss.mdc`「エントリーファイル」参照。スタイル実装は別工程）。
- `header_` / `footer_` で始まるクラスは、それぞれ `_header.scss` / `_footer.scss` に記載します。
- `ly_`、`hp_`、`is_`、`has_` などその他接頭辞のクラスはこの指示では対応不要です。
- `ly_`/`hp_`/`is_`/`has_` などのスタイル実装は不要です。
- この指示の場合、scss には「クラス名の定義だけ」を行い、スタイル実装はしません。

ネスト規則：
- 接頭辞（`un_` / `bl_` / `el_` 等）を除いた **残り全体** を、ブロック根の直下で **1つの `&_` セレクタ** にまとめる（`project/css/scss.mdc`「ネスト」）。
  - 例: `un_works_sliderItem` => `.un_works { &_sliderItem {} }`
  - 例: `un_ojt_stepBulletIcon` => `.un_ojt { &_stepBulletIcon {} }`
- **禁止**: `_` 区切りの各語を `&` で重ねて入れ子にする（例: `&_stepBullet { &Icon {} }`）
- `__mmmm` のように先頭が `__` のクラスはモディファイアです。
  - 対象セレクタ内で `&.__mmmm` の形でネストしてください。

ページ SCSS（`pages/`）の `section_` 規則：
- **`.section_xxxx` 内に `.un_*` をネストしない**（`project/css/scss.mdc`「ページ SCSS と `section_`」）。
- セクションごとに `.section_{セクション名} {}` と `.un_{セクション名} {}` を **兄弟ブロック** として並べる。`.section_*` にはセクション根向けスタイルのみ（骨組み生成時は空 `{}` でよい）。

スタイル実装禁止：
- SCSS 内にはプロパティ等を書かないで、空の `{}` ブロックで構いません。
- ただし空ブロックの書式は1行 (`{}`) ではなく、以下のように改行した形で統一してください。
  - 例:
    ```scss
    .header {
      &_inner {

      }
    }
    ```

ファイル命名（ページ側）：
- ページ固有SCSSファイル名は `resources/htdocs/includes/config/pages.php` の `assets_name` を参照します。
- `assets_name` が `null` の場合は、ユーザーが指定した「ページキー（pages.php 内の key）」をページSCSS名として扱ってください。
- block/element の SCSSは、ファイル名の先頭に `_` を付けた `_<部品名>.scss` になります（接頭辞 `bl_` / `el_` は不要。部品名は class と同じ **camelCase**。ケバブ禁止。正本: `project/css/scss.mdc`「モジュール用ファイル名」）。
- block の例外ルール：
  - `bl_xxxxWrap` / `bl_xxxxUnit` / `bl_xxxxParent` が `bl_xxxx` より親階層にある場合、`_xxxx.scss` にまとめてクラス定義してください。
  - この場合、`_xxxxWrap.scss` / `_xxxxUnit.scss` / `_xxxxParent.scss` のような専用ファイルは作成しないでください。

配置先：
- ページ（`un_`）: `resources/htdocs/src/scss/pages/<pageName>.scss`
- block（`bl_`）: `resources/htdocs/src/scss/modules/blocks/_<blockName>.scss`
- element（`el_`）: `resources/htdocs/src/scss/modules/elements/_<elementName>.scss`
- header: `resources/htdocs/src/scss/modules/header/_header.scss`
- footer: `resources/htdocs/src/scss/modules/footer/_footer.scss`
- ディレクトリが存在しない場合は作成してよいです。

@use ルール（必須）：
- ページ固有 SCSS（`pages/<pageName>.scss`）の先頭には、必ず `@use './initpage' as *;` を記載してください。
- ページ固有 SCSSでは、`initpage` 以外の `@use`（`modules/blocks`・`modules/elements` 等への参照）は記載しないでください。共通・部品スタイルは `common.scss` 側で読み込まれる前提とします（`common.scss` 自体は `scss-index` で自動生成 — 手動で `@use` を追記しない。`project/css/scss.mdc`「エントリーファイル」参照）。
- 部品 SCSS（block / element / header / footer）の先頭には、必ず `@use '../../foundation/' as *;` を記載してください。
- `@forward` は使用しないでください。

コメント：
- コメントの雰囲気は `resources/htdocs/src/scss/_template.scss` を参考にしてください（ただしスタイル実装はしない）。

対象ファイル（スキャン対象）：
- ユーザーが指定する対象PHPファイル（例: `resources/htdocs/index.php`）
- `resources/htdocs/includes/layouts/header.php`
- `resources/htdocs/includes/layouts/footer.php`
- `require` / `require_once` / `include` / `include_once` で読み込まれる別 PHP ファイルは、スキャン・クラス抽出の対象外とします（読み込み先のテンプレート本文は見ない）。
- 抽出の対象は、上記「ユーザー指定の対象PHP」と「header.php」「footer.php」の各ファイル本文に限定してください。

参照ファイル（生成対象ではない）：
- `resources/htdocs/includes/config/pages.php`（assets_name 参照用）

実行時の要件（ユーザーがチャットで指定）：
- 対象PHPファイルのパス（例: `resources/htdocs/index.php`）
- pages.php 内のページキー（assets_name 参照に使用する key。例: `top` など）

そして、上記のスキャン対象に限定して各ファイル本文をスキャンし、登場する `un_`/`bl_`/`el_`/`header_`/`footer_` クラスだけを抽出して、上記ルールで SCSS を生成してください。

補足：
- `un_` は画面固有ルールのため、基本的には「ユーザー指定の対象PHPファイル」から抽出してください（header/footer側に `un_` が出ても、ネスト先は不確実になるため）。
