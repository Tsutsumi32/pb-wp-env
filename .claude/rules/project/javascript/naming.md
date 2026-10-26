# JavaScript命名ルール

JS識別子とDOM参照用data属性の命名。`data-module`/`feature`/`action`、ページ固有 `data-xxxx` を扱う。テンプレートの `data-*` 付与時も参照する。

JavaScriptの識別子と、**JavaScript から参照する** `data-*` 属性（`data-css-*` を除く）は以下のルールに従って命名する。

## 識別子

- グローバル定数: 大文字のアンダースコア区切りで命名する。例: `API_ENDPOINT`
- ローカル定数: キャメルケースで命名する。例: `defaultOptions`
- 変数: キャメルケースで命名する。例: `currentIndex`
- メソッド: キャメルケースで命名する。例: `openModal`

## data属性

`data-css-*` は CSS/SCSS 専用の属性。JavaScript からは参照・更新しない。ルールは `.claude/rules/frontend-base/html.md`「data属性」と `.claude/rules/project/css/scss.md`「data-css 属性」を参照する。

`data-*` 属性（`data-css-*` を除く）は、JavaScriptとHTML/PHPテンプレートをつなぐ契約として扱う。イベント登録、モジュール起点、機能適用対象、パラメータの役割を混同しない。

JavaScript 側での定数化・ファイル先頭への一覧化は `coading.md`「data属性の定数化（module / feature）」に従う。

### `data-page`: ページルート

ページ種別を識別する属性。原則として `body` に付与する。

```html
<body data-page="top">
```

### `data-xxxxxx`: ページ内関連データ属性

ページ固有の処理で扱うデータ属性。ページ内だけで完結する値や状態に使用する。

```html
<section data-step-current="1">
```

### `data-module`: モジュールルート

モジュールのDOM起点となるルート要素を識別する属性。値のモジュール名は、複数単語を含む場合でもキャメルケースのままで問題ない。

```html
<div data-module="accordion">
<div data-module="pageTop">
```

### `data-{module名}-xxxxxx`: モジュール関連データ属性

モジュール専用のパラメータや識別子に使用する。`{module名}` が複数単語を含む場合、属性名側ではケバブケースに変換する。

```html
<button data-action="modal.open" data-modal-id="contact">
<button data-page-top-speed="fast">
```

### `data-feature`: 機能の適用対象

`features/` で提供する、独立UIではなく決まったdata属性でどこからでも使える機能の対象要素に付与する。値のfeature名は、複数単語を含む場合でもキャメルケースのままで問題ない。

```html
<p data-feature="wrapPunctuation">
```

### `data-{feature名}-xxxxxx`: 機能関連データ属性

feature専用のパラメータや識別子に使用する。`{feature名}` が複数単語を含む場合、属性名側ではケバブケースに変換する。

```html
<p data-feature="wrapPunctuation" data-wrap-punctuation-processed="true">
```

### `data-action`: イベントトリガー

イベント登録に使う唯一の属性。クリックなどのイベント委譲対象は `data-action` で識別する。値は責務が分かるように `<責務>.<動詞>` で統一する。

```html
<button data-action="page.save">
<button data-action="modal.open">
<button data-action="accordion.toggle">
```

責務には `page`、ページ内関連データ属性の名称、モジュール名、feature名などを使用する。class名はスタイル責務、`data-action` はイベント責務として分けて扱う。

### DOM参照（class / id との分離）

class 名・`id` はスタイル・状態・アンカー等の HTML/CSS 責務用。JavaScript から要素を特定する用途には **class も `id` も使わず**、本ファイルの `data-*` で契約する。識別のためだけに class や id を HTML に追加しないこと。取得方法・例外は `coading.md`「DOM参照」を参照する。
