# Subpage brief: example-slug

この画面の実装入力は次の構成です（案件共通の brand は `.cursor/design/brand.md` 等）。

**必須**: ブランドドキュメント ＋ 本 brief。  
画面構成の渡し方（併用可）:

| 経路 | 渡すもの |
|------|----------|
| A（通常） | 画像ワイヤー ＋ JSON（`refs/`） |
| B | MCP／Figma（その他の参照） |
| C | **仕様メモのみ**（ワイヤー／JSON なし可） |

- page-slug: example-slug
- Status: draft | ready
- Updated: YYYY-MM-DD

## ワイヤー・JSON（ファイル名で自動判定）

`refs/` 内を走査する。**ファイル名に `wireframe` を含むもの**が対象（大文字小文字は同一視。brief への列挙は不要）。**経路 C では無くてよい**（不足扱いにしない）。

| 種別 | 判定 | 用途 |
|------|------|------|
| 画像ワイヤー | `*wireframe*.{png,jpg,jpeg,webp}` 等 | **全体の構成・レイアウト・装飾の有無**（主参照） |
| JSON | `*wireframe*.json` | ワイヤーのデータ化。**細かい仕様・実装方法** |

フィールド・コンポーネント／画像の扱いの正本: `subpage-design-implement/wireframe-json.md`（`design-subpage`「ワイヤーと JSON の読み方」）。
例: `refs/about_wireframe.png`、`refs/about_wireframe.json`

=============================
## その他の参照

ワイヤー／JSON 以外（MCP・Figma URL・その他データ）。**箇条書き**でパスまたは URL と用途を書く。無い場合は「なし」。


## 仕様メモ（優先）

このページ固有の仕様・構成・機能・禁止など。**ここに書いたことは、ワイヤー／JSON／その他の参照より優先**する（案件共通の brand よりは下位）。

経路 C では、セクション構成・コンテンツ・使用コンポーネント・文言・表現方法・禁止などを **ここに詳しく書く**（画面構成の主参照）。無い場合は「なし」（経路 A／B のみのとき）。

- 「なし」
