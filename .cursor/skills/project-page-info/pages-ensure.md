# 実装前の pages 登録確認（pages ensure）

実装スキルが **画面実装に入る前**に行うゲート。正本はこのファイル。手順の長文を各実装スキルに複写しない。

`@project-env-setup` B-1 は **サンプル掃除（最小構成）のみ**。日常の登録は本ゲート。CPT/ACF・更新可能コンテンツは **動的コンテンツモード**（指定フレーム）。

## いつ呼ぶか

| 呼び出し元 | タイミング |
|------------|------------|
| `@figma-page-implement` | Phase 0 のあと、Phase 1（analyze）の前。resume でも対象 slug 未登録なら実施 |
| `@figma-batch-implement` | Phase 0b 確定後、Phase 1 の前。**未登録 slug をまとめて** 1 回（可能なら） |
| `@subpage-design-implement` | Step 1a（brand 抽出ゲート）の直後、資料読み・実装の前（本スキル内は Step 1b） |
| `@figma-coding` / `@figma-template-coding` を **ページ新規で単独** | 実装 Step の前（親が ensure 済みならスキップ） |

セクション部分実装のみ・既存ページへの追記だけのときは、対象が既に `pages.php`（必要なら `posts.php`）にあれば **スキップ**。

## 判定

1. 環境判定は [SKILL.md](SKILL.md)「環境判定」に従う。
2. 対象の **page-slug**（複数可）が次に存在するかを確認する。
   - WordPress: `pages.php` の定数／`$pages`、動的なら `posts.php`
   - PHP: `includes/config/pages.php`
3. **すべて登録済み** → チャットに 1 行だけ触れ、実装へ進む（AskQuestion 不要）。
4. **未登録がある** → 下記ブランチ。

## Interaction: unattended

親が `Interaction: unattended`（[figma-batch-implement/unattended.md](../figma-batch-implement/unattended.md)）のとき:

| 通常 | unattended |
|------|------------|
| AskQuestion で確定してから編集 | **AskQuestion しない**。cms → Request notes → 強いシグナル → 安全側（静的追記）の順で確定 |
| cms 無し Step A で聞く | 強いシグナル（一覧+詳細ペア等）なら動的、弱ければ静的 pages のみ |
| WP-CLI を実行 | Docker が無ければスキップし Progress に残す（コード登録は続行可） |

採用した推定はバッチ／ページ計画の Progress に短く残す。破壊的全置換はしない。

ERROR / 404 / TOP のみ足りない場合は、本ゲートで足すか、B-1 最小構成の残骸を確認する。

## ブランチ（未登録時）

```
未登録 slug あり
  ├─ cms フレームあり（依頼・バッチ計画・同一ファイル探索）
  │     → 対象行を解釈 → AskQuestion → D（動的モード。仕様は cms 優先）
  ├─ cms なし
  │     → cms-frame.md「cms が無いとき」Step A（更新管理かの AskQuestion）
  │           ├─ 動的にする → Step B 推定 → D
  │           └─ 静的のまま → A または B（固定ページ）
  ├─ 一覧・詳細の更新可能と明示／カタログペアが強い（cms 未解決でも Step A を省略せず確認）
  │     → 同上（推定を強めに選択肢へ）
  └─ Figma URL 無しの資料起点
        → B: 軽量登録（CPT が必要なら D を選択肢に）
```

正本の詳細: [cms-frame.md](cms-frame.md)。

### A: 固定ページ → `@project-page-info`（固定ページモード）

1. [SKILL.md](SKILL.md) を Read し、**対象画面だけ**を候補にする（親キャンバス全探索しない）。
2. URL の渡し方は同 SKILL「入力 URL」に従う。
3. **追記**を基本とする。既存エントリは消さない。
4. description / noindex / フォーム（4b）は project-info の Step に従う。
5. **6-W4 合格**まで終えたら、WordPress なら同 SKILL Step 7 の **WP-CLI 同期をエージェントが実行**してから実装へ。

手動で `@project-page-info` をユーザーに毎回依頼しない。実装スキル側が委譲する。

### B: Figma なし → 軽量登録

`php-config.md` の既存配列スタイルに合わせ、**未登録分だけ追記**する。

1. 推定材料: page-slug、brief の title／Deliverable、既存 `pages.php` の書き方。
2. チャットで現状（未登録一覧）と推定値を箇条書き提示する。
3. **`AskQuestion`（1 テーマずつ）** で確定する（推定値を選択肢に含める）。
   - 最低限: slug（定数値）・title・`assets_name`（または null）
   - あれば: `noindex`、親ページ、description（短く。無ければ空または後で `@pre-launch-check`）
   - WordPress で CPT が必要なら **D（動的モード）** を選択肢に含める（軽量で無理に CPT を作らない）
4. 承認後のみ PHP を編集する。
5. WordPress かつ `pages.php` を変えたら [php-config.md](php-config.md)「WP-CLI 同期」に従い **`make wp-create-pages` をエージェントが実行**（6-W4 が必要な変更なら先に検証）。
6. 完了を短く報告してから実装へ。

フォーム 3 画面が必要な案件は軽量で無理に完結させず **A** を勧める。

### D: 動的コンテンツ → `@project-page-info`（動的コンテンツモード）

1. **cms フレーム**があれば仕様の正とする（[cms-frame.md](cms-frame.md)）。無ければ画面からの推定＋AskQuestion（同「cms が無いとき」）。
2. **一覧・詳細のフレーム URL** が無ければ共有を促す（カタログ・brief・依頼文から拾えるならそれを使う）。
3. [SKILL.md](SKILL.md) の動的モードどおり Step 4–5 → 6-W4 → **WP-CLI 同期（WP）** まで完了させてから実装へ。
4. 親キャンバスの全画面探索はしない。

## バッチ時

- キュー内の未登録を列挙し、固定ページ同士ならまとめて A。
- 動的は D を CPT／グループ単位で（指定フレームごと）。
- すでに登録済みの screen は ensure 対象外。

## やらないこと

- 登録済みページの meta／CPT を ensure のたびに聞き直す
- サンプルページ（`SAMPLE1` 等）を残したまま新規だけ足す（見つかったら削除してよい）
- ensure 未完了・WP-CLI 未同期（要同期なのに未実行）のままテンプレート実装を始める
- ユーザーに `make wp-create-*` の手動実行だけを依頼して終わる
- 本ファイルに `php-config.md` のフィールド仕様を長文コピーする
- 全画面 Figma 一括登録を ensure の既定にする
