---
name: figma-js-coding
description: >-
  Figma実装に伴うJavaScriptを実装する。依頼でJS/Swiper等が明示されたとき、
  またはアノテーションのUX/機能仕様があるとき、figma-codingから呼ばれたときに使用する。
  単体呼び出しは稀。推定だけで大きなJSを追加しない。完了後はnpm run lint。
disable-model-invocation: true
---

# figma-js-coding

Figma 由来の画面に必要な **JavaScript のみ**を実装する。  
**依頼で JS／Swiper／メニュー開閉などが明示されているとき、またはアノテーションの UX / 機能仕様（動き・機能が要る他要件も含む）があるとき**動かす。Figma 見た目からの動作推定だけで大きな処理は足さない。

通常は `@figma-coding`（template → style の後）から呼ばれる。単体利用は稀。

## 必須参照

**開始時に Read する。** 条件に合わないファイルは読まない。

**常時**

- `frontend-base/javascript.mdc`
- `project/javascript/coading.mdc`（**既存流用**・配置判断・`data-*`・`createPage`）
- `project/javascript/naming.mdc`
- 親から渡された Request notes / 依頼の JS 要件 / 計画 Notes の UX／機能仕様（チャット記憶に頼らない）

**条件付き**

| 参照 | いつ Read |
|------|-----------|
| **`project/javascript/swiper.mdc`** | Swiper 明示時 |
| `figma-template-coding` / `figma-rule` 範囲 | テンプレ側の `data-*` 不足で HTML 追記が必要なとき（`coading.mdc`「画面JS実装時の手順」） |

**同ターン免除**: `@figma-coding` 経由で **このセクションのこのチャットターンで既に Read 済み**なら再 Read しない。JS 固有の常時参照が未読なら必ず Read。ソフト停止・新規チャット・次セクション・JS 単独では免除なし（正本: [figma-coding](../figma-coding/SKILL.md)「同ターン再読免除」）。

## 前提

- PHP/HTML が対象範囲について存在する（無ければ先にテンプレを促す）
- ビルドは実行しない（`npm run dev` 前提。`cursour-allways-rules.mdc`）
- 動作仕様は **依頼内容およびアノテーションの UX / 機能仕様** を正とする（正本: figma-rule「アノテーション」）。見た目からの推定はしない。曖昧なら確認してから実装する

## 実行フロー

```
- [ ] Step 1: 依頼の JS 要件とアノテーション（UX / 機能仕様／動きが要る他要件）を確認。いずれも無ければ本スキルを実行しない
- [ ] Step 2: 既存 feature / module / has_・animations を確認（流用優先。正本: coading.mdc「既存の流用」）
- [ ] Step 3: 対象 DOM を洗い出し、必要なら data-* / has_ をテンプレへ付与
- [ ] Step 4: 配置判断（pages / modules / features / project 配下。全画面共通の初期化は `initProject.js`・`initCommon` は触らない）。流用時は初期化呼び出しが主
- [ ] Step 5: JS 実装（_template.js・coading.mdc・swiper.mdc）
- [ ] Step 6: resources で npm run lint（失敗なら修正して再実行）
```

## 実装要点

- **既存流用優先**（Swiper・scrollObserver＋`has_observer_*` 等）。同等の新規実装をしない（`coading.mdc`「既存の流用」）
- DOM 参照は **class / id 禁止**。`data-*` 定数経由（`coading.mdc`）
- ページ固有は `src/js/pages/`。横断再利用は `modules` / `features`（プロジェクト内のみなら `*/project/`）。プロジェクト共通の初期化呼び出しは `setup/project/initProject.js`（`initCommon.js` は横断の大元。正本: `coading.mdc`「JavaScriptの配置判断」）
- ページエントリは末尾で `createPage`
- Swiper は `swiper.mdc`（`slidesPerView`・fluid `spaceBetween` 等）に従う
- スタイルの本実装は `@figma-style-coding` 側。本スキルで SCSS を増やしすぎない（JS 用の最小クラス／`has_` 契約に限る。既存 `animations/` を優先）

## 完了報告

- 追加・変更した JS パス
- 付与した主な `data-*`
- lint 結果（成功／修正内容）
- **直呼び**で JS を変更したときは [figma-coding/browser-check.md](../figma-coding/browser-check.md) のコンソール（大差検知はしない）。親が `@figma-coding` / `@figma-page-implement` なら親に任せる
