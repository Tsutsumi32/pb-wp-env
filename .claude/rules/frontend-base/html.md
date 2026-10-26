# HTML記述ルール

HTML/PHPテンプレート共通のHTML記述ルール。コメント、単一子ラッパー禁止、アクセシビリティ、リンク、静的 HTML の画像、data属性、属性順を扱う。

構成: コメント → 単一子ラッパー → アクセシビリティ → リンク → 静的 HTML の画像 → data属性 → 属性順。

HTMLを記述するすべてのファイルで、以下のルールを遵守する。対象は `.html` だけでなく、PHPテンプレート、JSフレームワークのテンプレート、コンポーネント内のHTML相当のマークアップも含む。

## コメント

HTMLコメントは、構造を把握しやすくする目的で **閉じタグの直後の行** に記載する。**開始タグの直前・直後にコメントは付けない**（閉じタグコメントのみ）。

```html
<div class="aaa">
  ...
</div>
<!-- /.aaa -->
```

```html
<!-- NG: 開始タグコメント -->
<!-- .aaa -->
<div class="aaa">
  ...
</div>
<!-- /.aaa -->
```

閉じタグコメントを付ける対象は、ページ要素のグループの親要素、各コンポーネントの親要素、および **内部に複数要素を持つ・グループ的な役割を持つ** 繰り返し要素である。すべてのタグにコメントを付けると煩雑になるため、上記の観点で必要な箇所に限定する。

- コメント形式は `<!-- /.class名 -->`（class が無い場合はタグ名や識別しやすい名前）
- PHP テンプレート・部品ファイルも本ルールに従う

**付けない例（単純な要素）**: テキストのみの `li`、単一行の見出し・段落、子要素が無い（またはテキスト＋`<br>` 程度の）タグ

```html
<!-- OK: 単純な li には閉じタグコメントを付けない -->
<ul class="un_recruit_welfareList">
  <li class="un_recruit_welfareItem">住宅手当（家賃補助）</li>
  <li class="un_recruit_welfareItem">社宅・寮の提供</li>
</ul>
<!-- /.un_recruit_welfareList -->

<!-- OK: 複雑な / グループ的な li には付ける -->
<li class="un_philosophy_value">
  <span class="un_philosophy_pill">...</span>
  <span class="un_philosophy_valueText">...</span>
</li>
<!-- /.un_philosophy_value -->
```

`li` 以外（`div` / `article` 等）も同様。テキストだけ・構造が浅い要素には付けず、ネストした子をまとめるグループ親やコンポーネントルートに付ける。

### 新規作成・追記時（必須）

PHP/HTML を **新規作成・追記するたび**、閉じタグコメントを **実装と同時に** 付与する。完了後の後付けではなく、マークアップ出力の必須要件とする。

**必ず付ける対象**（該当するたびに閉じタグ直後へ `<!-- /.class名 -->`）:

| 対象 | 例 |
|------|-----|
| `main`（レイアウト用ルート） | `<!-- /.ly_main -->` |
| 各 `<section>`（セクション単位のラッパー） | `<!-- /.ly_section -->` または `<!-- /.section_xxx -->` |
| 各コンテナ要素（幅制御用ラッパー） | `<!-- /.ly_container -->` |
| ブロック親（部品のルート要素） | `<!-- /.bl_subMv -->` |
| 画面固有ラッパー（セクション単位の親） | `<!-- /.un_about -->` |
| 複雑な / グループ的な繰り返し要素（`li` 等） | 子要素をまとめる場合のみ付与。テキストのみの `li` には付けない |

内側の小さなラッパーや数行だけの `div` には原則付けない。既存の実装例（サンプルコードや既存テンプレート）がある場合はその閉じタグコメントの付け方を優先する。

```php
<main class="ly_main">
    <div class="un_topMv">
        ...
    </div>
    <!-- /.un_topMv -->
    <section class="ly_section __s __top section_intro">
        ...
    </section>
    <!-- /.ly_section -->
    <section class="ly_section __l section_about">
        <div class="ly_container __m">
            <div class="un_about">
                <div class="un_about_head">...</div>
                <!-- /.un_about_head -->
                <div class="un_about_body ut_space __m">...</div>
                <!-- /.un_about_body -->
            </div>
            <!-- /.un_about -->
        </div>
        <!-- /.ly_container -->
    </section>
    <!-- /.ly_section -->
</main>
<!-- /.ly_main -->
```

## セマンティックHTML

HTMLは文書構造と意味が伝わるように実装する。`header`、`main`、`section`、`article`、`nav`、`footer`、`ul`、`ol`、`dl`、`button` など、用途に合うセマンティックな要素を優先し、意味を持たない `div` や `span` の多用は避ける。

### `section` と見出し

- **`section` には必ず見出し（`h1`〜`h6`）を含める。** 見出しのない `section` は HTML の文書構造として不適切なため禁止する。
- セクションで区切る各要素の **主見出しは `h2`** とする（`main` 配下では `h1` は原則1つ）。
- 同一 `section` 内に主見出しとなる `h2` を2つ置かない。キャッチコピー等は `p` 等の適切な要素を使う。
- デザイン上、セクション見出しを表示しない場合でも、意味上の見出しは `h*` として残す。視覚非表示にする場合は視覚的に隠すユーティリティクラスを併用する。

### 日本語ラベル + 装飾英字見出しの例

日本語ラベルと装飾用の英字見出しを併記するセクションヘッドの実装例。

- 日本語ラベル側を **`h2`**（当該 `section` の主見出し）にする。
- 英字テキストは `aria-hidden="true"` を付けた補助要素として置く。英字を画像の `alt` だけに頼らない。

```html
<div class="el_sectionHead2 __white">
  <h2 class="el_sectionHead2_label">
    代表メッセージ
  </h2>
  <!-- /.el_sectionHead2_label -->
  <div class="el_sectionHead2_head">
    <span class="el_sectionHead2_headText" aria-hidden="true">MESSAGE</span>
  </div>
  <!-- /.el_sectionHead2_head -->
</div>
<!-- /.el_sectionHead2 -->
```

### 単一子要素のラッパー

子要素が **テキスト1要素のみ**（`h1`〜`h6` / `p` / `span` / `a` / `button` など）の場合、それを包むだけの `div` ラッパーは **付けない**。class は子要素側に直接付与する。

- **例外（画像）**: 画像は `<picture>` 等の出力を1階層の `div` ラッパーで包む場合がある。プロジェクトに画像実装ルールがあればそれに従う。出力そのものだけを包む内側 `div` は付けない
- **ラッパーが必要なケース**: 複数子要素のグループ化、flex/grid の配置単位、ページ固有 class と部品 class の分離、疑似要素用の親、JS/CSS 連携で親要素が必要な場合

```html
<!-- NG: 見出し1つだけを div で包む -->
<div class="bl_pageIntro_head">
  <h2 class="bl_pageIntro_catch">ここで働く、<br>人を知る。</h2>
</div>

<!-- OK: class を子要素に直接付与 -->
<h2 class="bl_pageIntro_catch">ここで働く、<br>人を知る。</h2>
<!-- /.bl_pageIntro_catch -->
```

## アクセシビリティ

- 画像には適切な `alt` 属性を記載する。意味を持つ画像は内容や役割が伝わる代替テキストを入れ、装飾目的で意味を持たない画像は `alt=""` とする。リンク画像やボタン画像では、画像の見た目ではなくリンク先や操作内容が分かる文言にする。
- 見出しなどに付与する装飾的なテキスト（日本語見出しに添える英字など）は、読み上げ不要であれば `aria-hidden="true"` を設定する。
- `a` タグはリンクテキストだけで遷移先や目的が分かるようにする。文脈なしでは分かりにくい場合は、`aria-label` で具体的な遷移先や目的を補足する。
- フォーム要素には対応する `label` を用意し、入力目的が分かるようにする。グループ化が必要な場合は `<fieldset>` / `<legend>`、または既存プロジェクトのフォーム実装ルールに従う。
- 操作できる要素には `button` や `a` など適切な要素を使い、キーボード操作やフォーカス順が自然になるようにする。
- 見出し階層はページ構造に沿って順序立て、見た目だけを目的に見出しレベルを選ばない。

## リンク（a タグ）

SNS リンクや外部サイトへのリンクと思われる箇所では、新しいタブで開く想定として `target="_blank"` と `rel="noopener noreferrer"` を付与する。

- **付与する目安**: `href` が別ドメイン、SNS 公式 URL、別タブで開く想定の PDF 等
- **付与しない**: 同一サイト内のページ遷移

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer" class="el_snsLink">公式サイト</a>
```

## 静的 HTML の画像（jpg/png）

静的 `.html` で jpg/png を出すときは、`_origin` 直参照や単一 `<img>` は使わない。画像変換成果物を `<picture>` で **avif → webp → compression** を出し分ける。PHP テンプレートでは `render_img()`（実装は環境の `render-img.php`。呼び出し規約は `.cursor/rules/project/template/image.mdc`。未移行）を使う。SVG は `assets/images/svg/` を `<img>` 直参照する。

| 役割 | パス | HTML での扱い |
|------|------|----------------|
| AVIF | `assets/images/avif/{basename}.avif` | `<source type="image/avif">`（プロジェクトで AVIF が有効なとき） |
| WebP | `assets/images/webp/{basename}.webp` | `<source type="image/webp">` |
| 圧縮フォールバック | `assets/images/compression/{basename}.{jpg\|png}` | `<img src>`（元の拡張子を維持） |

### レスポンシブなし

```html
<picture>
  <source srcset="./assets/images/avif/example.avif" type="image/avif" width="860" height="522">
  <source srcset="./assets/images/webp/example.webp" type="image/webp" width="860" height="522">
  <img src="./assets/images/compression/example.jpg" alt="説明" width="860" height="522" loading="lazy">
</picture>
```

### レスポンシブ（PC/SP 切替）

PC ファースト（SP は `_sp` サフィックス）のときは次の順。`{sp}` はプロジェクトの SP ブレイクポイント（未満判定。例: 768）。

1. SP の avif / webp（`media="(max-width: {sp}px)"`。AVIF 無効時は avif を出さない）
2. **SP の compression**（同じ `media`、**`type` なし**。AVIF/WebP 非対応時の SP フォールバック）
3. PC（基準ファイル）の avif / webp（media なし）
4. `<img src>` は **PC の compression**

```html
<picture>
  <source srcset="./assets/images/webp/example_sp.webp" type="image/webp" media="(max-width: 768px)" width="750" height="900">
  <source srcset="./assets/images/compression/example_sp.jpg" media="(max-width: 768px)" width="750" height="900">
  <source srcset="./assets/images/webp/example.webp" type="image/webp" width="1440" height="720">
  <img src="./assets/images/compression/example.jpg" alt="説明" width="1440" height="720" loading="lazy">
</picture>
```

SP ファースト（PC は `_pc` サフィックス）は、PC 側に `media="(min-width: {pc}px)"` を付け、**PC の compression も `type` なし source** として出し、`<img>` は SP の compression とする。

### 禁止

- `_origin/` を `src` / `srcset` に書くこと
- jpg/png を単一の `<img>` だけで出すこと

## data属性

`data-*` 属性は用途ごとに次の2系統に分ける。混在させない。

| 接頭辞 | 用途 | 正本 |
|--------|------|------|
| `data-*`（`data-css-*` を除く） | JavaScript 連携（イベント、モジュール、機能、要素識別など） | `.claude/rules/project/javascript/naming.md` |
| `data-css-*` | CSS/SCSS によるスタイル制御 | 本セクション + `.claude/rules/project/css/scss.md`「data-css 属性」 |

JavaScript から要素を特定する用途の class / id は HTML に付与しない（`.claude/rules/project/javascript/coading.md`「DOM参照」）。

### `data-css-*`: CSS 連携

CSS/SCSS から状態や文脈に応じたスタイルを当てるための属性。**JavaScript からは参照しない**（動的な状態変更が必要な場合は class または JS 用 `data-*` を使う）。

- 属性名は `data-css-{kebab-case}` とする（例: `data-css-layout="grid"`, `data-css-variant="primary"`）
- 見た目のバリエーションやレイアウト切替など、**スタイル責務**の契約として使う
- 再利用可能な見た目の識別は引き続き `class`（`el_*` / `bl_*` など）を優先し、`data-css-*` は class だけでは表現しづらい状態・文脈の分岐に使う
- PHP/HTML で付与し、SCSS 側で属性セレクタとして参照する

```html
<section class="un_recruit" data-css-layout="split">
```

```scss
.un_recruit {
  &[data-css-layout='split'] {
    ...
  }
}
```

## 属性順

HTML属性は以下の順番で記載する。

1. タグ固有の必須属性
2. タグ固有の任意属性
3. `class` 属性
4. `id` 属性
5. `data-*` 属性
6. その他の属性

```html
<img src="/assets/img/example.jpg" alt="製品Aの外観" width="320" height="180" class="product-card__image" id="product-image" data-image-id="product-a" loading="lazy">
```
