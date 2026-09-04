# JSON / CSV 投稿インポート仕様

`wp-import-posts` 用データの置き場と、JSON / CSV の書き方です。

テーマ内の `data/{post_type}/` 配下の所定ファイルを読み込み、カスタム投稿を作成または更新します。識別子は `_external_id` です。

## 実行方法

```bash
# ターム・テンプレート生成のあと、開発用 JSON を一括インポート
# （内部で WP_IMPORT_ENV=dev / WP_IMPORT_POSTS_ARGS=<対象 CPT> 相当）
make wp-create-posts

# 本番データ（posts.json または posts.csv）を直接インポート
make wp-import-posts WP_IMPORT_POSTS_ARGS="news"

# 開発用データ（posts.dev.json）を直接インポート
make wp-import-posts WP_IMPORT_POSTS_ARGS="news" WP_IMPORT_ENV=dev
```

`WP_IMPORT_ENV` の省略時は `prod` です。`dev` / `develop` / `development` も開発扱いになります。

`posts.php` に定義されているスラッグのみ指定できます。このテーマの現状は次のとおりです。

| スラッグ | ラベル | データディレクトリ |
|---|---|---|
| `news` | サンプル | `data/news/` |

## ファイル名

読むファイル名は決まっています。それ以外の `.json` / `.csv` は読み込みません。

| 環境 | `WP_IMPORT_ENV` | 対象ファイル |
|---|---|---|
| 本番 | 省略 / `prod` / `production` | `posts.json` または `posts.csv`（両方あると中止） |
| 開発 | `dev` / `develop` / `development` | `posts.dev.json` または `posts.dev.csv`（両方あると中止） |

本番と開発を同時には読みません。同じ `_external_id` を両方に書いても、実行時に指定した環境のファイルだけが使われます。

## ディレクトリ構成

```
data/
├── README.md                  … このファイル
├── sample-img/                … 開発用 JSON（posts.dev.json）から相対参照するサンプル画像
├── news/
│   └── posts.dev.json         … 開発用（`make wp-create-posts` が読み込む）
├── works/                     … 本番 JSON の記載例（下記「JSON の作り方」）
└── sample-post/               … インポート形式のサンプル
```

- 配置先は `data/{post_type}/` です。サブディレクトリ内でも、上記のファイル名なら読みます。
- 同じ環境で JSON と CSV が両方ある場合は、取り込み前にエラーで中止します。どちらか一方にしてください。
- 下書きやバックアップ（`draft.csv` / `posts.backup.json` など）は読みません。
- ファイルはパス順（`sort`）で処理します。
- `{post_type}` は `inc/config/posts.php` のスラッグと一致させてください。

## 共通仕様

### 必須キー `_external_id`

各投稿に一意な文字列を付けます。同じ `_external_id` が見つかれば更新、なければ新規作成します。

- 無い、または空文字の行はスキップします。
- 管理画面から保存した投稿には `_manual_edit` が付きます。付いている投稿は再インポートしても更新しません。

### 投稿フィールド

次のキーを渡せます。未指定のキーは WordPress のデフォルト、または既存投稿の値を使います。

| キー | 内容 | 備考 |
|---|---|---|
| `post_title` | タイトル | |
| `post_content` | 本文 | |
| `post_excerpt` | 抜粋 | |
| `post_status` | ステータス | 新規作成時に未指定なら `publish` |
| `post_date` | 公開日時 | `Y-m-d H:i:s`（例: `2024-06-01 10:00:00`） |
| `post_date_gmt` | 公開日時（GMT） | |
| `post_name` | スラッグ | |
| `menu_order` | 表示順 | `requirements-posts` で使用。CSV では数値として取り込みます |

### `post_date` の扱い

| JSON / CSV の指定 | 新規作成 | 再インポート（更新） |
|---|---|---|
| キーなし（CSV の空セル含む） | インポート実行時点の現在時刻 | 既存の日時を維持 |
| `"post_date": ""`（JSON の空文字） | 現在時刻 | **現在時刻で上書き** |
| `"2024-06-01 10:00:00"` など有効な日時 | その日時 | その日時で上書き |

既存の公開日時を残したい場合は、キーごと省略してください。JSON で空文字を書くと上書きされます。

`post_date_gmt` だけ指定して `post_date` が空の場合は、GMT から逆算します。

### ACF

`acf` オブジェクト（CSV では `acf.フィールドスラッグ`）に、`acfFileds.php` のスラッグで値を入れます。

- 画像フィールド（`type: image`）は、テーマ内パスを書くとメディアへ登録し、attachment ID を保存します。数字だけの文字列はそのまま ID として扱います。
- ファイルフィールド（`type: file`）も同様です（pdf / doc / xls など）。
- `group` は入れ子で指定します（JSON はオブジェクト、CSV はドット区切り）。
- 定義に無いスラッグでも `update_field` は呼ばれますが、画像パス解決は定義があるフィールドだけです。

### 画像・ファイルパス

パスは **その JSON / CSV ファイルがあるディレクトリ** からの相対パスです。

```
data/members/posts.json
data/members/images/sasamoto-t-thumbnail.jpg
```

```json
"members_image": "images/sasamoto-t-thumbnail.jpg"
```

- `/` で始まるパスはテーマルート基準です（例: `/data/sample-img/sample-thumb.png`）。
- `http://` / `https://` などの URL は無視します。
- 対応拡張子: 画像は `jpg` / `jpeg` / `png` / `gif` / `webp`。ファイルは `pdf` / `doc` / `docx` / `xls` / `xlsx`。

### アイキャッチ `_thumbnail`

投稿タイプの `supports` に `thumbnail` がある場合のみ有効です。`news` は thumbnail 対応のため `_thumbnail` を使えます。パスはこの JSON からの相対です（例: `../sample-img/sample-thumb.jpg`）。

### タクソノミー

```json
"taxonomies": {
  "news-category": "blog"
}
```

スラッグは `posts.php` の `category_settings` / `term_settings` と揃えてください。複数タームは JSON では配列、CSV では `|` 区切りです。

---

## JSON の作り方

ファイル名は本番が `posts.json`、開発が `posts.dev.json` です。文字コードは UTF-8 です。次のどれでも読めます。

1. 投稿オブジェクトの配列（推奨。現行ファイルはこの形式）
2. `{ "posts": [ ... ] }` で包んだオブジェクト
3. 投稿 1 件だけのオブジェクト

### 最小例（施工実績）

`data/works/posts.json`

```json
[
  {
    "_external_id": "works-json-001",
    "post_title": "足立区マンション",
    "post_status": "publish",
    "post_date": "2026-01-01 10:00:00",
    "acf": {
      "works_period": "2026年",
      "works_location": "東京",
      "works_owner": "建築面積 1,000m2"
    }
  }
]
```

### group と画像の例（マキノで働く人）

`data/members/posts.json`

```json
[
  {
    "_external_id": "members-json-001",
    "post_title": "T.S.",
    "post_status": "publish",
    "post_date": "2024-06-01 10:00:00",
    "acf": {
      "members_image": "images/sasamoto-t-thumbnail.jpg",
      "members_position": "電気工事士",
      "members_department": "工事部",
      "members_nickname": "SASAMOTO TAKUYA",
      "members_catchcopy_line1": "大卒から職人の世界へ！",
      "members_catchcopy_line2": "冷静な分析力で現場を攻略する若きエース",
      "members_hero_image": "images/sasamoto-t-wide.jpg",
      "members_question_1": {
        "question": "休日の過ごし方",
        "answer": "その時の気分に合わせて自由に過ごしています。",
        "image": "images/sasamoto-t-q1.jpg"
      },
      "members_schedule_1": {
        "time": "08:00",
        "title": "出勤・作業前確認",
        "text": "現場に直行しタイムカードを押します。",
        "image": "images/sasamoto-t-schedule1.jpg"
      }
    }
  }
]
```

改行を含めたいテキストは `\n` で書けます。

### 表示順の例（募集要項）

`data/requirements-posts/posts.json`

```json
[
  {
    "_external_id": "requirements-json-001",
    "post_title": "現場代理人",
    "post_status": "publish",
    "post_date": "2024-06-01 10:00:00",
    "menu_order": 1,
    "acf": {
      "requirements_position": "現場代理人",
      "requirements_row_1": {
        "head": "募集職種",
        "content": "総合職（施工管理）、技術職（電気工事士）、事務職（積算）"
      }
    }
  }
]
```

配列の 1 件がオブジェクトでない場合は、その件だけスキップします。

---

## CSV の作り方

`data/{post_type}/posts.csv`（本番）または `data/{post_type}/posts.dev.csv`（開発）として置きます。同じ環境の JSON（`posts.json` / `posts.dev.json`）とは同時に置けません。

### ルール

- 1 行目はヘッダーです。
- 入れ子はドット区切りでフラット化します（`acf.members_question_1.question`）。
- ACF スラッグは `acf.` なしでも可です（`works_period` → `acf.works_period` として取り込みます）。
- タクソノミーの複数指定は `|` 区切りです。
- 空セルは未指定です。キーごと無いのと同じで、既存値は維持されます。
- 文字コードは UTF-8（BOM 可）と Shift-JIS です。Excel から出す場合は UTF-8 BOM か Shift-JIS にしてください。
- 未知の列名は警告して無視します。
- `_external_id` 列が無いファイルは警告します。各行に値が無ければその行はスキップします。
- 空行は無視します。

### 施工実績の例

`data/works/posts.csv`

```csv
_external_id,post_title,post_status,post_date,acf.works_period,acf.works_location,acf.works_owner
works-csv-001,足立区マンション,publish,2026-01-01 10:00:00,2026年,東京,建築面積 1,000m2
```

カンマを値に含めるときはダブルクォートで囲みます。

```csv
_external_id,post_title,acf.works_owner
works-csv-001,足立区マンション,"建築面積 1,000m2"
```

`acf.` を省略した書き方も同じ意味です。

```csv
_external_id,post_title,works_period,works_location,works_owner
works-csv-001,足立区マンション,2026年,東京,建築面積 1,000m2
```

### group の例（マキノで働く人）

```csv
_external_id,post_title,post_status,post_date,members_image,members_position,members_question_1.question,members_question_1.answer,members_question_1.image
members-csv-001,T.S.,publish,2024-06-01 10:00:00,images/sasamoto-t-thumbnail.jpg,電気工事士,休日の過ごし方,その時の気分に合わせて自由に過ごしています。,images/sasamoto-t-q1.jpg
```

セル内改行は、フィールドをダブルクォートで囲んだうえで実際の改行を入れます。

```csv
_external_id,post_title,members_question_2.answer
members-csv-001,T.S.,"実家に帰りやすい「関東圏内で転勤がないこと」を条件に探していました。
マキノは3回ほど見学し、社内の雰囲気の良さを肌で感じられたことが決め手です。"
```

### タクソノミーの例

```csv
_external_id,post_title,taxonomies.works_cat
works-csv-001,足立区マンション,商業施設|公共工事
```

1 件だけのときは `|` は不要です。

```csv
_external_id,post_title,taxonomies.works_cat
works-csv-001,足立区マンション,商業施設
```

---

## 投稿タイプ別フィールド

ACF スラッグの定義元は `inc/config/plugins/acf/acfFileds.php` です。

### works（施工実績）

| キー | 種別 | 内容 |
|---|---|---|
| `acf.works_period` | text | 竣工年月 |
| `acf.works_location` | text | エリア |
| `acf.works_owner` | text | 施工主 |

実ファイル: `data/works/posts.json`

### members（マキノで働く人）

| キー | 種別 | 内容 |
|---|---|---|
| `acf.members_image` | image | サムネイル |
| `acf.members_position` | select | 所属・職種（`電気工事士` / `積算課` / `現場代理人` / `なし`） |
| `acf.members_department` | text | 部署名 |
| `acf.members_nickname` | text | 名前（ローマ字） |
| `acf.members_catchcopy_line1` | text | キャッチコピー 1 行目 |
| `acf.members_catchcopy_line2` | text | キャッチコピー 2 行目 |
| `acf.members_hero_image` | image | インタビュー中間画像 |
| `acf.members_question_{1-4}` | group | `question` / `answer` / `image` |
| `acf.members_schedule_{1-12}` | group | `time`（30 分刻み `08:00` など） / `title` / `text` / `image` |

使わない Q&A 枠・スケジュール枠はキーごと省略して構いません。実ファイル: `data/members/posts.json`

### requirements-posts（募集要項）

| キー | 種別 | 内容 |
|---|---|---|
| `menu_order` | 投稿フィールド | 表示順 |
| `acf.requirements_position` | select | 職種（`電気工事士` / `積算課` / `現場代理人`） |
| `acf.requirements_row_{1-15}` | group | `head`（見出し） / `content`（内容） |

使わない行は省略できます。実ファイル: `data/requirements-posts/posts.json`

---

## 動作の要点

- 新規作成時に `post_status` が無いと `publish` になります。更新時は未指定なら既存のステータスを維持します。
- JSON でキーを空文字にすると、WordPress に空文字が渡ります（`post_date` は現在時刻になります）。CSV の空セルはキーごと無い扱いです。
- 管理画面で一度保存した投稿は `_manual_edit` が立ち、以降のインポートでは更新しません。プログラム側から再投入したい場合は、その投稿のカスタムフィールド `_manual_edit` を外してください。
- 同じ環境で JSON と CSV が両方あると、1件も取り込まずエラーで中止します。
- インポート結果は標準出力に出ます（`[OK]` / `[SKIP]` / `[WARN]` / `[ERROR]`）。
