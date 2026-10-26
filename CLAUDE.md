# development-os — Claude Code ルール

Claude Code が常に読み込む共通ルールです。実装ルールの詳細は `.claude/rules/`、JSライブラリ・プラグイン単位のルールは `.claude/skills/` に分割しています。

## 共通ルール（常時適用）

### 言語
- ユーザーとのやり取りは日本語で行う。

### 完了報告
- ファイルを作成・編集した作業の完了時は、報告の最後に「作成・編集したファイル」一覧を出す。
- 各ファイルはエディタでクリックして開けるよう、ワークスペースルートからの相対パスで Markdown リンクにする（例: `[CLAUDE.md](CLAUDE.md)`、`[src/js/pages/top.js](src/js/pages/top.js)`）。
- 新規作成と編集を区別して記載する（例: `新規` / `編集`）。削除したファイルがあれば併記する。

### 機密情報の扱い
- APIキー、パスワード、秘密鍵、トークン、`.env` の値など機密情報と思われるものを、確認なく修正・参照・出力しない。
- 実装の都合上どうしても扱う必要がある場合は、着手前に必ずチャットで確認を取ってから対応する。

### ビルド・コンパイル
- コーディング依頼では、JS / SCSS のビルド、SCSS インデックス（エントリー）生成、開発サーバーの起動を実行しない（`npm run build`、`npm run watch`、`npm run dev`、`scss-index`、`watch:scss-index`、`build:scss-index`、画像変換など）。
- 依頼者は開発モード起動済みか、ビルドは手動で行う。エージェントが代行すると監視の二重起動など、予期しない動作の原因になる。
- 「開発モードが動いていない」と伝えても、当該コマンドの実行を明示されない限り走らせない。
- 例外は、依頼者が当該コマンドの実行を明示したときのみ。

### ルールの読み込み
- 実装作業に着手する前に、対象ファイルの種類・作業内容に応じて `.claude/rules/` 配下の該当ルールを読み込んでから実装する（下記「ルール参照マップ」）。
- 使用する JS ライブラリ・プラグインに対応するルールが `.claude/skills/` にある場合は、それに従う。

## ルール参照マップ

実装対象に応じて、着手前に該当ファイルを読み込む。

| 対象 | 読み込むルール |
|---|---|
| SCSS/CSS 全般 | `.claude/rules/frontend-base/css.md` |
| Safari / iOS WebKit（細い線・ゴースト・dvh・フォーム等。GSAP 起因は `@gsap`） | `.claude/rules/frontend-base/safari-webkit.md` |
| JavaScript 全般 | `.claude/rules/frontend-base/javascript.md` |
| HTML/PHP テンプレート | `.claude/rules/frontend-base/html.md` |
| 本プロジェクトのSCSS基盤を使う実装（`s()` / `get-color()` 等の関数・PRECSS風class設計を使う案件） | 上記 + `.claude/rules/project/css/index.md`（配下の naming / scss / responsive へ分岐） |
| 本プロジェクトのJS基盤を使う実装（`data-*` 契約・`createPage` 等を使う案件） | 上記 + `.claude/rules/project/javascript/index.md`（配下の naming / coading / swiper へ分岐） |

`project/` 配下のルールは、`s()` / `get-color()` などの SCSS 基盤関数と、`data-*` 契約・`createPage` などの JS 基盤を前提にしたルール。同じ基盤を使わない案件・箇所では frontend-base のみを基準にする。

## 実装ルール（`.claude/rules/`）

- `frontend-base/`: CSS・JavaScript・HTML の汎用コーディングルール（コメント階層・記述順など）、Safari / iOS WebKit（`safari-webkit.md`）
- `project/css/`: SCSS実装ルール（命名・レスポンシブ・詳細記法）
- `project/javascript/`: JavaScript実装ルール（命名・画面JS手順・DOM参照・Swiper）

## プラグイン別ルール（`.claude/skills/`）

JSライブラリ・プラグインを使った実装は、プラグイン単位でスキル化する。該当するタスクでは Claude Code が自動的に読み込む。

- `gsap`: GSAP導入（npm必須）・ScrollSmoother / Lenis の選定・Safari 橋渡し（ハッシュ退避・overflow:clip・fixed portal・Lenis の ticker 接続／prevent／BFCache 等）

新しいプラグインを扱うルールを追加する場合も、同様に `.claude/skills/<plugin-name>/SKILL.md` として追加する。

## ワークフロー別スキル（`.claude/skills/`）

画面キャプチャ・原稿/画像シート・原稿投入など、案件横断の作業フローもスキル化している。

- `page-capture`: Playwright（make）で実装画面を `_docs/capture/` へキャプチャ保存
- `manuscript-sheet`: 仮テキストを画面ごとに `_docs/sheets/` の原稿シートへ書き出し
- `image-sheet`: 仮画像を画面ごとに `_docs/sheets/` の画像シートへ書き出し
- `manuscript-injection`: 確定原稿をテンプレートへ投入（改行の見せる/読ませる判断）
- `generate-scssfile`: PHP から `un_`/`bl_`/`el_`/`header_`/`footer_` クラスを抽出し、空の SCSS 骨組みを生成
- `project-env-setup`: 新規クライアント向けの環境・pages・SCSS トークン方針を対話で初期セットアップ
- `pre-launch-check`: 公開前の meta・UI系カラー・不要コード・TODO・誤字脱字・人手検証を対話で確認
- `reset-scss-variables`: 案件固有の SCSS トークンをリセット（デザインサイズ・ブレイクポイント等は保持）

これらが参照する Figma/PHP テンプレート系の詳細ルール（`figma-rule.mdc` / `php.mdc` / `assets.mdc` 等）や、Figma 実装パイプライン・トークン同期・ページ情報管理などの周辺スキル（`figma-tokens-setup` / `project-page-info` / `figma-batch-implement` 等）は `.claude/` へ未移行のため、各 SKILL.md から `.cursor/rules/` / `.cursor/skills/` を直接 Read する。`pre-launch-check` / `project-env-setup` は Cursor 側にも同名スキルが並行して残っており、同期しない。

## ルール・スキルの管理

`.claude/rules/` / `.claude/skills/` / 本ファイルを新規作成・編集するときは、先に `.claude/rules/rule-management.md` を確認する（重複禁止・役割分離・ツールツリーの独立管理）。ワークフローは `management-rule` スキルを参照。

## ツリーの独立管理

Claude Code は `.claude/rules/`・`.claude/skills/` および本ファイル（`CLAUDE.md`）のみを作成・更新・削除する。`.cursor/` 配下は Cursor 側の管理対象のため触らない。

`_docs/`（`_docs/capture/` の画面キャプチャ、`_docs/sheets/` の原稿・画像シート）は Cursor・Claude Code 共通の出力先。どちらのツリーにも属さない共有ディレクトリのため、スキルからの参照・生成は対象外の制約を受けない。
