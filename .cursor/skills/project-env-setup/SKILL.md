---
name: project-env-setup
description: >-
  新規クライアント向けのプロジェクト初期設定を、質問・返答の会話形式で順に進める。
  環境（.env・テーマ名・ドキュメント ※手動入力。Figma URL は不要）、
  pages.php のサンプル掃除（TOP/エラー/404 最小。下層は実装時 pages ensure。
  CPT/ACF・更新可能コンテンツは指定フレームの動的モード）、
  SCSS 基盤（トークン方針・デザインサイズ・ブレイクポイント・フォント読み込み）を段階的に案内する。
  画面カタログは @figma-batch-implement。OGP・Favicon・テーマカラー・管理画面は @pre-launch-check 側。
  project-env-setup・環境構築・初期セットアップの依頼時に使用する。
disable-model-invocation: true
---

# プロジェクト環境セットアップ

新規クライアント向けに、**環境 → ページ情報 → スタイル** の順で初期設定を進める。各 Step は **1 つずつ** 会話で進め、ユーザーが **スキップ** できる（後で手動対応可）。

OGP・Favicon・テーマカラー・WP 管理画面スタイルは **`@pre-launch-check`（M-1 / M-2）** で対応する（本スキルでは扱わない）。

## 全自動（unattended）対象外

本スキルは **対話セットアップ専用**。`@figma-batch-implement` の [unattended.md](../figma-batch-implement/unattended.md) には **入らない**。環境・トークン方針・サンプル掃除は PC の通常フローで先に済ませ、その後の画面実装バッチだけを unattended にする。

## 進め方（AskQuestion 優先）

ユーザー確認は **通常チャットではなく `AskQuestion`（選択式）** で行う。共通パターンは [project-page-info/SKILL.md](../project-page-info/SKILL.md) の「進め方（AskQuestion 優先）」に準拠する。

| ルール | 内容 |
|--------|------|
| 1 Step ずつ | 次の Step に進むのは、現 Step の `AskQuestion` 回答（対応済み・スキップ・確定値）を受け取ってから |
| AskQuestion 必須 | 各 Step の確認・選択は **`AskQuestion` を使う**。末尾に **「その他（続けてチャットで指定）」** を置く |
| **推定値を選択肢に** | 推定できる設定値は **AskQuestion の選択肢に載せ、選択だけで確定** させる。「変更する → チャット入力」の 2 段階は推定値が無い場合のみ。詳細は正本の「推定値を選択肢に含める」 |
| 情報提示 | 現状値・推定値（根拠）・候補一覧は AskQuestion の **直前** にチャットで箇条書き表示する（質問本文に詰め込まない） |
| スキップ | 現状維持と同義の Step では **`現状維持: {値}`** を選択肢に含める。独立したスキップラベルは省略可 |
| 手動 Step | エージェントは **`AskQuestion` のみ**。ファイル編集はユーザーが行い、「対応した」相当の選択を受け取るまで待つ |
| 自動 Step | 確定値が得られたら、当該スキル内の手順どおり編集してから次へ |
| 委譲 Step | 別スキルを **@メンション付きで実行**し、完了報告を受けてから次へ |

### AskQuestion の設計

| パターン | 使い方 |
|----------|--------|
| **値の確定（推定あり）** | 現状維持 / 推定値を採用（複数候補可）/ その他。1 回で slug・名称を確定 |
| **単独選択** | 方式選択、実施する / スキップ、一覧ページあり・なし など |
| **複数選択** | 動的コンテンツ採用画面など。`allow_multiple: true` |
| **その他入力** | 上記に載せきれない値のみ。「その他」選択後にチャットで受け取る |
| **1 テーマ 1 質問** | 1 回の `AskQuestion` は 1 テーマに限定。別テーマは別ラウンド |

チャットだけで確認を完結させない。ユーザーが先にチャットで回答した場合のみ、その内容を確定値として扱い、同内容の `AskQuestion` は省略してよい。

### 提示フォーマット（一覧・候補の見せ方）

候補・現状値・複数項目をチャットで示すときは、**1 文に並べず** 箇条書きまたは表にする。

| 提示内容 | フォーマット |
|----------|-------------|
| 画面フレーム名・ページ候補・フォント名・テーマ名・ファイル名など **複数の名前** | 箇条書き（`-`） |
| キーと値の対応（`PROJECT_NAME`、判定結果、変更ファイルなど） | 箇条書き（`キー: 値`） |
| 候補の比較・採用確認（description 案・noindex 案など） | 表 |
| Step 一覧・完了 / スキップ報告 | 箇条書き |

**NG 例**（読みにくい）:
> 候補は TOP、会社概要、お問い合わせ、プライバシーポリシー、採用情報です。現状の PROJECT_NAME は meisin-ne-jp、テーマ名は meisin-hp です。

**OK 例**:
> **候補画面**
> - TOP
> - 会社概要
> - お問い合わせ
> - プライバシーポリシー
> - 採用情報
>
> **現状**
> - `PROJECT_NAME`: `meisin-ne-jp`
> - テーマ名: `meisin-hp`

B-1（`@project-page-info`）の画面候補・description 案などは、委譲先スキルの表形式ルールに従う。本スキル内で候補を要約するときも、上記の箇条書き・表を使う。

---

## 全体チェックリスト

```
■ 環境の整備
- [ ] A-1  env・buildconfig など環境周り（プロジェクト名・サイト表示名・テーマ名 ※手動入力）

■ ページ情報の設定
- [ ] B-1  pages.php サンプル掃除（TOP・エラー・404 最小。一括登録はしない）

■ スタイルの設定
- [ ] C-1  変数・mixin の方針（質問 → 別スキル委譲）※スタイル最初
- [ ] C-2  デザインサイズ（手動）
- [ ] C-3  $media-query-strategy（手動）
- [ ] C-4  ブレイクポイント（手動）
- [ ] C-5  レスポンシブ対応の仕組み（手動）
- [ ] C-6  フォント読み込み（調査 → AskQuestion → FONT_TAGS / files。サブセットは手動）※スタイル最後
```

再実行時は、未完了の Step から再開する。完了済み Step はユーザーが指定すればスキップ可。

（旧 A-2・旧 B-2 Figma URL 専用・旧 B-1b カタログ・旧 B-3 allowed_blocks・旧 B-1-A 一括・旧 D 仕上げは廃止。**本スキルでは Figma デザイン URL を受け取らない**。カタログは `@figma-batch-implement` Phase 0-catalog。仕上げは `@pre-launch-check`）

**ページ登録の役割分担**:
- **B-1**: サンプル掃除（TOP・エラー・404 の最小構成）。**全画面の一括登録はしない**
- **固定ページの追加**: 実装前 [pages-ensure.md](../project-page-info/pages-ensure.md)
- **CPT / ACF（WP）・更新可能コンテンツ（PHP）**: 指定フレームで `@project-page-info` の **動的コンテンツモード**（ensure または単独）
- WordPress 実体同期: 設定反映・6-W4 後にエージェントが `make wp-create-pages` / `make wp-create-posts` を実行（手動案内しない）

---

## ■ 環境の整備

### A-1: env・buildconfig など（プロジェクト名・サイト表示名・テーマ名）

**エージェントが実施する**唯一の環境 Step。詳細・更新対象ファイルは [reference.md](reference.md)。

#### A-1-0: WordPress 判定

[reference.md](reference.md)「WordPress 判定」に従い判定する。結果をチャットで伝える（**箇条書き**で `WordPress` / `非 WordPress` と根拠を示す）。非 WordPress は **テーマ名（A-1-2）をスキップ**。

#### A-1-1: プロジェクト名・サイト表示名

**本スキルでは Figma URL を受け取らない・促さない。** 名称は **手動入力**（または現状維持）で確定する。詳細は [reference.md](reference.md)。

1. 現状の `PROJECT_NAME` / `WP_SITE_TITLE`（`.env.example`）を読み取る。参考としてリポジトリ名などをチャットに箇条書きしてよい（**自動採用しない**）。
2. チャットで **現状値** を箇条書きで提示する（`PROJECT_NAME` / `WP_SITE_TITLE` を分けて記載）。
3. **`AskQuestion`（1）**: 採用する `PROJECT_NAME` はどれですか？
   - `現状維持: {現状値}`
   - **手動入力（続けてチャットで slug を指定）**
   - その他（続けてチャットで指定）
4. **`AskQuestion`（2）**: 採用する `WP_SITE_TITLE`（WordPress サイト表示名）はどれですか？
   - `現状維持: {現状値}`（**サンプル値 `株式会社サンプル` の場合は載せない**）
   - **手動入力（続けてチャットで表示名を指定）**
   - その他（続けてチャットで指定）
5. `PROJECT_NAME` または `WP_SITE_TITLE` のいずれかを現状維持以外にした場合のみ **`AskQuestion`（3）**: `.env` も同時に更新しますか？（`.env` が存在する場合のみ）
   - `.env.example` のみ更新
   - `.env.example` と `.env` を更新
   - スキップ（`.env.example` のみ更新）
6. 「手動入力」または「その他」が選ばれたら、チャットで値を受け取ってから更新する。
7. `PROJECT_NAME` または `WP_SITE_TITLE` を現状維持以外にした場合は [reference.md](reference.md) の「プロジェクト名」に従い `PROJECT_NAME` 関連項目と `WP_SITE_TITLE` を更新する。
8. **確定した `WP_SITE_TITLE` と同値** で次を常に更新する（PHP / WordPress いずれも該当パスがある場合。A-1 完了時点で揃える）:
   - `config.php` の `SITE_NAME`
   - `assets/settings/site.webmanifest` の `name` / `short_name`（いずれもサイト表示名と同じ文字列。詳細は [reference.md](reference.md)「SITE_NAME・webmanifest」）

#### A-1-2: テーマ名（WordPress のみ）

1. `resources/wp-dir/wp-content/themes/` 配下の現テーマ名を読む。参考として `PROJECT_NAME-hp` をチャットに書いてよい（**自動採用しない**）。
2. チャットで **現状値** を箇条書きで提示する（複数テーマがある場合は 1 行 1 テーマ）。
3. **`AskQuestion`**: 採用するテーマ名はどれですか？
   - `現状維持: {現テーマ名}`
   - **手動入力（続けてチャットで slug を指定）**
   - その他（続けてチャットで指定）
4. 現状維持以外を選んだら、テーマディレクトリのリネーム・`WP_THEME_NAME`・`build-config.js` の `FRONT_DIR` 等を [reference.md](reference.md) に従い更新する。

#### A-1 完了時

- 変更ファイル一覧、`PROJECT_NAME` / `WP_SITE_TITLE` / `SITE_NAME` / `site.webmanifest`（`name`・`short_name`）/ テーマパス、DB ボリューム名が変わる場合の注意を **箇条書き**で短く報告する。
- 推奨: `.env` 未作成なら `cp .env.example .env` → `make init` または `make up`。
- 完了後は **B-1** へ。

---

## ■ ページ情報の設定

### B-1: pages.php サンプル掃除（最小構成）

**全画面の Figma 一括登録は行わない。** 下層・CPT・フォームは実装前 ensure / 動的コンテンツモードで足す。本 Step はテンプレ由来のサンプルページを落とし、TOP・エラー・404 だけ残す。

1. チャットで案内:
   - 固定ページの追加は実装スキルが **pages ensure** する
   - CPT / ACF・PHP の更新可能コンテンツは **指定の一覧・詳細フレーム** で `@project-page-info`（動的モード）
2. **`AskQuestion`**: `pages.php` のサンプル掃除をしますか？

| 選択 | 内容 |
|------|------|
| **最小構成にする（推奨）** | TOP・エラー・404 以外を削除（下記） |
| **スキップ** | 現状維持（サンプル残りに注意） |

`SITE_NAME` は **A-1 で設定済み**。B-1 では再確認しない。

#### B-1 実施（最小構成）

エージェントが編集する。詳細は [reference.md](reference.md)「B-1 最小構成」。

1. `pages.php`（PHP: `includes/config/pages.php` / WP: `inc/config/pages.php`）を読み、現状のキーを提示する。
2. **残すキー（必須）**: TOP（`top`）、エラー（`error`）、404（`not-found` 等。プロジェクトの定数名に合わせる）。
3. 上記以外の **ページ定数・`$pages` エントリ・関連ヘルパー参照**を削除する。他ファイルが削除キーを参照している場合は、参照切れを直すか、削除前に影響を報告して確認する。
4. `posts.php` にサンプル CPT だけがある場合は、削除候補として提示し **`AskQuestion`**（削除する / 残す）してから対応する。
5. 変更内容を箇条書きで報告し、**C-1** へ。

WordPress で既に `wp-install` 済みかつ `pages.php` を変えた場合は、[project-page-info/php-config.md](../project-page-info/php-config.md)「WP-CLI 同期」に従い **`make wp-create-pages` をエージェントが実行**する（未 install ならここでは実行しない。初回 install 時に create が含まれる）。

（旧 B-1-A Figma 一括・旧 B-1b カタログ・旧 B-2・B-3 は廃止。カタログは `@figma-batch-implement`。ブロックエディタ制限が必要なら別途依頼。）

---

## ■ スタイルの設定

**C-1 を最初**に実施する。レイアウト基盤の手動確認は **`@figma-tokens-setup` 完了後に促す**（C-1 経由・単体実行とも）。C-1 でトークン Setup をスキップした場合のみ C-2〜C-5 で改めて確認。**C-6 フォント読み込み**はスタイルの **最後**。

### C-1: 変数・mixin の方針（最初）

1. **`AskQuestion`**: 次のどれで進めるか。

| 選択 | 向き | 次のアクション |
|------|------|----------------|
| **JSON 同期** | Variables / Styles を Export 済み（またはこれから用意） | `@figma-tokens-setup` を実行（リセット → JSON 同期）。**カラー・フォント・タイポに加え `$section-sizes` / `$content-space` / `$container-sizes` も必要に応じて** |
| **リセットのみ** | 初回一括はしない | `@figma-tokens-setup` を実行（リセット → 何もしない）。過不足は画面実装時の変数化で対応 |
| **スキップ** | — | トークン方針は未決定のまま C-2 へ（サンプル値残りに注意） |

2. **JSON 同期**を選んだとき: `.cursor/figma-tokens/` に必要な JSON が無ければ、SCSS Variables Sync 等での **エクスポート準備を促し**、揃ってから同期する（**Figma デザイン URL の共有は不要**。JSON ファイルの配置のみ）。
3. 選択に応じて `@figma-tokens-setup` を **完了まで実行**する（完了時にレイアウト手動確認の促しも含まれる）。リセットのみ／JSON 後も、画面実装時に不足・余剰トークンを都度直してよい。

### C-2 〜 C-5: レイアウト基盤（手動・補完）

**正本の促しは `@figma-tokens-setup` 完了後**。C-1 で Setup を実行済みで、その完了時に確認済み（対応／スキップ）なら **C-2〜C-5 は飛ばしてよい**。

C-1 を **スキップ**したとき、または Setup 完了時にレイアウト確認が未了のときのみ、[reference.md](reference.md) を参照して **`AskQuestion`**（**対応する（手動）** / **スキップ**）。

| Step | `AskQuestion` の内容 |
|------|----------------------|
| **C-2** デザインサイズ | `$design-size-sp` / `$design-size-pc` 等を案件向けに設定しますか？ |
| **C-3** ファースト | `$media-query-strategy`（sp-first / pc-first）を設定しますか？ |
| **C-4** ブレイクポイント | `$breakpoint-keys` / `$breakpoints` を設定しますか？ |
| **C-5** レスポンシブ | `$style-settings` やレスポンシブ mixin を確認しますか？ |

### C-6: フォント読み込み（最後）

本 Step は **ブラウザへの読み込み方式** と **フォント実体の配置** を扱う。SCSS の `$font-configs` 等は C-1（JSON）または画面実装で定義される。C-1 で未設定のままなら **スキップして画面実装時に対応**してよい。

詳細は [reference.md](reference.md)「C-6 フォント読み込み」。**サブセット化（`make font-build*`）は本フローでは行わない**（必要ならユーザーが手動）。

#### C-6-1: 使用フォントの確認

1. `{フロント}/src/scss/foundation/variables/_variables.scss` の `$font-configs` / `$text-styles` を読む。
2. ファミリーが一覧できる場合は **箇条書き**で提示する。
3. **未設定・空**の場合は **`AskQuestion`**:
   - **スキップ**（画面実装時に `$font-configs` と読み込みを追加）
   - **手動でファミリーを指定**（続けてチャット）
   - その他

「スキップ」なら C-6 を完了扱いとし、完了報告に「フォント読み込みは画面実装時」と書く。

#### C-6-2: 読み込み方式の調査と確認（ファミリーごと）

各 `$font-configs` エントリ（または C-6-1 で確定したファミリー）について:

1. **調査**してチャットに箇条書き提示する（優先順位で自動採用しない）:
   - `@fontsource` 対応の有無（[fontsource.org](https://fontsource.org)。パッケージ名の目安は reference）
   - Google Fonts 等 CDN で使えそうか
   - 現状の `files` / `FONT_TAGS` / `assets/fonts/` の有無
2. 調査結果を踏まえ **`AskQuestion`**（ファミリーごとに分けてよい）:

| 選択肢例 | エージェントの対応 |
|----------|-------------------|
| **@fontsource でセルフホスト** | reference「@fontsource による配置」どおり配置・`files` 確定・`FONT_TAGS` は空。不要実体を削除 |
| **CDN（例: Google Fonts）** | `FONT_TAGS` を更新。該当ファミリーの **`files` を空**。セルフホスト用の旧実体があれば削除 |
| **手動でフォントファイル配置** | 配置手順を案内。`$font-configs` の `files` を設定。`FONT_TAGS` は空 |
| **デバイスフォントのみ** | `FONT_TAGS` を空または最小化。`files: ()` |
| **スキップ** | このファミリーは変更なし（画面実装時に再確認可） |

3. 承認された方式のみ実施する。手順の詳細は reference。

SCSS 変数の整合（`$base_font`、未使用フォントの `$font-configs` からの整理）は C-1 または画面実装側。本 Step は読み込みに集中する。

---

## 完了報告

最後に次を **箇条書き**で短くまとめる（Step 名・ファイル名は 1 行 1 件）:

- 実施 / スキップした Step 一覧（A / B / C）
- エージェントが変更したファイル（A-1、B-1、C-6 等）
- 手動・別スキルで残した作業（あれば）
- 推奨次手順: 画面実装（`@figma-batch-implement`（必要なら Phase 0-catalog） / `@figma-page-implement` / `@figma-coding` / `@subpage-design-implement` 等。未登録ページは各スキルが **pages ensure** する）、公開前は **`@pre-launch-check`**（OGP・Favicon・テーマカラー・管理画面・人手検証）

---

## 禁止・注意

- ユーザー確認なしにプロジェクト名・サイト表示名（`WP_SITE_TITLE`）・テーマ名を決めない（A-1）
- **Figma デザイン URL を受け取らない・促さない**（カタログ・画面実装は `@figma-batch-implement` / `@figma-page-implement`）
- 手動 Step（C-2〜C-5）で、ユーザーが「対応した」と言う前に該当ファイルを勝手に編集しない
- C-6 のみ、**読み込み方式の AskQuestion 承認後**に `FONT_TAGS` / `$font-configs` の `files` / フォント実体配置を編集してよい。サブセット化コマンドは実行しない
- B-1 で、TOP・エラー・404 以外を消す前に参照切れの影響を確認する。確信が持てない参照は削除せず確認する
- `project-page-info` の手順・PHP 編集ルールを本ファイルに複写しない
- `docker-compose.yml` の構造変更は不要（`PROJECT_NAME` 参照のため）
- プロジェクト名変更時は DB ボリュームが **別名になる** 旨を伝える
- DB パスワード・API トークン等の機密をチャットに載せない
- OGP / Favicon / `THEME_COLOR` / 管理画面スタイルは本スキルでは扱わない（`@pre-launch-check`）

## 追加リソース

- プロジェクト名・テーマ名・スタイルファイルパス・B-1 最小構成: [reference.md](reference.md)
- pages.php / ACF 等: [project-page-info/SKILL.md](../project-page-info/SKILL.md)
- 実装前の pages 登録確認: [project-page-info/pages-ensure.md](../project-page-info/pages-ensure.md)
- 複数画面実装・カタログ: [figma-batch-implement/SKILL.md](../figma-batch-implement/SKILL.md) / [catalog.md](../figma-batch-implement/catalog.md)
- トークン設定: [figma-tokens-setup/SKILL.md](../figma-tokens-setup/SKILL.md)
- SCSS 変数リセット: [reset-scss-variables/SKILL.md](../reset-scss-variables/SKILL.md)
- 公開前（meta・仕上げ含む）: [pre-launch-check/SKILL.md](../pre-launch-check/SKILL.md)
