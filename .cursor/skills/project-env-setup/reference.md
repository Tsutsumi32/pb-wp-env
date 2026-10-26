# project-env-setup リファレンス

SKILL.md の会話フロー用の技術メモ。

**正本として他スキルから参照するもの**: 「WordPress 判定」「フロントルート」「スキル実行順（推奨）」。`@pre-launch-check` はこれらを複写せず参照する。

## WordPress 判定（正本）

`@project-env-setup` A-1-0 / `@pre-launch-check` 開始時で共通。

| 結果 | 条件 |
|------|------|
| WordPress | `resources/wp-dir/` が存在し、`.env.example` に `WP_DIR_PATH` / `WP_THEME_NAME` がある |
| 非 WordPress（PHP） | 上記を満たさない |

補足（あれば判定の裏付けに使う。必須条件は上表）:

```
resources/wp-dir/wp-config.php または wp-load.php
resources/wp-dir/wp-content/themes/ にテーマディレクトリ
```

## プロジェクト名

### プロジェクト名の推定（A-1-1）

**方針**: Figma URL・ファイル名からは推定しない。**手動入力**を正とする。AskQuestion は **現状維持** / **手動入力** を基本にし、参考候補はチャット提示のみ（または任意で選択肢に載せてもよい）。

| 優先 | 根拠 | slug 化 |
|------|------|---------|
| 1 | ユーザーがチャットで指定した slug | 英小文字・数字・ハイフンのみ |
| 2 | `.env.example` の `PROJECT_NAME`（現状維持候補） | そのまま |
| 3 | リポジトリ / 作業ディレクトリ名（参考。自動採用しない） | `.` → `-`、英小文字・数字・ハイフンのみ |

### WP_SITE_TITLE の推定（A-1-1）

**方針**: Figma からは読まない。**手動入力**を正とする。

| 優先 | 根拠 | 例 |
|------|------|-----|
| 1 | ユーザーがチャットで指定した会社名・サイト名 | そのまま |
| 2 | 現状がサンプル値以外（現状維持候補） | `.env.example` の値 |
| 3 | 現状がサンプル値（`株式会社サンプル` 等） | **変更必須** — `現状維持` は選択肢に載せず、手動入力を促す |

### `.env.example` で更新する項目

| 変数 | ルール |
|------|--------|
| `PROJECT_NAME` | 確認した slug |
| `WP_SITE_TITLE` | 確認したサイト表示名（サンプル値 `株式会社サンプル` は案件名に差し替え） |
| `DB_ROOT_PASSWORD` | `{slug}_pass`（既存パターンに合わせる） |
| `DB_DATABASE` | `{slug}-hp_db` またはユーザー指定 |
| `DB_USERNAME` | `{slug}-hp` またはユーザー指定 |
| `DB_PASSWORD` | `{slug}-hp_dbpass` またはユーザー指定 |
| `FRONT_CONTAINER` | ユーザーが指定した場合のみ |
| `WP_CONTAINER` | ユーザーが指定した場合のみ |

**触らない**: `HOST_UID` / `HOST_GID`（`make init` で設定）、ポート類（ユーザーが明示した場合のみ）。

### SITE_NAME・webmanifest（A-1-1 で同時更新）

`WP_SITE_TITLE` と **同じ文字列** で次を更新する（現状維持でも `SITE_NAME` / webmanifest がサンプル値のときは揃える）。

| 対象 | 環境別パス | 値 |
|------|------------|-----|
| `const SITE_NAME` | PHP: `resources/htdocs/includes/config/config.php` / WP: `{テーマ}/inc/config/config.php`（定数がある場合） | `WP_SITE_TITLE` と同値 |
| `site.webmanifest` の `name` | PHP: `resources/htdocs/assets/settings/site.webmanifest` / WP: `{テーマ}/assets/settings/site.webmanifest` | 同上 |
| `site.webmanifest` の `short_name` | 同上 | 同上（ホーム画面用の短縮が必要なら公開前に手動で短縮可。A-1 ではサイト表示名と同一） |

サンプル値の目安（残っていれば差し替え）: `MyWebSite` / `MySite`（webmanifest）、`Sample inc.` / `株式会社サンプル` / `株式会社テスト`（`SITE_NAME` / `WP_SITE_TITLE`）。

`og:site_name`・フッター著作権・`pages.php` の `text` 等はテンプレートが `SITE_NAME` を参照するため、定数更新だけで追従する（A-1 で個別編集しない）。

`project-page-info` では `SITE_NAME` を再確認しない。A-1 未実施・不一致時は B-1 の前に A-1 を案内する。

### Docker

`docker-compose.yml` の `container_name` 例: `${PROJECT_NAME}_db`, `${PROJECT_NAME}_${WP_CONTAINER}`, 等。

## テーマ名（WordPress）

### テーマ名の推定（A-1-2）

**方針**: Figma からは読まない。**手動入力**を正とする。

| 優先 | 根拠 | 例 |
|------|------|-----|
| 1 | ユーザーがチャットで指定したテーマ名 | そのまま |
| 2 | `themes/` 配下の既存ディレクトリ名（現状維持候補） | 現状維持として提示 |
| 3 | 確定した `PROJECT_NAME` + `-hp`（参考。自動採用しない） | `makino-d-co-jp` → `makino-d-co-jp-hp` |

| 対象 | 内容 |
|------|------|
| テーマディレクトリ | `themes/{旧名}/` → `themes/{新名}/`（`git mv` 推奨） |
| `.env.example` | `WP_THEME_NAME={新名}` |
| `resources/build-config.js` | `FRONT_DIR = 'wp-dir/wp-content/themes/{新名}'` |

## B-1 最小構成（サンプル掃除）

`pages.php` を TOP・エラー・404 のみにする。**全画面の Figma 一括登録はしない。** 下層は [pages-ensure.md](../project-page-info/pages-ensure.md)。CPT/ACF・PHP 更新可能コンテンツは `@project-page-info` 動的モード（指定フレーム）。

| 残す | 例（PHP `Page` 定数） |
|------|----------------------|
| TOP | `TOP` / `top` |
| エラー | `ERROR` / `error` |
| 404 | `NOT_FOUND` / `not-found` |

手順:

1. `$pages`（または同等配列）から上記以外のエントリを削除
2. 対応する `public const` を削除（他ファイル参照が無いか Grep）
3. `url` / ルーティング / sitemap / CONTACT 定数などが削除キーを参照していれば修正または確認
4. WordPress で `posts.php` にサンプル CPT のみなら、削除可否を AskQuestion

ブロックエディタ `allowed_blocks` の一括設定 Step（旧 B-3）は本スキルから削除済み。必要なら別途依頼。

## スタイル基盤（C-2〜C-5・手動）

**手動確認の促しの正本は `@figma-tokens-setup` 完了後**（JSON 同期 / リセットのみのどちらでも）。`@project-env-setup` の C-2〜C-5 は、C-1 で Setup をスキップしたとき・未確認時の **補完**。

`{フロント}/src/scss/foundation/variables/_variables.scss`

| 項目 | 記述箇所 |
|------|----------|
| デザインサイズ | `$design-size-sp`, `$design-size-pc`, `$design-height-*`, `$design-container-pc` |
| ファースト | `$media-query-strategy` |
| ブレイクポイント | `$breakpoint-keys`, `$breakpoints` |
| レスポンシブ | `$style-settings`、`project/css/responsive.mdc` |
| セクション余白 | `$section-sizes`（C-1 一括同期の対象。手動確認時も同 map） |
| コンテンツ余白 | `$content-space`（C-1 一括同期の対象。手動確認時も同 map） |

セクション・コンテンツ余白のルール正本: `project/css/scss.mdc`「コンテナ・セクション余白」。一括同期手順: `@figma-tokens-setup` の reference.md「Device（余白）」。

`@reset-scss-variables` は上記（size / breakpoint / style-settings）を **変更しない**（`@figma-tokens-setup` 完了後の手動確認、または C-2〜C-5 で調整）。**`$color-palette` / `$font-configs` は空にリセット**し、**`$colors` は分類キーを残して `ui` 以外を空化**（**`ui` の値は既存のまま**。text-styles / space / effects と同様に案件トークンは空化。`$base_font` は `sans-serif`）。詳細は [reset-scss-variables/reference.md](../reset-scss-variables/reference.md)。

## C-6 フォント読み込み

SCSS 変数（`$font-weight-key` / `$font-configs` / `$base_font` / `$text-styles`）の正本:

| 経路 | 内容 |
|------|------|
| C-1 で JSON 同期 | `@figma-tokens-setup` [reference-json.md](../figma-tokens-setup/reference-json.md)「Font」「テキストスタイル」 |
| C-1 リセットのみ・未設定 | 画面実装時に `$font-configs` 等を追記。読み込みも本節の手順で追加 |
| 本 Step（C-6） | **読み込み方式**（調査 → AskQuestion → `FONT_TAGS` / `files` / 実体） |

**サブセット化**（`make font-build` / `make font-build-base`）はスキルから実行しない。必要ならユーザーが手動で行う（リポジトリ `README.md`「フォントサブセット化について」）。

画面実装時も、新規ファミリーや未読み込みがあれば本節と同じ調査 → AskQuestion → 配置を行う。**例外・停止ゲートの正本は `figma/style.mdc` §6「フォント」**（`FONT_TAGS` / `files` に既にあるファミリーは AskQuestion なしで `$font-configs` 最小追記可。`$base_font` 未設定時のみ本文ファミリーで一度セット。`$font-configs` 空のままスタイル数値だけ進めることは禁止）。

### FONT_TAGS

| 環境 | ファイル |
|------|----------|
| PHP | `resources/htdocs/includes/config/config.php` の `const FONT_TAGS` |
| WordPress | `inc/config/config.php` の `FONT_TAGS`（同等定数がある場合） |

出力: `includes/head/font.php` または `inc/head/font.php`。

### CDN（Google Fonts）例

```php
const FONT_TAGS = '<link rel="preconnect" href="https://fonts.googleapis.com">' .
    "\n" .
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' .
    "\n" .
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600&display=swap" rel="stylesheet">';
```

ファミリー名・ウェイトは `$font-configs` の `weight` に一致させる。

### 読み込み方式の調査（AskQuestion 前）

自動で方式を決めない。チャットに次を提示してから選ばせる。

| 調査項目 | 内容 |
|----------|------|
| `@fontsource` | [fontsource.org](https://fontsource.org) で `@fontsource/{font-key}` の有無。日本語は **japanese** サブセットの有無も確認 |
| CDN | Google Fonts 等で配信可能か |
| 現状 | `$font-configs` の `files`、`FONT_TAGS`、`assets/fonts/` の有無 |

パッケージ名の目安: ファミリー名を小文字・スペースを `-` に（例: `Zen Kaku Gothic New` → `@fontsource/zen-kaku-gothic-new`）。

### フォントファイル（セルフホスト）

1. 配置: `{フロント}/assets/fonts/`（woff2）
2. `$font-configs` に `files` 配列を定義（`global/_fonts.scss` が `@font-face` を生成）
3. `FONT_TAGS` は `''`（CDN 不使用）
4. 任意: 後で手動サブセットするなら `assets/fonts/font-subset/fonts.config.json` の `input` / `output` を整えておく（**実行はユーザー手動**）

### @fontsource による配置（AskQuestion で選ばれたとき）

本番で Node が不要なよう、**woff2 実体を `assets/fonts/` にコミット**する。`node_modules` はデプロイしない。

| 手順 | 内容 |
|------|------|
| 1. インストール | `cd resources && npm install @fontsource/{package} --save-dev` |
| 2. 原本配置 | `node_modules/@fontsource/{package}/files/*-japanese-{weight}-normal.woff2` を `{フロント}/assets/fonts/_source/` にコピー。**`$font-configs` の `file` 名にリネーム** |
| 3. 配信用コピー | `_source/` と同名を `assets/fonts/` 直下にもコピー |
| 4. `files` 確定 | `_variables.scss` の `$font-configs` に `file` / `weight` / `style` を記載 |
| 5. （任意）subset 設定 | `fonts.config.json` の `input` = `_source/{file}`、`output` = `assets/fonts/{file}`。**make は実行しない** |
| 6. 不要実体の削除 | 下記「不要フォント実体の削除」 |

**ファイル名の原則**: 手動サブセット後も `output` ファイル名を変えない想定。`$font-configs` の `files` をむやみに再編集しない。

### 不要フォント実体の削除

フォント差し替え・案件初期化時に、**現行設定に無いフォントファイル**を `assets/fonts/` から削除してよい（エージェントがフロー内で実施可）。

| 削除対象 | 例 |
|----------|-----|
| 旧案件の woff2 / woff / ttf | `NotoSansJP-*.woff2`、`ttf/` 配下の旧 ttf |
| `$font-configs` に無い直下ファイル | 参照されていない `.woff2` |
| `_source` に無い原本 | `fonts.config.json` の `input` に無い `_source/*.woff2` |
| 空ディレクトリ | 使わなくなった `ttf/` 等 |

| 保持（削除しない） | |
|--------------------|---|
| `$font-configs` の `files` の `file` 名（`assets/fonts/` 直下） | |
| `fonts.config.json` の `input`（`_source/`）・`output`（直下） | |
| `font-subset/` 内 | `chars_*.txt`、`fonts.config.json` |

CDN 採用で `files: ()` に切り替えた場合も、セルフホスト用の旧 woff2 / `_source` / 空の `ttf/` を削除する。

### デバイスフォントのみ

- `FONT_TAGS` を `''` またはコメントアウト方針をユーザーと確認
- 必要なら `$font-configs` の `family` をシステムスタックに調整（`files: ()`）

## フロントルート（正本）

| 環境 | `FRONT_DIR` の基準 |
|------|---------------------|
| WordPress | `resources/wp-dir/wp-content/themes/{WP_THEME_NAME}/` |
| PHP | `resources/htdocs/` |

`WP_THEME_NAME` は `.env` または `.env.example` から取得する。`@pre-launch-check` も同表を使う（複写しない）。

## 仕上げ（旧 D）について

OGP・Favicon・テーマカラー・WP 管理画面スタイルは **`@pre-launch-check`** の M-1 / M-2 で扱う。手順・パスは [pre-launch-check/reference.md](../pre-launch-check/reference.md)「仕上げセットアップ（旧 project-env-setup D）」を参照。UI 系カラー（`ui/*`）の **公開前確認**は同 M-1-5（設定は C-1。pre-launch では確認のみ）。

## スキル実行順（推奨・正本）

1. **project-env-setup** … A → B-1 → C-1 → C-2〜5 → C-6（Figma URL 不要。OGP 等の仕上げは含まない）
2. 画面実装（`@figma-batch-implement`（必要なら Phase 0-catalog） / `@figma-page-implement` / `@figma-coding` 等。セルフチェックは `@figma-page-implement` Phase 3 / `@figma-coding` Step 4。大差は報告のみ。微差は人の再指摘。ページの規約確認は Phase 3 の `page-check.md`）
3. **pre-launch-check** … meta／UI 系カラー／サイトマップ／仕上げセットアップ含む公開前確認（WP 固有・不要コード・仮・画像・href・誤字脱字・人手の表示／動作）

## 関連するが A-1 で自動変更しない項目

| 項目 | 理由 |
|------|------|
| `inc/config/consts.php`（PHP: `includes/config/consts.php`）の会社情報・メール等 | クライアント固有。画面横断の会社名・電話・FAX・住所等はテンプレート実装時に定義（正本: `project/template/php.mdc`「会社情報・共通定数」） |
| プライバシーポリシー・お問い合わせ placeholder 等の本文サンプル | 原稿・画面実装時。サイト表示名定数とは別 |
| `site.webmanifest` の `theme_color` / `background_color`・Favicon 実体 | `@pre-launch-check`（M-1 / 仕上げ） |
| TOP 等の仮見出し（例: `Welcome to Sample Site`） | 画面実装・原稿投入で差し替え |
