# unattended モード（全自動）

PC 自分作業の **通常フロー（AskQuestion・ソフト停止・Resume paste）は本線のまま残す。**  
本モードは Automations / SDK / 明示オプトイン専用の **別経路**。

正本はこのファイル。`@figma-batch-implement` が入口。下位（page-implement / pages-ensure / page-info）は計画の `Interaction: unattended` を引き継ぐ。

## 対象外（入らない）

| スキル | 理由 |
|--------|------|
| **`@project-env-setup`** | 案件初期の対話セットアップ（A/B/C）。全自動にしない |
| **`@pre-launch-check`** | 公開前の人手確認が主目的 |
| **`@figma-tokens-setup` の方式選択** | C-1 相当。env-setup／手動で先に済ませる前提 |

unattended を始める前提: 環境・トークン方針・サンプル掃除などは **通常フローで済んでいる**こと。

## 対象（入る）

| スキル | unattended 時 |
|--------|----------------|
| `@figma-batch-implement` | 入口。計画に `Interaction: unattended` |
| `@figma-page-implement` | バッチまたは依頼から引き継ぎ |
| `pages-ensure` / `@project-page-info` | 推定で登録。cms 優先。AskQuestion しない |
| `@figma-page-analyze` / coding 系 | 通常どおり実装。確認待ちで止めない |

Docker / `make wp-create-*` は **ローカルまたは CI**。Cloud Automations では実行できないことが多い → 失敗してもブロッカーにせず Progress に「WP-CLI はローカル／CI で」と残してコード側は続行してよい。

## 起動条件（いずれか）

1. バッチ計画に `Interaction: unattended`
2. Request notes / 依頼文に `unattended` / `全自動` / Automations 用プロンプト明示
3. Automations / SDK の指示文で本モード指定

**書かれていなければ通常フロー（AskQuestion あり）。** 勝手に unattended にしない。

## 振る舞い

| 項目 | 通常（interactive） | unattended |
|------|---------------------|------------|
| AskQuestion | **必須** | **しない**。推定・cms・Request notes・既存コードで確定 |
| Phase 0b キュー確認 | AskQuestion（1件直 URL 以外） | **省略**。計画どおり進める |
| cms 無しの動的判定 | AskQuestion（cms-frame Step A） | 強いシグナル（一覧+詳細ペア等）なら動的、弱ければ **静的 pages のみ**。曖昧でも聞かない |
| ソフト停止 | **1 screen は具体理由のみ**・2 到達後可＋Resume paste（[SKILL](SKILL.md)）。**残 screen ありのターン終了は必須** | **ラン上限**（既定 2 screen）で停止＋Resume paste。人の選択待ちはしない |
| ブロッカー | 停止＋報告 | 停止＋計画更新。Slack 等へ通知する指示があればそれに従う。次 screen へ勝手に進まない |
| 推定の記録 | 選択結果 | Progress に「採用した推定」を短く残す（事後レビュー用） |

### 推定の優先順

1. バッチ計画の Request notes / CMS 節 / Skill default  
2. cms フレーム表（[cms-frame.md](../project-page-info/cms-frame.md)）  
3. カタログ・フレーム名（`pc-<slug>` 等）  
4. 既存 `pages.php` / `posts.php` / 実装慣習  
5. それでも不明 → **安全側**（静的ページ、既存維持、スキップ）。破壊的削除や全置換はしない

### やってはいけないこと（unattended）

- 通常フローを廃止・AskQuestion を計画から消す  
- `@project-env-setup` を unattended で回す  
- 根拠の弱いファイル削除・`pages.php` 全置換  
- Docker が無いのに `make wp-create-*` を何度もリトライして止まる  
- ブロッカーを無視して次 screen へ進む（ユーザー明示の「失敗しても次へ」があるときのみ例外）

## 計画への書き方

```markdown
- Interaction: unattended
- Run budget: 2
```

`Run budget` 省略時は **2 screen / ラン**（通常のソフト停止目安と同じ）。

Resume paste は [SKILL.md](SKILL.md) ソフト停止の **短文型**と同じ。Automations 再起動では `Interaction: unattended` を `resume` 直後に 1 行足す。ページ途中停止の入口は `@figma-page-implement`（batch ペーストで代用しない）。

### batch-key の固定（自動再開を使うとき必須）

Automations の定期再実行など、**同一プロンプトが繰り返し送られる運用**では `batch-key` を必ず明示する。未指定時は `run` + 実行時刻で自動生成されるため、再実行のたびに別の計画ファイルが新規作成され、進捗が引き継がれない。

```markdown
- batch-key: <固定キー>
```

## 自動再開

**Cursor**: 自動再開の仕組みは無いため、下記「Automations 向けプロンプト例」のとおり Automations／手動 resume で継続する。

## Automations 向けプロンプト例（参考）

```text
@figma-batch-implement
計画: .cursor/tmp/figma-plans/_batch-<key>.md
resume
Interaction: unattended
次: #<n> <Name>（page-slug: <slug>）
カタログ再生成・キュー再確認・ensure 再実行・cms 再解決はしない。次 screen から page-implement。
AskQuestion 禁止。Run budget 到達で計画更新して停止。
```

先頭の `@` 行は入口の判別用。Automations／エージェントではスキルを明示指定し、プレーン `@` 文字列だけに頼らない。