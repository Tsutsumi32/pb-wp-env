---
name: figma-template-coding
description: >-
  figmaMCPで画面のテンプレート実装（PHP/HTML＋画像＋SCSS空骨組み）。スタイルは含めない。
  Figmaテンプレート、マークアップ、generate-scssfile、画像書き出しの依頼時に使用する。
disable-model-invocation: true
---

# figma-template-coding

figmaMCP で **テンプレートのみ**実装するワークフローです（PHP/HTML＋画像＋`@generate-scssfile`）。スタイルは手動または `@figma-style-coding` / `@figma-coding`。

ルールは共通＋フォールバック（`figma/` 直下）。structured／unstructured ラベルは使わない。

## 必須参照（実装開始前）

**開始時に Read する。** 条件に合わないファイルは読まない（品質のため、条件が曖昧なら読む側に倒す）。

**常時**

- `figma/index.mdc`
- **`figma/figma-rule.mdc`**
- `frontend-base/html.mdc`（PHP 前。閉じタグコメント、vnu で通る構文、アクセシビリティ）
- `project/template/naming.mdc` / `php.mdc`
- 親計画があるとき: Template DOM diffs / Request notes（あれば）
- **`.sample-code/`** — あれば参考（**既存プロジェクトコードがあれば読まない**）。読むときは該当断片のみ・全ツリー禁止（正本: `@coading`）

**条件付き**

| 参照 | いつ Read |
|------|-----------|
| **`figma/assets.mdc`** | 画像・SVG・書き出し候補がある（HTML より前） |
| `project/template/image.mdc` | 同上 |
| **`figma/interpretation.mdc`** | 命名が薄い／構造推定が必要 |
| `figma/responsive.mdc` | 両デザイン（「差分先行」。テンプレは DOM 差分のみ） |
| `project/javascript/swiper.mdc` | Request notes 等で Swiper 明示 |

**同ターン免除**: `@figma-coding` 経由で、**このセクションのこのチャットターンで既に Read 済み**のファイルは再 Read しない（正本: [figma-coding](../figma-coding/SKILL.md)「同ターン再読免除」）。page-implement 外ではソフト停止・新規チャット・次セクションで免除なし。

**ページ実装セッション免除**: 親が `@figma-page-implement` のとき、同一チャット・ソフト停止までは [figma-coding](../figma-coding/SKILL.md)「ページ実装セッション再読免除」。既読の必須参照は次セクションでも再 Read しない。本 SKILL は同型連続の2本目以降は再 Read 不要。巨大ルールは各 `.mdc` 冒頭の **Read map**（必要 § のみ）。

## 画像 crop（必須）

仕様の正: `figma/assets.mdc` **§6-0**。複数 IMAGE fill は **§6-1a〜6-3**（本節を飛ばすと写真 1 枚で終わる）。

- Docker `frontend` 内でのみ crop
- **禁止**: ホスト `npm install sharp` / ホスト crop / 写真向け `get_screenshot` 2x 代替
- 透過 PNG は §8
- **複数 fill**: `use_figma` の `fills` から `visible !== false` の IMAGE だけを、配列順（下から上）のまま `layers` にする。非表示は合成しない。各 layer に `opacity` を必ず渡す（fill に無いときだけ `1`）。`scaleMode: "FILL"` は `fillMode: "object-cover-center"`。単位行列の `imageTransform` は渡さない。`CROP` だけ `imageTransform` をそのまま渡す
- **保存前**: 表示中 IMAGE fill の枚数と `layers` の枚数が一致すること。2 枚以上なのに 1 枚なら書き出さない
- **保存後**: クリップ親の `get_screenshot` と突合する。SAMPLE の格子と `pixta_` ラベルの有無が一致しなければ取り直す

## 実行フロー

```
- [ ] Step 0: ページ新規で pages 未登録なら pages ensure（親 page-implement / figma-coding が済みならスキップ）
- [ ] Step 1: Figma URL・対象フレーム（PC/SP）・PHP パスを確認
- [ ] Step 2: figmaMCP で取得。text / el_textBase 等は必要なら get_metadata。**同型連続の2本目以降**は `figma-page-implement`「同型セクション連続（MCP）」（`get_metadata` 差分 → フルダンプ回避・`excludeScreenshot: true` 既定）
- [ ] Step 3: 命名・構造を整理（薄い場合は interpretation のインベントリ共有）。**アノテーションがあれば確認**し、テンプレに効く指示（**UI**・構造・疑似・**機能仕様**の DOM、**原稿**→ TODO 等）を反映（正本: figma-rule「アノテーション」）
- [ ] Step 4: アセット（assets.mdc「書き出しの優先方針」→ **既存最優先**。無いときのみ書き出し）。種別ごとの **コミット正経路**は同ファイル「MCP の役割分担」＋下表。**INSTANCE は選択バリアント／差し替えを正**（§2・§6-1。デフォルト／マスター禁止）。詳細・検証は §1 / §2 / §6 / §7 / §8。同型連続の crop 検証 Read は怪しい1枚だけ。`.cursor/tmp/` ステージングは最終配置後に削除（正本: `cursour-allways-rules.mdc`「`.cursor/tmp/`」）

| 種別 | コミット正（要約） | やらない |
|------|-------------------|----------|
| 矩形写真 | IMAGE fill 原画像（**hash 実寸と一致するものだけ**）→ §6 crop → JPG（条件により PNG）。**出力は表示枠×PC×2 / SP×4**。斜めは crop せず screenshot。**表示中 IMAGE は全部 `layers`**（`opacity` 必須・`FILL` は `object-cover-center`・枚数不一致は書き出さない。正本: 上「画像 crop」） | asset URL / export の未加工配置・実寸不一致の crop・等倍・実寸のまま・写真 1 枚だけ |
| `@EXP:SVG` | **その nodeId** + `download_assets`（`defaultFormat: "svg"`）の export。**TEXT 含むときはアウトライン化**（正本: `assets.mdc` §2） | 親セクション ID・design_context URL・`svgAssets` 拾い |
| 複合 PNG | `get_screenshot`（`contentsOnly` + `maxDimension`≥長辺×scale）→ **表示枠×倍率（PC×2 / SP×4）へ幅・高さとも一致**。テキストを含むときは目標未満を拡大しない | export（PNG）直保存・等倍・取得のまま・片辺だけ・文字ラスタの拡大 |
| 透過ラスタ | screenshot（同上）または `rawImages` → **同上**（§8） | design_context URL / export（PNG）・等倍・取得のまま・片辺だけ |
- [ ] Step 5: PHP/HTML（figma-rule + naming + html 閉じタグコメント）。**仮テキスト／差し替え画像の TODO**（判定・位置の正本: figma-rule「仮テキスト」／assets「差し替えが必要な画像」。画像は sample／WM 主軸＋**解像度不足**・既存参照も sample／WM 目視）
- [ ] Step 5b: 共通 modules 化した場合 → アノテーション「コンポーネント」を読み `.cursor/design/components.md` に追記（正本: figma-rule「アノテーション」内「コンポーネント」／design-subpage「components カタログ」）
- [ ] Step 6: @generate-scssfile（空 {} のみ。エントリ @use 手書き不要 — npm run dev 前提）
- [ ] Step 7: 可視要素・画像の過不足確認。**仮テキスト／画像 TODO の抜けがないか確認**（配列は定義側）。**編集した PHP のインデントを確認し、ずれがあれば修正**（正本: `project/template/php.mdc`「インデント」）。当該作業の `.cursor/tmp/` スクラッチ（`figma-plans/` 以外）が残っていれば削除
```

Step 0 の正本: [project-page-info/pages-ensure.md](../project-page-info/pages-ensure.md)。セクション部分実装のみならスキップ。

## Step 5 要点

- 分類 `{名}` を正。余白は **section-space / container Variables を主**（任意の `SECTION(...)` / `CONTAINER(...)` は保険）。**非整備（役割不明）**は画面全体から算出したサイズで `ly_section` / `ly_container` を付ける（variables 追記はスタイル工程。正本: `figma-rule.mdc`「セクション・コンテナ余白」）。不足の構造推定は interpretation
- **依頼明示の非整備**: レイヤーから共通断定できなくても、見出し／ボタン／ラベル／カード／下層FV／横断セクション等はコンポーネント化を検討。**近似丸めでの統合禁止**・差は `__*` まで（正本: `figma-rule.mdc`「依頼明示の非整備時のコンポーネント化」）。通常実装では使わない
- **未実装の共通部品**: 画面インスタンスだけで決めず **メインを確認**。バリアントがあれば **種類分**（モディファイア／状態セレクタ）。**当該画面の HTML は選択中バリアント**（デフォルトのまま置かない）。流用時もバリアント判定＋インスタンス差分（色・文言・画像等）。正本: `figma-rule.mdc`「インスタンス・メインコンポーネント・バリアント」
- `slot` は HTML 化しない。画像はレイアウト用ラッパー（常時）> `el_img*`（あるときのみ）> `render_img()`
- `ly_` / `bl_` / `el_` と `un_` を同一タグに併記しない
- class の `_` はルートの次の1段まで。Figma のレイヤー階層を `_` で連結しない（正本: `naming.mdc`「class名の親子関係」）
- 固定テキスト直書き・リストは foreach。**会社名・電話・FAX・住所等は `consts.php` 定数**（`php.mdc`「会社情報・共通定数」）
- **インデント**: PHP を列 0 に落とさない。Step 7 で当該差分を確認・修正（正本: `php.mdc`「インデント」）
- 動的一覧・CPT 等: **0件時も実装**（コメントアウト可）。画像枠は未設定時 **`noImg.jpg`**（`php.mdc`「動的コンテンツ（0件時）」／`image.mdc`「動的コンテンツの画像フォールバック」）
- **TODO**: 仮テキストは figma-rule「仮テキスト」。画像は assets「差し替えが必要な画像」（**sample／WM が主軸**＋**拡大前が目標未満なら解像度不足**。きれいなストックで WM 無しは内容面不要。既存優先時も sample／WM 目視）。位置はいずれも **固定＝参照直前／配列＝定義側**。長文は正本へ
- `_variables` / `$container-sizes` / `$section-sizes` はテンプレ工程では **更新しない**（非整備の算出値の追記は `@figma-style-coding`）
- 両デザイン時: 主はファースト側（通常 PC）。解析済みの **テンプレ影響差分（DOM）のみ** もう一方を見て HTML に入れる。スタイル値の SP 対応はしない。詳細は `figma/responsive.mdc`「差分先行」
- レスポンシブのメディアクエリは書かない（スタイル工程で `figma/responsive.mdc` に従う）

## Step 5b: components.md（共通化時のみ）

共通部品（`modules/blocks|elements` 等）に切り出した場合のみ。手順の長文は複写しない。

- アノテーション **カテゴリ「コンポーネント」** → Role / Use（正本: figma-rule「アノテーション」）
- PHP / Class / SCSS パスをエントリに書く
- ページ固有だけならスキップ

## 完了後

スタイルが必要なら `@figma-style-coding` を案内する。両方まとめて依頼する場合は最初から `@figma-coding`。
共通 modules 化した場合は `components.md` 追記の有無を完了報告に含める。
`.cursor/tmp/` の作業用スクラッチは残さない（`figma-plans/` の進行中計画は除く。正本: `cursour-allways-rules.mdc`）。

**直呼び**で PHP を変更したときは [figma-coding/browser-check.md](../figma-coding/browser-check.md) のコンソール（大差検知はしない）。親が `@figma-coding` / `@figma-page-implement` なら親に任せる。