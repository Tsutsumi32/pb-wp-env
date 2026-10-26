---
name: figma-tokens-setup
description: >-
  SCSSトークン基盤の設定。必ず先にリセットし、続けてJSON同期・何もしない（リセットのみ）のいずれかを選ぶ。
  デザイントークン、variables一括、Figma JSON同期の依頼時に使用する。
disable-model-invocation: true
---

# figma-tokens-setup

案件の SCSS トークン基盤を整えるスキルです。**毎回必ずリセットから始める**。

初回の画面横断 MCP 調査による投入は行わない。過不足は画面実装時（`@figma-style-coding` / `@figma-coding` 等の変数化ルール）で対応する。

## 実行順（必須）

### Step 1: リセット（例外なし）

`@reset-scss-variables` を実行する（同一ターンで編集可）。

- 空にする: text-styles・section/content/container 系・border・effects・**`$color-palette`**・**`$font-configs`** 等。**`$colors`** は分類キーを残し **`ui` 以外**を空に（**`ui` の値は変更しない**。`$base_font` は `sans-serif`）
- **保持**: size / breakpoints / style-settings / **`$colors` の分類キーと `ui` の既存値**
- 詳細: `reset-scss-variables/SKILL.md` + `reference.md`

### Step 2: 方式の確認（必ずユーザーに選ばせる）

| 選択肢 | 内容 | 詳細 |
|--------|------|------|
| **JSON 同期** | `.cursor/figma-tokens/*.json` から一括反映 | [reference-json.md](reference-json.md) |
| **何もしない** | リセットのみで終了。以降の画面実装で都度追記 | — |

### Step 3: 選択した方式を実行

- JSON: reference-json の手順。JSON が無ければ Export → `.cursor/figma-tokens/` を促してから同期する
- 何もしない: Step 1 のサマリーを報告する

### Step 3 完了ゲート（方式別・必須）

| 方式 | 完了条件（未充足なら「同期完了」にしない） |
|------|------------------------------------------|
| **JSON 同期** | `$font-configs` が空でない。**`$base_font_key` が非 null** かつ **`$base_font` が `sans-serif` のみでない**（`get-font-family($base_font_key)`）。Font.json の各ファミリーが `$font-configs` にある |
| **何もしない** | `$base_font` が `sans-serif` のまま終了してよい。完了報告で **「フォントは画面実装の §6 ゲート／`@figma-style-coding` で追記」** と明記する |

## 完了後（必須）

方式（JSON 同期 / リセットのみ）に **関係なく**、完了報告の末尾で **レイアウト基盤の手動確認を促す**（リセットでは触らないため）。勝手に編集せず、ユーザーに確認を取る。

促す対象（`_variables.scss`）:

| 項目 | 変数例 |
|------|--------|
| デザインサイズ | `$design-size-sp` / `$design-size-pc` 等 |
| メディアクエリ方針 | `$media-query-strategy` |
| ブレイクポイント | `$breakpoint-keys` / `$breakpoints` |
| レスポンシブ設定 | `$style-settings` |

文言の例: 「レイアウト基盤（design-size / breakpoint / style-settings 等）はリセット・JSON 同期の対象外です。案件の Figma フレーム幅に合わせて手動確認・変更しますか？」

続けて画面実装は `@figma-template-coding` / `@figma-style-coding` / `@figma-coding`。不足トークンの変数化・使用は各実装ルールに従う。

継続的な差分同期（リセットなし・Code↔JSON・push）は `@figma-tokens-sync`。

## 関連

- 突合せのキー規則: `figma/style.mdc` §2〜6
- サンプル値除去: reference-json「サンプル値の除去」
- 差分同期: `@figma-tokens-sync`
- レイアウト手動の詳細パス: `@project-env-setup` reference「スタイル基盤（C-2〜C-5・手動）」
- Font / `$base_font` 手順の正本: [reference-json.md](reference-json.md)「Font」
