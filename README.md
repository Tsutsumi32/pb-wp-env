# 環境について

## 開発環境の立ち上げ

### Dockerコンテナの起動

以下のコマンドでDockerコンテナの起動とその他初回のセットアップを行います。

```bash
make init
```

### 起動確認
- http://localhost:8000 にアクセスし、数件の投稿が表示されていること
- http://localhost:8000/admin-login にアクセスし、ログイン画面で以下の情報を入力し、ログインができること。（ユーザ名：adminUser　パスワード：adminPass）
※{login}はWPS Hide Loginプラグインの設定によるものです(.env「WHL_PAGE」)


### コンテナ起動(2回目以降)

Makefileを使用してDockerコンテナを起動します。

```bash
make up
```

### コンテナ停止(2回目以降)

Makefileを使用してDockerコンテナを停止します。

```bash
make down
```

### 開発サーバーの起動
**wordpressの場合**
.envの**WP_CHAGE_PORT**を**FRONT_PORT**に設定してください。(コンテナ再起動)
Wordpress内部の仕組み上、Wordpress側のURLのポートをフロント側のポートに合わせないと
ブラウザシンクが動作しません。
(なお、この場合通常のwordpress側のポートではアクセスできなくなるので注意)
設定を変更してもブラウザシンク(フロントポート)でアクセスできない場合、シークレットウィンドウでお試しください。

ビルド、ファイル監視、ブラウザシンクを同時に起動します。
*コンテナの起動も同時に行われるため、開発開始時には基本的にstartコマンドを利用します*

```bash
make dev
```

ブラウザで `http://localhost:3000` にアクセスできます。

---


## ビルドシステム

### SCSS
- **機能**: SCSSのコンパイル、minify化、PostCSS処理
- **memo**: indexまたは「_」ファイル変更時には、属するエントリーファイルをコンパイル(または全ファイル ※設定ファイルで指定可能)。エントリーファイルに属さない場合は全ファイルをコンパイル。コンパイル対象のファイル修正時には、該当ファイルのみコンパイル

### SCSSインデックス生成（common.scss）
- **機能**: SCSSファイルのエントリーポイントとなる`common.scss`を自動生成する。
- **memo**: 対象ディレクトリ内に`index.scss`がある場合: そのディレクトリの`index.scss`のみを`@use`する- **memo**:（拡張子なしで`@use './ディレクトリ名';`の形式）
ディレクトリ内のすべてのSCSSファイル（`index.scss`と`_`で始まるパーシャルファイルを除く）を`@use`する

### JavaScript
- **機能**: JSのコンパイル、minify化、ESLint

### 画像変換
- **機能**: 設定(build-config)に従って、格納したpngやjpg画像を、avif、webp変換、圧縮する
- **memo**: `resources/_origin/`（`build-config.js` の `DIR_IMAGE_ORIGIN_PATH`。npm 実行階層直下）に png または jpg 画像を格納します（拡張子の大文字・小文字違いや、jpg・jpeg違いは許容）
- **memo**: svgディレクトリは処理対象外です
- **memo**: Rethina対応を行う場合、基本は表示サイズの2倍の画像を用意し、変換後の画像のみを使用します。
- **memo**: `npm run meta:convert-images`でメタファイルを更新することが可能。(メタファイルを元に変換処理を行っています。メタファイルを更新すると、現時点の画像格納状態から監視を行います。)　※メタファイルにエラーが発生した場合にも本コマンドでmetaファイルを再生成することで解消可能

### ブラウザシンク
- **機能**: ブラウザシンクを起動します。基本的には本サーバーで開発を行います。

---

## プロジェクト毎の調整事項

- `build-config.js`の設定（プロジェクトの構造に合わせて調整が必要）
- JSのコンパイル有無（`package.json`）
- SCSSコンパイル方法（Live Sass Compiler / npm）
- コンパイル後の出力先（`dist`にするかどうか）
- 各種ディレクトリパス

---

## Nu Html Checker（HTML検証）

[The Nu Html Checker (vnu)](https://validator.github.io/validator/) を Docker 環境で利用できます。

### Web UI

`make up` でコンテナを起動すると、vnu サービスも起動します。ブラウザで次のURLを開くと、HTML/CSS/SVG の検証ができます。
- **URL**: `http://localhost:8888`（ポートは `.env` の `VNU_PORT` で変更可能）
- **ブックマークレット**：開発画面を開いている状態で、用意したブックマークレットを使用することで、画面内のDOMをvnuにPOSTして、そのまま検証が可能。(nu-html-checker-bookmarklet.md)

---

## コードフォーマット

### EditorConfig

- **設定ファイル**: `.editorconfig`
- **対象**: インデント、改行コード、文字コード、最終行改行、行末スペース

### Prettier

- **設定ファイル**: `.prettierrc`
- **対象**: コードの詳細なフォーマット（クォート、括弧、import順、プロパティ順など）
- **VSCode設定**: `.vscode/settings.json`でPrettierをフォーマッターに設定

### php-cs-fixer(PHPがある場合)

- **設定ファイル**: `php-cs-fixer.dist.php`

### Pre-commitフック

- **ファイル**: `pre-commit`
- **機能**: コミット時にPrettierとESLintを自動実行
- **設置**: `make init`で自動設置

---

## 開発時の注意事項

### Node.jsの使用

- **ホストで使用する場合**: Voltaを使用（`package.json`の`volta`セクションを参照）
- **Dockerで使用する場合**: Dockerコンテナ内のNode.jsを使用

### クライアント都合でNode.jsが使用できない場合

1. `.vscode/settings.json`を生成（CSSのパスを設定）
2. `dist`ディレクトリを削除
3. JS: `src`内のJSをそのまま使用（コンパイルしない）
4. SCSS: Live Sass Compilerで`src`内にCSSを生成
5. ブラウザシンクは不要（Live Serverで十分）


### ビルドができない場合

- `src`内のJSをそのまま使用
- CDNを利用する

---

## コードスニペットについて
- _docs/ にスニペットファイルを配置しています。必要に応じて活用してください。

## 規約について
- .cursor内のファイルを確認すること

## Cursor Skills

### figma-wordpress-project-info

Figma MCP でページ候補を取得し、デザイン上部テキストから description（約180文字）を生成、noindex を画面ごとに確認したうえで、`pages.php`・`posts.php`・`acfFileds.php` を直接編集するスキル。

- **配置**: `.cursor/skills/figma-wordpress-project-info/`
- **編集先**: テーマ内 `inc/config/`（固定ページ・カスタム投稿・ACF）
- **使い方**: Cursor チャットで `@figma-wordpress-project-info` と Figma URL を指定

詳細はスキル内の `SKILL.md` を参照。

### project-env-setup

プロジェクト名・テーマ名（WordPress 時）を確認し、`.env.example`・テーマディレクトリ・`resources/build-config.js` を更新するスキル。

- **配置**: `.cursor/skills/project-env-setup/`
- **使い方**: `@project-env-setup` で新規クライアントの環境設定を依頼

詳細はスキル内の `SKILL.md` を参照。

## WP

### 固定ページの再生成
make wp-create-pages

### カスタム投稿のターム・テンプレート生成と開発用 JSON インポート
`posts.php` のタームとアーカイブ/single 雛形を生成し、`data/{post_type}/posts.dev.json` を `WP_IMPORT_ENV=dev` でインポートします。

```bash
make wp-create-posts
```

### プラグインの再導入
make wp-plugin

### パーマリンク（リライトルール）の再生成
カスタム投稿タイプやタクソノミーを追加・変更したあと、URL が 404 になる場合などに実行します。管理画面の「設定 > パーマリンク」で「変更を保存」を押す操作に相当します。DB のリライトルールは `wp rewrite flush`、`.htaccess`（ルートと `wp-dir` 配下）は `scripts/wp/wp-htaccess.sh` で再生成します。

```bash
make wp-rewrite-flush
```

### 設定ファイル
固定ページ、カスタム投稿、acf、cf7、等々の設定は
inc/config/配下に配置

## GTM・アナリティクス（計測タグ）

テーマの `inc/config/tracking-tags.php`（`TrackingTags` クラス）で ID を管理し、`header.php` から `inc/meta/tracking-tags.php`（head 内）および `inc/meta/tracking-tags-body.php`（body 開始直後）経由で出力します。

出力の有無はホスト名から自動判定します（`localhost` / `.local` / `.test` / プライベート IP ではオフ、本番ホストではオン）。本番でも止めたい場合のみ `FORCE_DISABLED` を `true` にします。

**設定手順**

1. **GTM を使う場合**: `GTM_CONTAINER_ID` にコンテナ ID（`GTM-XXXXXXX`）を設定する（GA4 は GTM 側で配信する想定）
2. **GTM を使わず GA4 のみの場合**: `GA4_MEASUREMENT_ID` に測定 ID（`G-XXXXXXXXXX`）を設定する  
   （リポジトリに載せたくない場合は `wp-config.php` に `define('GA_MEASUREMENT_ID', 'G-...');` または `define('GTM_CONTAINER_ID', 'GTM-...');` を定義し、クラス定数は空のままにする）

Meta Pixel 等の追加タグは `TrackingTags` 内の `$headTags` / `$bodyStartTags` に HTML を追加します。

## playwright
- 使用する場合、`make test-e2e-install`でインストールを行う

## フォントサブセット化について
- 実行コマンド：
  - `make font-build`：クロールありでコンバート（Playwright → frontend）
  - `make font-build-base`：クロールなしでコンバート（frontend のみ・日常向け）
- コンテナ分担：
  - **Playwright**: `font-chars-crawl`（`chars_crawled.txt` 生成）
  - **frontend**: `font-chars-merge` / `font-chars-merge-base` / `font-subset`（マージ・woff2 変換）
  - `pyftsubset`（fonttools / brotli）は frontend イメージに同梱（`docker/frontend/Dockerfile`）。初回または Dockerfile 更新後は `make build-docker` で frontend を再ビルドすること
- 事前設定: `resources/wp-dir/wp-content/themes/sample-hp/assets/fonts/font-subset/fonts.config.json`
  - `name`: フォント名（ログ表示用）
  - `input`: 元フォントのパス（`resources` 配下からの相対パス）
  - `output`: 生成する `.woff2` の出力先（`resources` 配下からの相対パス）
- 文字セットファイル
  - `chars_base.txt`: 常に含めたい固定文字（手動管理）
  - `chars_crawled.txt`: クロールで抽出した文字（自動生成）
  - `chars_merged.txt`: 上記2つを統合した最終文字セット（自動生成）
- `make font-build` を実行すると、以下を順に実行
  - `make test-e2e-install`（Playwright ブラウザ導入・クロール用）
  - `make font-chars-crawl`（Playwright: WordPress のフロント画面を同一オリジン内で巡回し、画面文字を抽出して `chars_crawled.txt` 生成）
  - `make font-chars-merge`（frontend: `chars_base.txt` と統合して `chars_merged.txt` 生成）
  - `make font-subset`（frontend: `fonts.config.json` の対象フォントを `.woff2` へ変換）
- クロールとコンバートを分けて実行する例：
  - `make font-chars-crawl` → `make font-chars-merge` → `make font-subset`
- クロールせずに `chars_base.txt` のみで実行する場合は `make font-build-base` を使用

## サイトマップについて

WordPress コアのサイトマップ（`/wp-sitemap.xml` およびインデックス）を利用しています。

テーマの `inc/setup/sitemap-noindex.php` で、**検索に載せない（noindex）と設定したコンテンツをサイトマップからも外す**ようにしています。

- **固定ページ**: `inc/config/pages.php` の各ページで `noindex` が `true` のスラッグは URL 一覧に含めない
- **カスタム投稿**: `inc/config/posts.php` で `noindex` の投稿タイプはサイトマップの投稿タイプ対象から除外し、そのタイプに紐づくタクソノミーも除外（アーカイブ URL の取りこぼし防止）

検索エンジン向けのインデックス方針とサイトマップの中身を一致させるための処理です。