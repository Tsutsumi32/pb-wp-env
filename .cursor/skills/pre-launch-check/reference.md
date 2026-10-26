# pre-launch-check リファレンス

SKILL.md の会話フロー用の技術メモ。`@figma-page-implement` Phase 3（実装直後のコンソール＋大差検知）とは連携しない。

## 環境判定・フロントルート・実行順

次は **`@project-env-setup` の reference が正本**（本ファイルに複写しない）:

- WordPress / 非 WordPress 判定 → [project-env-setup/reference.md](../project-env-setup/reference.md)「WordPress 判定」
- フロントルート → 同「フロントルート」
- スキル実行順 → 同「スキル実行順（推奨）」

---

## M-1 meta

セットアップ手順: 本ファイル「仕上げセットアップ（旧 project-env-setup D）」。

### M-1-1 基本 meta のパス

| 項目 | PHP | WordPress |
|------|-----|-----------|
| title / description | `includes/config/pages.php`、`includes/meta/title.php` / `description.php` | `inc/config/pages.php`（CPT: `posts.php`）、`inc/head/` 相当 |
| OGP | `includes/meta/ogp.php`、`assets/settings/ogp.jpg` | 同系統 |
| Favicon | `includes/meta/favicon.php`、`assets/settings/` | 同系統 |
| テーマカラー | `config.php` → `THEME_COLOR`、`includes/meta/theme-color.php` | 同系統 |
| サイト名 | `config.php` → `SITE_NAME` | 同系統 |
| PWA 表示名 | `assets/settings/site.webmanifest` の `name` / `short_name` | 同系統（A-1 で `SITE_NAME` と同値想定。`MyWebSite` / `MySite` 残りは要修正） |

#### 仮設定・サンプル残りの目安（報告必須）

ヒットしたら **要修正候補として明示**する。無くても「仮設定候補なし」と報告する。

| 種別 | 例 |
|------|-----|
| サイト名 | `Sample inc.` / `MyWebSite` / `MySite` / `サンプル` |
| description | `ダミー` / `テスト` / `lorem` / 空のまま本番公開向け |
| OGP 画像 | プレースホルダ・明らかに仮の ogp.jpg |
| Favicon | テンプレ同梱のまま未差し替えが疑わしいもの |
| テーマカラー | テンプレ初期値のまま案件色と明らかに不一致 |

サンプル値（`Sample inc.` / `MyWebSite` / `MySite` 等）が残っていれば要修正。

### M-1-2 noindex

| 環境 | 設定 | 出力例 |
|------|------|--------|
| PHP | `pages.php` の `noindex` | `includes/meta/noindex.php` |
| WordPress | `pages.php` / `posts.php` | `inc/setup/sitemap-noindex.php` 等と連動 |

本番公開対象に `noindex: true` が残っていないか。確認・サンクス等は `true` が適切なことが多い。

### M-1-3 構造化データ

探索の目安:

- JSON-LD（`application/ld+json`）
- Microdata（`itemtype="http://schema.org/..."`）
- パンくず（例: `modules/blocks/breadcrumbs.php` の BreadcrumbList）

案件仕様で Organization / WebSite / Article 等が必須なら突合。必須が無ければ「現状の有無」を報告してユーザー判断。

### M-1-4 計測タグ

| 環境 | 主な確認元 |
|------|------------|
| PHP | `includes/config/tracking-tags.php`（`GTM_CONTAINER_ID` / `GA4_MEASUREMENT_ID`）、`includes/meta/tracking-tags.php`、`tracking-tags-body.php`、`layouts/base.php` での include |
| WordPress | テーマ `inc/head`・プラグイン・管理画面のタグ設定 |

GTM 利用時は GA4 を GTM 側配信にする構成が多い（ファイル先頭コメントに準拠）。空文字のまま本番に出ないか確認。

### M-1-5 UI 系カラー（確認のみ・手動対応）

選択色・フォーカス色・スクロールバー色。**設定の正本**は `@project-env-setup` C-1（`@figma-tokens-setup` reference-json「SemanticColor」）と `project/css/scss.mdc`「UI フラット変数」。本 Step は公開前の **有無・妥当性の確認**。対応はユーザー手動（エージェントは編集しない）。

#### 確認する変数

| 用途 | `$colors`（`ui/*`） | フラット変数（`_variables.scss`） | 反映先の目安 |
|------|---------------------|----------------------------------|--------------|
| 選択テキスト | `ui/select-text` | `$color-select-text` | `global` の `::selection` 等 |
| 選択背景 | `ui/select-bg` | `$color-select-bg` | 同上 |
| フォーカス輪郭 | `ui/focus-outline` | `$color-focus-outline` | `:focus-visible` 等 |
| スクロール track | `ui/scroll-track` | `$color-scroll-track` | `scrollbar` mixin 等 |
| スクロール handle | `ui/scroll-handle` | `$color-scroll-handle` | 同上 |

パス: `{フロント}/src/scss/foundation/variables/_variables.scss`（`$colors` の `ui` グループとフラット変数ブロック）。

#### 確認観点

| 観点 | 見るもの |
|------|----------|
| 有効化 | フラット変数がコメントアウトのままか。`meta.variable-exists` 前提の global 適用と整合しているか |
| `$colors` | `ui/*` キーが案件色を指しているか。テンプレ／サンプル色（例: フォーカスの仮色）が残っていないか |
| 意図的な未設定 | コメントアウトのまま公開する方針なら「問題なし」でよい（ユーザー判断） |
| 見た目 | ブラウザでの選択・フォーカス・スクロールバーの最終確認は **M-8** でも可。本 Step はコード側の棚卸し |

#### 要対応時（手動案内のみ）

- `_variables.scss` で該当フラット変数のコメントを外す／`$colors` の `ui/*` を案件色に更新
- Figma Semantic がある場合は `@figma-tokens-setup` / `@figma-tokens-sync` を案内してよい（手順の長文は複写しない）
- **エージェントは本 Step でファイルを編集しない**。Open は完了報告・M-4-3 TODO 候補へ

`THEME_COLOR`（meta のテーマカラー）とは別物。テーマカラーは M-1-1 / 仕上げセットアップ。

### M-1-6 サイトマップ確認・生成（PHP は htaccess も）

#### WordPress

| 項目 | 内容 |
|------|------|
| 方針 | コア `/wp-sitemap.xml`（標準）。独自 `sitemap.php` 等は不要 |
| テーマ側 | `inc/setup/sitemap-noindex.php` が `pages.php` / `posts.php`（CPT・**`category_settings.noindex`**）と整合 |
| 本 Step の報告 | 「コア標準を使用しており問題ない」で可。深掘り・生成コマンドは不要。任意で `category_settings.noindex` が基本 `true` か軽確認 |

#### PHP — サイトマップ

| 主な確認元 | 役割 |
|------|------|
| `resources/scripts/write-sitemap.php` | `make sitemap` の実体。文字列で XML 生成（DOM 不要） |
| `htdocs/sitemap.xml` | 出力（`.gitignore`。デプロイ前に生成して配置） |
| `Page::getIndexableStaticSitemapPaths()` | `pages.php` の url・noindex（`{…}` 付きは除外） |
| `includes/sitemap/entries.php` | 動的 URL の追加（Store の `getSitemapPaths` 等） |

| 観点 | 内容 |
|------|------|
| 静的ページ | 公開すべき url が載り、noindex・確認／サンクス等が載っていないか |
| 動的 URL | `entries.php`（または Store）で足りているか。空のまま本番で不足していないか |
| サンプル | デモ用パス・開発用だけのデータが載っていないか |
| 生成 | 本番 `SITEMAP_ORIGIN` で `make sitemap`。ランタイム `sitemap.php` は使わない |

```bash
make sitemap SITEMAP_ORIGIN=https://www.example.com
```

#### PHP — htaccess（生成元 `000-default.conf` とサイト状態）

| 主な確認元 | 役割 |
|------|------|
| `docker/php/000-default.conf` | **生成元**（Rewrite の正本。ここがサイト状態と合うかが本確認の中心） |
| `resources/scripts/write-htaccess.php` | conf → `htdocs/.htaccess`（`SITE_BASE_PATH` 反映） |
| `make htaccess` | 上記を php コンテナで実行 |
| `config.php` の `SITE_BASE_PATH` | サブディレクトリ配置時のベース |

| 突合観点 | 見ること |
|------|------|
| 動的詳細ルート | `pages.php` の `{id}` URL・`*-detail.php` の有無と、conf 内 `RewriteRule`（コメント／有効）が一致しているか |
| 拒否ディレクトリ | `includes` / `data` / `src` / `modules` 等の `[F]` が現状の公開構成と合うか |
| サイトマップ | 旧 `sitemap.xml → sitemap.php` リライトが残っていないか（静的 XML 方針） |
| 拡張子なし | `/foo` → `foo.php` のルールが、固定ページ構成と矛盾していないか |
| 404 | `ErrorDocument 404` が案件の 404 に向いているか |
| ベースパス | `SITE_BASE_PATH` 変更後に `make htaccess` し直す前提になっているか |

```bash
make htaccess
```

`.htaccess` 単体の目視より、**conf と pages／実ファイルの差分**を先に報告する。

---

## 仕上げセットアップ（旧 project-env-setup D）

`@project-env-setup` から移管。公開前の M-1 / M-2 で **確認だけでなくセットアップも可**。

### OGP・Favicon（旧 D-1）

| 項目 | 環境別パス |
|------|------------|
| OGP 出力 | PHP: `includes/meta/ogp.php`（または `includes/head/ogp.php`） / WP: `inc/head/ogp.php` |
| デフォルト画像 | `{フロント}/assets/settings/ogp.jpg`（1200×630） |
| Favicon 配置 | `{フロント}/assets/settings/`（`favicon.ico`, `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png`, `site.webmanifest` 等） |

`og:site_name` は `SITE_NAME`（project-env-setup A-1 で設定済み想定）。`site.webmanifest` の `name` / `short_name` も A-1 で同値更新済み想定（未実施・サンプル残りなら M-1-1 で修正）。

手動配置を促すか、ユーザー承認後にパス・存在確認を行う。

### テーマカラー（旧 D-2）

| 環境 | 定数 | 出力 |
|------|------|------|
| PHP | `includes/config/config.php` → `THEME_COLOR` | `includes/meta/theme-color.php` 等 |
| WordPress | `inc/config/config.php` → `THEME_COLOR` | `inc/head/theme-color.php` 等 |

候補は `_variables.scss` の `$color-palette` から抽出（ベースの黒・白、ブランド色）。ユーザー承認後に `THEME_COLOR` を更新してよい（pre-launch の編集ポリシー: meta セットアップ時は承認後編集可）。

### 管理画面（旧 D-3・WordPress）

| ファイル | 役割 |
|----------|------|
| `inc/config/admin-style.php` | 色定数（**上部の集約定数を優先更新**） |
| `inc/setup/custom-admin-style.php` | 読み込み（通常は編集不要） |

`$color-palette` / `$colors` に合わせ、構造は壊さず値のみ更新。実施後は管理画面の見直しを促す。

## M-2 プロジェクト固有

### WordPress（W-1 / W-2 / W-4 / W-5 / W-6）

**廃止**: 旧「ログイン URL 変更」、**W-3（管理 URL・ユーザーアカウント）**、問い合わせメール宛先のコード棚卸し（旧 M-2-C）。  
※ PHP の `.htaccess` / `000-default.conf` 確認・再生成は **M-1-6**（サイトマップと同時）。

#### W-1 管理画面

セットアップ: 本ファイル「仕上げセットアップ」の管理画面。ログイン・ダッシュボード・投稿編集の色味・ロゴ。

#### W-2 投稿・サンプルデータ（棚卸しのみ）

| 見るもの | 例 |
|----------|-----|
| 不要投稿 | Hello world、テスト下書き、明らかに開発用タイトル |
| 開発用 CPT 投稿 | `data/{post_type}/posts.dev.json` 想定のサンプルが本番 DB に残っていないか |
| メディア | 未使用のテスト画像が目立つ場合（分かる範囲） |

- **削除はユーザー実行**（管理画面、または `make wp-remove-posts` 等があれば案内のみ）
- エージェントは投稿・メディアを独断削除しない
- `data/` の **ファイル**残存は M-3-2

#### W-4 開発モード

`inc/config/config.php` や `inc/config/plugins/` の、プラグイン操作を許可する開発用フラグが本番向けに解除されているか。

#### W-5 SMTP

- 設定確定後、プロジェクトに SMTP 用 make / WP-CLI があれば案内
- 本番 `wp-config.php` への転記・テスト送信はユーザー作業
- 認証情報はチャットに載せない
- **宛先・件名・CF7 本文のコード棚卸しは本スキル対象外**（実送信の確認は M-8。フォーム契約・エラー表示は M-7）

#### W-6 編集ガイド

納品・運用向けの **編集ガイド**（投稿／固定ページの編集手順、ブロックエディタ・カスタムブロック、ACF 入力、メディア等）の有無と内容を確認するよう促す。

- リポジトリ内ドキュメント・納品物・共有ドライブなど、案件で使っている形態を問わず「公開前に確認したか」を聞く
- エージェントは原則 **促すのみ**（ガイド本文の新規作成は明示依頼時のみ）
- 編集ガイドが不要な案件は **対象外・スキップ**
- AskQuestion 例: 確認済み / 要作成・要更新 / 対象外・スキップ

---

## M-3 不要コード

### 空セレクタ

- `src/scss/**/*.scss` で `セレクタ { }` やコメントのみのブロック
- `@generate-scssfile` 直後の空骨組みは、未スタイルのままだと削除対象になりうる（ページ公開前にスタイル予定なら残す判断もあり → ユーザー確認）

### 未使用ファイルの根拠例

| 種別 | 根拠の例 |
|------|----------|
| SCSS | どのエントリからも `@use` / `@forward` されない。scss-index に載らない orphan |
| SCSS サンプル | **`src/scss/_sample/`**（PHP: blocks / elements 参照用。`build-config` の `SCSS.EXCLUDE_DIRS` でコンパイル除外）。存在すれば **削除候補として必ず確認**。流用・本番採用分は除外。併せて `pages/_sample/` も確認 |
| SCSS wp-block | **`src/scss/wp-block-editor/`**・**`wp-block-styles.scss`**（ブロックエディタ用。`EXCLUDE_ENTRIES` で未使用除外のことも多い）。案件で不要／サンプルのままなら **削除候補として必ず確認**。本番利用のカスタムブロック分は残す |
| JS（M-3-3） | 下記「M-3-3」 |
| PHP テンプレ | ルーティング・`pages.php`・他テンプレから include されない |
| `data/` | 参照されない `*.sample.json`、使っていない `posts.dev.json` コピー、開発専用で本番リポジトリに不要と分かるもの。**運用に必要な定義は消さない** |

**削除しない例**: `foundation/`、共有で参照ありの `modules`、`_template.js`、ビルド設定、画像パイプライン設定、本番で使う `mail.config.json` 等。

mixin / function の未使用は **検出しない**。

### M-3-3 未使用 JS ファイル

**必ず実施**（候補ゼロでも「なし」と報告）。

| 対象 | 見方 |
|------|------|
| `features/`・`modules/`・`utils/` | 他ファイルからの `import` が無い。`initCommon` / `initProject` / `pages` で init されていない。**コメントアウトのみは未使用** |
| `pages/*.js` | `assets_name`・ルーティング・`pages.php` と不一致、または画面が公開対象外で読まれない |
| `.gitkeep` のみのディレクトリ | `src/js/` 配下で、再帰的に `.gitkeep` 以外のファイルが無いもの。**ディレクトリごと** 1 件（`.gitkeep` 単体は出さない）。入れ子は外側にまとめる。他ファイルがあるディレクトリは対象外 |
| カタログ由来 | `@js-catalog-adopt` でコピーしたが未参照。**正本 `catalog/js/` は消さない** |
| 残してよい例 | `lifecycle/`・`setup` 基盤、参照ありの `utils`（`delegate` 等）、`_template.js`、解析曖昧な要確認 |

`initProject` にコメント例だけ残っているコア（`scrollObserver` 等）も、**実 init が無ければ削除候補**として表に出す（残す判断はユーザー）。

---

## M-4 仮・未実装・リンク／画像

コード横断の棚卸しは **M-4 で一度だけ**。ページ完了時の一覧（そのページのテンプレートだけ。編集しない）は `@figma-page-implement` の `page-check.md`。M-5 は誤字・表記ゆれ。M-6 はコーディング規約（実施するとき）。HTML 構文は vnu の一括（実施するとき）。M-7 はフォーム契約（ページ完了時は当該ページの契約一覧のみ。動作はここ）。M-8 はブラウザ上の人手再確認。

### M-4 と M-5 の境界

| 扱い | 例 | 担当 |
|------|----|------|
| 意図的な仮・未確定・差し替え待ち・未実装 | `(仮)`、`TODO：テキスト差し替え`、`TODO：画像差し替え`、役割説明ダミー、仕様上未実装 | **M-4** |
| WM／sample 画像・画像リンク切れ・href 漏れ | ウォーターマーク、`sample` アセット、参照ファイル不在、`href="#"` | **M-4** |
| 本番っぽい誤字／句読点／表記ゆれ | 誤変換、句読点の過不足 | **M-5** |

### 検索語（コメント・表示文言）

- コメント系: `TODO` / `FIXME` / `XXX` / `差し替え`（例: `TODO：テキスト差し替え` / `TODO：画像差し替え`）
- 表示残留の目安（ユーザー向け文字列内。**TODO コメントが無くても対象**）: `テスト` / `ダミー` / `入ります` / `ほげ` / `xxx` / `lorem` / `サンプル` / `Sample` / `(仮)`
- ヒットしても開発用語・変数名・テストコードだけなら候補にしない（表示に出るもの優先）

### 画像・href（M-4-2）

| 観点 | 内容 |
|------|------|
| TODO コメント | `TODO：画像差し替え` 等 |
| 使用画像全体 | テンプレ・設定から参照される画像を対象に、ウォーターマーク・sample 臭・明らかに仮のものを候補化（`figma/assets.mdc`「差し替えが必要な画像」の主軸に合わせる） |
| リンク切れ | `render_img` / `src` / メディアパスの参照先ファイル不在 |
| href | 空、`#` のみ、`javascript:void(0)`、`example.com` 等のプレースホルダ、未設定っぽい内部リンク |

スキップ Step の TODO は、可能な限り **該当機能の近いファイル** に書く（例: noindex 未確定 → `pages.php` 近傍コメント）。

文言例: `// TODO(pre-launch): M-1-4 本番 GTM ID を設定する`

---

## M-5 誤字脱字の可能性確認

コード横断の **誤字・表記ゆれ候補**。仮・サンプル・画像／href は M-4。画面上の最終確認は M-8。

### 対象（ユーザー向け文言）

フロントルートは [project-env-setup/reference.md](../project-env-setup/reference.md)「フロントルート」。

| 種別 | 目安パス・箇所 |
|------|----------------|
| meta・ページ名 | `pages.php` / `posts.php` の title・description・表示名 |
| テンプレ固定文 | PHP/HTML テンプレ内の日本語・英語の表示文言、`aria-label`、`alt`、ボタンラベル |
| メール | CF7 / メールテンプレの件名・本文（秘密・個人情報は載せない） |
| JS | `src/js/` のユーザー向けメッセージ・バリデーション文言 |
| サイト名等 | `SITE_NAME` など画面／OGP に出る定数値 |

### 除外

- `node_modules` / `vendor` / WordPress コア / `dist/` のビルド成果物
- 変数名・関数名・class 名・コメントのみ（表示に出ないもの）
- 画像バイナリ・フォント実体
- 意図的な仮文言・差し替え待ち（M-4 側）

### 疑いの目安（候補にする例）

- 明らかな誤変換・脱字・重複文字（例: 「お問合せせ」「ございす」）
- 句読点・記号の過不足や不自然さ（例: `。` / `、` の連続・欠落、括弧の閉じ忘れ、全角／半角の混在が目立つ）
- 同一サイト内で意味が同じ語の表記ゆれが目立つ（例: 「お問合せ」と「お問い合わせ」が混在し方針が不明）
- 英語 UI の明らかなスペルミス

断定できない固有名詞・専門用語は **要確認** 行に分け、修正案を押し付けない。

### 提示フォーマット

| ファイル | 該当文言（抜粋） | 疑い | 確信度 |
|----------|------------------|------|--------|
| パス | … | 脱字の可能性 等 | 高 / 要確認 |

候補が多いときは優先度の高いものから提示し、残りは件数だけ添えてよい。

---

## M-6 コーディング規約（基本は実施）

既定は実施する。実施しないはユーザーが選んだときだけ。他人の実装も対象。ページ完了時の確認（`@figma-page-implement` の `page-check.md`）は、そのページで追加・変更したファイルだけを見る。ここはテーマ全体。規約本文はここに複写しない。`.cursor/external/` に案件差分があれば、共有ルールより「この案件では」を優先する。

HTML の調査には `frontend-base/html.mdc`「アクセシビリティ」と「vnu（構文）」を含める。vnu の実行は HTML 構文 Step。M-6 では、vnu が見ないもの（`alt` の妥当さ、リンクの目的、キーボード順、コントラスト）も見る。

| 対象 | 正本 |
|------|------|
| HTML | `frontend-base/html.mdc`（「vnu（構文）」「アクセシビリティ」を含む）。class・PHP テンプレートは `project/template/`（入口 `index.mdc`。`naming.mdc` / `php.mdc` / `image.mdc`） |
| CSS / SCSS | `frontend-base/css.mdc`。記述・命名・レスポンシブは `project/css/`（入口 `index.mdc`。`scss.mdc` / `naming.mdc` / `responsive.mdc`） |
| JS | `frontend-base/javascript.mdc`。実装・命名は `project/javascript/`（入口 `index.mdc`。`coading.mdc` / `naming.mdc`） |

調査範囲はテーマのテンプレート、`src/scss`、`src/js`。`dist` と WordPress 本体は見ない。

報告はファイルパス・該当規約・内容の表。違反が無ければ「違反なし」。修正は報告後の承認範囲だけ。

## M-7 お問い合わせ／分岐フォーム（該当時）

契約の正本は `.cursor/rules/project/template/form-implementation.mdc`「フォーム種別出し分け」→ **formValidator との契約**（本 reference に契約本文を複写しない）。

### 判定目安（フォームあり）

次のいずれかがあれば **M-7 対象**（複数可）:

| 種別 | 目安 |
|------|------|
| 静的 PHP | `<docroot>/contact.php` 等、`data-feature="formValidator"` 付きフォーム |
| WordPress | CF7（`cf7.php`）、テーマ内お問い合わせ固定ページ、`formValidator` 初期化のある `pages/*.js` |
| JS | `src/js/features/formValidator.js` の利用、`formBranchToggle.js` の利用 |
| 設定 | `cft-branches.php`（CF7 枝分け）、CONTACT 定数・メール送信ユーティリティ |

無い・別手段のみ（外部埋め込みのみ等）なら M-7 対象外。埋め込みでも自前バリデーションがある場合は対象に含めてよい。

### M-7-2 コード確認の観点（抜粋）

| 観点 | 見るもの |
|------|----------|
| 初期化 | `formValidator.init()`（静的は `platform: 'externalService'` 等）、必要なら `formBranchToggle.init({ form })` |
| data 属性 | `data-form-validator-validate` 必須漏れ、`input` / `err` キー対応 |
| 分岐・inactive | 非表示枝の `hidden` + `data-form-validator-inactive="true"` + 配下 `disabled` |
| エラー欄解決 | 同一キー複数時に `resolveErrorArea` / `resolveErrorGroupArea`（活性側優先）。素の `querySelector` 先頭のみになっていないか |
| 再描画 | PHP が選択ブランチに合わせて表示 / inactive / disabled / エラー位置を出しているか |
| デフォルト埋め | エラー再表示で空の必須（ラジオ等）を勝手に埋めないか |
| CF7 枝 | `data-form-branch` と `CFT_FORM_BRANCH` の文字列一致、`swv_placeholder` の付け方 |

### M-7-3 動作確認の観点

| 確認 | 内容 |
|------|------|
| 通常フロー | 入力 → 確認（あれば）→ 完了 |
| 必須エラー | 未入力送信で **表示中** のエラー欄に見える |
| 分岐＋必須（必須） | 非表示側ブランチ選択 → 未入力送信 → **表示側**にエラーが見える |
| 枝切替 | 非表示枝が disabled／送信対象外になること |
| メール | 実送信は M-7 または M-8。宛先コード棚卸しはしない |

---

## HTML 構文（vnu）

手順とコマンドは SKILL.md「HTML 構文（vnu）」。ここは範囲だけ。

| 環境 | 一括 |
|------|------|
| WordPress | `make vnu-pages`（公開画面のサーバー HTML） |
| PHP | `make vnu-pages`。静的 HTML があるときは `make vnu-html` |
| 静的 HTML だけの案件 | PHP 環境の `make vnu-html`。WordPress 環境には `vnu-html` は無い |

見ないもの: JavaScript 実行後の DOM、BrowserSync 経由の HTML、URL として一覧に無い状態（未登録の確認画面など）。ページ完了時の 1 件は `@figma-page-implement` の `page-check.md`（`make vnu-page`）。ここはサイト全体の一括。

## M-8 検証（人手・統合）

コーディング規約は **M-6**（実施したとき）。HTML 構文の一括は **HTML 構文（vnu）**（実施したとき）。表示・OS／ブラウザ・画面上のリンク／画像／誤字・機能動作を **1 Step** で促す。フォーム契約のコード確認・分岐エラー表示の重点確認は **M-7**。本 Step では規約の再調査も vnu の再実行もしない。

### 表示観点（分けて確認）

| 観点 | 見るもの |
|------|----------|
| レイアウト | 崩れ、はみ出し、重なり、グリッド／カラム |
| カラー | ブランド色、コントラスト、状態色。**選択・フォーカス・スクロールバー**は M-1-5 でコード確認済みでも、ブラウザ上の見え方をここで再確認してよい |
| テキストスタイル | サイズ、ウェイト、行間、切り詰め |
| 余白 | セクション・コンテナ・要素間 |
| 装飾 | 線、影、角丸、背景、疑似要素 |

### ブラウザマトリクス（推奨）

| OS | ブラウザ |
|----|----------|
| Windows | Chrome, Edge |
| macOS | Chrome, Safari |
| Android | Chrome |
| iOS | Safari |
| 可能なら | iPad 等 |

### 機能抽出の目安

- `pages.php` の contact / form / search 等
- CONTACT 定数・CF7
- CPT 一覧・詳細・ページネーション
- フィルタ・外部埋め込み
- 実送信メール（届くか。宛先のコード棚卸しは本スキル対象外）

### M-4 / M-5 / M-6 / M-7 / M-8 の分担

| Step | 役割 |
|------|------|
| M-4 | リポジトリ上の TODO・仮テキスト・未実装・画像（WM／切れ）・href 漏れを **一度**棚卸し |
| M-5 | 誤字脱字・表記ゆれの **可能性候補** |
| M-6 | HTML / CSS / JS の **コーディング規約**（基本は実施。アクセシビリティと vnu 構文を含む。調査・報告のあと修正） |
| HTML 構文（vnu） | Nu Html Checker の一括（基本は実施。`make vnu-pages`。PHP の静的 HTML は `make vnu-html`）。手順は SKILL.md |
| M-7 | お問い合わせ／分岐フォームの **コード契約確認**と重点動作確認（該当時） |
| M-8 | ブラウザ上での表示・マトリクス・リンク／画像／誤字・機能動作の **人手確認** |
