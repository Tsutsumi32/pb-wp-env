# Figma トークン JSON（Variables / Styles スナップショット）

SCSS 突合せ用の **Figma Variables / Styles の JSON 置き場**です。配置先は本ディレクトリ（`.cursor/figma-tokens/`）。  
差分同期では **ライブ Figma ではなく本 JSON** を Code との比較面にします（`@figma-tokens-sync`）。

| スキル | 使い方 |
|--------|--------|
| `@figma-tokens-setup` | 基盤の初回／全面（リセット → JSON 同期 等） |
| `@figma-tokens-sync` | 継続的な差分（鮮度ゲート → diff → pull / push） |

突合せ規則: `figma/style.mdc` §2〜6・§8。

## ファイル

| ファイル | 内容 |
|----------|------|
| `Space.json` | スペース Primitive（変数コレクション） |
| `_PrimitiveColor.json` | カラーパレット（変数コレクション） |
| `SemanticColor.json` | セマンティックカラー（変数コレクション） |
| `Font.json` | フォント（変数コレクション） |
| `Device.json` | レイアウトトークン PC/SP（変数コレクション） |
| `TextStyles.json` | テキストスタイル一覧 |
| `EffectStyles.json` | エフェクトスタイル一覧 |

## 更新手順（Export）

1. Figma でプラグイン **SCSS Variables Sync** を実行（`figma-plugins/scss-variables-sync/README.md`）
2. **すべてエクスポート** → ZIP を解凍し、**本ディレクトリ（`.cursor/figma-tokens/`）** へ上書き保存
3. 目的に応じて:
   - 基盤の全面反映 → `@figma-tokens-setup`（リセット後に JSON 同期）
   - 差分の pull / push / diff のみ → `@figma-tokens-sync`

## 鮮度ルール

Export は **Figma デスクトップ上のプラグイン操作（ユーザー作業）**。エージェントからは実行できない（指示のみ）。

- **Figma の Variables / Styles を変えたら**、`@figma-tokens-sync` / JSON 同期の **前に必ず** 本ディレクトリを最新 Export で上書きする
- **Code → Figma（push）のあと**も再 Export し、JSON をライブ Figma（＝戻した Code）に揃える
