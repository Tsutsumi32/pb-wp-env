# ワイヤー画像と JSON（subpage-design-implement）

`@subpage-design-implement` の **画像ワイヤー**と **`*wireframe*.json`** の読み方・フィールド仕様。  
判定・優先は `project/design-subpage.mdc`「brief」「情報の優先」。本ファイルに手順の長文を複写しない。

**適用条件**: `refs/` に `*wireframe*` 画像／JSON が **あるとき**に本ファイルの手順・フィールド表を使う。無い場合（経路 C: 仕様メモのみ）は本ファイルをスキップし、brief 仕様メモ＋ brand ＋既存実装で進める（不足扱いにしない）。

## 役割分担

| 資料 | 役割 |
|------|------|
| **画像ワイヤー**（`refs/*wireframe*.{png,jpg,…}`） | **全体の構成・レイアウト・コンテンツ配置・装飾の有無**の主参照。この表現に沿い、`brand.md` に適した実装をする |
| **JSON**（`refs/*wireframe*.json`） | ワイヤーをデータ化したもの。**細かい仕様・実装方法**（レイヤー名、文言、アノテーション、コンポーネント種別など）の確認 |
| **brief 仕様メモ** | 上記よりページ内で優先（`design-subpage`「情報の優先」） |

イメージ: **全体構成はワイヤー画像を見る → 細部・実装方法は JSON を見る**。矛盾時は仕様メモ → 次にブランド。

ワイヤー見た目（グレースケール・エフェクト／角丸なし・border・余白が曖昧等）を直写しない。表現の寄せ方の正本: `design-subpage`「ワイヤーの限界と表現の寄せ方」。構造は崩さない。

## 実装時の進め方

1. ワイヤー画像を Read し、セクション構成・配置・装飾の有無を把握する（色・角丸・余白数値は信用しない）
2. 対応する `*wireframe*.json` を Read し、階層（**FRAME / GROUP 含む**）・`name`・文言・アノテーション・コンポーネント／アセットを突合する（**`UN` 欠落は想定内**）
3. `name` は **Figma 実装時のレイヤー名**と同じ前提で扱う（`figma/figma-rule.mdc`・`figma/assets.mdc` 等）。`un_*` は JSON に `UN` が無くても命名規約で付与
4. タグ構造は JSON の階層（FRAME / GROUP 含む）を **参照**する（絶対ではない。命名・DOM 規約で最終判断）
5. スタイルは `design-subpage`「ワイヤーの限界と表現の寄せ方」＋ brand 各節＋既存画面の類似 UI。variables／mixin（同「variables（実装時）」）。`bounds` / `fontSize` を実装値に直写しない

## JSON ルート

| キー | 内容 |
|------|------|
| `page.name` | 選択ページ名（参考） |
| `root` | 画面ルートノード（通常 FRAME）。以下のノード共通フィールドを持つ |

ノードは入れ子の `children` で階層を表す。

## エクスポート／抽出の前提

ワイヤー JSON のエクスポート側の対象は次を前提にする（実装時に「無いから不足」としない／「無いから無視してよい」と誤らない）。

| 対象 | 扱い |
|------|------|
| **`UN` 付きレイヤー** | **抽出対象外**。JSON に `UN …` が載らなくてよい。画面固有の `un_*` class は JSON の有無に依存せず、命名規約（`project/template/naming.mdc`・`figma/figma-rule.mdc`）で付与する |
| **`FRAME` / `GROUP`** | **抽出対象に含む**。階層・まとまりの参照として読む（スキップしない）。タグ化は DOM 規約で最終判断（余分なラッパーは従来どおり整理可） |

その他（`SECTION` / `LAYOUT` / `INSTANCE` / `TEXT` / `@EXP*` / `:WF` 等）は従来どおり。

## ノード共通フィールド

| フィールド | 意味 | 実装での扱い |
|------------|------|----------------|
| `id` | レイヤー固有 ID | 参照用。コードに必須ではない |
| `name` | レイヤー名 | **Figma 実装時のレイヤー名**として認識。`SECTION` / `LAYOUT` / `@EXP*` / `:WF` 等は各 `figma/`・`project/` ルールに従う。**`UN` は JSON に出ない想定**（上記「エクスポート／抽出の前提」） |
| `type` | レイヤータイプ（`FRAME` / `GROUP` / `INSTANCE` / `TEXT` / `RECTANGLE` 等） | 構造判断の参考。**`FRAME` / `GROUP` も階層に含まれる** |
| `bounds` | `{ x, y, width, height }` | **グループ／フレーム／コンポーネント等のまとまりに付くことが多い**。テキスト・矩形・画像など最小単位には無い想定。**ワイヤー画像との位置照合専用。実装（SCSS の座標・サイズ直写）には使わない** |
| `annotations` | `{ category, content }[]` | Figma アノテーションと同様に指示を把握して反映（カテゴリ UI／UX／機能仕様／原稿／他要件／コンポーネント。正本: `figma/figma-rule.mdc`「アノテーション」）。※エクスポート表記ゆれで `annotaions` の場合も同義として読む |
| `children` | 子ノード配列 | 階層・タグ構造の参照（`FRAME` / `GROUP` 経由の入れ子を含む） |

## テキスト

| フィールド | 意味 | 実装での扱い |
|------------|------|----------------|
| `textContent` | テキスト本文 | **この内容をそのまま**テンプレに載せる。仮テキスト判定（`figma/figma-rule.mdc`「仮テキスト」）に当たれば **TODO 必須** |
| `textStyle` | 適用テキストスタイル名（例: `head/_m` → Code では `head/m` 等。キー変換は `figma/style.mdc` §2） | **該当キーで `font($_key:)`**。無い・不一致は既存キー判断または個別指定（`design-subpage`「variables（実装時）」） |
| `fontSize` | フォントサイズ | **`textStyle` が無いときだけ**付く想定。**ワイヤー側の参考値**。そのまま `s(fontSize)` 固定にせず、既存 `$text-styles` キーか `font()` 値直指定かを同「variables」どおり判断する |

## 画像（`assetType`）

| フィールド | 意味 | 実装での扱い |
|------------|------|----------------|
| `assetType` | `jpg` / `png` / `svg` 等（レイヤーが `@EXP` / `@EXP:PNG` / `@EXP:SVG` 等のとき） | `name` でも判定できるが、**ここに出た拡張子を確認して対応** |

配置手順（`design-subpage`「画像（実装時）」と併用）:

1. ソースは **`sample.jpg` / `sample.png` / `sample.svg`** を `assetType` に合わせて選ぶ（jpg/png は `resources/_origin/`、svg は `assets/images/svg/` の既存）
2. **配置箇所ごとに別名でコピー配置**する（繰り返し項はスロットごと。`design-subpage`「配置箇所ごとの別ファイル」。`sample.*` をテンプレから直接参照しない）
3. **必ず仮画像**として `TODO：画像差し替え（…）` を付ける（`figma/assets.mdc`）
4. **jpg / png**: 表示領域の幅・高さの実装後、その比率で配置済みファイルを crop（正本: `design-subpage`「sample ラスタのアスペクト比 crop」。`aspect-ratio` の付与条件は `scss.mdc`。`svg` は対象外）
5. AI 生成・本番画像の無断作成はしない

## コンポーネント（`componentType` / `componentVariant`）

レイヤー名に **`:WF`** が付くかでエクスポート側が種別を付ける想定。

| `componentType` | 意味 | 実装での扱い |
|-----------------|------|----------------|
| `design` | 本番デザイン由来のコンポーネント／インスタンス | **実装済み部品の利用が基本**。未実装なら下記「`design` 未実装時の取得」 |
| `wireFrame` | ワイヤー専用（`:WF` 付き） | **新規作成が必要**なことが多い。ワイヤー画像＋ JSON 構造＋ brand で実装。**後続画面では既に実装済みのこともあるため、必ず既存 modules／`components.md` を確認**してから新規化判断 |

| フィールド | 実装での扱い |
|------------|----------------|
| `componentVariant` | **コンポーネント対応時は必ず確認** |

#### `design` 未実装時の取得

実装側に該当コンポーネント／バリアントが無いと判断したら:

1. `.cursor/design/brand.md` の **Figma 参照 → コンポーネント一覧 URL** を確認する
2. **記載あり** → その URL を起点に MCP で一覧内の該当コンポーネント（`name` / `componentVariant`）を取得し実装する（主工程は subpage のまま。必要範囲のみ `figma/`）。一覧内に見つからないときだけチャットで通知し、個別 URL または brand の URL 更新を促す
3. **記載なし（空）** → チャットで通知し、**AskQuestion** でコンポーネント名を示して Figma MCP 用 URL の提供を促す（従来どおり）。提供後は MCP で確認して実装。今後のため brand への一覧 URL 記載を勧めてよい

- **`wireFrame`**: バリアントにより要素構成が違う／状態・色の差でワイヤー＋ JSON だけでは断定しにくい場合がある。**バリアント名から適切な対応を判断**し、モディファイア（`__*`）等で実装する（`figma/figma-rule.mdc`「インスタンス・メインコンポーネント・バリアント」の考え方を流用）

## 構造例（抜粋）

```json
{
  "page": { "name": "rule" },
  "root": {
    "id": "582:3065",
    "name": "Frame 76",
    "type": "FRAME",
    "bounds": { "x": 0, "y": 0, "width": 1440, "height": 2703 },
    "children": [
      {
        "name": "LAYOUT container",
        "type": "INSTANCE",
        "componentType": "design",
        "componentVariant": "プロパティ1=md"
      },
      {
        "name": "SECTION about",
        "type": "GROUP",
        "children": [
          {
            "name": "これはサンプルです。これはサンプルです。",
            "type": "TEXT",
            "textContent": "これはサンプルです。これはサンプルです。",
            "textStyle": "head/_m"
          },
          {
            "name": "@EXP:svg",
            "type": "RECTANGLE",
            "assetType": "svg"
          },
          {
            "name": "BLOCK:WF Group 4",
            "type": "INSTANCE",
            "componentType": "wireFrame",
            "componentVariant": "プロパティ1=デフォルト",
            "children": []
          }
        ]
      }
    ]
  }
}
```

## チェック（ワイヤー／JSON）

- [ ] ワイヤー見た目を直写せず、brand 各節＋既存類似 UI に寄せたか（`design-subpage`「ワイヤーの限界と表現の寄せ方」）
- [ ] ワイヤー画像で全体構成・装飾の有無を把握したか
- [ ] JSON とワイヤーを照らし、`name`／文言／アノテーション／アセット／コンポーネントを落としていないか（FRAME / GROUP を階層参照したか。UN 欠落を不足扱いしていないか）
- [ ] `bounds` / `fontSize` を実装寸法に直写していないか
- [ ] `textContent` をそのまま載せ、仮なら TODO したか
- [ ] `assetType` に応じ `sample.*` をコピー配置＋仮画像 TODO したか
- [ ] `design` 未実装時に brand のコンポーネント一覧 URL から取得したか（無ければ AskQuestion で提供を促したか）／`wireFrame` で既存有無を確認したか
- [ ] `componentVariant` を確認し、不足時は AskQuestion またはモディファイアで対応したか
