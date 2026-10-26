# Swiper 実装ルール

Swiper実装。`slidesPerView`、fluid `spaceBetween`、loopクローン、有効時のoverflow上書き禁止。`swiper.init` 利用時に参照する。

`src/js/modules/swiper.js` を使う Swiper 実装のルール。ページ JS から `swiper.init` でオプションを渡す。

## 構成

- `slidesPerView` の指定方針
- `spaceBetween` の fluid 指定
- loop 用 DOM クローン（`cloneSlidesForLoop`）
- `overflow`（有効時の上書き禁止）
- reduced-motion（制限しない）
- デザインカンプの値からの算出方法

## slidesPerView

- **`'auto'` は原則使わない。** 数値で指定する。
- 操作 UI 非表示・loop オフの判定は **オリジナルスライド枚数** と `slidesPerView` の比較で行う（`slideCount > slidesPerView`）。

### デザインカンプの値から算出する場合

デザインのページフレーム幅・スライドアイテム要素の幅・`spaceBetween` から `swiperCalcSlidesPerView` で算出する。

```js
import { swiperCalcSlidesPerView } from '../modules/swiper.js';

swiperCalcSlidesPerView({
  viewportWidth: 1440, // デザインのフレーム幅（px）
  slideWidth: 290,     // スライドアイテム幅（px）
  spaceBetween: 64,    // 基準幅における間隔（px）
});
// => 4.07 … そのまま slidesPerView に渡す
```

- デザインがないレスポンシブ領域（TAB 等）は、既存 SCSS のスライド幅・推定間隔・代表 viewport 幅から同様に算出する。
- ブレークポイントごとに `swiperBreakPoints` の `sp` / `tab` / `pc` へ設定する。

## spaceBetween（fluid）

CSS の `vw` のように画面幅に比例させる場合は `swiperFluidPair` を使う。
指定した `{ at, value }` の **at（画面幅 px）** の時点で **value（px）** になるよう比例計算し、リサイズ時も再計算される（幅変更時に Swiper を再初期化）。

```js
import { swiperBreakPoints, swiperFluidPair } from '../modules/swiper.js';

breakpoints: swiperBreakPoints({
  sp: { spaceBetween: swiperFluidPair(375, 16) },
  pc: { spaceBetween: swiperFluidPair(1440, 64) },
}),
```

- 固定 px の場合は数値をそのまま渡す。
- fluid 指定はブレークポイントごとに別の `{ at, value }` を持てる。

## loop 用 DOM クローン（通常モード）

- リニアモード（`data-swiper-linear`）は数値 `slidesPerView` 時に自動でクローンする。
- **通常モード**では `cloneSlidesForLoop: true` を明示した場合のみクローンする。
- クローンは **操作 UI / loop 判定の後** に行う。枚数不足で loop がオフになるケースではクローンしない。

```js
normal: {
  loop: true,
  cloneSlidesForLoop: true,
  slidesPerView: 4,
},
```

## overflow

- Swiper CDN 標準では `.swiper` に `overflow: hidden` が設定される。**有効時に `.swiper { overflow: visible }` を付けない**（スライド表示・スクロール領域が崩れる）。
- 隣スライドの peek やコンテナ外へのはみ出しは、親ラッパーの negative margin や `slidesPerView` / `centeredSlides` で実現する。
- `overflow: visible` への上書きは **Swiper 無効時（`is_swiper_disabled`）の打ち消しのみ** `_plugin.scss` に集約する（下記「CDN 標準スタイルの打ち消し」参照）。

## reduced-motion

Swiper はコンテンツ閲覧に必須の動きとして扱い、**`prefers-reduced-motion: reduce` でも制限しない**（初期化・操作・オプションを reduce で分岐させない）。正本: `.claude/rules/frontend-base/reduced-motion.md`。

## enable: false と is_swiper_disabled

breakpoints 等で `enable: false` が現在幅に適用される場合、Swiper は初期化せず `[data-module="swiper"]` 要素に `is_swiper_disabled` を付与する。有効化時は除去し `is_pluginReady` を付与する。

- CSS 側では `.swiper.is_swiper_disabled` で PC グリッド表示・ナビ非表示等を制御できる
- リサイズで SP ↔ PC を切り替えた際、オリジナルスライドのみに DOM を組み直してから無効化する

### CDN 標準スタイルの打ち消し（`_plugin.scss`）

Swiper 無効時のみ、共通で CDN 標準スタイルを打ち消す（有効時の `overflow` 上書き禁止は上記「overflow」参照）。

打ち消しは `src/scss/global/_plugin.scss` の `.swiper.is_swiper_disabled` に集約する。

| 対象 | 打ち消し内容 |
|------|-------------|
| `.swiper` | `overflow: visible`、`display: block`（標準の `flex` / `hidden` を解除）、左右 margin |
| `.swiper-wrapper` | `display: block`（標準 `flex` を解除）、`transform` / `transition` の残留を解除 |
| `.swiper-slide` | `width` / `height` / `flex-shrink` / `margin` を auto・unset に戻す |

### wrapper の display（grid / flex）

Swiper 標準 CSS により `.swiper`・`.swiper-wrapper` に `display: flex` が付く。無効時に grid 等へ戻す場合は、**コンポーネント側**で `is_swiper_disabled` を使い優先度を上げる。

```scss
// 無効時: grid（!important または is_swiper_disabled で Swiper 標準 flex を上書き）
.swiper.is_swiper_disabled .bl_cardUnit {
  display: grid !important;
}

// 有効時（SP）: flex
.swiper.is_pluginReady:not(.is_swiper_disabled) .bl_cardUnit {
  display: flex !important;
}
```

- 無効時の grid 定義は **各コンポーネント**（`modules/blocks/` 等）に書く。共通打ち消しだけではレイアウト方式までは決めない

## 参照

- モジュール本体: `src/js/modules/swiper.js`
- 共通 JS ルール: `.claude/rules/project/javascript/coading.md`
