# JavaScript Rules

`.claude/rules/project/javascript/` 配下にあるJavaScript関連ルールの入口。JavaScriptを編集する際は、同ディレクトリ内の必要なルールを参照する。

画面の JS 実装を依頼されたときは、先に `coading.md`「画面JS実装時の手順」と「DOM参照」、`naming.md` の `data-*` を確認する。

## 参照ルール

- `coading.md`: JavaScript実装時のコーディングルールです。**画面JS実装時の手順**（HTMLへ `data-*` 追記→定数化→取得）、`pages/*.js` の構成、`createPage`、デバッグ用console、module / feature 設計、配置判断、data 属性の定数化、**DOM参照（class / id 禁止・data-* のみ）**、イベント委譲を確認する。コメント階層・機能内の記述順は `.claude/rules/frontend-base/javascript.md` を参照する。
- `naming.md`: JavaScriptの識別子命名と、HTML/PHPテンプレートにも関係する JS 用 `data-*` 属性（`data-css-*` を除く）の命名ルールを確認する。
- `swiper.md`: Swiper 実装ルールです。`slidesPerView` の数値指定、fluid `spaceBetween`、`cloneSlidesForLoop`、**有効時の `overflow` 上書き禁止** を確認する。
- GSAP / ScrollSmoother（Safari 橋渡し含む）: `@gsap`（`.claude/skills/gsap/SKILL.md`）。プラグイン非依存の Safari CSS は `.claude/rules/frontend-base/safari-webkit.md`

## 適用対象

JavaScriptファイル、JavaScriptが参照するHTML/PHPテンプレートの `data-*` 属性（`data-css-*` を除く）、JS連携を前提にしたDOM設計を対象とする。CSS 用 `data-css-*` は `.claude/rules/frontend-base/html.md`「data属性」を参照する。
