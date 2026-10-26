---
name: coading
description: >-
  通常のフロントエンド実装を、frontend-base と project ルールに沿って行う。
  コーディング、HTML/SCSS/JS実装、テンプレート修正、.sample-code 参照を依頼されたときに使用する。
disable-model-invocation: true
---

# coading

通常のコーディング実装を行うためのワークフローです。

必須参照ルール：
- `.cursor/rules/frontend-base/` 配下のルールを参照して実装してください。
  - `frontend-base/html.mdc`（HTML/PHP/JSテンプレート共通のHTML記述ルール）
  - `frontend-base/css.mdc`（CSS/SCSSの共通実装ルール）
  - `frontend-base/safari-webkit.mdc`（Safari / iOS WebKit。GSAP 起因は `@gsap`）
  - `frontend-base/javascript.mdc`（JavaScript共通の記述順・コメントルール）
- `.cursor/rules/project/` 配下のルールを参照して実装してください。
  - `project/structure.mdc`（プロジェクト構成・編集対象ディレクトリの基準）
  - `project/template/`（テンプレート命名・画像出力などのルール）
  - `project/css/`（SCSS命名・記述・レスポンシブのプロジェクトルール）
  - `project/javascript/`（JS命名・実装のプロジェクトルール）
- `.cursor/external/`（任意）: `project-rules-*.md` / `figma-conventions-*.md` があれば Read。「この案件では」は共有 `project/` より優先
- `.sample-code/`（任意・コンテキスト防衛。正本は本節）:
  - 有無は **軽い確認**（ディレクトリ有無／該当パスの一覧程度）に留める
  - **当該プロジェクトの既存実装があれば読まない**（既存を優先。Figma 系スキルと同趣旨）
  - 読む場合も **今回の実装に直結する数ファイルだけ**。配下の全走査・丸ごと読込は禁止
  - 無い／該当が無いときはスキップしてよい

実行時の基本フロー：
1. frontend-baseルールを確認する（必要なファイル・§のみ）
2. projectルールを確認する（同上）
3. `.cursor/external/` があれば Read（「この案件では」優先）
4. `.sample-code/` — 上記の防衛ルールに従い、必要なら該当断片だけ参照する
5. 参照ルールに沿って実装する

実装時の補足：
- ビルド・コンパイル系コマンドは実行しない（`.cursor/rules/cursour-allways-rules.mdc`「ビルド・コンパイル」参照）。依頼者は開発モード起動済みの前提
- hover で見た目が変わる場合は `project/css/scss.mdc`「hover と transition」に従い、変化プロパティへの `transition`（`get-transition()`）を必ず設定する
