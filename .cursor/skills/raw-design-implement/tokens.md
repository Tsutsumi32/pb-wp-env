# トークン・タイポ（raw-design-implement）

本スキル経路のカラー／フォント／余白トークン。  
Figma Semantic 運用（`$colors` → 2引数 `get-color`）とは切替わる点がある。

## タイポ（SCSS）

1. `@generate-scssfile` で空骨組み
2. **AI JSON と突合できたテキストすべて**（`un_*` / `bl_*` / `el_*` 問わず）に typography を書く
3. **`font()` はキーなしの値直指定**（`$text-styles` に追記しない）

```scss
@include font(29, 39, 0, 900);
// 別ファミリーが必要なら $_family / $_font-key（既存 $font-configs キー）
color: get-color('neutral-02');
```

- `$_size` / `$_line` / `$_space` / `$_weight` は **すべて必須**（weight 省略不可）
- **タイポは `font()` で完結**（直後に `letter-spacing` / `line-height` 等を重ねない。正本: `project/css/scss.mdc`「`font()` 直指定の完結」）
- `size` / `leading`→line / `tracking`→space（AI tracking はおおむね 1/1000em。`letter-spacing` 換算は近似で可）。渡し方の詳細は同 scss.mdc「`font()` 直指定の引数」
- `fill` → palette キーへ寄せて `get-color('…')`
- JSON 無し・突合不能 → 空のまま。notes / 報告に残す
- 行間の丸め等の一般ルールは `project/css/scss.mdc` / tokens-setup 参照。本スキルは直指定優先
- **本文と同じファミリーなら `$_family` 省略可**（`$base_font`）。別ファミリーだけ明示

## `$font-configs` / `$base_font`（Step 4・必須）

- JSON（または計画の `fontsNeeded`）のフォント種ごとに **無ければ `$font-configs` に追加**（Step 7 の `font()` 前に完了）
- **`$base_font` / `$base_font_key`**: 未設定（`null` / 汎用 `sans-serif` のみ）なら、本文相当で最多のファミリーで **一度セット**する。既に案件値なら変えない（画面／アートボードごとに再判定しない）
- **読み込み**（`FONT_TAGS` / ローカル `files` / `@fontsource` 等）は新規時に調査 → **AskQuestion** → 配置  
  正本: `project-env-setup/reference.md`「C-6 フォント読み込み」（Figma 画面実装時と同じ）
- 内部名（`ATC-…` 等）は対応が取れなければフォールバック＋報告
- **完了禁止**: 使用ファミリーが `$font-configs` に無い、または `$base_font` が未設定のまま Step 7 を完了扱いにしない

## カラー（本スキル経路）

デザインに Semantic が無い前提。variables コメントの「palette 直参照」パターンに寄せる。

### 抽出元

| ソース | 取るもの | 取らない／注意 |
|--------|----------|----------------|
| AI / PS 補助 JSON | `textStyle.fill`、名前付きパス等の fill／stroke | グラデは参考止まりでよい |
| **正本 PNG**（`-annotate` 無し） | **面積の大きい面の色**（背景・帯・大きな塗り） | 細い線・影・写真の中間色・細かい装飾の逐一抽出はしない |
| `*-annotate` 画像 | **色抽出に使わない**（枠色が混ざる） | 構造判定専用 |

JSON で足りる色は JSON 優先。PNG は大きな面の補完。実装に使う色を `$color-palette` に載せるのが目的（全画素の網羅ではない）。

### 反映手順

1. 上記で集めた色のうち、**既存に無い色だけ** `$color-palette` に追加（同色重複キー禁止。仮名 `sample*` 禁止）
2. **`$colors` と 2引数 `get-color` を削除またはコメントアウト**（既に palette 運用なら触らない）
3. `get-color-palette` を **`get-color($_key)`** に寄せる（または同等の1引数 API）
4. 実装 SCSS は `get-color('brand-01')` のように **palette キー直参照**
5. `$color-base-text` 等のフラット変数が壊れる場合は palette 参照に直す

### 既存 `get-color('group','name')` があるとき

`_variables.scss` / `_global.scss` 等、プロジェクト必須ファイルに残っている場合:

- **AskQuestion** のうえ、**palette 直参照へ書き換え**
- 画面 SCSS の旧2引数呼び出しも本スキルで触る範囲は寄せる

既に Semantic `$colors` で本番運用中の案件では、切替前に AskQuestion（スキップ可）。スキップ時は本スキルでも2引数のままにし、palette 追加のみ行う（混在を報告）。

## section / container

おおよその数値でよい（書き出し画像の比率・赤＝セクション／橙＝コンテナ枠・JSON bounds）。ピンクのグループ枠・黒のその他枠は DOM 階層用で、section／container トークンには載せない。

| 対象 | 反映先 |
|------|--------|
| セクション間の上下空き | `$section-sizes` ＋ `ly_section __{key}`（必要ならキー追加） |
| コンテナ幅・左右の扱い | `$container-sizes` ＋ `ly_container __{key}` |

- 近い既存キーがあれば流用。大きく違うときだけ追加
- Variables 厳密突合はしない。`project/css/scss.mdc`「コンテナ・セクション余白」の用途は守る（リスト間への流用禁止）
- `__top` / `__bottom` は片側余白が明らかなとき

## フルスタイル（任意）

依頼明示時のみ。タイポ・色・section／container 以外（装飾・細かい余白）は近似。期待値は低め。
