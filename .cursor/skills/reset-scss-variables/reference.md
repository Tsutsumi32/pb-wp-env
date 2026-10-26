# reset-scss-variables リファレンス

`{フロント}` は SKILL.md の環境判定に従う（PHP: `resources/htdocs/`、WordPress: `resources/wp-dir/wp-content/themes/{WP_THEME_NAME}/`）。

**エージェント**: 本リファレンスは読むだけでなく、スキル呼び出し時に **ファイルへ反映**する。

## 編集ファイル

| ファイル | 操作 |
|----------|------|
| `{フロント}/src/scss/foundation/variables/_variables.scss` | 下記「削除対象」のみリセット |
| `{フロント}/src/scss/foundation/mixins/base/_effects.scss` | `set-effect()` 内 `$_effect-styles` を空に |

---

## 触らないブロック（リセット禁止）

次の範囲は **読み取りのみ**。値の変更・削除・リテラル置換をしない。

| 範囲 | 主な変数 |
|------|----------|
| `/* size */` 〜 `$min-layout-width` | `$design-size-sp/pc`, `$design-height-*`, `$design-container-pc`, `$width-scrollbar`, `$padding-container-pc`, `$min-width-container-pc`, `$min-layout-width` |
| `/* breakpoint */` | `$media-query-strategy`, `$breakpoint-keys`, `$breakpoints` |
| `/* style */` | `$style-settings` 全体 |
| `/* font */`（map・base を除く） | `$font-path-base`, `$font-weight-key`, `$font-family-fallbacks`, フォント用 `@function` |
| `/* color */`（map 本体を除く） | フラット色（`$color-base-text` 〜 `$color-scroll-handle`）、`get-color` / `get-color-palette` の `@function` |

**レイアウト基盤**（上表の size / breakpoint / style）はリセット・JSON 同期の対象外。**手動確認の促しは `@figma-tokens-setup` 完了後**（詳細パスは `@project-env-setup` reference「スタイル基盤」）。フォント・色の案件値は C-1 のトークンスキルで差し替え（`@figma-tokens-setup` reference「サンプル値の除去」）。フォント読み込みは C-6。グローバル UI 色（`$colors` の `ui/*`）はリセット時に **既存値のまま変更しない**。JSON 同期時は SemanticColor の `ui/*` があれば差し替える。

---

## 削除対象（デザイントークン）

`figma/style.mdc` §4〜6 に対応。中身を **空** にする（セクションコメント・getter `@function` は残す）。

### Device / Space 系（案件トークン）

| 変数 | リセット後 |
|------|------------|
| `$section-sizes` | `() !default;` |
| `$content-space` | `() !default;` |
| `$container-max-width-sp` | **削除**（空の `$container-sizes` とセット） |
| `$container-sizes` | `() !default;` |
| `$border-radiuses` | `() !default;` |
| `$border-width` | `() !default;` |

### テキストスタイル

| 変数 | リセット後 |
|------|------------|
| `$text-styles` | `() !default;` |

### フォント設定

| 変数 | リセット後 |
|------|------------|
| `$font-configs` | `() !default;` |
| `$base_font_key` | `null !default;` |
| `$base_font` | `sans-serif;`（`$font-configs` 投入後に `get-font-family($base_font_key)` へ差し替え） |
| `$font-weight-default` | **削除**（残っていれば除去。直指定 `font()` の weight デフォルトは無い） |

### カラー

| 変数 | リセット後 |
|------|------------|
| `$color-palette` | `() !default;` |
| `$colors` | **分類キーは残す**。`ui` 以外（text / background / border / icon-decoration 等）は `()` に空化。**`ui` はキー・値とも既存のまま変更しない** |

```scss
// 例: ui の中身はファイル上の既存値をそのまま残す（下記は構造の例であり、値のテンプレートではない）
$colors: (
  'default': (
    'text': (),
    'background': (),
    'border': (),
    'icon-decoration': (),
    'ui': (
      // ← 既存のキー・値をそのまま残す（置換・削除しない）
    ),
  ),
) !default;
```

- ファイルに上記以外の分類キー（例: `state`）がある場合も、**キーは残して中身だけ `()`** にする（削除しない）
- 標準グループ（`text` / `background` / `border` / `icon-decoration` / `ui`）が無い場合は、空 map としてキーだけ足す。**`ui` にテンプレート値を入れない**（既存 `ui` があるときだけその中身を残す）

### エフェクト（変数側）

| 変数 | リセット後 |
|------|------------|
| `$effects` | `() !default;` |

### エフェクト（mixin 実値）

`mixins/base/_effects.scss` の `set-effect()` 内:

```scss
$_effect-styles: (
  // MCP 実装時に figma/style.mdc §5 に従い追記
);
```

---

## 保持対象（削除しない）

### `_variables.scss`

- 「触らないブロック」一覧のすべて
- `$font-s-base`, `$font-size-min`
- `$image-paths`, `$heights`, `$transitions`, `$z-indexes`
- `$colors` の **分類キー**（`ui` 以外は空 map）と **`ui` の既存値**
- 各 `@function` / `@mixin` の **定義本体**

### その他 SCSS

- `pages/`, `modules/` は **変更しない**（grep で参照警告のみ）

---

## 実行後チェック

```bash
rg "get-color\\(|get-text-style\\(|'head/|section\\(|content-space\\(|container\\(|set-effect\\(" \
  {フロント}/src/scss/pages {フロント}/src/scss/modules
```

`$text-styles` 等を空にした場合、pages / modules の参照は `@figma-coding` でトークン追記後に解消する想定。

---

## 関連スキル

| タイミング | スキル |
|------------|--------|
| リセット前後の順序 | `@project-env-setup` の C-1 |
| リセット後 | `@figma-tokens-setup` / `@figma-coding` |
| JSON 同期 / リセットのみ | `@figma-tokens-setup` |
