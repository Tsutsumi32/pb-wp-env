---
name: subpage-design-implement
description: >-
  Figma一括ではなく、ブランドドキュメント＋画面別briefで下層ページをデザイン検討から実装する。
  画面構成の渡し方は (A) 画像ワイヤー＋JSON (B) MCP／Figma (C) 仕様メモのみ（ワイヤー／JSONなし可）。
  実装前に pages ensure（未登録なら追記）。
  brand.md の Expression-status が pending なら先に表現の方針を実装調査で生成し、必ず停止・報告する。
  page-slug 指定が無ければ design/pages を走査し AskQuestion で対象を選ばせる。
  スタイルは brand（特記事項→表現の方針）＋既存実装。components.md は積極利用・必須ではない。
  refs の *wireframe* 画像／JSON があれば自動判定（全体＝画像・細部＝JSON。正本 wireframe-json.md）。brief 仕様メモはページ内優先。
  画像は既存または sample.*／noImg 等を配置箇所ごとに別名コピー（同一パス使い回し禁止・common_* 意図的共有のみ。sample.* 直参照禁止・AI生成しない）。
  jpg/png はスタイル後に表示領域のアスペクト比へ crop（svg 対象外）。
  本番文言が無いテキストは役割説明 or (仮)付き想定文＋TODO必須。
  subpage-design-implement、下層ページ、情報起点のデザイン実装の依頼時に使用する。
disable-model-invocation: true
---

# subpage-design-implement

下層ページを **情報・参考資料起点**で、デザイン検討から実装する。  
入力: **brand ＋ brief は必須**。画面構成は **A** ワイヤー＋JSON／**B** MCP・Figma／**C** 仕様メモのみ（ワイヤー・JSON なし可）。正本: `design-subpage`「brief」。  
Figma カタログ／`figma-page-implement` とは別系統（参考に Figma URL があっても主工程は本スキル）。

## 必須参照

- `project/design-subpage.mdc`（**brand（Expression-status・表現の方針）**・**components**・**brief**・variables・画像・テキスト・TODO・コンポーネント化）
- [wireframe-json.md](wireframe-json.md)（ワイヤー画像と JSON の役割分担・フィールド仕様）
- `.cursor/design/brand.md`（特記事項＋表現の方針。生成済み判定は `Expression-status`）
- `.cursor/design/components.md`
- `.cursor/design/pages/<page-slug>/brief.md`（記入例: `pages/_example/brief.md`）
- コーディング: `project/` / `frontend-base/`（既存コードがあれば **既存を優先**）
- pages 登録: [project-page-info/pages-ensure.md](../project-page-info/pages-ensure.md)（Step 1b）
- AskQuestion: [project-page-info/SKILL.md](../project-page-info/SKILL.md)「進め方（AskQuestion 優先）」
- TODO: `figma/figma-rule.mdc`／`figma/assets.mdc`
- 参考に Figma があるときのみ、必要な範囲で `figma/`（本スキルを figma-page-implement に切り替えない）

## やること / やらないこと

| やる | やらない |
|------|----------|
| **page-slug 指定時はその1件のみ** | slug 無しで `pages/` 全件を勝手に実装する |
| slug 未指定時は候補一覧＋**AskQuestion** | slug 未指定のまま実装開始 |
| **`Expression-status: pending` なら brand「表現の方針」を生成 → 停止・報告** | 未生成のまま実装へ進む／特記事項を上書き |
| `Expression-status: ready` なら再生成せず実装へ | 無断で brand を再生成 |
| brand / brief / components の確認。ワイヤー・JSON はあれば読む（経路 C では無くてよい） | brief 無しでの実装開始／経路 C でワイヤー提供を求める |
| **スタイルは特記事項 → 表現の方針各節 → 既存の類似 UI**（`design-subpage`「ワイヤーの限界と表現の寄せ方」） | ワイヤー見た目（グレースケール・角丸なし等）の無条件丸写し |
| `components.md` 積極利用 | カタログ外を禁止する |
| 経路 A: ワイヤーで全体・JSON で細部（[wireframe-json.md](wireframe-json.md)）。経路 C: 仕様メモが主参照 | `bounds` を実装値に直写 |
| **仕様メモをワイヤー／JSON より優先** | 仕様メモ無視 |
| `design` 未実装は brand のコンポーネント一覧 URL（無ければ AskQuestion）／`wireFrame` は既存確認のうえ brand 準拠 | 黙って進める／二重実装 |
| pages ensure | 未登録のまま実装 |
| **画像は配置箇所ごとに別名コピー**（`sample.*` 直参照・同一パス使い回し禁止。jpg/png はスタイル後 crop） | `sample.*` 直参照／同一パス使い回し／未 crop のまま完了／AI 生成 |
| 仮テキスト・仮画像に TODO | TODO なしで残す |
| チャット報告は短く | 規約のスキルへの複写 |

## 実行フロー

```
- [ ] Step 1: page-slug 確定（正本: design-subpage「対象画面の選び方」）
- [ ] Step 1（続き）: brief 存在確認（無ければ整備促し・実装しない）
- [ ] Step 1a: brand 生成ゲート（Expression-status。正本: design-subpage「brand」）
      → pending なら表現の方針を生成し Expression-status: ready → 【ここで停止・報告】実装しない
      → ready ならスキップして続行
- [ ] Step 1b: pages ensure
- [ ] Step 2: brand.md + components.md + brief.md を Read
- [ ] Step 3: 既存踏襲先の確認
- [ ] Step 4: *wireframe* 画像／JSON（あれば）＋その他の参照。無ければ仕様メモ主（wireframe-json.md／design-subpage「brief」）
- [ ] Step 5: 方針を内部決定（確認待ちなし。brand 生成停止は除く）
- [ ] Step 6: 実装
- [ ] Step 7: 自己チェック
- [ ] Step 8: 完了報告
```

## Step 1: 入力・対象画面

### page-slug があるとき

- その **1件のみ**。パス: `.cursor/design/pages/<page-slug>/`
- brief が無い／`_example` のまま → 整備を促し **実装しない**

### page-slug が無いとき（AskQuestion）

1. `.cursor/design/pages/` を走査（**`_example` 除外**）
2. 候補表（slug / brief / 実装推定）を出す
3. **AskQuestion** で対象確定（通常 1 件）
4. brief 無しは整備促し・その slug は実装しない
5. 確定後は「page-slug があるとき」と同じ（1a 以降）

## Step 1a: brand 生成ゲート（必須・未生成時は停止）

正本: `project/design-subpage.mdc`「brand」。

1. `.cursor/design/brand.md` の **`Expression-status`** を読む（無い・不明 → **pending**）
2. **`ready`** → 再生成せず Step 1b へ（「再生成」「brand を更新」明示時のみ上書き。**その他特記事項・Figma コンポーネント一覧 URL は触らない**）
3. **`pending`** → 次を実行して **停止**
   - 実装済み TOP・下層（通常各 1+）と modules / foundation / `_variables.scss` 等を調査
   - `brand.md` の **表現の方針**各節を記入（扱い方の要約。値の全文羅列はしない）
   - `Sources` / `Updated` を更新し **`Expression-status: ready`**
   - **その他特記事項・Figma コンポーネント一覧 URL は上書きしない**
   - **ページ実装・ensure・ワイヤー実装には進まない**
   - チャットで短く報告して終了: Sources、記入した節の要点、`Expression-status: ready`、次は同スキルで実装依頼すれば続行できる旨

## Step 1b: pages ensure（必須）

[project-page-info/pages-ensure.md](../project-page-info/pages-ensure.md) を Read し、対象 slug を確認／追記。  
Figma URL があればブランチ A、無ければ B。未完了のまま Step 2 以降に進まない。

## Step 2〜4: 資料の読み方

正本: `design-subpage`「情報の優先」「brief」＋ [wireframe-json.md](wireframe-json.md)。

- **スタイル**: 特記事項 → 表現の方針各節 → 既存の類似 UI（正本: `design-subpage`「ワイヤーの限界と表現の寄せ方」）
- **画面固有**: brief 仕様メモ（経路 C では主参照）／あればワイヤー／JSON／その他の参照
- **ワイヤー画像があるとき**: 全体構成・装飾の有無のみ（色・角丸・余白数値は信用しない）／**JSON**: 細部・実装方法（無いときは wireframe-json の手順をスキップ）

## Step 5: デザイン方針（確認待ちなし）

仕様メモ → brand 各節 →（あれば）ワイヤー構成 → JSON の順で矛盾を解く。要素ごとに既存類似 UI を確認。`components.md` 流用と、JSON があるときの `design`/`wireFrame` 方針を整理。チャットに長文を出さない。

## Step 6: 実装

- brand「表現の方針」各節＋特記事項＋既存類似 UI に揃え、コンポーネント化は `design-subpage`＋`php.mdc`
- **画像**: 参照ごとに `sample.*` 等を **別名コピー配置**（同一パス使い回し禁止。`common_*` 意図的共有のみ。直参照禁止）→ テンプレ参照＋仮画像 TODO → スタイル後に **jpg/png を表示領域のアスペクト比で crop**（`design-subpage`「画像（実装時）」）。`svg` は crop 対象外
- テキスト・variables・TODO は `design-subpage`／（JSON があれば）wireframe-json
- JS は依頼・仕様メモ明示時のみ。ビルドは走らせない

## Step 7: チェック

- [ ] `Expression-status: ready` か（pending のまま実装していないか）
- [ ] 特記事項・表現の方針各節を反映したか／特記を消していないか／ワイヤー見た目の直写をしていないか
- [ ] 要素ごとに既存類似 UI を確認したか（`design-subpage`「ワイヤーの限界と表現の寄せ方」）
- [ ] `components.md`／brief／（あれば）ワイヤー・JSON（wireframe-json チェック）。経路 C は仕様メモで構成を満たしたか
- [ ] JSON があるときの `design`／`wireFrame`／`componentVariant`
- [ ] 画像: 配置箇所ごと別名（`sample.*` 直参照なし・同一パス使い回しなし）／TODO／jpg・png のスタイル後 crop／テキスト仮判定／variables
- [ ] そのページの確認（vnu と HTML / SCSS / JS の規約。正本: `figma-page-implement/page-check.md`）

## コンテキスト

- 正本は `.cursor/design/`。部品索引は `components.md`
- 旧 `brand-extracted.md` は新規作成しない
- 任意メモ: `.cursor/tmp/figma-plans/_subpage-<page-slug>.md`（不要なら削除）

## 完了報告

### brand 生成のみで停止したとき

- Expression-status: ready
- Sources
- 表現の方針の要点（短く）
- 次の依頼で実装に進める旨

### ページ実装まで完了したとき

- page-slug / brief
- brand: ready（利用）／再生成（明示時）
- components／仕様メモの要点／（あれば）ワイヤー・JSON
- 変更ファイル／TODO／Open questions
