---
name: reset-scss-variables
description: >-
  案件固有の SCSS トークン（text-styles・section/content/container 系・border・effects・$color-palette・$font-configs）を空にリセットする。
  デザインサイズ・ブレイクポイント・style-settings は保持する。
  $colors は分類キーを残し ui 以外を空にする（ui の値は既存のまま変更しない）。$base_font はシステムフォールバックへ。
  reset-scss-variables・Figma MCP 実装前の指定時に使用する。
disable-model-invocation: true
---

# SCSS 変数リセット

**タイポ・スペース・エフェクト・カラー・`$font-configs`** など案件差し替え用トークンを空に戻す。**レイアウト基盤**（size / breakpoint / style-settings）は触らない。`$colors` は **分類キーを残し**、`ui` 以外の中身だけ空にする（**`ui` の値は既存のまま変更しない**）。

## スキル呼び出し時（必須）

`@reset-scss-variables` 指定時は **同一ターンでファイルを編集**する（「スキップ」「中止」のときのみ中止）。

## いつ使うか

- `@project-env-setup` の **C-1** または `@figma-tokens-setup` の Step 1 として実行するとき
- `@figma-tokens-setup` の前に前案件の **text-styles / space / effects / color / font-configs** を消したいとき

## 触らない（重要）

[reference.md](reference.md) の「触らないブロック」は **一切編集しない**:

- **size** 節（`$design-size-*` 等）
- **breakpoint** / **style-settings**
- **font**（`$font-path-base` / `$font-weight-key` / `$font-family-fallbacks` / フォント用 `@function`。`$font-configs`・`$base_font*` は削除対象）
- **color**（フラット色行 / `get-color`・`get-color-palette` の `@function`。`$color-palette` は空化。`$colors` は下記）

## 実行フロー

```
- [ ] Step 1: 触らない範囲を確認
- [ ] Step 2: reference の削除対象のみ _variables.scss を更新
- [ ] Step 3: _effects.scss の $_effect-styles を空にする
- [ ] Step 4: grep とサマリー報告
```

## 完了報告

- 空にした map（section-sizes, text-styles, effects, **`$color-palette`**, **`$font-configs`** 等）と **`$colors`（ui 以外を空・ui は値未変更）**
- **保持した** ブロック（size / breakpoints / style-settings / **`$colors` の分類キーと `ui` の既存値**）
- 次手順: `@figma-tokens-setup` / `@figma-template-coding` / `@figma-coding` または C-2 以降（トークンスキルで font / color を案件値に差し替える）

## 禁止・注意

- `$color-palette` / `$font-configs` は `() !default;` にリセットする
- `$base_font_key: null`、`$base_font: sans-serif`（案件フォント投入まで）
- `$font-weight-default` が残っていれば **削除**（直指定 `font()` の weight デフォルトは無い）
- `$colors` は **分類キーを残す**。`ui` 以外は `()` に空化。**`ui` のキー・値は既存のまま変更しない**（テンプレート値への置換禁止）
- 触らないブロックをリテラル置換・削除しない
- `pages/` / `modules/` を直さない

## 追加リソース

- [reference.md](reference.md)
- `.cursor/rules/figma/style.mdc`
