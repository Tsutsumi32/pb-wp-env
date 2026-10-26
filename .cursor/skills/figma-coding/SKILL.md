---
name: figma-coding
description: >-
  figmaMCPでテンプレート＋スタイルを連続実装する。工程境界で下位SkillをReadし、必須参照は条件付き・同ターン／ページ実装セッション再読免除あり。
  JSが依頼で明示、またはアノテーションのUX/機能仕様があればfigma-js-coding→lintまで続ける。
  直呼びでPHP/JS変更またはセクション新規一通りのときは browser-check（コンソール／大差検知。見た目の自動修正はしない）。
  Figmaから一通り実装、デザインからコーディング一式の依頼時に使用する。
disable-model-invocation: true
---

# figma-coding

figmaMCP で画面（またはセクション）を一通り実装する **薄い監督**です。  
手順の正本は各下位スキル。本スキルは実行順と **工程境界の再ブート**だけを担う。

## コンテキスト原則（必須）

会話・前工程の記憶は忘れる前提。ただし **再読免除**（下記）は例外。

| 原則 | 内容 |
|------|------|
| 工程再ブート | **各 Step の開始時**に、次に呼ぶ Skill の **SKILL.md** を Read（ページ実装セッションの同型連続は下記）。必須参照は各 Skill の条件付き表＋**再読免除**に従う |
| 依頼条件 | 親（`figma-page-implement`）から渡された `Request notes`、または依頼文。チャット記憶に頼らない |
| 両デザイン | `figma/responsive.mdc`「差分先行」。テンプレとスタイルで見る範囲が違う（下記） |
| 外部オーバーライド | `.cursor/external/` に `figma-conventions-*.md` / `project-rules-*.md` があれば工程開始前に Read（「この案件では」は共有 rules より優先）。セッション／同ターンで既読なら再 Read しない |
| 報告 | 工程ごとに短く。ルールの長文再掲はしない |

### 同ターン再読免除（必須・品質ゲートは維持）

**同一セクション・同一チャットターン**で template → style →（明示時）JS と進むとき:

1. Step 開始時に **次 Skill の SKILL.md は必ず Read**
2. 必須参照は各 Skill の表に従う。**このターンで既に Read したファイルは再 Read しない**
3. その工程で **未読の常時参照**（例: スタイルの `style.mdc` / `scss.mdc`）は必ず Read
4. **免除しない**: ソフト停止後・新規チャット・スタイル／JS 単独依頼。両デザインのスタイル Step 5b（`responsive.mdc` 再 Read ＋ MCP 再取得）は維持。page-implement 外では **次のセクションでも免除なし**

### ページ実装セッション再読免除（`figma-page-implement` 配下）

親が page-implement のとき、**同一チャット・ソフト停止まで**は次に従う。

- 必須参照の既読ファイルは **次セクションでも再 Read しない**（同型／異型問わずセッション内）
- 実装 Skill の SKILL.md は **同型連続の2本目以降は再 Read 不要**。異型に切り替わったら再 Read
- 新たに条件成立した条件付き参照・Step 5b・resume／新規チャットは免除しない
- 同型 MCP の節約は `figma-page-implement`「同型セクション連続（MCP）」

ルール本文のチートシート化・正本の省略はしない。巨大ルールは各ファイル冒頭の **Read map**（必要 § のみ）に従う。

## 実行順（必須）

```
- [ ] Step 0: ページ新規で pages 未登録なら pages ensure（親が済みならスキップ。正本: pages-ensure.md）
- [ ] Step 1: 再ブート → @figma-template-coding を完了まで
- [ ] Step 2: 再ブート → @figma-style-coding を完了まで
- [ ] Step 3: JS が依頼で明示されている、またはアノテーションの UX / 機能仕様（動きが要る他要件含む）があるときだけ、再ブート → @figma-js-coding → lint（js スキル内）
- [ ] Step 4: **直呼びのときだけ** [browser-check.md](browser-check.md)（親が `@figma-page-implement` ならスキップ。Phase 3 に寄せる）
```

ページ全体は `@figma-page-implement` 経由が正（ensure 済み）。セクション部分・既存ページへの追記だけのときは Step 0 スキップ。
単独でページ新規テンプレを始めるときだけ [pages-ensure.md](../project-page-info/pages-ensure.md) を Read して従う。

### 各 Step 開始時の再ブート

1. 当該 Skill の **SKILL.md を Read**
2. 当該 Skill の **必須参照**を、その SKILL の常時／条件付き表どおり Read（**同ターン再読免除**を適用。一覧を本スキルに複写しない）
3. 親計画がある場合は、必要なら計画の当該行・`Request notes`・Notes（重い UX／機能仕様）・Template DOM diffs を確認
4. 当該 Skill を **完了まで**実行する

JS の明示例: 「Swiper も」「メニュー開閉の JS も」「アコーディオンも」。アノテーションの **UX / 機能仕様**、および動き・機能が要る **他要件** も明示相当（正本: `figma-rule.mdc`「アノテーション」）。  
依頼にもアノテーションにも無ければ Step 3 はスキップする（見た目からの動作推定では足さない）。

### Step 4: ブラウザ確認（直呼びのみ）

正本: [browser-check.md](browser-check.md)。**親が `@figma-page-implement` なら行わない。**

- PHP を触った、または Step 3 で JS を入れた → コンソール
- セクションを一通り（Step 1–2）**新規**実装した → 当該セクションの大差検知（報告のみ・自動修正しない）
- スタイルのみ・既存の微修正 → 開かない

## variables（スタイル工程）

スタイル工程の variables は **`figma/style.mdc` §1**（通常はデザイン通り・**キーも数値も丸め禁止**・**非整備の丸めは `$section-sizes` のみ**・Variables/TextStyle はキーと値を突合）。Figma にあり Code に無いキーは Figma 値で最小追記 OK。既存キーの値ずれは `@figma-tokens-setup` / `@figma-tokens-sync` へ。コンテナ・コンテンツ余白・要素間は丸めず Figma 通り。コンテナは **`container/*` Variables 直値**（欠落時のみ列＋padding フォールバック・`scss.mdc`）。

**フォント（Step 2）**: `@figma-style-coding` の §6／完了ゲートに従う。対象ファミリー ⊆ `$font-configs`、`$base_font` が案件値であること。未充足ならスタイル完了にしない（テンプレ完了だけではフォント未整備のまま終わらせない）。

## レスポンシブ（差分先行）と工程の分担

詳細の正本は **`figma/responsive.mdc`**（本スキルに数値・例外を書かない）。

| 工程 | 両デザイン時にやること | やらないこと |
|------|------------------------|--------------|
| 解析（page-analyze 等） | テンプレ影響差分の洗い出し | スタイル数値の列挙 |
| Step 1 テンプレ | ファースト側正＋**DOM 差分のみ**もう一方 | SP スタイル値の深追い・メディアクエリ |
| Step 2 スタイル | `$media-query-strategy` に従いファースト→**もう一方フレーム再取得**→項目突合して上書き（**SP もデザイン通り**・**Figma 同値なら同値**） | 解析なしに HTML を大きく作り直す（漏れならテンプレに戻す）／片側用基本対応で SP を済ませる／同値なのに縮小 |

片側のみのときはスタイル工程で基本対応（**余白は原則ひと段階・据え置き禁止**／PC のみ時の SP テキスト寄せを含む）。  
「レスポンシブ不要」等の明示があればそれを優先。

**コンテキスト上の注意（両デザイン）**: スタイル工程は PC/SP 両方の値を扱うため長い。`figma-style-coding` の Step 5b（再 Read ＋ MCP 再取得＋項目突合）に従う。

## 使い分け

| 依頼 | スキル |
|------|--------|
| テンプレのみ | `@figma-template-coding` |
| スタイルのみ（PHP 既存） | `@figma-style-coding` |
| テンプレ＋スタイル（JS なし） | **`@figma-coding`**（本スキル・Step 3 スキップ） |
| 上記＋ JS／Swiper 等、またはアノテーション UX／機能仕様 | **`@figma-coding`** + 要件を明示（アノテーションは推定ではない） |
| JS のみ（稀） | `@figma-js-coding` |
| トークン基盤 | `@figma-tokens-setup` |
| ページ全体 | `@figma-page-implement`（計画正本・セクションは計画行＋実装 Skill。内部で本スキル等を呼ぶ） |
| 複数画面 | `@figma-batch-implement`（必要なら Phase 0-catalog → 直 URL／カタログから page-implement） |

## 完了報告

テンプレ／スタイル／（実施した場合）JS＋lint を分けて短く報告する。  
スタイル工程を実施したら **フォント完了ゲート**（対象ファミリー ⊆ `$font-configs`／`$base_font` 案件値）の結果を 1 行含める（未通過ならスタイル未完了）。  
直呼びで Step 4 を実施したら Self-check 1 行を含める（`browser-check.md`）。  
共通 modules 化した場合は `.cursor/design/components.md` 追記の有無も含める（`figma-template-coding` Step 5b）。  
テンプレで PHP を触った場合はインデント確認済みであること（`php.mdc`「インデント」／template Step 7）。
