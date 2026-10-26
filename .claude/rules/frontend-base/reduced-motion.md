# 動きの配慮（prefers-reduced-motion）ルール

OS / ブラウザの「動きを減らす」設定（`prefers-reduced-motion: reduce`）への対応方針。CSS・JS・プラグインを問わず、動きを伴う実装に適用する。GSAP 固有の実装方法は `@gsap`（`.claude/skills/gsap/SKILL.md`）。

## 構成

1. 前提（reduce でもコンテンツはすべて見える）
2. 動きの分類と reduce 時の扱い
3. CSS
4. JavaScript
5. 確認方法
6. 参照

## 前提（必須）

**reduce 時も、コンテンツはすべて通常どおり閲覧・操作できる状態にする。** 動きを止めることで、要素が見えない・届かない・操作できない状態を作らない。

- 非表示の初期状態（`opacity: 0`、画面外への `translate`、`clip-path`、文字分割による非表示など）は、**動きを有効にする条件下でのみ**付与する。reduce 時に初期状態だけが残らないようにする
- reduce 時は、演出の **最終状態（表示状態）で即時表示** する
- 動き前提のレイアウト（pin 区間分の余白、スクロール量を稼ぐための高さ等）が reduce 時に空白として残らないようにする

## 動きの分類と reduce 時の扱い

| 分類 | 例 | reduce 時 |
|------|----|-----------|
| 装飾の動き | 入場アニメーション、パララックス、scrub による移動・拡大縮小、カーソル追従、スムーススクロール、装飾の自動ループ | **止める**（最終状態で静止） |
| 追従（一定区間の固定のみ） | 要素を一定区間留めるだけの pin | **CSS の `position: sticky` に置き換える** |
| コンテンツ閲覧に必須の動き | 横スクロールコンテンツ、カルーセル（Swiper 等） | **制限しない**（通常どおり動作） |

- 判断基準: **その動きが無いとコンテンツが見られない・操作できない** なら「必須」として制限しない
- 必須の動きに付随する装飾（横スクロール内のパララックス等）は「装飾の動き」として止める
- 迷ったら、reduce 時にコンテンツがすべて見えるかを優先して判断する

## CSS

`transition`・`animation`・フェード切替・hover の状態変化など、視覚的な動きを伴うスタイルには、`prefers-reduced-motion: reduce` で動きを抑えるスタイルを併記する。

- `reduce` 時は `transition` / `animation` を無効化するか、即時切替に寄せる
- 動きそのものを必須とする表現（操作の可否が動きに依存する）は避け、静止状態でも内容が伝わるようにする

```scss
.element {
  transition: opacity .8s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
```

## JavaScript

- 判定クエリ（`(prefers-reduced-motion: reduce)` / `no-preference`）は定数化し、処理の途中で文字列を書かない
- 設定の変更（ページ表示中の切替）に追従させる場合は、変更時に作成・破棄できる仕組み（GSAP は `gsap.matchMedia()`）を使う
- 「コンテンツ閲覧に必須の動き」の初期化は、reduce の判定で分岐させない

## 確認方法

Chrome / Edge の DevTools のコマンドメニュー（`Ctrl + Shift + P`）→「Emulate CSS prefers-reduced-motion: reduce」→ **リロード**。初期化時に判定する実装はリロードしないと反映されない。

確認観点:

- すべてのコンテンツが表示されているか（非表示の初期状態が残っていないか）
- 追従要素が sticky で留まるか
- 横スクロール・カルーセルが通常どおり動くか
- 不要な空白が残っていないか

## 参照

- GSAP（pin → sticky、横スクロール、スムーススクロール）: `.claude/skills/gsap/SKILL.md`
- Swiper: `.claude/rules/project/javascript/swiper.md`
- sticky が効かないとき（祖先の `overflow`）: `.claude/rules/frontend-base/safari-webkit.md` 項目 5
