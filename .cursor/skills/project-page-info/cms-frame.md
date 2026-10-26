# CMS フレーム（更新管理コンテンツ仕様）

Figma 上の **`cms` フレーム**を、CPT / ACF / PHP 更新可能コンテンツの **仕様正本**とする。動的コンテンツモード（[SKILL.md](SKILL.md)）・[pages-ensure.md](pages-ensure.md) から参照する。手順の長文を実装スキルに複写しない。

## フレームの置き方（制作側）

| 項目 | 内容 |
|------|------|
| 名前 | フレーム名に **`cms`** を含む（例: `cms` / `CMS` / `cms-spec`）。大文字小文字ゆれは同一視 |
| 中身 | **テーブル**に仕様を記載（下記「表の読み方」） |
| 対象画面 | 関連する **画面フレーム名**（`pc-<slug>` 等）や page-slug を表に含める |

画面デザイン用の `pc-*` / `sp-*` とは別フレーム。カタログの screen 行には通常載せない（[figma-batch-implement/catalog.md](../figma-batch-implement/catalog.md) は任意で CMS URL を注記してよい）。

## 表の読み方（目安）

列名は案件で揺れるため、ヘッダー文言から対応づける。

| 意味 | ヘッダー例 |
|------|------------|
| 対象画面 | ページ / 画面 / フレーム名 / slug / `pc-works` |
| コンテンツ種別 | 投稿タイプ / CPT / 一覧+詳細 / 固定のみ 等 |
| フィールド | 項目名 / label / 型 / type / ACF |
| 一覧の有無 | アーカイブ / has_archive / 一覧ページ |
| その他 | タクソノミー / 件数 / 備考 |

1 行＝1 フィールド、または 1 ブロック＝1 CPT、など表構造に合わせて解釈し、チャットで **解釈表**を出してから AskQuestion する（**unattended** 時は AskQuestion せず解釈を確定し Progress に残す。[unattended.md](../figma-batch-implement/unattended.md)）。

## 取得優先（エージェント）

1. **依頼で渡された cms フレーム URL**（単体実装・Request notes・バッチ計画の CMS 節）
2. **バッチ計画 / カタログに記録済みの cms URL・要約**
3. **同一 Figma ファイル内**で名前に `cms` を含むフレームを MCP（metadata 等）で探す
4. **無い** → 「画面デザインからの推定」へ（下記）

複数 `cms` がある場合は表で列挙し AskQuestion（**unattended** なら依頼 slug に最も近い 1 件を採用し Progress に根拠を残す）。

## cms があるとき

1. テーブルを読み、対象 slug（キュー内または単体依頼の slug）に該当する行だけ抽出する
2. 解釈結果を表で提示 → **AskQuestion** で確定（推定を選択肢に含める）。**unattended** なら提示せず推定確定＋Progress 記録
3. `@project-page-info` **動的コンテンツモード**へ（指定フレーム＝当該画面の一覧・詳細 URL ＋ cms で確定した仕様）。ACF / `posts.php` / PHP `{id}` は cms 仕様を優先
4. 6-W4 → WP-CLI 同期は従来どおり（unattended で Docker 不可ならスキップ可）

画面デザインと cms が矛盾したら **cms を優先**し、差分を一文でユーザーに示す（unattended なら Progress に書く）。

## cms が無いとき

### Step A: 更新管理かどうかの判定（必須）

次を材料に **更新管理コンテンツ候補か**を判断する（**interactive では自動確定しない**。**unattended** は [unattended.md](../figma-batch-implement/unattended.md) の推定規則）。

| シグナル（強い） | 例 |
|------------------|-----|
| 一覧＋詳細の画面ペア | `pc-works` + `pc-works-detail`、カタログ上のペア |
| カード／行の繰り返し＋詳細への導線 | 一覧グリッド、記事リスト |
| 投稿日・カテゴリ・ページネーション等 | 典型的な CMS UI |
| ユーザーが CPT / お知らせ / 事例 等と明示 | 依頼文 |

| シグナル（弱い・単独では不足） | 例 |
|-------------------------------|-----|
| ただのカード風レイアウト（静的でもあり得る） | 特徴紹介の 3 カラム |
| フォームのみ | CONTACT 系はフォーム経路（動的 CPT ではない） |

**AskQuestion** 例（interactive）:

- 更新管理コンテンツとして CPT/ACF（または PHP 動的）を設定する
- 静的ページとして pages のみ（動的にしない）
- 保留したい（cms フレーム URL を後から渡す）
- その他

**unattended**: 強いシグナルなら動的、弱ければ静的。曖昧でも聞かない。

「静的」なら動的モードに入らない。ensure の固定ページ経路のみ。

### Step B: 静的でない場合の仕様推定

画面デザイン（一覧・詳細フレーム）からフィールド候補・`has_archive` 等を整理し表で提示 → AskQuestion → 動的モードへ（**unattended** なら提示後すぐ推定確定）。  
従来の Step 5 / 5-5 の対話と同じだが、**先に Step A の判定を済ませる**。

## 呼び出し元との分担

| 呼び出し | cms の扱い |
|----------|------------|
| `@figma-batch-implement` | Phase 0 で cms を解決し、**バッチ計画に CMS 節**（URL・要約・対象 slug）を書く。ensure 時に参照 |
| `@figma-page-implement`（単独） | 依頼の cms URL → 同一ファイル探索 → 無ければ Step A。結果をページ計画 or Request notes に短く残す |
| pages ensure 単体 | 上記優先順で cms を解決してから D / A / B ブランチ |

バッチでは「進行管理 md に cms 内容と該当画面を書く」で足りる。単体では **cms を一緒に渡すのが確実**。渡さなくても同一ファイル探索 → 推定＋確認でよい。
