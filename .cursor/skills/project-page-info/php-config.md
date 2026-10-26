# PHP 設定テンプレート

環境に応じて該当節のみ参照する。

| 環境 | 編集対象 |
|------|----------|
| WordPress | `pages.php`, `posts.php`, `acfFileds.php`, `data/{post_type}/posts.dev.json` |
| PHP | `pages.php` のみ |

---

## 編集対象パス

### WordPress

```
resources/wp-dir/wp-content/themes/{WP_THEME_NAME}/inc/config/pages.php
resources/wp-dir/wp-content/themes/{WP_THEME_NAME}/inc/config/posts.php
resources/wp-dir/wp-content/themes/{WP_THEME_NAME}/inc/config/plugins/acf/acfFileds.php
resources/wp-dir/wp-content/themes/{WP_THEME_NAME}/data/{post_type}/posts.dev.json
```

`{WP_THEME_NAME}` は `.env` / `.env.example` を参照。

### PHP

```
resources/htdocs/includes/config/pages.php
resources/htdocs/includes/config/config.php   # SITE_NAME（@project-env-setup A-1 で設定。本スキルでは一致確認のみ）
```

---

## SITE_NAME（PHP 環境）

`config.php` の `const SITE_NAME`。`Page::getFormattedDocumentTitle()` や `includes/head/ogp.php` の `og:site_name` 等で使用。

### 推定の材料

| 材料 | 例 |
|------|-----|
| Figma ファイル / キャンバス名 | `TLB_秋葉工業` |
| リポジトリ・プロジェクト名 | `akibakougyo.co.jp` |
| デザイン内の正式表記 | プライバシーポリシー「秋葉工業株式会社（以下「当社」…）」 |

### 記載の目安

- コーポレート・採用サイト: **法人名**（例: `秋葉工業株式会社`）
- サービス特化サイト: ユーザー指定の **サービス名・店名** を優先
- 英語表記がデザイン上の正と分かる場合のみ英名（例: `Sample inc.`）— 原則は日本語の正式名称

`@project-env-setup` A-1 で `WP_SITE_TITLE` と同値に設定する。`project-page-info` では編集せず、Step 6 で一致確認のみ行う。

---

## description（meta ディスクリプション）

`pages.php` の各エントリの `'description'` に設定。head 出力（`includes/head/description.php` 等）から meta description として使われる。

WordPress では `posts.php` の CPT アーカイブ用 `description` も同様。

### 生成手順

1. Figma デザインフレーム上部のテキストを抽出（[figma-discovery.md](figma-discovery.md) 参照）
2. ページの主題が伝わる1〜2文に要約
3. 会社名・サービス名・地域・職種名など **検索されうる語**を1〜3語自然に含める
4. **約180文字**（160〜200文字で調整）

### 文体

- です・ます調または体言止め（既存サイトに合わせる）
- 句読点で読みやすく。改行は入れない（1行文字列）

### 動的詳細ページ（PHP）

`url` に `{id}` を含むエントリ（例: `WORKS_DETAIL`）は `title` / `description` を **空文字** のまま。詳細表示時に `Page::setSeoOverride()` で DB / JSON から上書きする。

Step 5b では **一覧側のみ** description を生成・確認する。

---

## noindex

### 固定ページ・CPT 本体（画面キー）

`pages.php` / `posts.php`（CPT ルート）の `'noindex' => true|false`。

- WordPress: `inc/meta/noindex.php` と `inc/setup/sitemap-noindex.php` と連動
- PHP: `includes/meta/noindex.php`（または同等）と `Page::getIndexableStaticSitemapPaths()` と連動

#### 提案ルール（必ずユーザー確認）

| 種別 | 例 | 提案 |
|------|-----|------|
| フォーム確認 | 採用エントリー・お問い合わせ - 確認 | `true` |
| フォーム完了 | 〜完了、thanks | `true` |
| エラー | `error`, `not-found` | `true` |
| 通常コンテンツ | TOP、会社情報、一覧 | `false` |
| プライバシーポリシー | ポリシー単体ページ | 要確認（多くは `false`） |

### WordPress — `category_settings.noindex`（タクソノミー／ターム一覧）

CPT の `category_settings` 各要素に `'noindex' => true|false` を書く。

| 項目 | 方針 |
|------|------|
| **基本値** | **`true`**（ターム一覧はインデックスしない） |
| 反映先 | `inc/meta/noindex.php`（`Post::getTaxonomyNoindex`）、`inc/setup/sitemap-noindex.php`（タクソノミーサイトマップ除外） |
| 未設定時 | `Post::getTaxonomyNoindex()` は **`true` 扱い**（書き忘れでも基本方針に合わせる） |
| ユーザー確認 | **原則 AskQuestion 不要**（`true` で書く）。ターム一覧を index したい案件だけ確認して `false` |

CPT 本体の `posts.php` トップレベル `'noindex'`（一覧・詳細の画面キー）とは別。混同しない。

---

## assets_name

CSS/JS のファイル名（`dist/css/{name}.css` / `dist/js/{name}.js`）。`inc/head/assets.php` の `sample_hp_resolve_assets_file_name()` が解決する。

### WordPress の読み込みの仕組み（正本）

`get_current_slug()`（`inc/utils/get-current-slug.php`）の返却値がファイル名の起点になる。

| 画面 | `get_current_slug()` の返却 |
|------|----------------------------|
| CPT アーカイブ | `get_post_type()`（例: `works`） |
| CPT 詳細（single） | `get_post_type()`（**アーカイブと同じ**） |
| 固定ページ | `$post->post_name`（例: `contact` / `contact-confirm` / `thanks`） |

`sample_hp_resolve_assets_file_name()` は次の順で解決する。

1. `$file_name = $slug`（上記の返却値）
2. `Page::getAssetsName($slug)` があれば上書き
3. なければ `Post::getAssetsName($slug)` があれば上書き

**CPT はアーカイブ・詳細とも同じ `$slug`（投稿タイプ slug）が渡るため、一覧と詳細で別々の `assets_name` を揃える必要はない。** `posts.php` で `assets_name` を省略（`null`）すれば、投稿タイプ slug がそのまま dist ファイル名になる。

### いつ `assets_name` を設定するか

| 対象 | 設定 | 理由 |
|------|------|------|
| **WordPress `posts.php`（CPT）** | **原則 `null`（省略可）** | 投稿タイプ slug で一覧・詳細が自動的に同一ファイルを読む |
| **WordPress `posts.php`（例外）** | dist 名を slug と変えたいときのみ | 例: 投稿タイプ `requirements-posts`、dist は `requirements.css` |
| **WordPress `pages.php` フォーム系** | **3画面とも同一**（例: `'contact'`） | slug が `contact` / `contact-confirm` / `thanks` と**バラバラ**のため |
| **WordPress `pages.php` エラー系** | **`ERROR` / `NOT_FOUND` とも `'error'`** | 画面キーと実スラッグが異なるため |
| **PHP `pages.php` 一覧 + `{id}` 詳細** | **2エントリで同一** | 一覧用・詳細用でページ ID が別のため（WordPress CPT とは仕組みが異なる） |

セットアップ（Step 5b）で **`assets_name` をユーザー確認するのは `pages.php` のフォーム系・エラー系が中心**。CPT は投稿タイプ slug と dist ファイル名を揃える運用なら **AskQuestion 不要**（例外だけ確認）。

### 命名

- 英小文字・ハイフン可（例: `contact`, `works`, `requirements-posts`）
- フォーム系の `assets_name` は **ユーザーに1つ確認**（未指定時は `'contact'` を提案）
- CPT の `src/scss/pages/` / `src/js/pages/` のファイル名は、**投稿タイプ slug**（`assets_name` を使う場合のみその値）に合わせる

---

## フォーム系固定ページ（CONTACT 定数）— WordPress のみ

入力 / 確認 / 完了のフォーム系画面は、**表示 title は案件文言のまま**、**定数名と slug は下表で統一**する（Step 4b）。

| 画面 | 定数 | slug | `parent` |
|------|------|------|----------|
| 入力 | `CONTACT` | `contact` | `null` |
| 確認 | `CONTACT_CONFIRM` | `contact-confirm` | `CONTACT` |
| 完了 | `CONTACT_THANKS` | `thanks` | `CONTACT` |

- **禁止**: `RECRUIT_ENTRY` / `ENTRY_COMPLETE` / `CONTACT_COMPLETE` など別名定数（`wp-install` 時に `cf7.php` 等と不整合になり Fatal error の原因になる）
- `assets_name`: 3画面とも同一（通常 `'contact'`）

### フォーム連携ファイル（Step 6-W3b）

| ファイル | 必須参照 |
|----------|----------|
| `inc/config/plugins/cf7/cf7.php` | `get_page_url(Page::CONTACT_THANKS)` |
| `inc/config/assets-plugins.php` | yubinbango 等: `'pages' => [Page::CONTACT]` |

セットアップ時にテンプレート残存の `Page::CONTACT_THANKS` だけが `pages.php` に無い、といった不整合を防ぐため **6-W3b は Step 4b 採用時必須**。

---

## pages.php — WordPress

### 定数 + $pages エントリ例

```php
public const CONTACT        = 'contact';
public const CONTACT_CONFIRM = 'contact-confirm';
public const CONTACT_THANKS  = 'thanks';

protected static $pages = [
    self::CONTACT => [
        'title'       => '採用エントリー・お問い合わせ', // 案件文言可
        'parent'      => null,
        'noindex'     => false,
        'assets_name' => 'contact',
    ],
    self::CONTACT_CONFIRM => [
        'title'       => '入力内容確認',
        'parent'      => self::CONTACT,
        'noindex'     => true,
        'assets_name' => 'contact',
    ],
    self::CONTACT_THANKS => [
        'title'       => '送信完了',
        'parent'      => self::CONTACT,
        'noindex'     => true,
        'assets_name' => 'contact',
    ],
];
```

### slug 命名

- 英小文字・ハイフン（例: `makino-way`, `contact-confirm`）
- フォーム完了は `thanks`（meisin 等と共通）
- `top`, `error`, `not-found` は予約的扱い

### WP-CLI

`forCli()` が `NOT_FOUND` 以外の固定ページを出力。`top` / `error` は `wp-create-pages.sh` でスキップされるため定義は残す。

---

## pages.php — PHP

### 定数 + $pages エントリ例

```php
public const WORKS        = 'works';
public const WORKS_DETAIL = 'works-detail';
public const CONTACT      = 'contact';
public const CONTACT_CONFIRM = 'contact_confirm';

private static $pages = [
    self::TOP => [
        'title'       => 'TOP',
        'description' => '…',
        'breadcrumbs' => [],
        'url'         => '/',
        'noindex'     => false,
        'assets_name' => null,
    ],
    self::WORKS => [
        'title'       => '施工事例',
        'description' => '…',
        'breadcrumbs' => [],
        'url'         => '/works',
        'noindex'     => false,
        'assets_name' => null,
    ],
    self::WORKS_DETAIL => [
        'title'       => '',
        'description' => '',
        'breadcrumbs' => [],
        'url'         => '/works/{id}',
        'noindex'     => false,
        'assets_name' => 'works',
    ],
    self::CONTACT_CONFIRM => [
        'title'       => 'お問い合わせ（確認）',
        'description' => '…',
        'breadcrumbs' => [],
        'url'         => '/contact-confirm',
        'noindex'     => true,
        'assets_name' => 'contact',
    ],
    self::ERROR => [
        'title'       => 'エラーが発生しました。',
        'description' => '…',
        'breadcrumbs' => [],
        'url'         => '/error',
        'noindex'     => true,
        'assets_name' => 'error',
    ],
    self::NOT_FOUND => [
        'title'       => 'ページが見つかりません（404）',
        'description' => '…',
        'breadcrumbs' => [],
        'url'         => '/404',
        'noindex'     => true,
        'assets_name' => 'error',
    ],
];
```

### ページ ID と URL

- **定数値**（ページ ID）: 英小文字・アンダースコア可（例: `contact_confirm`）
- **`url` パス**: 先頭 `/`、ハイフン区切り（例: `/contact-confirm`）
- 動的詳細: `'/works/{id}'` — プレースホルダ名はテンプレ PHP と一致させる
- 動的詳細を `pages.php` に追加・削除したら、非 WordPress では `docker/php/000-default.conf` の RewriteRule を案件の既存手順に従って同期する（`project-env-setup/reference.md` に記載がある場合はそれに従う）
- `parent` キーは **使わない**（階層は `breadcrumbs` のみ）

### アセット読み込み

`includes/head/assets.php` が `Page::getAssetsFileKey($pageId)` で `dist/css/{key}.css` を解決する。

---

## posts.php — WordPress のみ

PHP 環境には **存在しない**。一覧 + 詳細は `pages.php` の2エントリで表現する。

**画面表示**: `posts.php` / `term_settings` は設定・初期・サンプル用。投稿・タームの一覧やラベル出力は WP 実データを使う（正本: `project/wordpress/posts.mdc`）。

### 定数例

```php
public const WORKS = 'works-posts';
public const WORKS_TAXONOMY = 'works-category';
```

### $posts エントリ例

```php
self::WORKS => [
    'title'       => '施工実績',
    'description' => '',
    'breadcrumbs' => [],
    'noindex'     => false,
    // assets_name は省略可（null）。投稿タイプ slug と同一なら dist も works.css になる
    'post_type_settings' => [
        'label'         => '施工実績',
        'supports'      => ['title', 'revisions'],
        'menu_position' => 2,
        'has_archive'   => true, // false = アーカイブなし（詳細のみ）。wp-create-posts の判定にも使用。Step 5 でユーザー確認必須
    ],
    'archive_query' => [
        'posts_per_page' => 10,
        'orderby'        => 'modified',
        'order'          => 'DESC',
    ],
    'category_settings' => [
        [
            'slug'         => self::WORKS_TAXONOMY,
            'label'        => '施工実績カテゴリ',
            'default'      => 'others',
            'has_archive'  => true,
            'meta_box_cb'  => false,
            // ターム一覧は基本 noindex（meta / サイトマップと連動）。index したいときだけ false
            'noindex'      => true,
        ],
    ],
    'term_settings'     => [ /* … */ ],
],
```

`category_settings.noindex` の方針は上記「noindex」節（WordPress — category_settings）を正本とする。

### supports とブロックエディタ

| ブロックエディタ | supports |
|------------------|----------|
| 使わない（ACF のみ） | `['title', 'revisions']` |
| 使う | `['title', 'editor', 'revisions']` |

許可ブロックの制限（`allowed_blocks` / `embed_variations`）は **@project-env-setup B-3** で設定する（`allowed-blocks.php` / `pages.php` / `posts.php`）。本スキルでは supports のみ確定する。

### has_archive（一覧ページ）

`post_type_settings['has_archive']`。WordPress のアーカイブ URL 有無と `wp-create-posts.sh` の生成判定に使用。

| 値 | 用途 |
|----|------|
| `true` | 一覧 + 詳細。`archive-{post-type}.php` を用意。Step 5b でアーカイブ用 description を設定 |
| `false` | 詳細のみ。一覧 URL なし |

project-page-info の Step 5 で **`AskQuestion` によりユーザー確認必須**。Figma に一覧フレームがあっても自動で `true` にしない。

---

## ACF フィールド設定 — WordPress のみ

PHP 環境では **編集しない**。動的コンテンツのデータは JSON ストア等（例: `includes/media/news/NewsStore.php`）で別管理。

project-page-info の **Step 5-4 で ACF 利用を選んだ CPT** では、**Step 5-5 が必須**。ユーザー確認なしに `acfFileds.php` を編集しない。

### 実施タイミング

| Step 5-4 の選択 | 5-5 | `acfFileds.php` |
|-----------------|-----|-----------------|
| ACF のみ（推定） | **必須** | 追記する |
| ブロックエディタ | スキップ | 追記しない |
| 両方使わない | スキップ | 追記しない |

### AskQuestion フロー（CPT ごと）

| ラウンド | テーマ | 形式 |
|----------|--------|------|
| **5-5a** | 採用フィールドの選択 | `allow_multiple: true`。推定候補 + 汎用候補 + 一括採用 + その他 |
| **5-5b** | slug / label / type の確定 | 表提示 → 一括採用 or その他 |
| **5-5c** | `PREFIX` / `thumbnail` | 両方 `AskQuestion` |
| **5-6a〜d** | `posts.dev.json` の作成方針 | 件数・カテゴリ配分・画像・文言。毎回 `AskQuestion`（自動算出しない）。正本は下記「posts.dev.json」 |

### ACF フィールド候補（選択肢の材料）

Figma 詳細・一覧カードから推定し、不足時は下表から追加する。

| キー | label 例 | type | 提案する場面 |
|------|----------|------|--------------|
| `image` | サムネイル画像 | `image` | 一覧カード・詳細に画像あり（**ほぼ必須候補**） |
| `content` | 本文 | `textarea` | 詳細本文が WP 投稿タイトル以外にある |
| `taxonomy` | カテゴリ | `taxonomy` | Step 5-3 でタクソノミー利用時 |
| `lead` | リード文 | `textarea` | 詳細冒頭の短い説明文 |
| `position` | 所属・職種 | `text` | 社員インタビュー・人物紹介 |
| `name` | 氏名 | `text` | 投稿タイトルと別に名前表示 |
| `client` | クライアント名 | `text` | 施工実績・事例 |
| `location` | 所在地・エリア | `text` | 施工実績・店舗 |
| `period` | 工期・期間 | `text` | 施工実績 |
| `url` | 関連 URL | `url` | 外部リンク・PDF リンク |
| `file` | 添付ファイル | `file` | 資料ダウンロード |
| `date` | 日付 | `date` | 投稿日以外の表示日 |

**slug の組み立て**: `{PREFIX}{キー}`（例: `works_image`）。`PREFIX` は通常 **投稿タイプ slug の短縮形** + `_`（例: `works_`）。`assets_name` と同一とは限らない。

### ACF type 一覧（5-5b の選択肢）

`text`, `textarea`, `number`, `email`, `url`, `image`, `file`, `select`, `checkbox`, `radio`, `true_false`, `date`, `datetime`, `taxonomy`, `wysiwyg`

### taxonomy フィールドの追加キー（5-3 連動）

```php
[
    'slug'          => self::WORKS_ACF_PREFIX . 'taxonomy',
    'label'         => 'カテゴリ',
    'type'          => 'taxonomy',
    'required'      => 1,
    'taxonomy'      => Post::WORKS_TAXONOMY, // posts.php のタクソノミー定数
    'field_type'    => 'radio',
    'save_terms'    => 1,
    'load_terms'    => 1,
    'return_format' => 'id',
],
```

### acfFileds.php — 記載テンプレート

```php
public const WORKS_ACF = Post::WORKS;
public const WORKS_ACF_PREFIX = 'works_';

// init() 内 self::$acf_fields:
self::WORKS_ACF => [
    [
        'slug'  => self::WORKS_ACF_PREFIX . 'image',
        'label' => 'サムネイル画像',
        'type'  => 'image',
    ],
],

// init() 内 self::$acf_settings:
self::WORKS_ACF => [
    'slug'      => self::WORKS_ACF_PREFIX . 'field',
    'label'     => '施工実績_設定項目', // {CPTラベル}_設定項目
    'post_type' => self::WORKS_ACF,
    'items'     => self::getField(self::WORKS_ACF),
    'thumbnail' => 'works_image', // image フィールドの slug（PREFIX 除かない・フル slug）
],
```

- `thumbnail` に image が無い CPT は `''`
- `init()` のロジック本体は変更しない（定数・配列の追記のみ）
- フィールド定義に **`sample` キーは書かない**（値は `posts.dev.json`）

---

## posts.dev.json — WordPress のみ

開発用サンプル投稿の正本。`make wp-create-posts`（対話で dev、または `--non-interactive`）が読み込む。


| 項目 | 内容 |
|------|------|
| 配置 | `<theme-root>/data/{post_type}/posts.dev.json` |
| 形式 | JSON（投稿オブジェクトの配列）。**CSV は作らない** |
| 必須 | `_external_id`（一意。無い件はスキップ） |
| 方針 | Step 5-6 で毎回 `AskQuestion`（件数・カテゴリ・画像・文言）。自動算出しない |

キーの詳細（`post_title` / `acf` / `taxonomies` / `_thumbnail` 等）はテーマの `data/README.md` を正とする。ここへ CSV 仕様は複写しない。

### 記載例

```json
[
  {
    "_external_id": "works-dev-001",
    "post_title": "施工実績サンプル1",
    "post_status": "publish",
    "post_date": "2026-04-02 10:00:00",
    "_thumbnail": "../sample-img/sample-thumb.jpg",
    "taxonomies": {
      "works-category": "residential"
    },
    "acf": {
      "works_image": "../sample-img/sample-thumb.jpg",
      "works_period": "2026年"
    }
  }
]
```

- `_thumbnail` / `acf` の image パスは **この JSON ファイルからの相対**（共通サンプルなら `../sample-img/sample-thumb.jpg`）
- タクソノミー slug は `posts.php` の `term_settings` と揃える
- ACF スラッグは `acfFileds.php` と揃える
- 画像ファイルが無いパスは 6-W3c で確認（エージェントは画像を上書きしない）

---

## 設定整合性検証（Step 6-W4）

`wp-install` / WP-CLI がテーマを読み込む際の Fatal error（未定義定数 `Page::CONTACT_THANKS` 等）を防ぐ。**Step 7 の前に必須。**

### 1. 定数参照の突合

`<theme-root>/inc/config/` を対象に、参照と定義を突合する。

```bash
# pages.php に定義されている Page 定数
grep -oP 'public const \K[A-Z][A-Z0-9_]*' inc/config/pages.php | sort -u

# inc/config 内の Page:: 参照
grep -roh 'Page::[A-Z][A-Z0-9_]*' inc/config/ | sed 's/Page:://' | sort -u
```

**合格**: 参照側の定数がすべて `pages.php` の `public const` に存在する。同様に `Post::` ↔ `posts.php`、`acfFileds.php` の `Post::` ↔ `posts.php`。

### 2. PHP 構文チェック

編集した config PHP それぞれで `php -l` が成功すること。

### 3. WP-CLI smoke test（環境起動可能な場合）

```bash
wp option get blogname --allow-root
```

**合格**: Fatal error なく終了。失敗時はスタックトレースのファイル・行から未定義定数や require エラーを修正し、再実行。

### 4. 禁止パターン

`inc/config/` に次が残っていないこと（フォーム系を CONTACT で統一した案件）:

- `RECRUIT_ENTRY` / `ENTRY_COMPLETE` / `CONTACT_COMPLETE` 等、`pages.php` に無いフォーム用 `Page::` 参照
- `pages.php` が `CONTACT_THANKS` なのに `cf7.php` が別定数を参照

### 5. posts.dev.json

`posts.php` に定義した各 CPT について `<theme-root>/data/{post_type}/posts.dev.json` が存在すること。CSV（`posts.dev.csv`）だけしか無い場合は NG。

### 報告フォーマット

| 項目 | 結果 | 備考 |
|------|------|------|
| Page:: 突合 | OK / NG | 未定義があれば列挙 |
| Post:: 突合 | OK / NG | |
| php -l | OK / NG | |
| wp smoke test | OK / スキップ / NG | |
| 禁止パターン | OK / NG | |
| posts.dev.json | OK / NG | CPT ごとにパス |

**1 件でも NG なら修正 → 6-W4 再実行。すべて OK のときのみ Step 7（WP-CLI 同期 / 初回は `wp-install`）可。**

---

## WP-CLI 同期（WordPress）

`pages.php` / `posts.php` / `acfFileds.php` / `posts.dev.json` を正とし、WP 上の固定ページ・開発用投稿を揃える。スクリプト本体は案件にコピーした `scripts/wp/`（元: env-wordpress）。

### コマンド

| Make | スクリプト | 役割 |
|------|------------|------|
| `make wp-install` | `wp-install.sh` | **初回のみ**。末尾で create-posts → create-pages を呼ぶ |
| `make wp-create-pages` | `wp-create-pages.sh` | 固定ページを設定どおり再生成＋未作成の `page-*.php` 雛形 |
| `make wp-create-posts` | `wp-create-posts.sh` | 対話デフォルト。エージェント／install は `--non-interactive`（dev・削除・ターム再作成・テンプレ・`posts.dev.json`） |

エージェントが実行する（ユーザー手動にしない）。コンテナ未起動なら先に `make up`。

### 再実行時の挙動（重要）

| スクリプト | 挙動 |
|------------|------|
| `wp-create-pages` | 既存の **全固定ページを削除**してから `pages.php`（`forCli`）どおり再作成。`top` / `error` slug はページ作成スキップ。テーマ内 `page-*.php` は **無いものだけ生成**、設定外テンプレは orphan 削除 |
| `wp-create-posts` | 非対話時: 対象 CPT の既存投稿を削除し、タームを作り直し、`posts.dev.json` をインポートしテンプレ生成。対話時は各確認に従う |

そのため **設定ファイルが正**であること。WP 管理画面だけで足したページ／投稿は消える。

### いつ走らせるか

| タイミング | 実行 |
|------------|------|
| 初回環境 | `make wp-install`（内部で create 済みなら追加 create 不要） |
| ensure / page-info で `pages.php` のみ変更 | 6-W4 後に `make wp-create-pages` |
| 動的モードで `posts.php` / ACF / `posts.dev.json` 変更 | 6-W4 後に `make wp-create-posts WP_CREATE_POSTS_ARGS="--non-interactive"`（pages も変えていれば pages も） |
| env-setup B-1 で最小構成にした直後で、すでに install 済み | `make wp-create-pages` |

PHP（非 WP）では本節は対象外。動的 URL は Apache リライト同期（`project-env-setup` reference）。

---

## テンプレート PHP（別作業）

設定追加後、必要に応じて作成。スキル本編では **config PHP と `posts.dev.json`** を編集。

### WordPress

- 固定ページ: `page-{slug}.php`
- CPT: `archive-{post-type}.php`, `single-{post-type}.php`, `taxonomy-{taxonomy}.php`

### PHP

- 固定ページ: `resources/htdocs/{slug}.php`（例: `contact.php`）
- 動的詳細: `{slug}-detail.php`（例: `news-detail.php`）
- JSON データ: `data/{slug}/` または `includes/media/{slug}/`（既存 `NewsStore` パターンに合わせる）
