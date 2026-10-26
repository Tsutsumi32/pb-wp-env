# Components catalog（実装済み共通部品の索引）

下層実装（`@subpage-design-implement`）が **積極利用**するための一覧。  
**必須ではない** — 合うものだけ使う。画面固有の直書き・新規コンポーネントも可。

- ブラウザ用カタログページは作らない（本ファイルが正本）
- 役割・用途の指示の元: Figma アノテーション **カテゴリ「コンポーネント」**（実装時にここへ転記）
- 配置の正本: `project/template/php.mdc`「コンポーネント化」／追記ルール: `project/design-subpage.mdc`「components カタログ」・`figma/figma-rule.mdc`「コンポーネントアノテーション」

- Updated: YYYY-MM-DD

## エントリの書き方

各部品は次の見出しブロックで追記する（無い項目は省略可）。

```md
## {class名または部品名}
- Role / Use: （アノテーション「コンポーネント」の内容。役割・いつ使うか）
- PHP: （例: modules/blocks/card-news.php。未切り出しならなし）
- Class: （例: bl_cardNews）
- SCSS: （例: src/scss/modules/blocks/_card-news.scss）
- Notes: （variant・NG・注意。短く。無ければ省略）
```

## Entries

（実装済みの共通部品を上の形式で列挙。無い場合はこのまま）
