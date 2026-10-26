---
name: project-page-info
description: >-
  ページ情報（固定ページ・meta・noindex。WordPress ではカスタム投稿・ACF・フォーム系定数も含む）を
  対話確認のうえ設定ファイルへ反映する。固定ページは実装前 pages ensure／追記。
  CPT・ACF・PHP 更新可能コンテンツは指定の一覧・詳細フレーム（動的モード）。
  全画面一括は非推奨。WP では CPT 設定時に posts.dev.json も作り、create-pages/posts をエージェントが実行する。
  project-page-info・ページ情報設定・pages.php・posts.php・ACF 設定の依頼時に使用する。
disable-model-invocation: true
---

# プロジェクト ページ情報設定

画面・コンテンツの **ページ情報**（固定ページ、description / noindex。WordPress では **カスタム投稿・ACF・フォーム系** も含む）をユーザー確認後に設定ファイルへ反映する。

現状の編集対象は主に PHP 設定（`pages.php` 等）。将来ランタイムが変わっても、本スキルの役割は「ページ情報の設定」とする。

**全画面の Figma 一括探索は原則行わない**（読み込み・会話が重い）。固定ページは ensure、動的は指定フレーム。

## 実行モード（開始時に確定）

| モード | いつ | 入力 | 主な Step |
|--------|------|------|-----------|
| **固定ページ** | pages ensure・下層追加・フォーム画面の登録 | 対象 slug ＋あれば Figma URL（フレーム単位で可） | 1–2（対象のみ）→ 4b（フォーム時）→ 5b → 6 → 6-W4 → **WP-CLI 同期** |
| **動的コンテンツ** | CPT/ACF（WP）または一覧＋詳細の更新可能コンテンツ（PHP） | **cms フレーム（推奨）**＋一覧・詳細の画面フレーム URL | cms 解釈 → 4–5 → 5b → 6 → 6-W4 → **WP-CLI 同期** |
| **全画面一括（非推奨）** | ユーザーが明示したときのみ | 親キャンバス等 | 旧フロー全体。通常は使わない |

ensure からの呼び出しはモードを明示する（固定 or 動的）。曖昧なら AskQuestion で選ぶ（**unattended** なら [figma-batch-implement/unattended.md](../figma-batch-implement/unattended.md) の推定）。

## 前提

- Figma から候補を取る場合の取得は **Figma MCP**（`user-figma-developer-mcp` / `get_figma_data`）のみ。
- クライアントごとに Figma 構造が異なる。**候補提示 → ユーザー確認 → 設定ファイル編集**（unattended は確認を推定確定に置き換え）。
- 編集前に必ず対象ファイルを読み、既存の命名・配列構造・コメントスタイルに合わせる。
- Figma 無しの追記は [pages-ensure.md](pages-ensure.md) ブランチ B（軽量登録）。

## 進め方（AskQuestion 優先）

**既定は interactive。** 親バッチ／依頼が `Interaction: unattended` のときは本節の AskQuestion を行わず、[unattended.md](../figma-batch-implement/unattended.md) の推定優先順で確定する（採用推定を Progress に残す）。単独の対話依頼では AskQuestion 必須。

各 Step で **チャット上の一覧提示**（現状値・候補）と **`AskQuestion` による選択** を組み合わせ、ユーザーが確定するまで設定ファイルを編集しない。**通常チャットでの確認は行わない。**（unattended 例外は上記）

| タイミング | エージェントが行うこと | ユーザーの操作 |
|------------|------------------------|----------------|
| 候補・提案の提示 | 表形式または箇条書きで候補・description 案・noindex 案を示す | 内容を読む |
| 確認 | **`AskQuestion` で選択肢を出す**（複数選択可の Step は `allow_multiple: true`）。**推定値・現状値は選択肢に含める**。末尾に **スキップ**（現状維持と同等のとき）と **その他（続けてチャットで指定）** を置く | **選択するだけで確定** |
| 追加入力 | **「その他」選択時のみ** チャットで値を受け取る。推定値が選べる Step では「変更する → 入力」を必須にしない | 必要なら追記 |
| 補足・修正 | 選択結果を要約し、次 Step に進む | — |
| 設定反映 | **直前の Step で承認された内容のみ** 設定ファイルを編集 | — |

### 推定値を選択肢に含める（必須）

設定値に **推定できる候補** がある Step では、次を守る。

1. **AskQuestion の前**に、チャットで **現状値** と **推定値（根拠 1 行）** を箇条書きまたは表で示す。
2. **AskQuestion の選択肢**に、推定値・現状値を **そのまま選べるラベル** で載せる（例: `makino-d-co-jp を採用（推定）` / `sample-hp を維持（現状）` / `秋葉工業株式会社 を採用（推定）` / `description 案を一括採用`）。
3. **2 段階確認を避ける** — 「変更しますか？」→ チャット入力、の順序は **推定値が無い場合のみ** 使う。推定値がある場合は **1 回の AskQuestion で値を確定** させる。
4. 推定が複数ある場合は **有力な候補を選択肢に並べる**（通常 1〜3 件）。残りは「その他」で受け取る。
5. **スキップ** は現状維持と同義の Step では `現状維持: {値}` を先頭に置き、スキップラベルは省略してよい。

運用ルール:

- 1 回の `AskQuestion` は **1 テーマ**（例: 画面採用 / description 承認 / `has_archive`）にまとめる。別テーマは別ラウンドに分ける。
- ユーザーが先にチャットで直接回答した場合のみ、その内容を確定値として扱い、同内容の `AskQuestion` は省略してよい。
- 自動確定しない項目: 採用画面、動的コンテンツ、description、noindex、URL、**`pages.php` の `assets_name`（フォーム系・エラー系）**、`has_archive`、**フォーム系 CONTACT 定数**、**ACF フィールド（label / type / slug / thumbnail）**、**`posts.dev.json` の作成方針（件数・カテゴリ配分・画像・文言）**（**自動確定 ≠ 推定値を選択肢に載せない**）。CPT の `posts.php` `assets_name` は仕組み上省略可（[php-config.md](php-config.md)「assets_name」参照）。
- **`SITE_NAME`** は `@project-env-setup` A-1 で設定済み。本スキルでは再確認しない。
- **`pages.php` の既存サンプル（`SAMPLE1` 等）** はユーザー確認なしで削除する。

## 環境判定（Step 3）

| 環境 | 判定条件 | 設定パス |
|------|----------|----------|
| **WordPress** | `resources/wp-dir/` が存在し、`.env` または `.env.example` に `WP_THEME_NAME` がある | `resources/wp-dir/wp-content/themes/{WP_THEME_NAME}/inc/config/` |
| **PHP（非 WP）** | `resources/htdocs/includes/config/pages.php` が存在し、WordPress 条件を満たさない | `resources/htdocs/includes/config/` |

判定後は **該当環境の手順のみ** 実行する。非対応環境（どちらも該当しない）なら候補一覧の報告のみで終了。

---

## SITE_NAME

`config.php` の `SITE_NAME` は **`@project-env-setup` A-1** で `WP_SITE_TITLE` と同値に設定済みとする。本スキルでは **AskQuestion しない**。Step 6 では A-1 確定値と一致しているか確認するのみ。未設定・不一致時は A-1 を先に実施するよう案内する。

記載の目安は [php-config.md](php-config.md)「SITE_NAME」を参照。

## 入力 URL

| 渡し方 | 扱い |
|--------|------|
| **親キャンバス／ページ候補が並ぶ親**（推奨） | 探索のルート。SECTION → `design` → `pc-*` 等が効きやすい |
| **実装準備できた複数のフレーム URL**（`pc-*` 等） | 各フレームを候補として列挙してよい。親 SECTION からの title 推定は弱くなりやすい → Step 2 で補う |
| ファイル全体（node なし） | 巨大化しやすい。避け、親またはフレームを渡す |

実装スキルからの **pages ensure（追記）** では、対象の親または複数フレームだけを渡す。手順の正本は [pages-ensure.md](pages-ensure.md)。

## ワークフロー

```
- [ ] Step 0: 実行モード確定（固定ページ / 動的コンテンツ / 非推奨一括）
- [ ] Step 1: 候補抽出（固定: 対象のみ。動的: 指定フレームのみ。一括以外で親キャンバス全探索しない）
- [ ] Step 2: 候補一覧を提示し、AskQuestion で確認（追記が既定）
- [ ] Step 3: WordPress / PHP 環境を判定
- [ ] Step 4: 動的モードのみ — 動的グループ確定（指定フレーム前提）
- [ ] Step 4b: フォーム系固定ページの定数・連携先（WordPress・該当時）
- [ ] Step 5: 動的モード — CPT ごと（WP）または一覧+詳細（PHP）の対話。ACF 時は 5-5 必須。WP の CPT は 5-6（posts.dev.json 方針）必須
- [ ] Step 5b: description・noindex（対象画面のみ）
- [ ] Step 6: 承認内容どおり PHP と `posts.dev.json` を編集
- [ ] Step 6-W4: 設定整合性検証（必須。合格まで WP-CLI 同期しない）
- [ ] Step 7: WP-CLI 同期をエージェントが実行（案内のみにしない）＋サマリー
```

---

## Step 1–2: Figma 抽出・確認

[figma-discovery.md](figma-discovery.md) に従う。**モードにより範囲を制限する。**

| モード | 抽出範囲 |
|--------|----------|
| **固定ページ** | ensure 対象 slug に対応するフレーム／ノードのみ。無ければ軽量登録（[pages-ensure.md](pages-ensure.md) B） |
| **動的コンテンツ** | ユーザー／バッチ計画の **cms フレーム**（[cms-frame.md](cms-frame.md)）を仕様正本に。画面は一覧・詳細 URL のみ。cms が無ければ同ドキュメントの推定＋AskQuestion |
| **全画面一括（非推奨）** | 親キャンバス等から候補列挙（明示時のみ） |

各候補に `title`, `node_id`, `design_frame`, `confidence`, `reason` を付与。

**ユーザー確定前に PHP を編集しない。** Step 2 では採用フレーム・`pages.php` / `posts.php` の **追記**（既定）を `AskQuestion` で取る。全置換はユーザー明示時のみ。

- **`@project-env-setup` B-1** はサンプル掃除のみ（本スキルの一括呼び出しはしない）
- **実装前 ensure・下層追加**: 既定は **追記**

### 確定後の分類

| 分類 | WordPress | PHP |
|------|-----------|-----|
| 固定ページ | `pages.php` | `pages.php` |
| 一覧 + 詳細（動的） | `posts.php` + `acfFileds.php` | `pages.php`（一覧 + `{id}` 詳細の2エントリ） |
| 詳細のみ | `posts.php` の CPT に紐づく | `pages.php` の `{id}` ルート |
| 採用しない | 反映しない | 反映しない |

---

## Step 4–5: 動的コンテンツ選択・対話

**動的コンテンツモードで実施。** 固定ページモードでは Step 4–5 をスキップ（フォームなら 4b のみ）。

Step 4: 指定フレームに基づき、一覧 + 詳細（または詳細のみ）として扱うグループをユーザーが確認。親キャンバスから広く選ばせない。

### Step 4b: フォーム系固定ページ（WordPress のみ）

Step 2 で **入力 / 確認 / 完了** のフォーム系画面を採用した場合、**Step 5 の前に必ず実施**する。詳細は [php-config.md](php-config.md)「フォーム系固定ページ（CONTACT 定数）」を正本とする。

1. チャットで3画面を表提示する（Figma の **title 推定** | **定数（固定）** | **slug（固定）**）。

   | 画面 | 定数 | slug | title（推定・案件文言可） |
   |------|------|------|---------------------------|
   | 入力 | `CONTACT` | `contact` | （例: 採用エントリー・お問い合わせ） |
   | 確認 | `CONTACT_CONFIRM` | `contact-confirm` | 入力内容確認 |
   | 完了 | `CONTACT_THANKS` | `thanks` | 送信完了 |

2. **`AskQuestion`** で確定する。
   - `CONTACT 定数セットを採用（推定 title 込み）`
   - `定数は CONTACT 系のまま、title のみその他で修正`
   - フォーム系を採用しない（Step 2 見直し）
   - その他

**定数名は `CONTACT` / `CONTACT_CONFIRM` / `CONTACT_THANKS` に統一する。** `RECRUIT_ENTRY`・`ENTRY`・`CONTACT_COMPLETE` など別名定数は **作らない**（表示タイトルだけ案件文言にしてよい）。

3. `assets_name` は Step 5b で `'contact'` を提案する（フォーム系3画面で同一）。

4. Step 6 で `pages.php` 反映後、**6-W3b** で `cf7.php`・`assets-plugins.php` 等の `Page::` 参照を同期する。

### WordPress（Step 5）

Step 4 で確定した **CPT ごとに 1 ラウンドずつ** 対話する。複数 CPT の設定を **1 回の `AskQuestion` にまとめない**。

#### 進め方（CPT 単位）

1. 対象 CPT 一覧をチャットで箇条書き提示する（例: `works-posts` / `members-posts` / `requirements-posts`）
2. **先頭 CPT から順に** 以下 5-1 〜 5-6 を実施する。1 CPT の 5-1〜5-6 が完了してから次 CPT へ
3. 全 CPT 完了後に Step 5b へ

#### 5-1: 基本（スラッグ・ラベル・`has_archive`）

- 投稿タイプスラッグ・ラベル（推定値を選択肢に載せる）
- **`has_archive`** — 下記「一覧ページ（has_archive）」参照。CPT ごとに **`AskQuestion`**

#### 5-2: アーカイブクエリ（`has_archive: true` のみ）

- `archive_query.posts_per_page` 等（推定値を選択肢に載せる）

#### 5-3: タクソノミー

- **`AskQuestion`**: タクソノミーを使うか（**この CPT のみ**）
  - 使う（続けて 5-3b で slug・タームを確認）
  - 使わない
  - その他
- 5-3b（使う場合）: タクソノミースラッグ・各ターム（slug / label / order）を **`AskQuestion`** または推定値選択肢で確定
- **`category_settings.noindex`**: 書くときは **基本 `true`**（[php-config.md](php-config.md)「noindex」）。原則確認不要。ターム一覧を検索に載せたい場合だけ AskQuestion して `false`

#### 5-4: ACF・エディタ

- **`AskQuestion`**: ACF を使うか / ブロックエディタを使うか（**この CPT のみ**）
  - ACF のみ（推定）
  - ブロックエディタ
  - 両方使わない
  - その他

**5-4 で ACF のみ（または ACF を主とする構成）を選んだ場合、5-5 は必須。** `acfFileds.php` の定義が完了するまで次 CPT へ進まない。

#### 5-5: ACF フィールド（ACF 利用時 **必須**）

[php-config.md](php-config.md) の「ACF フィールド設定」を正本とする。当該 CPT ごとに **5-5a → 5-5b → 5-5c** の順で `AskQuestion` する（1 ラウンドに複数テーマをまとめない）。

##### 5-5a: フィールド候補の提示と採用

1. Figma の **詳細フレーム・一覧カード** から表示要素を読み取り、当該 CPT 向け候補を **表** で提示する。

   | 候補 slug（推定） | label（推定） | type（推定） | 根拠（1行） |

2. Step 5-3 でタクソノミーを使う場合は、候補に **カテゴリ（taxonomy）** を含める。
3. 既存 `acfFileds.php` に当該 CPT の定義がある場合は **現状フィールド** も表に併記する。
4. **`AskQuestion`（`allow_multiple: true`）** で採用フィールドを確定する。
   - 各推定候補を個別選択肢に載せる（例: `サムネイル画像（image・推定）`）
   - [php-config.md](php-config.md)「ACF フィールド候補」の **汎用候補**（デザインに無くてもよく使うもの）を必要に応じて追加
   - `推定セットを一括採用`
   - `その他（続けてチャットでフィールドを追加）`

**1 件も選ばれない場合は再質問。** スキップして次 CPT へ進まない。

##### 5-5b: label・type・slug の確定

5-5a で採用した **各フィールド** について、チャットで確定案を表提示する。

| 採用 | slug（`{prefix}` 付き） | label | type |

- **`AskQuestion`**:
  - `表の案を一括採用`
  - フィールドごとの修正が必要なら `その他` → チャットで slug / label / type を指定
- type は [php-config.md](php-config.md) の **ACF type 一覧** から選ぶ（選択肢に主要 type を載せる）。
- slug は `{PREFIX}{key}`（例: `works_image`）。`PREFIX` は 5-5c で確定するが、推定値を表に先出しする。

taxonomy フィールドを含む場合は `taxonomy` / `field_type` / `save_terms` / `load_terms` も Step 5-3 の承認内容に合わせて表に含め、一括採用または `その他` で確定する。

##### 5-5c: プレフィックス・サムネイル

1. **ACF プレフィックス** — 投稿タイプ slug から推定（例: `works_`）。**`AskQuestion`** で確定。
2. **サムネイル** — `type: image` のフィールドがある場合、`acf_settings['thumbnail']` に使う slug（**prefix なし**、例: `works_image`）を **`AskQuestion`** で選ぶ。image フィールドが無い場合は空文字。

##### 5-5 完了条件

- 採用フィールドが 1 件以上
- 各フィールドの slug / label / type が確定
- `PREFIX` と `thumbnail`（該当時）が確定
- Step 6-W3 で `acfFileds.php` にそのまま書ける状態

5-4 でブロックエディタのみ / 両方使わないを選んだ CPT は 5-5 をスキップし、`acfFileds.php` への追記も行わない。**5-6 は ACF の有無にかかわらず実施する。**

#### 5-6: 開発用サンプルデータ（`posts.dev.json`）

WordPress の **すべての CPT** で実施する（5-5 スキップ時も）。PHP 環境では行わない。

`make wp-create-posts` は対話で prod/dev・CPT・投稿削除・カテゴリ再作成・（dev のみ）テンプレを確認し、JSON/CSV をインポートする。非対話（`--non-interactive` / `wp-install`）は旧動作相当（dev・全 CPT・削除・ターム再作成・テンプレ）。データの正本は **`data/{post_type}/posts.dev.json`**（開発時）。**CSV は作らない。**

件数・カテゴリ配分・画像・文言は **その都度 `AskQuestion`** する。自動算出・自動確定しない。正本: [php-config.md](php-config.md)「posts.dev.json」。

AskQuestion の前に、チャットで当該 CPT の slug・ターム一覧・ACF フィールド（採用済みなら slug / type）を箇条書きする。

| ラウンド | テーマ | 選択肢の目安（推定は載せてよい。選ばれるまで作らない） |
|----------|--------|------------------------------------------------------|
| **5-6a** | 件数 | 推定（例: タームなし 5 件 / タームありなら各ターム 3 件）＋ **`その他（チャットで件数を指定）`** |
| **5-6b** | カテゴリ配分 | 5-3 でタクソノミーありのときのみ。均等 / 特定ターム多め（チャット） / その他。タクソノミーなしならスキップ |
| **5-6c** | 画像 | 共通サンプル（`../sample-img/sample-thumb.jpg`） / 画像なし / 投稿ごとにパスをチャットで指定 / その他 |
| **5-6d** | タイトル・本文・ACF 値 | プレースホルダ連番 / チャットで文言・フィールド値を指定 / その他 |

- 1 ラウンドに複数テーマをまとめない。
- 「その他」またはチャット指定を選んだら、ユーザーの指示を待ってから次ラウンドへ。
- unattended のときは AskQuestion せず、上表の推定（件数・均等・共通サンプル・プレースホルダ連番）を採用し Progress に残す。

##### 5-6 完了条件

- 件数（と、該当時はターム配分）が確定
- 画像方針が確定
- 文言・ACF 値の方針が確定
- Step 6-W3d で `posts.dev.json` を書ける状態

#### 一覧ページ（has_archive）

Figma に一覧フレームがある場合でも **自動確定しない**。CPT ごとに **`AskQuestion`** で確認する。

| 選択 | `has_archive` | 意味 |
|------|---------------|------|
| 一覧ページを作る | `true` | `archive-{post-type}.php` 相当のアーカイブ URL を有効化。`wp-create-posts` のページ生成対象 |
| 詳細のみ（一覧なし） | `false` | single のみ。アーカイブ URL なし |
| その他（続けてチャットで指定） | ユーザー指示に従う | 例: 固定ページで一覧を作る等 |

- Step 4 で「一覧 + 詳細」として選ばれた CPT は **提案値 `true`** と根拠（一覧フレーム名）をチャットで示し、`AskQuestion` の選択肢に **`一覧ページを作る（推定: true）`** を載せる。
- 「詳細のみ」として Step 4 に含めた CPT は **提案値 `false`**。選択肢に **`詳細のみ（推定: false）`** を載せる。
- **`has_archive: false`** の CPT は Step 5b の description 対象から **一覧側を除外**（single 用 SEO は別タスク）。
- Step 6-W2 で `post_type_settings['has_archive']` に承認値を反映する。

### PHP（Step 5）

**一覧 + 詳細グループごと**に以下を確認:

- ページ ID（定数値）: 一覧用・詳細用（例: `works` / `works-detail`）
- URL パス: 一覧（例: `/works`）、詳細テンプレ（例: `/works/{id}`）
- 一覧の `assets_name`（詳細と **同一** に統一）
- JSON データストアの要否（`includes/media/{slug}/` 等）は **別作業** として必要な旨を伝える

ACF / WP-CLI / `posts.php` は **PHP 環境では使わない**。

---

## Step 5b: description・noindex

確定した **全画面**（固定ページ + 一覧。`ERROR` / `NOT_FOUND` 含む）について実施。**PHP 反映前にユーザー確認必須。**

### description

1. 各デザインフレームの `node_id` で Figma データを参照し、[figma-discovery.md](figma-discovery.md) で **画面上部のテキスト**を抽出。
2. 抽出文・ページタイトル・サイト/会社名から **約180文字**（160〜200 文字）で生成。
3. チャットで **画面名 | 文字数 | description 案** の一覧を提示。
4. **`AskQuestion` で承認** — `description 案を一括採用` を選択肢に含める。修正が必要な画面だけ直す場合は `その他` → チャット。
5. **`assets_name`（WordPress）** — [php-config.md](php-config.md)「assets_name」に従い、**`pages.php` のフォーム系・エラー系のみ** `AskQuestion` で確認する。CPT（`posts.php`）は投稿タイプ slug と dist を揃えるなら **設定不要**（例外: slug と dist 名を変えたいときのみ確認）。

詳細: [php-config.md](php-config.md#descriptionmeta-ディスクリプション)

### noindex

1. 全画面について **提案値**（`true` / `false`）を一覧提示。
2. **`AskQuestion` で必ずユーザー確認**。自動確定しない。

| 画面の種類 | 提案 noindex |
|------------|--------------|
| お問い合わせ・エントリーの **確認** | `true` |
| お問い合わせ・エントリーの **完了** / サンクス | `true` |
| `ERROR`, `NOT_FOUND` | `true` |
| TOP・会社情報・サービス紹介・一覧ページ等 | `false` |
| プライバシーポリシー | 案件による（`false` 推奨しつつ確認） |
| **CPT タクソノミー（`category_settings.noindex`）** | **`true`（基本。原則確認不要）** |

PHP 環境の動的詳細（`{id}` ルート）は `title` / `description` を空にし、実行時に `Page::setSeoOverride()` する想定。**Step 5b では一覧側のみ** description を生成・確認する。

WordPress の `category_settings.noindex` は Step 5-3 連動。詳細は [php-config.md](php-config.md)「noindex」。

---

## Step 6: PHP 編集

**`_docs/projectInformation/` は使わない。** 開発用サンプル投稿は `data/{post_type}/posts.dev.json` を作成する（CSV は作らない）。

環境ごとの詳細: [php-config.md](php-config.md)

### WordPress

#### 6-W1. `inc/config/pages.php`

1. クラス先頭に **定数**（`public const SLUG = 'slug';`）を追加。
2. `protected static $pages` にエントリを追加。キーは定数（`self::TOP` 形式）。
3. 既存サンプル（`SAMPLE1` 等）は **確認せず削除** する。
4. **残す**: `ERROR`, `NOT_FOUND`。
5. `TOP` の `title` は「ホーム」、`slug` は `top`。
6. `parent` / `breadcrumbs` は既存ファイルの書き方に合わせる。
7. `description` / `noindex` / `assets_name` は Step 5b 承認内容どおり。
8. フォーム系（Step 4b）: `CONTACT` / `CONTACT_CONFIRM` / `CONTACT_THANKS` と slug `contact` / `contact-confirm` / `thanks` を必ず定義。確認・完了は `parent => self::CONTACT`。

#### 6-W2. `inc/config/posts.php`

CPT 定義を追加。`description` / `noindex`（CPT 本体）を Step 5b どおり。`post_type_settings['has_archive']` は Step 5 で承認した値どおり。

タクソノミーありのとき `category_settings` に **`'noindex' => true` を基本で書く**（[php-config.md](php-config.md)「noindex」）。`false` は Step 5-3 で index すると決めたときのみ。

**`assets_name` は原則省略（キーごと書かないか `null`）** — アーカイブ・single は `get_post_type()` で同一 slug となり、同じ dist を自動読込する（[php-config.md](php-config.md)「WordPress の読み込みの仕組み」）。dist 名だけ slug と変えたい CPT のみ Step 5b で承認した値を書く。

#### 6-W3. `inc/config/plugins/acf/acfFileds.php`

**Step 5-5 で承認した CPT のみ**追記。**`init()` のロジック自体は変更しない。**

1. クラス定数: `{KEY}_ACF = Post::{CPT定数}` / `{KEY}_ACF_PREFIX = '{prefix}'`
2. `self::$acf_fields` に Step 5-5b で確定したフィールド配列（**`sample` キーは書かない**）
3. `self::$acf_settings` にグループ定義（`slug` / `label` / `post_type` / `items` / `thumbnail`）
4. 詳細・記載例: [php-config.md](php-config.md)「acfFileds.php」

#### 6-W3d. `data/{post_type}/posts.dev.json`（WordPress・CPT ごと **必須**）

Step 5-6 で承認した方針どおり、**CSV ではなく JSON** を書く。配置: `<theme-root>/data/{post_type}/posts.dev.json`。形式の正本: [php-config.md](php-config.md)「posts.dev.json」。

1. ディレクトリが無ければ作成する。
2. `_external_id` / `post_title` / タクソノミー / `acf` / `_thumbnail` を 5-6 の承認内容で埋める。
3. 画像パスは JSON ファイルからの相対（共通サンプルなら `../sample-img/sample-thumb.jpg`）。
4. 既存の `posts.dev.json` がある場合は差分をチャットで示し、上書きするか AskQuestion（推定は追記しない・方針どおり再生成）。

#### 6-W3c. 参照画像ファイル（WordPress・該当時）

6-W3d の JSON が画像パスを含む場合のみ。ファイルが既にあれば **質問せずスキップ**。

**`AskQuestion` のみ**。エージェントは画像ファイルを差し替え・上書きしない。

1. 参照パス（テーマルートからの実在確認）を箇条書きする。
2. 欠けているパスがあるとき **`AskQuestion`**: 画像を手動配置する / スキップ（インポート時は当該画像なし）。
3. 「手動配置」選択後、ユーザーが配置完了した旨を伝えるまで次へ進まない。`make wp-create-posts` は **6-W4 合格後**（Step 7）。

#### 6-W3b. フォーム連携ファイル（Step 4b 採用時 **必須**）

テンプレート由来の古い定数参照を残さない。Step 4b でフォーム系を採用した場合、**必ず**次を同期する（詳細: [php-config.md](php-config.md)「フォーム連携ファイル」）。

| ファイル | 更新内容 |
|----------|----------|
| `inc/config/plugins/cf7/cf7.php` | 完了 URL を `get_page_url(Page::CONTACT_THANKS)` に統一 |
| `inc/config/assets-plugins.php` | yubinbango 等フォーム用プラグインの `pages` に `Page::CONTACT` |

`inc/config/` 配下を `Page::` / `Post::` で grep し、**`pages.php` / `posts.php` に無い定数が残っていないか**確認してから Step 6-W4 へ。

#### 6-W4. 設定整合性検証（**必須**）

Step 7・WP-CLI 同期の **前に必ず実行**する。手順の正本: [php-config.md](php-config.md)「設定整合性検証」。

1. **定数参照の突合** — `Page::` / `Post::` の参照先が定義ファイルに存在するか
2. **PHP 構文** — 編集した config PHP に `php -l`（エラー 0 件）
3. **WP-CLI 読み込み** — 環境が起動可能なら `wp option get blogname --allow-root` でテーマ bootstrap の smoke test（Fatal error が無いこと）
4. **禁止パターン** — `RECRUIT_ENTRY`・`CONTACT_COMPLETE` 等、CONTACT 系と不一致のフォーム定数が `inc/config/` に残っていないか
5. **posts.dev.json** — `posts.php` の各 CPT に `data/{post_type}/posts.dev.json` があること（CSV のみは NG）

| 結果 | 対応 |
|------|------|
| すべて合格 | Step 7（WP-CLI 同期）へ |
| 1 件でも不合格 | **当該ファイルを修正し 6-W4 を再実行**。合格するまで Step 7 に進まない |

最低限チャットで **検証結果表**（項目 / 結果 / 備考）を報告する。

### PHP

#### 6-P1. `includes/config/pages.php` のみ編集

1. `public const` にページ ID を追加（値は slug。例: `CONTACT_CONFIRM = 'contact_confirm'`）。
2. `private static $pages` にエントリを追加。必須キー: `title`, `description`, `breadcrumbs`, `url`, `noindex`, `assets_name`。
3. **残す**: `ERROR`, `NOT_FOUND`。
4. `url`: トップは `'/'`、それ以外は先頭 `/` のパス（例: `'/contact-confirm'`）。動的詳細は `'/works/{id}'` 形式。
5. 動的詳細は `title` / `description` を空文字。`assets_name` は一覧と同一。
6. `breadcrumbs` は親階層に沿って組み立て（末尾 `'slug' => null` は WordPress と同様）。
7. `description` / `noindex` / `assets_name` は Step 5b 承認内容どおり。

#### 6-P2. `includes/config/config.php` の SITE_NAME

**編集しない**（A-1 で設定済み）。`SITE_BASE_PATH` / `THEME_COLOR` / `FONT_TAGS` も変更しない。

#### 6-P3. 編集後の確認

- 重複 `url`・未定義のページ ID がないか
- 動的詳細の `{id}` プレースホルダ名がテンプレ PHP と一致するか（テンプレ作成は別タスク）
- `SITE_NAME` が `@project-env-setup` A-1 の `WP_SITE_TITLE` と一致しているか（不一致時は A-1 を案内）

**PHP 環境では `posts.php` / `acfFileds.php` は編集しない。**

---

## Step 7: WP-CLI 同期と完了報告

6-W4 合格後に実施する。**ユーザーに `make` の手動実行だけを頼まない。**

### WordPress: WP-CLI 同期（エージェント実行）

正本: [php-config.md](php-config.md)「WP-CLI 同期」。

| 変更内容 | 実行 |
|----------|------|
| `pages.php` を変えた | `make wp-create-pages` |
| `posts.php` / `acfFileds.php` / `posts.dev.json` を変えた | `make wp-create-posts WP_CREATE_POSTS_ARGS="--non-interactive"` |
| 両方 | 両方（順不同可。posts → pages でも可） |
| まだ `wp-install` 未実施 | **初回のみ** `make wp-install`（内部で create-posts / create-pages を呼ぶ）。その後の追加は create のみ |

前提: Docker が起動していること（`make up` 済み）。未起動なら起動してから実行する。

**スクリプトの性質（要理解）**: `wp-create-pages` は既存固定ページを **全削除してから** `pages.php` どおり再生成する。`wp-create-posts` の非対話（エージェント実行時は `WP_CREATE_POSTS_ARGS="--non-interactive"`）は対象 CPT の既存投稿を消し、タームを作り直し、`posts.dev.json` をインポートしテンプレを生成する。対話実行では各確認に従う。`pages.php` / `posts.php` / `posts.dev.json` を正とする前提。チャットで一言触れてから実行してよい（AskQuestion で拒否されたらスキップし完了報告に残す）。

テンプレ PHP の雛形生成も create スクリプト側で行われる（既存ファイルはスキップ）。

### 共通の完了報告

- 編集したファイル一覧
- `SITE_NAME` が A-1 と一致しているか
- 固定ページ数・動的コンテンツグループ数
- description / noindex を設定した画面数
- **実行した make ターゲットと成否**（スキップ理由があれば）

### WordPress のみ（報告）

- `acfFileds.php` の CPT 数・フィールド数
- `posts.dev.json` を書いた CPT
- 6-W3c の実施 / スキップ
- **6-W4 の検証結果**

### PHP のみ（報告・同期）

- WP-CLI は使わない
- 動的詳細を追加したら Apache Rewrite 等の同期が必要なら、非 WordPress では `docker/php/000-default.conf` 等を案件手順に従いエージェントが更新する
- ルート PHP・JSON ストア未作成なら別タスクとして記載
- 新規 `assets_name` があれば `src/scss/pages/` / `src/js/pages/` 追加を記載

テンプレ未作成は別タスクとして記載。**6-W4 未合格のまま WP-CLI / install を実行しない。**

---

## 再実行時

- 既存 `pages.php`（WordPress なら `posts.php` も）を読み、差分を報告する。
- **実装スキル経由（pages ensure）**: 既定は **追記**。全置換は AskQuestion で明示されたときのみ。
- 単独依頼時: 追記／全置換を AskQuestion で確認（推定は追記を選択肢に含める）。
- Figma 再取得時も Step 2 の確認を省略しない。
- 実装前ゲートの呼び方・Figma 無し時の軽量登録は [pages-ensure.md](pages-ensure.md)。
- 更新管理仕様の cms フレームは [cms-frame.md](cms-frame.md)。

---

## 禁止・注意

- Figma API トークンを `.env` に追加しない
- デザイン案フレームを本番として自動採用しない
- ユーザー未確認で PHP を編集しない
- description・noindex・`has_archive`・**ACF フィールド定義**・**`posts.dev.json` の件数・カテゴリ・画像・文言**をユーザー未確認で確定しない
- 6-W3c で、ユーザーが「配置した」と言う前に画像を勝手に差し替えない
- ACF 利用 CPT で **5-5 を省略**し `acfFileds.php` を空のままにしない
- WordPress の CPT で **5-6 を省略**し `posts.dev.json` を作らない
- `posts.dev.json` の代わりに CSV を作る
- フォーム系で **`RECRUIT_ENTRY` 等の別名定数**を `pages.php` に定義し、他ファイルに古い `Page::CONTACT_*` を残す
- **6-W4 未合格**のまま Step 7 の WP-CLI / `wp-install` を実行しない
- ユーザーに `make wp-create-*` の **手動実行だけを依頼して終わらない**（エージェント実行が原則）
- `_docs/projectInformation/` への JSON 出力を行わない（旧運用）
- 通常フローで親キャンバスの **全画面一括探索をしない**（非推奨モード明示時のみ）

## 追加リソース

- 実装前の登録確認: [pages-ensure.md](pages-ensure.md)
- CMS フレーム仕様: [cms-frame.md](cms-frame.md)
- Figma 探索: [figma-discovery.md](figma-discovery.md)
- PHP 設定テンプレート: [php-config.md](php-config.md)
