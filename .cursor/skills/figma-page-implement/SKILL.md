---
name: figma-page-implement
description: >-
  ページフレーム全体を計画に沿ってセクション単位でFigma実装する監督スキル。
  計画ファイルを正本に再開・セクション再ブート対応。全セクション done 後はブラウザで
  コンソール確認と大差検知（Cursor は cursor-ide-browser。見た目の自動修正はしない）、
  およびそのページだけの確認（vnu、HTML / SCSS / JS の規約。正本 page-check.md）。
  ページ全体実装、figma-page-implement、ページを一通りコーディングの
  依頼時に使用する。セクション単体はfigma-coding等を直接使う。lint・commit・px差分検証は含まない。
disable-model-invocation: true
---

# figma-page-implement

ページフレーム全体の **監督スキル**。計画ファイルを正本とし、セクション単位で実装する。

セクション URL での部分実装は本スキルを使わず、`@figma-coding` / `@figma-template-coding` / `@figma-style-coding` を直接使う。  
複数 screen は `@figma-batch-implement`（本スキルを screen ごとに呼ぶ）。

## コンテキスト原則（必須）

会話履歴は忘れる前提で動く。次を守る。

| 原則 | 内容 |
|------|------|
| 正本 | `.cursor/tmp/figma-plans/<page-slug>.md` のみを進捗・依頼条件の正とする |
| 再ブート | **セクション開始時**は計画の当該行＋Progress＋実装 Skill（下記）。**本 SKILL 全文**は Phase 0／resume／親 batch の screen 開始時のみ Read（セクション毎に繰り返さない） |
| 依頼条件 | `Request notes` から引き継ぐ。チャットの記憶に頼らない。計画 Notes の **UX／機能仕様**も実装スキルへ渡す |
| 外部オーバーライド | `.cursor/external/` に `figma-conventions-*.md` / `project-rules-*.md` があれば Phase 0 で Read。「この案件では」は共有 `rules/` より優先 |
| 報告 | チャットは短く。完了の記録は計画の Status / Progress 更新が本体 |
| ソフト停止 | **1 本完了でのソフト停止は禁止**。2〜3 は具体理由があるときのみ可。4 到達後は理由なしで可。**`pending`/`blocked` が残る状態でターンを終えるときはラベルを問わず Resume paste 必須**。**Resume paste の入口は本スキル**（screen 完了後のバッチ継続は `@figma-batch-implement`） |
| Interaction | 親バッチの `Interaction` / 依頼の `unattended` を引き継ぐ。正本は [figma-batch-implement/unattended.md](../figma-batch-implement/unattended.md) |
| コンテキスト防衛 | 同型連続の MCP 差分取得（下記「同型セクション連続」）・セッション内ルール再読免除（正本: `@figma-coding`） |

## 位置づけ

| フェーズ | 内容 | 今のスコープ |
|----------|------|----------------|
| Phase 0 | モード判定（初回 analyze / 再開） | **含む** |
| Phase 0a | cms 解決（更新管理仕様） | **含む** |
| Phase 0b | pages ensure（未登録なら追記） | **含む** |
| Phase 1 | `@figma-page-analyze`（初回または明示やり直し） | **条件付き** |
| Phase 2 | `pending` セクションを上から連続実装 | **含む** |
| Phase 3 | 完了時セルフチェック（コンソール＋大差検知＋そのページの規約確認） | **含む**（全セクション `done` 後） |
| 以降 | 見た目の自動修正・lint/test・commit | **含まない**（大差は報告のみ。微差は人の確認→再指摘） |

新規ルールは作らない。実装手順の正本は各実装スキル側。

## やること / やらないこと

| やる | やらない |
|------|----------|
| 計画を正本にした連続実装・再開 | 部分セクションだけの実行（単体依頼は各 coding スキルへ） |
| pages ensure（未登録なら追記。cms 連携） | pages 未登録のまま analyze／実装を始める |
| cms 解決（URL / 探索 / 推定確認） | cms 無しを黙って静的固定と決めつける |
| セクション境界での計画行・実装 Skill の再読（本 SKILL の連打はしない） | lint / test / commit の自動実行 |
| Status / Progress の更新 | ブロッカー後のセクション継続 |
| Open questions の警告（初回 analyze 時） | `figma-coding` 手順の重複記載 |
| ソフト停止と再開案内。**残セクションがあるターン終了では必ず Resume paste** | px 一致を目指す差分検証・セクション途中の vnu。残作業ありなのにペースト省略 |
| セクション完了時の PHP インデント確認・修正（template Step 7） | 数px の見た目差分検証・見た目の自動修正 |
| 全 done 後のセルフチェック（Phase 3: コンソール＋大差検知＋そのページの規約確認） | 会話記憶だけでの進捗判断 |
| | 独立の `@figma-page-verify`（廃止） |

## 実行フロー

```
- [ ] Phase 0: page-slug・計画の有無・モード（fresh / resume）を決める
- [ ] Phase 0a: cms 解決（依頼 URL / バッチ CMS 節 / 同一ファイル探索 / 無ければ ensure 側判定）。正本: project-page-info/cms-frame.md
- [ ] Phase 0b: pages ensure（未登録なら追記。正本: project-page-info/pages-ensure.md）
- [ ] Phase 1: fresh なら @figma-page-analyze を完了まで（resume ならスキップ）
- [ ] Phase 1b: Open questions があれば短く警告（実装は継続）
- [ ] Phase 2: Status=pending を # 昇順に、セクション再ブート→実装→Status 更新
- [ ] ブロッカー / ソフト停止なら計画を更新して停止報告（**残セクションがあれば Resume paste 必須**）
- [ ] 全 pending 解消なら Phase 3 → 完了報告
```

## Phase 0: モード判定

計画パス: `.cursor/tmp/figma-plans/<page-slug>.md`

| 条件 | モード | Phase 1 |
|------|--------|---------|
| 計画が無い | **fresh** | analyze 実行 |
| ユーザーが「最初から」「やり直し」「再解析」等を明示 | **fresh** | analyze 実行（上書き・Status 全 pending） |
| 計画があり、`pending` または `blocked` が残る | **resume** | **スキップ** |
| 計画があり、全セクション `done` | 完了済み | 実装せず。Progress に Self-check が無ければ **Phase 3 のみ**（やり直し明示時は fresh） |

page-slug は依頼・フレーム名・既存計画ファイル名から決める（analyze と同じ slug 化）。

resume 開始時:

1. 計画ファイルを **Read**
2. 先頭の未完了（`blocked` があればそれ優先、なければ最小 `#` の `pending`）を次タスクにする
3. `blocked` から再開する場合、Progress の理由を踏まえ、解消できそうなら当該行を `pending` に戻してから実装する。解消不能なら停止報告のみ
4. **やらないこと**: analyze やり直し、カタログ再生成、計画に CMS／ensure 済みがある（または親バッチから渡された）場合の **cms 再解決・ensure 再実行**。Request notes は計画を正とする

## Phase 0a: cms 解決

[project-page-info/cms-frame.md](../project-page-info/cms-frame.md) に従う。

| 入力 | 動き |
|------|------|
| 親バッチの CMS 節 | それを正とし、当該 slug の行だけ ensure に渡す |
| 依頼で cms フレーム URL | 読んで要約。ページ計画の先頭か Request notes に URL・要約を残す |
| 画面 URL のみ | 同一ファイル内で `cms` フレームを探索 |
| どれも無し | ensure（Phase 0b）の Step A。**interactive** なら AskQuestion。**unattended** なら [unattended.md](../figma-batch-implement/unattended.md) の推定 |

**単体依頼では cms を一緒に渡すのが確実**。無くても探索→推定＋確認で進めてよい。

## Phase 0b: pages ensure（必須）

[project-page-info/pages-ensure.md](../project-page-info/pages-ensure.md) を Read し、その手順どおり **対象 page-slug の登録を確認／追記**する。Phase 0a の cms 結果を渡す。未完了のまま Phase 1／2 に進まない。手順は本スキルに複写しない。

親バッチが直前に同じ slug を ensure 済みならスキップしてよい（計画またはチャットに一行あれば足りる）。

### Interaction: unattended

バッチ／依頼から `Interaction: unattended` のとき、ensure・cms 判定は AskQuestion せず [unattended.md](../figma-batch-implement/unattended.md) に従う。単独 interactive 依頼では通常どおり AskQuestion。

## Phase 1: 解析（fresh のみ）

1. **`@figma-page-analyze`** の SKILL を読み、その手順どおり完了させる
2. 本スキルに解析手順を複写しない
3. analyze は計画を上書きし Status を全 `pending` にする（再開進捗は捨てる）

### Open questions（Phase 1b）

- 計画の Open questions が空でなければ、**短く警告**する
- **実装は止めない**（ユーザーが明示的に止めた場合のみ中断）

## Phase 2: セクション連続実装

対象は Status が `pending` の行のみ（`done` はスキップ）。`#` の昇順。

### セクション開始時の再ブート（毎回・必須）

次を **この順で**行う。前セクションの実装内容の記憶で省略しない（ただし **セッション再読免除**は `@figma-coding`、**同型 MCP** は下記）。

1. 計画ファイルを **Read**（`Request notes`・**当該行**・該当する Template DOM diffs・**Notes**（重い UX／機能仕様）・Progress）。全文を目的なく読み直さない
2. 当該行の `Skill` の **SKILL.md**: resume 直後または異型セクションでは Read。**同型連続の2本目以降は再 Read 不要**（実装スキル側の必須参照はセッション免除に従う）
3. 対象: 行の node-id（Device に応じた PC/SP URL）
4. `Request notes` の JS／Swiper 等、および計画 Notes の **UX／機能仕様**を実装スキルへ引き継ぐ（見た目からの推定はしない。アノテーションは推定ではない）
5. 当該スキルを **完了まで**実行する

**やらないこと（コンテキスト）**: セクション毎に本 SKILL（`figma-page-implement`）を再 Read しない。analyze／cms／ensure をやり直さない。既読ルールの全文再読・同型へのフル `get_design_context` 連打をしない。

### 同型セクション連続（MCP）

計画上 Name／構造が同型の連続（例: interviewItem×4）は次に従う。

- 先頭1本: 通常どおりフル取得可
- 2本目以降: `get_metadata` で差分確認 → 文言・画像差のみならフルコードダンプを繰り返さない。`excludeScreenshot: true` 既定。crop 検証の画像 Read は怪しい1枚だけ
- 同型か曖昧ならフル取得（品質優先）

両デザイン時の Template DOM diffs 引き継ぎ方針は `figma/responsive.mdc`「差分先行」。手順は複写しない。

PHP パス・部品再利用・アセットは各実装スキルと `figma-rule` / `assets` 等に委ねる。
### セクション完了後（必須）

1. 当該セクションで編集した PHP があれば、**インデントを確認しずれを修正**（正本: `project/template/php.mdc`「インデント」。template Step 7 で未実施ならここで実施）
2. 計画の当該行 `Status` を `done` にする
3. `## Progress` を更新: `Last done: #<n> <Name>`
4. 当該セクションで作った `.cursor/tmp/` スクラッチ（`figma-plans/` 以外）があれば削除（正本: `cursour-allways-rules.mdc`）
5. **重い UX／機能仕様**を当該工程で完了できなかった場合は Progress に残す（正本: `figma-rule.mdc`「アノテーション」）。黙って落とさない
6. チャット報告は **1〜3 行**（長文のルール再掲・差分解説はしない）
7. 次の `pending` へ進む（確認待ちなし）。**ソフト停止は下記表のみ**（1 本完了での再開案内は禁止）
8. **同ターンで次セクションに着手しない**かつ **`pending`/`blocked` が残る** → 下記 Resume paste を **必ず** Progress＋チャットに出す。「セクション完了」報告だけで止めてペーストを省略することは禁止

### ソフト停止（コンテキスト防衛）

**既定は継続。** ブロッカーでなければ次の pending に進む。目安は **4 本継続**だが、逼迫時は 2〜3 で止めてよい（条件付き）。完了数は計画の **セクション行数**（同型バッチでも 1 行 = 1）。同型連続の再読／MCP 節約（上記）で 4 本到達しやすくするのが意図。

| このチャットの完了数 | ソフト停止 |
|----------------------|------------|
| **1** | **禁止**（「不安」「念のため」不可。ブロッカーのみ停止可） |
| **2〜3** | **条件付き可**。下表の具体理由を Progress に書く。曖昧な不安だけでは不可。可能なら 4 まで続ける |
| **4 以上** | **可**（次の pending に入らず止めてよい。理由は短くてよい） |
| ページ全セクションが少なく、残りを終えられる | ソフト停止せず **ページ完了（全 done）まで**優先 |

**2〜3 本目で認められる具体理由（いずれか・Progress に明記）**:

- 両デザイン＋アセット等で MCP／必須参照の結果が膨張し、次セクションで規則を保持しにくい
- ルールや Request notes の取り違えが起き始めた（または明らかに起きそう）
- 応答が手順を落とし始めたなど、品質低下の兆候がある

**認めない理由**: 「なんとなく不安」「念のため」「1 本やったから」だけ。

**入口**: ページ途中の再開は **必ず `@figma-page-implement`**。親がバッチでも、当該ページが全 `done` になるまで **`@figma-batch-implement` を貼らない**（二重読み・Phase 0 再走査の原因）。screen 完了後の次画面は batch 側のペースト（[batch のソフト停止](../figma-batch-implement/SKILL.md)）。

**残作業ゲート（必須）**: 計画に `pending` / `blocked` が **1 件でも残る**状態で応答を終えるときは、ソフト停止・ブロッカー・逼迫・その他の理由を問わず **Resume paste 必須**。省略禁止。例外は **同ターンで次の `pending` セクション実装に着手し続ける**ときのみ。ページが全 `done` で親バッチに残 screen がある場合のペーストは **batch 側**（本節の page ペーストで代用しない）。

**必須（停止時）**:

1. Progress に理由を 1 行（例: `Soft-stop: 2 sections — both-design + assets bloat`。Status は次セクションを `pending` のまま）
2. Progress に **`Resume paste`**（短文型のみ。説明を足さない）
3. チャット停止報告の先頭に **`入口: page`** と書き、**同じペーストをコードブロックで再掲**する（先頭の `@figma-page-implement` 行は **残す**。page / batch の判別に使う）

```text
@figma-page-implement
計画: .cursor/tmp/figma-plans/<page-slug>.md
resume
次: #<n> <Name>
カタログ・ensure・cms 再解決・analyze やり直しはしない。計画の pending のみ続行。
```

**再開時**: 貼る前に、先頭行を自分で消して **`@` ピッカーから `figma-page-implement` を参照付きで選び直し**、続けて残りの本文を貼る（または本文全体を貼ったあと、先頭のプレーン `@` を参照チップに置き換える）。プレーンのまま送るとスキル未参照になりやすい（`disable-model-invocation: true`）。`入口: page` と先頭の `@figma-page-implement` で batch と取り違えない。

**別チャット起動は自動化できない。** 同チャット resume も可（同様に参照付きで呼び直す）。長い会話では新規チャットへの貼り付けを推奨する。### ブロッカー時（必須）

次で当該セクションを完了できない場合は **そこで停止**する。

- Figma MCP 取得不可（URL・権限・node-id 不正など）
- 実装スキル側の中止条件に該当
- アセット/crop 等で安全に続行できない
- その他、完了報告できない明確な阻害

停止時の計画更新:

- 当該行 `Status` → `blocked`
- Progress: `Blocked: #<n> <Name> — <理由>`
- **Resume paste** をソフト停止と同じ短文型で Progress に書く（`blocked` 解消後に resume）

チャット報告:

- 先頭に **`入口: page`**
- 失敗したセクション（#・Name・node-id）と理由
- **未実施の残り**（`pending` / 他の `blocked`）
- 再開: 計画 Progress の **Resume paste** をコードブロックで再掲
- 以降のセクションには手を付けない

見た目の微差や「後で直したい」はブロッカーにしない（人の確認→再指摘で対応）。

## Phase 3: 完了時セルフチェック（必須・コンソール＋大差検知＋そのページの規約確認）

全セクション `Status=done` の直後、完了報告の前に行う。ソフト停止・ブロッカー停止では行わない（再開して全 done になったときに行う）。**途中セクションでは開かない**。

**数px 比較・見た目の自動修正はしない。** 大差は報告のみ。微差は人が確認し、ずれは再指摘する。

ユーザーがセルフチェック不要と明示したら Progress に `Self-check: skipped — user` を書く。見た目を省いても **ページ確認は行う**。ページ確認も不要と明示したときだけ `Page-check: skipped — user`。

1. ブラウザ（コンソール＋大差）。正本は [figma-coding/browser-check.md](../figma-coding/browser-check.md)（対象は **ページ全体**）。
2. そのページの vnu と規約（HTML / SCSS / JS）。正本は [page-check.md](page-check.md)。

実施後:

1. **Progress** に残す（例）:  
   `Self-check: ok (console+visual)` / `Self-check: fixed console` / `Self-check: large-diff — <要点>` / `Self-check: skipped — …`  
   `Page-check: ok` / `Page-check: fixed` / `Page-check: skipped — user` / `Page-check: open — 片側のみ`

2. **`.cursor/tmp/` 掃除**  
   当該作業で作ったスクラッチ（画像・SVG ステージング等）を削除する。**全セクション `done` かつ `Page-check: open — 片側のみ` でないとき**は計画ファイル（`figma-plans/<page-slug>.md`）も削除する（チャット確認不要）。片側のみのときは計画を残す。正本: `cursour-allways-rules.mdc`「`.cursor/tmp/`」。

## 完了報告

全セクション `done` かつ Phase 3 実施（または明示スキップ記録）のあと:

- 計画ファイル（削除済み、または片側のみで残したパス）
- 実施セクションの要約（スキル名）
- Open questions の再掲（あれば短く）
- **Phase 3 の結果**（ok / コンソール修正 / large-diff / スキップ理由。ページ確認は ok / fixed / open — 片側のみ / スキップ理由）
- **仮置き**（無ければ「仮置きなし」）。**フォーム**（対象外 / 不足なし / 不足のパス）。**PC/SP**（対象外 / 両方 / 同値のため上書きなし / 片側のみ）
- 大差は報告済みなら人が判断。微差は人の確認→ずれがあれば再指摘、と短く案内してよい

ソフト停止・ブロッカー停止時は上記「ソフト停止」「ブロッカー時」に従う（Phase 3 はまだ行わない。計画 MD は残す）。
