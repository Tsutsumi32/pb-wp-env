# CSS/SCSS Rules

`.claude/rules/project/css/` 配下にあるCSS/SCSS関連ルールの入口。CSS/SCSSを編集する際は、同ディレクトリ内の必要なルールを参照する。

## 参照ルール

- `naming.md`: SCSSの変数、ローカル変数、function、mixin の命名規則を確認する。
- `scss.md`: ページSCSS、コンポーネントSCSS、**モジュール用ファイル名（class 準拠・camelCase）**、**エントリーファイル（`common.scss` の `@use` 手動追記禁止・`scss-index` 自動生成）**、ネスト、**ページ SCSS と `section_`（`.section_*` はネストしない）**、**部品の位置制御**、**aspect-ratio（比率固定は一方の寸法＋比率・画像枠）**、**data-css 属性**、固定値、背景画像、テキスト、**`font()`（直指定は完結・`$_line` / `$_space` の渡し方）**、**テキストの折り返し（テキストに `flex-shrink: 0` 禁止・`nowrap` 原則禁止）**、**hover と transition**、**カラー（`$color-palette` / `$colors` / `get-color`・CSS 役割と group 一致）** などの書き方を確認する。
- プロパティの記述順（`$_this` → mixin → レイアウト→位置→…）とコメント方針（**デザインツールの実測値の併記禁止**を含む）は `.claude/rules/frontend-base/css.md` を参照する。
- Safari / iOS WebKit（細い線・opacity ゴースト・dvh・sticky・mask・フォーム等。GSAP 起因は `@gsap`）: `.claude/rules/frontend-base/safari-webkit.md`
- `responsive.md`: レスポンシブの設計方針、`$media-query-strategy`、`media(get-breakpoint-key('key'))` の使い方、**メディアクエリの記述位置（各セレクタ内）** を確認する。

## 適用対象

SCSSファイル、CSS出力に関わるSCSSのエントリーファイル、ページ固有スタイル、コンポーネントスタイル、レスポンシブ実装を対象とする。
