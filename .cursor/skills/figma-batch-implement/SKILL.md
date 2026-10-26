---
name: figma-batch-implement
description: >-
  カタログ生成（必要時）または直接URLから複数screenを順にfigma-page-implementする監督スキル。
  バッチ計画を正本に再開・画面再ブート・Request notes永続化対応。
  Interaction: unattended（明示時のみ・AskQuestion無し）は unattended.md。
  figma-batch-implement、複数ページ実装、一括実装、カタログから実装、画面カタログ生成、全自動バッチの依頼時に使用する。
  lint・commitは含まない（画面ごとのセルフチェックは page-implement Phase 3。大差は報告のみ。微差は人の再指摘。そのページの規約確認は page-check.md）。
disable-model-invocation: true
---

# figma-batch-implement

複数 **screen** を順に実装する **監督スキル**。1 screen の中身はすべて `@figma-page-implement` に委譲する（**本チャット内で直接実行**）。

**画面カタログ**（索引）が必要なときは本スキル内 **Phase 0-catalog**（手順正本: [catalog.md](catalog.md)）で生成・更新する。セクション単体は `figma-coding` 等を直接使う。

## 用語

| 用語 | 意味 |
|------|------|
| **screen** | 1 Web 画面（PC/SP ペアは 1 行） |
| **catalog** | `_catalog-<key>.md`（索引。進捗は持たない。手順は [catalog.md](catalog.md)） |
| **batch plan** | `_batch-<key>.md`（今回のキュー・Status・Request notes） |

## コンテキスト原則（必須）

会話は忘れる前提。

| 原則 | 内容 |
|------|------|
| 正本 | バッチ計画ファイルのみを進捗・依頼条件の正とする |
| 再ブート | **各 screen 開始時**にバッチ計画＋`figma-page-implement` の SKILL を Read |
| 依頼条件 | `Request notes` / `Skill default` を計画に書き、各 implement に渡す |
| 外部オーバーライド | `.cursor/external/` に `figma-conventions-*.md` / `project-rules-*.md` があれば Read し、パスを Request notes か計画に残す（「この案件では」は共有 rules より優先） |
| PC/SP | カタログまたは依頼に両方あれば **必ず両方** page-implement に渡す（追加指示不要） |
| 報告 | チャットは短く。Status / Progress 更新が本体 |
| ソフト停止 | 画面完了後。**1 screen 完了のみでの停止は具体理由必須**（曖昧な不安不可）。2 到達後は理由なしで可。**`pending`/`blocked` が残る状態でターンを終えるときはラベルを問わず Resume paste 必須**（**入口は本スキル**。ページ途中停止は page-implement のペースト）。別チャット起動は自動化不可・貼り付け再開。**PC 自分作業の本線は AskQuestion＋ソフト停止ありの通常フロー（変えない）** |
| Interaction | 既定は **interactive**（AskQuestion あり）。**unattended** は [unattended.md](unattended.md)。`@project-env-setup` は対象外 |

## 位置づけ

| フェーズ | 内容 | スコープ |
|----------|------|----------|
| Phase 0-catalog | 必要時のみ。画面カタログ生成・更新（[catalog.md](catalog.md)） | **含む** |
| Phase 0 | 対象解決・Request notes・**cms 解決**・バッチ計画 | **含む** |
| Phase 0b | 実装キューの確認（必須。直 URL のみで1件のときは省略可） | **含む** |
| Phase 0c | pages ensure（未登録をまとめて。cms は計画の CMS 節を渡す） | **含む** |
| Phase 1 | 各 pending screen で `@figma-page-implement` | **含む** |
| 以降 | lint / commit | **含まない**（各 screen のセルフチェックは page-implement Phase 3。大差は報告のみ。微差は人の再指摘。規約確認は page-check.md） |

新規ルールは作らない。実装手順は page-implement 以下。

## やること / やらないこと

| やる | やらない |
|------|----------|
| 必要時のカタログ生成（Phase 0-catalog） | カタログ未確認のまま全候補を自動実装 |
| カタログ／直 URL／名前指定からキュー化 | `@project-env-setup` でのカタログ生成 |
| 未登録 slug の pages ensure（まとめて。cms 連携） | pages 未登録のまま page-implement を始める |
| cms を計画に記録 | cms をチャット記憶だけに頼る |
| Request notes の永続化と引き継ぎ | チャット記憶だけでの条件保持 |
| screen 境界の再ブート・Status 更新 | ブロッカー後の次 screen 継続 |
| ソフト停止と **Resume paste**（コピー用再開文）。**残 screen があるターン終了では必ず再掲** | lint / commit の自動実行。残作業ありなのにペースト省略 |
| **unattended**（明示時のみ。[unattended.md](unattended.md)） | `@project-env-setup` を全自動で回すこと |
| PC+SP セット渡し | page-implement 手順の複写 |

## 実行フロー

```
- [ ] Phase 0-catalog: 必要なら [catalog.md](catalog.md) どおりカタログ生成・更新
- [ ] Phase 0: モード（fresh / resume）・**Interaction（interactive / unattended）**・対象・Skill default・Request notes
- [ ] Phase 0: **cms フレーム解決**（[cms-frame.md](../project-page-info/cms-frame.md)）→ バッチ計画の CMS 節に記録
- [ ] Phase 0: バッチ計画を作成または Read
- [ ] Phase 0b: キューを表で示し確認（1 screen 直 URL のみ、または **unattended** なら省略可）
- [ ] Phase 0c: pages ensure（未登録 slug をまとめて。正本: pages-ensure.md。CMS 節を渡す。unattended なら AskQuestion しない）
- [ ] Phase 1: pending を順に、再ブート → page-implement → Status 更新
- [ ] ブロッカー / ソフト停止（unattended は Run budget）なら計画更新して停止。**残 screen があれば Resume paste 必須**
- [ ] 全 done なら完了報告
```

## Phase 0: 対象解決と計画

### バッチ計画パス

`.cursor/tmp/figma-plans/_batch-<batch-key>.md`  
`batch-key` 未指定時: catalog-key、または `run` + 短い日時。

### モード（fresh / resume）

| 条件 | モード |
|------|--------|
| 計画が無い／「最初から」「やり直し」明示 | **fresh** |
| 計画があり pending / blocked が残る | **resume**（**カタログ再生成・キュー再確認・ensure 再実行・cms 再解決はしない**。Request notes / CMS 節は既存を正とし、依頼で上書き明示があれば更新） |
| 全 screen `done` | 完了案内のみ（やり直し明示時は fresh） |

### Interaction（interactive / unattended）

| 値 | いつ | 振る舞い |
|----|------|----------|
| **interactive**（既定） | 書かれていないとき・PC 自分作業 | AskQuestion・Phase 0b 確認・ソフト停止あり |
| **unattended** | 計画／依頼／Automations で明示 | [unattended.md](unattended.md)。AskQuestion 禁止。`@project-env-setup` は対象外 |

勝手に unattended にしない。page-implement / pages-ensure には計画の `Interaction` を引き継ぐ。

### Phase 0-catalog: 画面カタログ（必要時）

手順の正本は [catalog.md](catalog.md)。**本スキル内で実行**する（別スキルに委譲しない）。

| いつ実行するか | 内容 |
|----------------|------|
| **カタログ無し＋キャンバスだけ**（「全部」「一覧から」等） | Phase 0-catalog で生成してからキュー化 |
| ユーザーが「カタログ更新してから」と明示 | 再取得してからキュー化 |
| 既存カタログが明らかに古い／欠ける | 再取得してからキュー化 |
| **直接 URL**のみ／既存カタログで足りる | **スキップ**（必須ではない） |

カタログのみ欲しい依頼（実装しない）でも、本スキル＋「カタログのみ」で Phase 0-catalog まで実行してよい。

### 対象の入れ方（いずれか・併用可）

| 入力 | 動き |
|------|------|
| **カタログから**（名前 / slug /「全部」） | `_catalog-*.md` を Read。一致行でキュー化。曖昧なら候補を出して確認 |
| **直接 URL**（1件以上） | カタログ不要。PC/SP 両方渡されたらペア、片方なら片側。page-slug はフレーム名または依頼から |
| **カタログ無し＋キャンバスだけ** | **Phase 0-catalog**（[catalog.md](catalog.md)）→ その後キュー化 |

### Skill default / Request notes（必須・計画に書く）

依頼文から確定し、**チャットだけでなくバッチ計画に保存**する。

| 依頼 | Skill default | Request notes 例 |
|------|---------------|------------------|
| 指定なし・一式 | `figma-coding` | なし、または補足のみ |
| テンプレのみ | `figma-template-coding` | テンプレのみ |
| レスポンシブ不要 | `figma-coding`（または style） | レスポンシブ不要 |
| JS／Swiper 明示、またはアノテーション UX／機能仕様 | `figma-coding` | 当該 JS／機能要件 |

その他の除外・パス指定なども Request notes に短く残す。
各 screen の page-implement / analyze に **同じ内容を引き継ぐ**（画面計画の Request notes にも反映されるよう渡す）。

### CMS フレーム（Phase 0・必須に近い）

更新管理コンテンツの仕様は [project-page-info/cms-frame.md](../project-page-info/cms-frame.md) に従う。

1. 依頼 URL・同一ファイル探索・カタログ注記から **cms フレーム**を解決する
2. テーブルを読み、キュー内 slug との対応を要約する
3. **バッチ計画に CMS 節を書く**（無い／未使用ならその旨）。ensure・各 page-implement はここを正本にする
4. cms が無く、一覧+詳細っぽい画面がキューにある場合: **interactive** なら ensure の Step A（AskQuestion）。**unattended** なら [unattended.md](unattended.md) の推定規則

### PC/SP（条件なし依頼）

- カタログ行に PC+SP がある → **両方の URL を page-implement に渡す**。SP は SP フレームどおり（`figma/responsive.mdc` 差分先行・**SP もデザイン通り**）。「SP も見て」等の追加指示は不要
- 片方のみ → 片側デザインとして渡す（もう一方はスタイル工程の基本対応）

### バッチ計画テンプレート

```markdown
# Figma batch plan: <batch-key>

- Catalog: <path or none>
- Interaction: <interactive | unattended>
- Run budget: <n>（unattended 時。省略時 2）
- Skill default: <figma-coding | figma-template-coding | …>
- Request notes: <…>
- Created at: <datetime>

## CMS

- URL: <cms frame url or none>
- Summary: <対象 slug・CPT/フィールド概要。無ければ「なし（ensure で判定）」>
- Related screens: <slug 一覧>

## Screens (implementation order)

| # | Name | page-slug | PC URL | SP URL | Status |
|---|------|-----------|--------|--------|--------|
| 1 | About | about | https://… | https://… | pending |

## Progress

- Last done: （なし）
- Blocked: （なし）
- Adopted estimates: （unattended 時。採用した推定を短く）
- Resume: `@figma-batch-implement` + batch-key `<batch-key>`（または本計画パス）
- Resume paste: （**残 screen があるターン終了時は必須**。新規チャット用の貼り付け文をここに書く）
```

Status: `pending` / `done` / `blocked`（page-implement と同義）。

## Phase 0b: キュー確認

- 表で Name / slug / PC・SP 有無 / Skill default を示す
- **`AskQuestion`**: この内容で実装してよいか（進める / 修正する / キャンセル）
- **例外（省略可）**:
  - 直接 URL が **1 screen のみ**で、依頼が明確
  - **`Interaction: unattended`**（[unattended.md](unattended.md)）

## Phase 0c: pages ensure（必須）

[project-page-info/pages-ensure.md](../project-page-info/pages-ensure.md) を Read し、キュー内の **未登録 page-slug をまとめて**確認／追記する。バッチ計画の **CMS 節**があれば ensure / 動的モードに渡す。完了後に Phase 1 へ。手順は複写しない。

ensure 済みである旨を Progress に 1 行残すと、各 `@figma-page-implement` の Phase 0b をスキップしやすい。

## Phase 1: screen 連続実装

`pending` を `#` 昇順。`done` はスキップ。

### screen 開始時の再ブート（毎回・必須）

本チャット内で直接 `@figma-page-implement` を実行する。

1. バッチ計画を **Read**（Request notes・当該行・Progress）
2. **`figma-page-implement` の SKILL.md を Read**
3. 当該 screen の PC URL（と SP URL があれば両方）、page-slug、Skill default、Request notes、**バッチ計画の CMS 節（関連すれば）** を渡して **page-implement を完走**させる
4. page-implement 内のセクション再ブート・analyze/resume はそちらに従う（複写しない）

### screen 完了後

1. バッチ計画の当該行 `Status` → `done`
2. Progress: `Last done: #<n> <Name>`
3. チャットは 1〜3 行
4. ソフト停止に該当しなければ次の `pending` へ（確認待ちなし）。page-implement が `Page-check: open — 片側のみ` のときは、当該 screen を `done` にせず次 screen に進まない（ページ計画は残る）
5. **同ターンで次 screen に着手しない**（ソフト停止・逼迫・その他のターン終了）かつ **`pending`/`blocked` が残る** → 下記 Resume paste を **必ず** Progress＋チャットに出す。「画面完了」報告だけで止めてペーストを省略することは禁止

### ソフト停止

**既定は次 screen へ継続。** ブロッカーでなければ進む。目安は **2 screen**。

| このチャットの完了 screen | ソフト停止（interactive） |
|---------------------------|----------------------------|
| **1** | **条件付き可**。具体理由を Progress に書く（曖昧な不安・念のためだけは不可）。可能なら 2 本目へ |
| **2 以上** | **可**（次 screen に入らず止めてよい） |
| **unattended** | 計画の **`Run budget`**（省略時 **2**）に達したら停止。人の選択待ちはしない（[unattended.md](unattended.md)） |

**1 screen 目で認められる具体理由の例**: 当該ページがセクション多数／両デザインでコンテキストが膨張し、次 screen の analyze＋実装の品質を保てない。

ページ内のセクション途中停止は本節ではなく [page-implement](../figma-page-implement/SKILL.md)（**1 セクション完了でのソフト停止は禁止**。2〜3 は具体理由）。

**入口の切り分け（誤用禁止）**:

| 停止位置 | Resume paste の `@` | 正本 |
|----------|---------------------|------|
| **screen 完了後**（本節） | `@figma-batch-implement` | `_batch-*.md` |
| **ページ途中**（セクション境界） | `@figma-page-implement`（[page-implement のソフト停止](../figma-page-implement/SKILL.md)） | `<page-slug>.md` |

ページ途中で page-implement が止めたときは **本スキルのペーストを出さない／使わない**（batch を貼ると SKILL 二重読みになる）。当該ページが全 `done` になったあと、次 screen から再び本スキルのペーストを使う。

**残作業ゲート（必須）**: 計画に `pending` / `blocked` が **1 件でも残る**状態で応答を終えるときは、ソフト停止・ブロッカー・逼迫・Run budget・その他の理由を問わず **Resume paste 必須**。省略禁止。例外は **同ターンで次の `pending` screen の page-implement に着手し続ける**ときのみ。

**必須（停止時）**:

1. Progress に理由を 1 行（Status は次 screen を `pending` のまま）
2. Progress に **`Resume paste`** を必ず書く（短文型のみ。説明を足さない）
3. チャット停止報告の先頭に **`入口: batch`** と書き、**同じペーストをコードブロックで再掲**する（先頭の `@figma-batch-implement` 行は **残す**。page / batch の判別に使う）

`Resume paste` の型（プレースホルダを実値に置換。**これ以外の行を足さない**）:

```text
@figma-batch-implement
計画: .cursor/tmp/figma-plans/_batch-<batch-key>.md
resume
次: #<n> <Name>（page-slug: <slug>）
カタログ再生成・キュー再確認・ensure 再実行・cms 再解決はしない。次 screen から page-implement。
```

`Interaction: unattended` のときだけ、`resume` の直後に `Interaction: unattended` を 1 行足す（[unattended.md](unattended.md)）。

**再開時**: 先頭の `@figma-batch-implement` は判別用。貼るときは自分で **`@` ピッカーから参照付きに選び直し**、続けて本文を貼る（プレーンのまま送らない）。`入口: batch` と先頭行で page と取り違えない。

**resume 時にやらないこと**: Phase 0-catalog、Phase 0b キュー再確認、Phase 0c ensure のやり直し、cms の再解決。計画を Read し、次の pending screen で page-implement する。

**別チャット起動そのものは自動化できない。** 同チャット resume も可（参照付きで呼び直す）。長い会話・夜間続きは **新規チャットを推奨**。Automations も同じ短文をトリガーに使える（スキルは明示指定）。### unattended（全自動）

正本: [unattended.md](unattended.md)。

- PC 本線は **interactive のまま**（置き換えない）
- **`@project-env-setup` / `@pre-launch-check` は対象外**
- 起動は計画・依頼・Automations での **明示のみ**

### ブロッカー

page-implement がブロッカー停止した、または渡せない場合:

- 当該行 `Status` → `blocked`
- Progress に理由
- **Resume paste** を Progress とチャットに書く（ソフト停止と同じ短文型。チャット先頭は **`入口: batch`**。`blocked` 解消後に resume）
- **以降の screen には手を付けない**
- 残り一覧を報告

「失敗しても次へ」は **ユーザーが明示したときだけ**。

※ page-implement 自身がセクション途中で止めた場合のペーストは **`入口: page`**（本スキルのペーストで代用しない）。

## 完了報告

全 screen `done` のとき:

- **バッチ計画（`figma-plans/_batch-*.md`）を削除**する（チャット確認不要。正本: `cursour-allways-rules.mdc`「`.cursor/tmp/`」）。削除したパスを報告に残す
- 実施 screen 要約
- Request notes の再掲（あれば短く）
- 各 screen の完了セルフチェックは **`@figma-page-implement` Phase 3**（コンソール＋大差検知、およびそのページの規約確認）で実施済み想定。大差は報告のみ。微差は人の確認→再指摘

停止時はソフト停止／ブロッカーに従う（計画 MD は残す）。
