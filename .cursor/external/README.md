# `.cursor/external/` — 案件固有オーバーライド

共有の `.cursor/rules/` / `.cursor/skills/` とは **分離**した、案件ごとの差分置き場です。  
`rules` / `skills` を最新差し替えしても、ここは残ります。

## ファイル

| ファイル | 作成スキル | 内容 |
|----------|------------|------|
| `project-rules-<key>.md` | `@external-project-rules` | 既存コードを正としたコーディング規約の差分（共有 `project/` より「この案件では」を優先） |
| `figma-conventions-<key>.md` | `@external-figma-conventions` | 他流儀 Figma の読み方メモ（共有 `figma/` より「この案件では」を優先） |

`<key>` はテーマ名または project slug（未指定時は `default` / fileKey 等）。

## 実装時の優先

矛盾するとき: **`.cursor/external/` の「この案件では」 > 共有 `rules/`**。

`@figma-coding` / `@figma-page-implement` / `@figma-batch-implement` / `@coading` 等が、あれば Read する。

## やらないこと

- 共有 `rules/` / `skills/` への案件都合の書き込み（本ディレクトリの目的と逆）
- `tmp` 扱いでの削除（進行中案件の正本。用済みの key だけ手動で消す）
