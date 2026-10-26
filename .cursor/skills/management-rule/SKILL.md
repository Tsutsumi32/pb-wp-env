---
name: management-rule
description: >-
  Cursor 専用。Cursor のルール・プロジェクトスキルを作成・編集する。
  ルール管理、rule-management、.mdc、SKILL.md、重複整理、参照関係の更新を依頼されたときに使用する。
  .claude/skills/management-rule は使わない。
disable-model-invocation: true
---

# management-rule

Cursor 用（`.cursor/rules/` / `.cursor/skills/`）のルール・スキルを作成または編集するワークフローです。Claude Code 用（`.claude/`）とは同期しない。相手側ツリーは編集しない。

必須ルール：
- ルールを新規作成・更新する前に、必ず `.cursor/rules/rule-management.mdc` を参照してください。
- 参照後は、`rule-management` の方針（同一ツリー内の重複禁止、役割分離、再利用性、参照関係の整合、ツールツリーの独立管理）に従って作業してください。

作業対象：
- `.cursor/rules/**/*.mdc`
- `.cursor/skills/**`
- 対象外: `.claude/rules/`・`.claude/skills/`・`CLAUDE.md`（Claude Code 側が管理）

編集時の整理ルール：
- 類似した内容を追記する場合は、必ず同じセクション内に統合して記載してください。
- 新規セクション追加の前に、既存セクションへ整理して追記できないかを確認してください。
- 重複記載を避け、内容が分散しないように編集してください。
- 変更は **Cursor 側のみ**。報告時も Cursor 側パスを列挙する。

実行時の基本フロー：
1. `rule-management` を確認する
2. 既存ルール/スキルとの重複有無と追記先の妥当性を確認する
3. `.cursor/rules/` / `.cursor/skills/` に必要なファイルだけ作成・編集する
4. 関連ファイルの参照関係を必要に応じて更新する
横断トピックの正本（スキルへ長文コピーしない）：
- **カラー**（`$color-palette` → `$colors` → `get-color()`。実装から `get-color-palette()` 直参照禁止。Semantic 無し時は要素から `text` / `background` / `border` / `icon-decoration` へ当てはめ。**実装は CSS の役割と group 一致**（線→`border` 等。同色でも `text` を border 流用しない。不足は同パレット Alias で該当 group 最小追記。**例外**: Semantic 明示適用時はキー突合）。`ui` は画面実装では原則触らない）→ `.cursor/rules/project/css/scss.mdc`「カラー」＋ `figma/style.mdc` §6。一括は `@figma-tokens-setup` reference-json「SemanticColor」。Figma 実装スキルは要点と参照のみ
- **フォント設定（SCSS）**（`$font-weight-key` / `$font-configs` / `$base_font`・`$base_font_key` は Font 投入時に本文で一度決める・画面実装では再判定しない・`$text-styles` に `font` なし・直指定 `font()` は `$_weight` 必須・**サイズ／行間／文字間は `font()` で完結**（直後の `letter-spacing` 等重ね書き禁止・特別上書きのみ例外）・**`$_line` / `$_space` は mixin 換算に合わせ Figma 単位の生値**（CSS 倍率・`em` 直渡し禁止・**`$_space` は `letterSpacing.unit` 正・見た目で PIXELS 推測禁止**）・**行間 `line` は小数第3位四捨五入で第2位まで**）→ 完結・引数は `project/css/scss.mdc`「値とmixin / function」。トークンは `@figma-tokens-setup` reference-json「Font」「テキストスタイル」。使い分けは `figma/style.mdc` §4（**BP間のキー切替禁止**は同 §1・**`$_min-size` / `$_max-size` / `$_use-sh` は原則不要**は同 scss.mdc）
- **フォント読み込み**（`FONT_TAGS` / `files`。`@fontsource` 有無を調査したうえで AskQuestion。サブセットは手動・スキルから実行しない）→ `@project-env-setup` C-6 + `project-env-setup/reference.md`「C-6 フォント読み込み」。画面実装時の追加も同手順（`figma/style.mdc` §6「フォント」）
- **サンプル値除去（SCSS トークン一括設定時）** → `@figma-tokens-setup` reference-json「サンプル値の除去」（MCP 経路も同節）
- **SITE_NAME**（`config.php`・`WP_SITE_TITLE` と同値）→ `@project-env-setup` A-1 + `project-env-setup/reference.md`「SITE_NAME」。`project-page-info` は一致確認のみ
- **OGP・Favicon・テーマカラー・管理画面** → `@pre-launch-check` reference「仕上げセットアップ」。`@project-env-setup` では扱わない
- **UI 系カラー**（選択・フォーカス・スクロールバー等の `ui/*`）→ 初期設定は C-1（`@figma-tokens-setup`）。公開前の確認は `@pre-launch-check` M-1-5（**手動対応**・エージェントは編集しない）。色ルールの正本は `project/css/scss.mdc`「UI フラット変数」
- **posts.php（設定と実データの分離）** → `project/wordpress/posts.mdc`。設定・初期タームのみ。画面の投稿・タームは WP 実データ（`get_terms()` 等）。開発用投稿は `data/{post_type}/posts.dev.json`。登録値の書き方は `@project-page-info` / `php-config.md`。一覧・詳細の **0件時／noImg** は同ファイルから `php.mdc` / `image.mdc` へ参照
- **開発用サンプル投稿（posts.dev.json）** → `project-page-info/SKILL.md` Step 5-6・6-W3d + `php-config.md`「posts.dev.json」。件数・カテゴリ・画像は毎回 AskQuestion
- **margin**（`margin-top` / `margin-block` 優先、`margin-bottom` 単独禁止）→ `.cursor/rules/project/css/scss.mdc`「margin」。Figma 実装スキルは要点と参照のみ追記する
- **スケール関数**（固定値は `s()`、特に指示がない限り `sh()` は使わない）→ `.cursor/rules/project/css/scss.mdc`「値とmixin / function」。Figma 実装スキルは要点と参照のみ追記する
- **コンテナ・セクション・コンテンツ余白**（`$container-sizes` / `$section-sizes` / `$content-space`、`ly_container` / `ly_section` / **`ut_space`**）→ `project/css/scss.mdc`「コンテナ・セクション余白」（**用途**: 第一セクション間／第二・グループ間。**リスト間・padding・最小要素は対象外**。**`container/*` Variables があるときは直値**・欠落時のみ列＋padding / PC 40 フォールバック・`border-box`）＋ `figma/style.mdc` §6・`figma-rule.mdc`（**Variables 主**・任意の `SECTION(...)` / `CONTAINER(...)` は保険。**非整備（役割不明）は画面全体から算出→variables 最小追記→`ly_*`**）。**近いキー丸めは `$section-sizes` のみ**（片側・依頼明示の非整備）。**その他余白は Figma 通り**。**既存キーの値変更禁止**・**BP間は同一キー**は `figma/style.mdc` §1。一括は `@figma-tokens-setup` reference-json「Device（コンテナ）」「Device（余白）」
- **variables（実装時）** → ① Figma MCP: 既存値変更禁止・Figma にあり Code に無いキーは最小追記 OK（確認待ちなし）→ `figma/style.mdc` §1。② 下層情報起点: **既存のみ・新規追加禁止**（確認付き追加もしない）・**該当プロパティは mixin 経由**（`get-color()` / `set-effect()` / `font()`）・余白は用途限定・テキストはキーか値直指定を判断 → `project/design-subpage.mdc`「variables（実装時）」。値変更は `@figma-tokens-setup` / `@figma-tokens-sync`。`.cursor/external/` がある案件はその「この案件では」優先で①②適用外
- **セクション識別 class**（`main` 直下 `<section>` に `section_{セクション名}`。`ly_section` は **section-space Variables 優先**、無ければ任意の `SECTION(...)`、**非整備は算出＋variables 追記のうえ付与**・余白不要なら付けない）→ `figma/figma-rule.mdc`「HTML構造」＋ `project/template/naming.mdc`。ページ SCSS の `.section_*` / `.un_*` → `project/css/scss.mdc`「ページ SCSS と `section_`」
- **class 名の親子関係（HTML DOM）**（**`_` はルートの次に1段まで**。Figma のレイヤー階層を `_` で連結しない。`has_` は対象外）→ `project/template/naming.mdc`。SCSS の `&_` → `project/css/scss.mdc`「ネスト」。SCSS 骨組み → `@generate-scssfile`（テンプレートスキル内）
- **Figma 個別指定テキスト** → `figma/style.mdc` §4「個別指定テキスト」。情報起点のキー／値直指定の判断は `project/design-subpage.mdc`「variables（実装時）」
- **テキスト上下トリミング（leading-trim / text-box-trim）** → `figma/style.mdc` §4「テキスト上下トリミング」（`@include text-trimming`）
- **テキストの折り返し**（テキストに `flex-shrink: 0` 禁止・`white-space: nowrap` は原則使わない。MCP 出力も転記しない）→ `.cursor/rules/project/css/scss.mdc`「テキストの折り返し」。Figma 実装スキルは要点と参照のみ追記する
- **Figma 実装（テンプレ／スタイル）** → `figma/`（共通＋フォールバック）＋ `@figma-template-coding` / `@figma-style-coding` / `@figma-coding`。ページ全体 → `@figma-page-implement`。複数画面 → `@figma-batch-implement`（カタログは Phase 0-catalog）。トークン基盤 → `@figma-tokens-setup`（リセット必須→JSON 同期 / 何もしない）。トークン差分同期 → `@figma-tokens-sync`（JSON 鮮度ゲート→diff→pull/push）。**JSON 配置は `.cursor/figma-tokens/`**。過不足の変数化は画面実装時。**通常はデザイン通り・キーも数値も丸め禁止**（非整備の丸めはセクション余白のみ。正本: `figma/style.mdc` §1）
- **外部チーム対策** → 成果物は **`.cursor/external/`**（共有 `rules/` / `skills/` は不変）。コード規約差分 `@external-project-rules` → `project-rules-*.md`。Figma 作法メモ `@external-figma-conventions` → `figma-conventions-*.md`。確認は最後1回。実装時は「この案件では」を共有ルールより優先
- **下層ページ（情報起点）** → `.cursor/design/`（`brand.md`＝特記事項手動＋表現の方針は `Expression-status` で生成判定／Figma コンポーネント一覧 URL（手動）／components／brief／`refs/`）。未生成なら **生成して停止・報告**。入力: brand＋brief 必須。画面構成は **A** ワイヤー＋JSON／**B** MCP／**C** 仕様メモのみ可。ワイヤー見た目は直写せず brand 各節＋既存類似 UI へ寄せる（正本 `design-subpage`「ワイヤーの限界と表現の寄せ方」）。手順は `@subpage-design-implement`。正本 `project/design-subpage.mdc`「brand」「brief」
- **brand 生成** → `Expression-status: pending|ready`（ファイル有無では判定しない）。調査元は TOP＋下層。特記事項・Figma コンポーネント一覧 URL は上書き禁止。旧 `brand-extracted.md` は新規作成しない
- **ワイヤー／JSON フィールド** → 正本 `subpage-design-implement/wireframe-json.md`（`*wireframe*` があるときのみ。**`UN` は抽出対象外**・**FRAME / GROUP は階層に含む**。未実装 `design` は brand のコンポーネント一覧 URL 優先・無ければ AskQuestion）。スキルへ長文コピーしない
- **整っていないデザイン書き出し（raw-design）** → `.cursor/design/exports/`（正本 PNG・任意 `*-annotate`・任意 AI/PS JSON）。Figma MCP 無しテンプレ本線。色枠・計画 JSON・palette 直 `get-color`・JSON 由来 `font()` 値直指定。手順は `@raw-design-implement`（`exports.md` / `annotate.md` / `plan-json.md` / `tokens.md`）。補助書き出しは `scripts/export_artboard_to_json.illustrator.js` / `export_artboard_to_json.photoshop.js`。`pages/`（subpage）と混在させない
- **pages 登録（実装前 ensure）** → 正本 `project-page-info/pages-ensure.md`。**更新管理仕様**は `project-page-info/cms-frame.md`（Figma `cms` フレーム表。無ければ画面から推定し AskQuestion）。呼び出しは `@figma-page-implement` / `@figma-batch-implement`（バッチ計画に CMS 節）/ `@subpage-design-implement` / `@raw-design-implement`。初回は `@project-env-setup` B-1 でサンプル掃除のみ。手順の長文を実装スキルに複写しない
- **バッチ全自動（unattended）** → 正本 `figma-batch-implement/unattended.md`。実装キュー継続用。**`@project-env-setup` / `@pre-launch-check` は対象外**。PC 本線は interactive（AskQuestion＋ソフト停止）のまま
- **Resume paste（ソフト停止再開）** → screen 境界は `@figma-batch-implement`＋`_batch-*.md`、ページ途中は `@figma-page-implement`＋`<page-slug>.md`（誤用禁止・停止報告に `入口: batch|page`）。**残作業（pending/blocked）があるターン終了ではラベルを問わず必須・省略禁止**（同ターン継続のみ例外）。短文型・resume 時の catalog/ensure/cms 再実行禁止は各 SKILL のソフト停止節。長文をここへ複写しない
- **コンテキスト逼迫時の停止・引継ぎ（全作業）** → 使用率％は取得不可・ヒューリスティック判定。逼迫時はキリで停止＋**Resume paste（別チャット用コピペ・batch と同趣旨）必須**。**残作業ありのターン終了も同様**（正本 `cursour-allways-rules.mdc`）。**関連作業完了後は引継ぎ・計画 MD（`figma-plans/` 等）を削除**。正本 `cursour-allways-rules.mdc`「コンテキスト逼迫時の停止と引継ぎ」「`.cursor/tmp/`」。Figma は `入口: batch|page`、それ以外は `入口: general`
- **Figma 実装のコンテキスト防衛（A／B-4／B-5）** → page セクション再ブートは計画行中心（本 SKILL 連打禁止）。必須参照は条件付き。同一セクション内 template→style→JS は同ターン再読免除（正本: `@figma-coding`）。**B-4** セッション内ルール再読免除・同型 MCP 節約は `@figma-coding`「ページ実装セッション再読免除」＋ `@figma-page-implement`「同型セクション連続（MCP）」。**B-5** 巨大ルールは各 `.mdc` 冒頭の **Read map**（必要 § のみ）。MCP・突合・Step 5b・禁止事項の正本は削らない。長文をここへ複写しない
- **`.sample-code/` 参照（コンテキスト防衛）** → 有無の軽確認のみ。**既存プロジェクトコードがあれば読まない**。読むなら該当数ファイルのみ・全ツリー禁止。正本 `@coading`。Figma スキルは要点と参照のみ
- **Figma アノテーション**（カテゴリ **UI／UX／機能仕様／原稿／他要件** は指示どおり。原稿はテキスト／画像 TODO。重い UX／機能は計画で管理。JS 系は既存 feature／module／`has_` 流用優先。**コンポーネント** はカタログ転記）→ `figma/figma-rule.mdc`「アノテーション」
- **Figma コンポーネント階層**（`{分類名} {コンポーネント名}`・分類名は大文字・`TEXT` 分類・`ASSETS` は部品除外・`slot` 非 HTML 化・不要ラッパーのみ整理。**依頼明示の非整備**ではレイヤーから共通断定できなくても見出し／ボタン／ラベル／カード／下層FV／横断セクション等をコンポーネント化・**近似丸めでの統合禁止**・差は `__*` まで）→ `figma/figma-rule.mdc`「コンポーネント階層の実装」「依頼明示の非整備時のコンポーネント化」＋ `figma/interpretation.mdc`「余分なラッパーの排除」。アノテーション全般は同「アノテーション」。カテゴリ「コンポーネント」→ `components.md`
- **Figma インスタンス／メイン／バリアント（UI）**（画面はインスタンスでもメイン確認・種類分実装・**画面配置は選択中バリアント**・基本は `__*`・disabled/checked 等はセレクタ・hover は状態実装・**`sp` 等は SP 用認識**（アセット切替／コンテンツは SP デザイン）・流用時はバリアント判定＋インスタンス差分）→ `figma/figma-rule.mdc`「インスタンス・メインコンポーネント・バリアント」。SVG 側は `assets.mdc` §2（複写しない）
- **レスポンシブ**（スタイル実装時は原則対応。両デザイン＝**差分先行（B）**＋**SP もデザイン通り**（スタイル工程でフレーム再取得・項目突合。片側用基本対応禁止。**Figma 同値なら SP も同値／縮小禁止**）：解析でテンプレ影響差分→テンプレはファースト側＋DOM 差分のみ／スタイルは `$media-query-strategy` のファースト側→上書き。片側のみ＝もう一方は基本対応（**余白は原則ひと段階落とす・据え置き禁止**・例外あり・**既存トークン値は触らない**・**キー切替しない**）。**PC のみ時の SP は長いリード・説明文を左寄せ**）→ `figma/responsive.mdc`。記述は `project/css/responsive.mdc`
- **内側の線（Inside stroke）と padding**（原則 `border`・「除外する」=`strokesIncludedInLayout: false` のみ `box-shadow: inset`。`get_design_context` では判定不可→`use_figma`）→ `figma/inside-stroke.mdc`
- **ビルド・コンパイル** → `cursour-allways-rules.mdc`「ビルド・コンパイル」（`npm run dev` 前提・エントリ `@use` 手書き不要・**scss-index / ビルドはエージェント実行禁止**・未起動でも代行しない）
- **ブラウザ確認（実装後）**（原則不要。大きなロジック／依頼明示／同一修正の繰り返し／**Figma 専用スキル**。手段は `cursor-ide-browser`・Chrome DevTools MCP は原則禁止。page-implement Phase 3 はコンソール＋大差検知。figma-coding 直呼びは PHP/JS 時のコンソール＋新規セクション一通りの大差検知。**見た目の自動修正禁止**・数px無視。手順は `@figma-coding` `browser-check.md`。キャプチャ保存は Claude Code 側の `page-capture`）→ `cursour-allways-rules.mdc`「ブラウザ確認（実装後）」
- **`.cursor/tmp/`**（作業用一時・進行中の `figma-plans/` は残す・**関連作業完了後は計画 MD も削除**・確認不要）→ `cursour-allways-rules.mdc`「`.cursor/tmp/`」。アセット最終配置後は `figma/assets.mdc`「画像格納場所」・`@figma-template-coding` / `@figma-page-implement` が参照
- **画像命名（使用箇所プレフィックス・`@EXP` / `@EXP:PNG` / `@EXP:SVG`）** → `figma/assets.mdc`「画像命名規則」＋「ID・自動サフィックスの禁止」。制作側トークンは `figma/figma-rule.mdc`「特殊レイヤー命名」
- **画像書き出し** → `figma/assets.mdc`「書き出しの優先方針」（**既存最優先** → `@EXP*` あり・ファイル無し → 合図無し・既存無し。**ラスタ既存は保存寸法一致のときだけ再利用**。**書き出し直し依頼は対象の既存・前回 crop を使わず取り直す**）。形式は「出力形式の判定」。**保存寸法は表示枠×PC×2 / SP×4 で幅・高さ一致**（仮・解像度不足も拡大。等倍・中途半端な拡大禁止。§1。**テキストを含むラスタは目標未満を拡大しない・PNG**）。**crop は hash 実寸と一致する原画像のみ。斜め `imageTransform` は crop しない**（§6-1a）。**コミット用 MCP 経路**は「MCP の役割分担」（公式 asset URL は参照用・最終ファイルの正にしない）。詳細は「書き出し対象の判定」・§1・§6・無名フォールバック。**INSTANCE は選択バリアント／差し替えを正**（§6-1）。**複数 IMAGE fill**（§6-1a〜6-3）: `visible !== false` のみ下から上。各 layer に `opacity`（fill に無いときだけ 1）。`FILL` は `object-cover-center`（単位行列の `imageTransform` は渡さない）。枚数不一致（2枚以上なのに1枚）は書き出さない。SAMPLE 格子と `pixta_` はクリップ親 screenshot と突合。手順は `@figma-template-coding`「画像 crop」にも同じゲート
- **SVG・複合 PNG 書き出し** → `figma/assets.mdc` §2（**対象 nodeId** + `download_assets` `defaultFormat: "svg"`・**TEXT 含むときはアウトライン化必須**（UI「テキストをアウトライン化」／`svgOutlineText: true`）・**全バリアント書き出し＋画面 INSTANCE の選択バリアントを実装参照の正**・**親巻き込み／キャンバス背景の検知と除去**）・§3・§7。制作側境界は `figma/figma-rule.mdc`「SVG書き出し境界」
- **Figma コーディング関連レイヤー名**（既存トークン以外の `el_`/`bl_`/`ly_`・`::before`/`::after`・`z-index:` 等。妥当性判断のうえ実装）→ `figma/figma-rule.mdc`「コーディング関連のレイヤー命名」
- **`coading:none`（コーディング対象外）** → `figma/figma-rule.mdc`「特殊レイヤー命名」（互換 `none`）
- **Figma 疑似要素（装飾）** → `figma/figma-rule.mdc`「疑似要素（装飾）」（明示は `::before`/`::after` またはアノテーション。単独 `before`/`after` は使わない）
- **ACF フィールド設定**（指定フレームの動的モード・CPT ごとの AskQuestion・`acfFileds.php`）→ `project-page-info/SKILL.md` Step 5-5 + `project-page-info/php-config.md`「ACF フィールド設定」。`project-env-setup` はサンプル掃除のみ
- **JS カタログ採用**（横断 feature／module の正本は `catalog/js/`。案件へはコピーのみ・直接 import 禁止）→ `@js-catalog-adopt`。配置・既存流用の原則は `project/javascript/coading.mdc`。公開前の未使用削除は `@pre-launch-check` M-3-3
- **フォーム系 CONTACT 定数・設定整合性検証**（`pages.php` / `cf7.php` / WP-CLI 前の 6-W4）→ `project-page-info/SKILL.md` Step 4b・6-W3b・6-W4 + `php-config.md`「フォーム系固定ページ」「設定整合性検証」
- **WP-CLI 同期**（`make wp-create-pages` / `make wp-create-posts WP_CREATE_POSTS_ARGS="--non-interactive"`。pages は既存を消して再生成。posts 非対話はターム再生成＋`posts.dev.json` インポート＋テンプレ。エージェント実行・手動案内しない）→ `project-page-info/php-config.md`「WP-CLI 同期」+ SKILL Step 7。初回のみ `wp-install`
- **ブロックエディタ allowed_blocks** → 旧 `@project-env-setup` B-3 は廃止。必要なら別途依頼。`project-page-info` は supports のみ（`php-config.md`「supports とブロックエディタ」）
- **`assets_name` と CSS/JS 読込**（CPT は投稿タイプ slug で一覧・詳細が同一ファイル／フォーム系のみ `pages.php` で統一）→ `project-page-info/php-config.md`「assets_name」。セットアップスキルは要点と参照のみ追記する
- **モジュール SCSS ファイル名**（`modules/` の `bl_*` / `el_*` 等。接頭辞除き class と同じ camelCase。ケバブ禁止）→ `project/css/scss.mdc`「モジュール用ファイル名」。`@generate-scssfile` は要点と参照のみ
- **Safari / iOS WebKit（CSS・ブラウザ）**（細い線・opacity ゴースト・dvh・sticky・mask・フォーム・video・BFCache。GSAP 起因は分離）→ `frontend-base/safari-webkit.mdc`。ScrollSmoother 等 → `@gsap`（Claude 側）
- **GSAP / ScrollSmoother**（ハッシュ退避・overflow:clip・allowNestedScroll 限定・fixed portal・Flip・pin/Lenis）→ `@gsap`（`.claude/skills/gsap/SKILL.md`。Cursor 側スキルは置かない）
- **SCSS プロパティ順**（`$_this` → プロパティ設定 mixin → レイアウト→位置→…、アルファベット順禁止）→ `frontend-base/css.mdc`「プロパティ順」。Figma 実装スキルは要点と参照のみ追記する
- **SCSS コメント**（構造用見出しのみ。**Figma 値の併記禁止**）→ `frontend-base/css.mdc`「コメント付与の考え方」。Figma 実装スキルは要点と参照のみ追記する
- **HTML コメント**（閉じタグ直後のみ。開始タグコメント禁止。本文に `--` を書かない）→ `frontend-base/html.mdc`「コメント」＋「Figma MCP 実装時（必須）」。必須化は `figma/figma-rule.mdc`「PHP/HTML マークアップ」＋各 Figma スキル。長文は html.mdc に一元化
- **vnu で通る HTML**（error も warning も出さない。空属性・`script` の `type`・`dl` の中身・見出しの飛び等。セクション途中は vnu を回さない）→ `frontend-base/html.mdc`「vnu（構文）」。アクセシビリティは同「アクセシビリティ」。ページ完了時の 1 件、そのページの SCSS / JS 規約、仮置き一覧、フォームがあるページの契約一覧、PC/SP 両方が依頼にあるときの片側未着手は `@figma-page-implement` `page-check.md`（規約の表は `@pre-launch-check` reference「M-6」。仮置きの検索語は同「M-4」。フォーム契約は `form-implementation.mdc`。片側のみは次画面に進まない）。サイト全体は `@pre-launch-check` の M-4 / M-6 / M-7 と HTML 構文 Step
- **単一子要素のラッパー**（テキスト1要素のみを包む `div` 禁止）→ `frontend-base/html.mdc`「単一子要素のラッパー」。画像は `project/template/image.mdc`
- **画像ラッパー・画像制御用 `el_*`**（レイアウト用ラッパー > `el_img*` > `render_img()`）→ `project/template/image.mdc` + `figma/figma-rule.mdc`「画像制御用 element」。**SVG** → `image.mdc`「SVG」。**動的未設定画像は `noImg.jpg`** → 同「動的コンテンツの画像フォールバック」
- **外部リンク（a タグ）** → `frontend-base/html.mdc`「リンク（a タグ）」
- **PHP 末尾カンマ**（関数・呼び出し・`use` は禁止、配列は可。PHP 7 互換）→ `project/template/php.mdc`「末尾カンマ（PHP 7 互換）」
- **PHP ロジックのコメント** → `project/template/php.mdc`「コメント」。HTML コメントは html.mdc に分離
- **固定テキストの記述** → `project/template/php.mdc`「固定テキストの記述」
- **会社情報・共通定数（consts.php）**（会社名・電話・FAX・住所・メール等。横断再利用。`SITE_NAME` は `config.php`）→ `project/template/php.mdc`「会社情報・共通定数」。Figma テンプレスキルは要点と参照のみ
- **URL・アセットパス（タグ直書き）** → `project/template/php.mdc`「URL・アセットパスの記述」（ファイル上部の `$xxxUrl` 切り出し禁止）
- **PHPテンプレート実装** → `project/template/php.mdc`「テンプレート実装」「エスケープと HTML マークアップ」
- **`<?php` の改行**（要素の中身・制御構文は独立行。**属性値は `="` の直後に改行しない**。長い式は手前で変数化）→ `project/template/php.mdc`「`<?php` タグ」
- **PHP インデント**（混在テンプレで列 0 に落とさない・実装直後に確認／修正）→ `project/template/php.mdc`「インデント」。呼び出しは `@figma-template-coding` Step 7・`@figma-page-implement` セクション完了
- **テキスト出力のマークアップ** → `project/template/php.mdc`「テキスト出力のマークアップ」「改行の表現」（**`<br>` 直後のソース改行禁止**を含む）
- **原稿投入** → `@manuscript-injection`（見せる/読ませる・PC/SP の `<br>`・WP 設定連動）。改行判断・`<br>` 記法の正本は `project/template/php.mdc`「改行の表現」、原稿アノテーションは `figma/figma-rule.mdc`「アノテーション」
- **画面キャプチャ・原稿/画像シート作成** → Claude Code 側（`.claude/skills/page-capture` / `manuscript-sheet` / `image-sheet`）。Cursor 側にスキルは無い。出力の `_docs/capture/`（`capture-{slug}.png` + `README.md`）・`_docs/sheets/`（原稿シート_テンプレート.xlsx・画像シート_テンプレート.xlsx）は両ツール共通の参照先
- **Figma テキスト要素** → `figma/figma-rule.mdc`「テキスト要素」+ `project/template/php.mdc`「改行の表現」
- **リスト的な繰り返しコンテンツ** → `project/template/php.mdc`「リスト的な繰り返しコンテンツ」
- **動的コンテンツの0件時**（一覧・CPT 等。デザイン未提供でも実装。コメントアウト可）→ `project/template/php.mdc`「動的コンテンツ（0件時）」
- **動的画像の noImg フォールバック**（一覧・詳細。データに画像が無いとき `noImg.jpg`。静的仮画像のコピー手順とは別）→ `project/template/image.mdc`「動的コンテンツの画像フォールバック」
- **仮テキスト TODO（記載位置）** → `figma/figma-rule.mdc`「仮テキスト」（`(仮)` は先頭・末尾／役割説明／反復ダミー／動的未実装。**固定＝出力直前／配列＝定義側**。**原稿アノテーション**は同「アノテーション」）。テンプレ確認は `@figma-template-coding` Step 5／7
- **差し替え画像 TODO** → `figma/assets.mdc`「差し替えが必要な画像」（**主軸は sample・ウォーターマーク**・疑わしいも含む。きれいなストックで WM 無しは内容面不要。**解像度不足**＝拡大前が目標（枠×PC×2/SP×4）未満のラスタは `TODO：画像差し替え（解像度不足）`・拡大保存は従来どおり。SVG・既存のみで元サイズ不明は解像度 TODO なし。画像内「仮」は対象外。既存優先時も sample／WM は目視。**記載位置は固定＝参照直前／配列＝定義側**。**原稿アノテーション**は `figma-rule.mdc`「アノテーション」）。情報起点のプレースホルダ配置は `design-subpage.mdc`「画像（実装時）」。テンプレ工程の確認は `@figma-template-coding` Step 5／7
- **情報起点の sample 画像** → 配置箇所（参照）ごとに別名コピー（同一パス使い回し禁止・`common_*` 意図的共有のみ。`sample.*` 直参照禁止）。**jpg/png はスタイル後に表示領域のアスペクト比で crop**（`object-cover-center`・Docker `frontend`・`sourcePath`）。`svg` 対象外。正本 `project/design-subpage.mdc`「画像（実装時）」。実行環境は `figma/assets.mdc` §6-0
- **PHP コンポーネント化**（**`bl_*` は基本 `modules/blocks/` に別ファイル**、`el_*` は原則直書き・横断/複雑時のみ `modules/elements/`、機能部品は `modules/` 直下可、`un_*` は原則直書き・複雑時のみ `includes/pages/<page-slug>/`。WP は `get_template_part` + `$args`）→ `project/template/php.mdc`「コンポーネント化」。切り出し時は `.cursor/design/components.md` 追記（`design-subpage.mdc`「components カタログ」）。Figma 実装スキルは要点と参照のみ追記する
- **部品の位置制御**（`modules/` の `el_*` / `bl_*` に配置用 `position: absolute` 等を書かない。`pages/` の `un_*` または `bl_*` ラッパーで制御）→ `project/css/scss.mdc`「部品の位置制御」。Figma 実装スキルは要点と参照のみ追記する
- **aspect-ratio**（装飾・図形は `width`/`height` 両方禁止・一方 + `aspect-ratio`。画像は枠でトリミングする箇所だけ。静的な書き出し画像は内在比率。`object-fit: cover` は枠固定時のみ）→ `project/css/scss.mdc`「aspect-ratio」。Figma 実装スキルは要点と参照のみ追記する
- **data 属性**（JS 用 `data-*` / CSS 用 `data-css-*` の分離。DOM 識別は data-* のみ — class / id セレクタ禁止）→ `frontend-base/html.mdc`「data属性」。JS 命名は `project/javascript/naming.mdc`、DOM 参照は `project/javascript/coading.mdc`「DOM参照」。SCSS セレクタは `project/css/scss.mdc`「data-css 属性」。Figma 実装スキルは要点と参照のみ追記する
- **JavaScript 配置**（`features/` / `modules/` の横断再利用、`features/project` / `modules/project` のプロジェクト内共通、画面固有は `pages/*.js`。**全画面共通の初期化は `initProject.js`**・`initCommon` は横断の大元で案件では触らない）→ `project/javascript/coading.mdc`「JavaScriptの配置判断」。`project/structure.mdc` はディレクトリ一覧のみ
- **JS 既存流用**（インタラクション／プラグイン実装前に feature・module・`has_`・`animations/` を確認。Swiper 初期化・scrollObserver＋`has_observer_*` 等。同等の新規実装禁止）→ `project/javascript/coading.mdc`「既存の流用」。`@figma-js-coding` は要点と参照のみ
- **Swiper overflow**（有効時に `.swiper { overflow: visible }` を付けない・peek は親ラッパー等で実現）→ `project/javascript/swiper.mdc`「overflow」。Figma 実装スキルは要点と参照のみ追記する
- **ページ用 JS 構成**（機能単位のグループ化・定数→変数→メソッド→初期化・ライフサイクル末尾の `createPage`）→ `project/javascript/coading.mdc`「Pageの実装」。コメント階層・JSDoc は `frontend-base/javascript.mdc`、雛形は `<theme-root>/src/js/_template.js`
- **公開前確認**（meta・UI 系カラー・サイトマップ・WP 固有・不要コード（`data/` 含む）・仮／画像／href・未実装の一括棚卸し・誤字脱字・**コーディング規約（M-6。基本は実施。アクセシビリティと vnu 構文を含む。調査・報告のあと修正）**・**HTML 構文（vnu。基本は実施。`make vnu-pages`。PHP の静的 HTML は `make vnu-html`）**・人手の表示／動作確認。**対象外**: htaccess・問い合わせ宛先棚卸し・管理 URL／アカウント。実装直後のセルフチェックは `@figma-page-implement` Phase 3（コンソール＋大差＋そのページの規約確認）／`@figma-coding` Step 4。大差は報告のみ。微差・人手の見た目は `@pre-launch-check`）→ `@pre-launch-check`。環境初期（A/B/C）は `@project-env-setup`
- **WordPress 判定・フロントルート・スキル実行順**（環境→実装→公開前）→ `project-env-setup/reference.md`「WordPress 判定」「フロントルート」「スキル実行順」。`pre-launch-check` は参照のみ（複写しない）

ユーザー確認が中心のスキル（例: `project-page-info`・`project-env-setup`・`pre-launch-check`）を編集するときは、手順の詳細は **当該スキル内** に書く。ユーザー確認の共通パターン（**AskQuestion 優先**・一覧提示 → **推定値・現状値を選択肢に含める** → 選択で確定・追加入力は「その他」のみ）は [project-page-info/SKILL.md](../project-page-info/SKILL.md) の「進め方（AskQuestion 優先）」を正本とし、他スキルへ長文コピーしない。
