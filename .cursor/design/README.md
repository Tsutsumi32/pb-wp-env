# デザイン資料（`.cursor/design/`）

Cursor / Claude 共通。用途でディレクトリを分ける。手編集してよい。

## 用途

| パス | スキル | 内容 |
|------|--------|------|
| `brand.md` / `components.md` / `pages/` | `@subpage-design-implement` | 情報起点（brief・ワイヤー） |
| `exports/` | `@raw-design-implement` | 整っていない書き出し（PNG・任意 annotate／AI JSON） |

## 下層（subpage）入力

1. **ブランドドキュメント**（`brand.md`）
   - **その他特記事項** … 手動
   - **表現の方針** … 実装済み TOP・下層から調査生成（`Expression-status: pending|ready`）
2. **画像ワイヤー**（`refs/*wireframe*.{png,jpg,…}`）**または MCP／Figma**
3. **JSON**（`refs/*wireframe*.json`）
4. **画面別 brief**（仕様メモはこのページではワイヤー等より優先）

## ディレクトリ

```
.cursor/design/
  brand.md                 … 特記事項（手動）＋表現の方針（生成）。判定: Expression-status
  components.md            … 共通部品索引
  pages/<page-slug>/
    brief.md
    refs/                  … ワイヤー画像・JSON・その他
  pages/_example/          … brief 記入例
  exports/<page-slug>/     … raw-design 用書き出し（README 参照）
  exports/_example/
```

（旧 `brand-extracted.md` は使わない。表現の方針は `brand.md` に統合）

- ワイヤー／JSON: `project/design-subpage.mdc`「brief」＋ `subpage-design-implement/wireframe-json.md`
- brand: `project/design-subpage.mdc`「brand」＋ `brand.md`
- exports: `@raw-design-implement` の `exports.md`

## 使い方（subpage）

1. （任意）`brand.md`「その他特記事項」を手で書く
2. `@subpage-design-implement` 初回 → `Expression-status: pending` なら **表現の方針を生成して停止・報告**
3. 確認後、再度同スキル＋ page-slug で実装（`ready` なら生成スキップ）
4. 画面ごと: `_example` をコピー → `refs` に `*wireframe*` → brief を埋める

## 使い方（raw-design）

1. `exports/<page-slug>/` に正本 PNG（＋任意で `-annotate`・AI JSON）を置く
2. `@raw-design-implement` ＋ slug（手順は当該スキル）

計画・一時は `.cursor/tmp/`。本ディレクトリは案件資産として残してよい。
