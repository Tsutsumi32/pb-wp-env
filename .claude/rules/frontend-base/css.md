# CSS/SCSS記述ルール

CSS/SCSS共通の記述ルール。コメント階層、プロパティ順（`$_this` → mixin → レイアウト…）を扱う。SCSS実装時は `.claude/rules/project/css/` も参照。

CSS/SCSSを記述するすべてのファイルで、適切なコメント付与を意識する。コメントはコードの構造や役割を把握しやすくするために使い、必要以上に細かい説明や自明な処理説明は避ける。

## コメント階層

SCSSでは、`_template.scss` の形式に合わせて以下のコメントを使い分ける。

### 大見出し

ページ、ブロック、主要セクションなど、ファイル内の大きなまとまりを示す場合に使用する。

```scss
/******************************************************************
* page - sample-about
*******************************************************************/
```

```scss
/******************************************************************
* block - card
*******************************************************************/
```

### 中見出し

MV、コンテンツセクション、フォーム、一覧など、大見出し内の主要な構成要素を示す場合に使用する。

```scss
/* mv
----------------------------------------------------------------- */
```

### 小見出し

状態管理、バリエーション、補助的なまとまりなど、中見出し内をさらに分ける場合に使用する。

```scss
// State
//////////////////////////////////////////////
```

### 最小コメント

数行の補足や、意図が伝わりにくい実装理由を短く補足する場合に使用する。

```scss
// 最小
```

## コメント付与の考え方

- ファイル内の大きな構成が変わる箇所には、読み手が現在位置を把握できるコメントを付ける。
- ページ固有のSCSSでは、ページ名や主要セクションが分かるコメントを付ける。
- モジュールやコンポーネントのSCSSでは、対象となるブロック名や役割が分かるコメントを付ける。
- 状態クラス、modifier、JS連携クラスなど、役割を誤解しやすいまとまりにはコメントを付ける。
- プロパティ単位の説明や、見れば分かる内容のコメントは避ける。
- **デザインツールの実測値・デザイン値をコメントに併記しない**（例: `// 24px` / `// Figma: 16` / `/* gap 40 */`）。値はプロパティ本体にのみ反映する。

## JavaScript無効環境の考慮

必要に応じて、JavaScriptが無効な環境でも最低限の表示・操作性を保てるよう、CSS/SCSSでのフォールバックスタイル適用を考慮する。実装手段の詳細は、各プロジェクトのルールと実装方針に従う。

## 動きの配慮（prefers-reduced-motion）

`transition`・`animation`・フェード切替・**hover 時の状態変化** など、視覚的な動きを伴うスタイルは `prefers-reduced-motion: reduce` で動きを抑える。前提（reduce でもコンテンツはすべて見える）・分類・書き方は `.claude/rules/frontend-base/reduced-motion.md` を参照する。

## hover と transition

hover で見た目が変わる実装（opacity / color / transform / background 等）では、**必ず `transition` を設定**する。詳細・例は `.claude/rules/project/css/scss.md` の「hover と transition」節を参照。

- `@include hover` を使う場合、変化するプロパティに対応する `transition` を **同じセレクタ内・hover より前** に書く
- 時間は `get-transition()` を使用する
- `reduce` 時の打ち消しを併記する（`.claude/rules/frontend-base/reduced-motion.md`「CSS」）

## プロパティ記述

プロパティは、意図が明確で短く書けるものを優先する。

- 上下左右、または左右・上下の組で値が同じ場合のみ、`padding` を優先する。
- 次に、方向のまとまりを表せる場合は `padding-inline`、`padding-block` を優先する。
- まとまりで表せない場合は、`padding-top`、`padding-right`、`padding-bottom`、`padding-left` など単一方向で指定する。

```scss
// OK
padding: s(20) s(40);
padding-block: s(24);
padding-inline: s(32);
padding-top: s(16);
```

`0.5` など `0.` から始まる小数は、先頭の `0` を省略して記載する。

```scss
opacity: .5;
```

## プロパティ順

プロパティは **アルファベット順に並べない**。関連するプロパティをまとめ、**大きい単位から小さい単位**（レイアウト → 位置 → サイズ・余白 → フォント → カラー → 装飾・挙動）の順で記載する。

### セレクタ内の記述順

1. **ローカル変数**（`$_this: &;` などセレクタ内で定義する変数）を **先頭**
2. **プロパティを設定する mixin**（`@include font()` / `@include background-image()` など）を **続けて先頭**
3. 以降、下記「プロパティのグループ順」に従う

`@include hover` や `@media` ブロックは、対象となる通常プロパティの **後** に記載する。

### プロパティのグループ順

各グループ内も、大きい単位 → 小さい単位のイメージで並べる。

1. **レイアウト** — `display` / `flex`・`grid` 系 / `gap` / `align-*` / `justify-*` / `order` など
2. **位置** — `position` / `inset` / `top`・`right`・`bottom`・`left` / `z-index`
3. **サイズ・ボックス** — `width` / `height` / `min-*` / `max-*` / `aspect-ratio` / `overflow` / `box-sizing` など
4. **余白** — `margin` / `padding`（`.claude/rules/project/css/scss.md`「margin」の方針に従う）
5. **フォント・テキスト** — `text-align` / `white-space` など **`font()` 対象外**。`font-size` / `line-height` / `letter-spacing` / `font-weight` / `font-family` は原則 `font()` に含め、直後の重ね書きは特別な上書き時のみ（正本: `project/css/scss.md`「`font()` 直指定の完結」）
6. **カラー・背景** — `color` / `background-color` / `background`（mixin 未使用分）など
7. **枠線・装飾** — `border` / `border-radius` / `box-shadow` / `outline` など
8. **挙動・その他** — `opacity` / `visibility` / `cursor` / `pointer-events` / `transition` / `transform` / `animation` など

```scss
.el_sample {
  $_this: &;

  @include font(16, 24, 0, 700);
  display: flex;
  align-items: center;
  gap: s(16);
  position: relative;
  width: 100%;
  padding-block: s(16);
  color: get-color('brand');
  transition: opacity get-transition('normal');

  @include hover {
    opacity: .75;
  }
}
```
