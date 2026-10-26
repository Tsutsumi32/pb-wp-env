# figma-tokens-sync リファレンス

SKILL.md の詳細。キー変換・マップ対応の正本は `figma/style.mdc` §2〜6 と `@figma-tokens-setup` の `reference-json.md`（重複記載しない）。

## 同期対象（これだけ）

| JSON | SCSS / 関連 |
|------|-------------|
| `_PrimitiveColor.json` | `$color-palette` |
| `SemanticColor.json` | `$colors`（＋ `ui/*` フラット色、`$color-base-text` / `$color-body-bg`） |
| `Font.json` | `$font-weight-key` / `$font-configs` / `$base_font` / `$base_font_key` |
| `TextStyles.json` | `$text-styles`（`weight` / `size` / `line` / `space`。`font` は同期しない） |
| `Device.json`（＋ `Space.json` 参照） | `$section-sizes` / `$content-space` / `$container-sizes` / `$border-radiuses` / `$border-width` 等 |
| `EffectStyles.json` | `$effects` ＋ `_effects.scss` の `$_effect-styles` |

対象外: size / breakpoint / style-settings / transitions / z-indexes / 画面 SCSS の `un_*` など。

## JSON 鮮度ゲート

`.cursor/figma-tokens/*.json` は **ライブ Figma ではなくスナップショット**。

| 状況 | 行動 |
|------|------|
| Figma を直した／直した可能性があり未 Export | **中断** → Export → `.cursor/figma-tokens/` 上書き → 再開 |
| Figma 未変更で JSON あり | 現行 JSON で Step 2 へ |
| JSON 欠損 | Export を促して中断 |
| Code と Figma の両方を未同期で変更 | **先に Export**（JSON＝Figma）→ diff でキー単位の勝ちを決める |

Export: プラグイン **SCSS Variables Sync** → すべてエクスポート → `.cursor/figma-tokens/`（`.cursor/figma-tokens/README.md`）。

## 差分（Code ↔ JSON）

主エンジンは **ファイル突合**。MCP 全コレクション走査は主差分に使わない。

### 表の列

`category | key | mode | Code | JSON | 操作候補`

- **mode**: Device の PC/SP、Semantic のモード等。単一モードなら `—` または `default`
- pc-first: SCSS `'default'` ↔ Figma PC 相当、`get-breakpoint-key('sp')` ↔ SP 相当（modeId は名前で解決。Export 例の `20:0` / `20:1` をハードコードしない）

### 値の比較メモ

| カテゴリ | Code 側 | JSON 側 |
|----------|---------|---------|
| Device 余白 | 単位なし数値 | 多くは `aliasName`（`space/120`）→ `Space.json` で px 解決して比較 |
| Primitive Color | hex（小文字正規化） | `resolvedValuesByMode` |
| Semantic Color | `get-color-palette('…')` | Alias → Primitive キー（`/` → `-`） |
| TextStyles | `$text-styles` の weight/size/line/space | ローカルテキストスタイル。**`line` は丸め後で比較**（正本: tokens-setup `reference-json`「テキストスタイル」） |

一致判定後、差分だけを Step 4 の候補にする。Code の `line` が長桁で、丸め後が JSON と同じなら `変更`（桁揃え）。桁揃えは **pull のみ**（Figma へは push しない）。

## pull（JSON → Code）

1. 承認済みの `追加` / `変更` のみ `_variables.scss`（必要なら `_effects.scss`）へ反映
2. **差分のみ**。マップ全体の丸ごと差し替え・テンプレサンプル全除去が必要なら `@figma-tokens-setup` へ誘導
3. 画面実装中の「既存キー値変更禁止」は、本スキル承認済み pull では解除（トークン調整扱い）
4. `$text-styles` の `line` は tokens-setup `reference-json`「テキストスタイル」の小数丸めを適用してから書く
5. **Font 差分を pull したとき**: `$font-configs` に不足ファミリーがあれば追記。`$base_font` が未設定（`sans-serif` のみ等）なら本文ファミリーで一度セット（既に案件値なら変えない。正本: tokens-setup「Font」）
6. 完了報告: 更新キー一覧（Font 時は `$base_font_key` / `$base_font` の状態も含める）

## push（Code → Figma）

手段: **MCP `use_figma`**（部分更新）。プラグイン Import は一括・Text/Effect Styles・MCP 失敗時の保険。

### 共通

1. 承認前に書込しない
2. **変えたキー／モードだけ** `setValueForMode`（または Style 更新）
3. コレクション・モードは **名前で解決**
4. 読取 → 書込 → 検証を分割（1 コールに詰め込みすぎない）
5. 完了後 **必ず再 Export を手順付きで依頼**（JSON 追従）。**プラグインの自動実行は不可**。エージェントは指示のみ。ユーザーが `.cursor/figma-tokens/` を上書きするまで JSON は古いまま

### Device / Space

- セマンティック（`space/section-space/*` 等）は **Space Primitive への Alias 優先**
- Code の数値に対応する `space/{n}` が無ければ: Primitive 作成→Alias（推奨）／ユーザー指示時のみ生 FLOAT
- PC だけ／SP だけ／両方、いずれも **diff に出たモードのみ**更新

### Color

- Primitive: hex → `{r,g,b,a}`（0–1）で該当キーを更新または作成（scopes は既存踏襲）
- Semantic: Primitive への **VARIABLE_ALIAS 優先**。`ui/*` はフラット色の扱いを `reference-json`「SemanticColor」に合わせる

### Font

- `$font-weight-key` / `$font-configs` に対応する Variables を更新。scopes は既存に合わせる
- Code 側の `$base_font` / `$base_font_key` は SCSS 専用（Figma Variables に無い想定）。push 対象外。整合は pull／tokens-setup 側
- フォント実体・CDN は本スキル外（`@project-env-setup` C-6 / 画面実装時。調査 → AskQuestion）

### TextStyles / EffectStyles

- Variables より重い。MCP で更新してよいが、失敗・範囲が大きいときは **プラグイン Import** を案内
- `$text-styles` に `font` は載せない／戻さない（`style.mdc` §4）

### push 後チェック

- [ ] 承認キーのみ更新された
- [ ] 非対象モード・キーが無傷
- [ ] 再 Export をユーザーに依頼した（JSON 未更新である旨を報告に含める）

## MCP の位置づけ

| 用途 | 使うか |
|------|--------|
| 主差分（全件） | **使わない**（JSON ↔ Code） |
| push の適用 | **使う** |
| モード名の確認・書込後のスポット検証 | 使ってよい |
| pull | 使わない（JSON → ファイル編集） |

`use_figma` 前に Figma の `/figma-use` スキルを読む（プロジェクト外スキル）。

## `@figma-tokens-setup` との切り分け

| やりたいこと | スキル |
|--------------|--------|
| 初回・全面入れ替え（リセットあり → JSON 同期 or リセットのみ） | `@figma-tokens-setup` |
| 継続的に差分だけ揃える | `@figma-tokens-sync`（本スキル） |
| Variables 未整備・JSON なし | `@figma-tokens-setup` でリセットのみ → 画面実装時に変数化 |
