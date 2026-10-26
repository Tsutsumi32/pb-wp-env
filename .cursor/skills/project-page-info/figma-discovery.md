# Figma ページ探索ヒューリスティクス

クライアントごとに構造が異なるため、複数手段で候補を集め、confidence を付ける。

## MCP 呼び出し

```
server: user-figma-developer-mcp
tool: get_figma_data
arguments: { fileKey, nodeId? }
```

`nodeId` 省略時はファイル全体（巨大になりやすい）。ユーザーがキャンバス URL を渡した場合はその node をルートにする。

**複数のフレーム URL**（実装準備できた `pc-*` 等）が渡された場合は、親探索の代わりに各 `nodeId` を候補として列挙してよい（詳細は SKILL「入力 URL」）。

## 探索パターン（優先度順）

### 1. design セクション + pc-* フレーム（牧野電設型）

```
{canvas} → [ページ SECTION] → design (SECTION) → pc-* (FRAME)
```

- ページ名 = 親 SECTION の `name`
- `design_frame` = `pc-*` FRAME の `name`
- confidence: **high**

`design` が `components` 内にネストしている場合あり（例: 募集要項）。`design` SECTION を再帰的に探す。

### 2. 番号付き本番フレーム（秋葉工業型）

- `00_*` … 本番ページ候補
- `01_*` … フォーム系サブページ候補
- confidence: **high**（命名が明確な場合）

### 3. サイトマップ FRAME

名前に `サイトマップ` / `page 一覧` / `sitemap` を含む FRAME 内の `text:` を収集。

- 論理ページ構成の参考（第一階層・第二階層）
- デザインフレームの node_id は別途紐づけが必要なことが多い
- confidence: **medium**（構成把握用）

### 4. フレーム名パターン

| パターン | 扱い |
|----------|------|
| `^pc-`, `^sp-` | デザインフレーム候補（high） |
| `^[ABC]案` | デザイン探索 → 通常 excluded（low） |
| `Components?`, `XD Components` | コンポーネント集 → excluded |
| `version`（INSTANCE） | バージョンラベルのみ。直後の FRAME が本体のことが多い |

### 5. キャンバス直下 FRAME 一覧

ルート CANVAS の直下 CHILD を列挙。上記に該当しないものは **low** で提示し、ユーザー判断に委ねる。

## パース実装メモ

MCP 出力は YAML 風テキスト。ノードは `- id:` の次に `name:` / `type:` が続く。

```python
# type: 処理時に同一 indent の name を pop しない
if stripped.startswith('name:'):
    while stack and stack[-1][0] >= indent:
        stack.pop()
    stack.append((indent, name, None, node_id))
elif stripped.startswith('type:'):
    # update stack[-1] with type; evaluate FRAME rules
```

## 再実行時

- 既存設定と照合し、Figma 候補との差分を報告する。
  - WordPress: `pages.php` / `posts.php` の slug 定数
  - PHP: `resources/htdocs/includes/config/pages.php` の定数と `url`
- 探索ルールのメモはチャット内またはプロジェクト README に残してよい（JSON ファイル化はしない）。

## 出力フィールド（ユーザー確認用・チャット提示）

| フィールド | 説明 |
|------------|------|
| `title` | 表示用ページ名 |
| `section_name` | Figma 親 SECTION 名（あれば） |
| `design_frame` | デザインフレーム名 |
| `node_id` | `1234:5678` 形式 |
| `figma_url` | `...?node-id=1234-5678`（fileKey は meta から） |
| `confidence` | high / medium / low |
| `reason` | 採用理由の短文 |
| 分類 | Step 2 以降: 固定ページ / CPT / 除外 |

---

## 画面上部テキストの抽出（description 用）

各ページの `node_id` をルートに `get_figma_data` を呼ぶか、既存ダンプから該当 FRAME  subtree を抜き出す。

### 優先して拾う TEXT（上から順・フレーム先頭付近）

1. ヒーロー／メインビジュアル直後の **リード文・サブコピー**（paragraph 系 textStyle）
2. **h1 相当**の見出しテキスト（1行目の大きな見出し）
3. セクション冒頭の説明文（ナビ・フッター・ボタンラベル・重複フッター文言は除外）
4. `text:` が複数行（`|-`）の場合は先頭2〜3行まで

### 除外するテキスト

- `Copyright`, `MENU`, `TOP`, 電話番号のみ、住所のみの行
- ナビゲーション項目の羅列
- 同一フレーム内で繰り返される装飾テキスト
- ボタン文言のみ（「もっと見る」「エントリー」単体）

### description 生成への渡し方

- 抽出テキスト + ページ `title` + クライアント名（Figma ファイル名やヘッダーロゴテキストから推定）を材料にする
- 日本語で **約180文字**。文字数は生成後にカウントし一覧に記載する
