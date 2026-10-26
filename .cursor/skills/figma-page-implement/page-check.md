# ページ完了時の確認

ページの実装が揃ったとき、そのページだけ行う。セクション途中では行わない。サイト全体の仮置き・フォーム・規約・vnu 一括は `@pre-launch-check`（M-4 / M-6 / M-7 と HTML 構文 Step）。

規約本文はここへ複写しない。正本の表は [pre-launch-check/reference.md](../pre-launch-check/reference.md)「M-6」。`.cursor/external/` に案件差分があれば、共有ルールより「この案件では」を優先する。

## いつ行うか

| 呼び出し | 行う |
|----------|------|
| `@figma-page-implement` Phase 3（全セクション `done`） | そのページ |
| `@subpage-design-implement` / `@raw-design-implement` のページ実装完了 | そのページ |
| セクション途中、`@figma-coding` 直呼び | しない |

見た目のセルフチェックを省いても、本確認は行う。本確認も不要と明示したときだけ `Page-check: skipped — user`。

## 手順

1. **対象ファイル**  
   公開画面のパスは `pages.php`（または同等）。トップは `/`。不明なら止めて確認する。静的 HTML はそのファイル 1 つ。  
   規約を見るのは次だけ。`dist` と WordPress 本体は見ない。今回変更していない共通 SCSS / JS は見ない。  
   - そのページのテンプレート（PHP / HTML）  
   - そのページの `src/scss/pages/` と、今回追加・変更した `src/scss/modules/`  
   - そのページの `src/js/pages/` と、今回追加・変更した `src/js` の feature / module  
   ページ用 SCSS / JS が無ければ、その側は対象なし。

2. **vnu**（エージェントが実行する。`VNU_ERRORS_ONLY` は付けない）  
   作業ディレクトリは `vnu-page` がある Makefile（`envs/php` または `envs/wordpress`）。実行すると `up` を含む。  
   - WordPress / PHP の公開画面: `make vnu-page VNU_PATH=<パス>`  
   - 静的 HTML 1 ファイル（PHP 環境のみ）: `make vnu-html VNU_HTML_DIR=<ファイル>`  
   WordPress に静的 HTML 用ターゲットは無い。`make vnu-pages` は使わない。  
   見るのはサーバー HTML またはファイル。JavaScript 実行後の DOM ではない。  
   error も warning も 0 になるまで、そのページの HTML を直して同じコマンドを再実行する。セレクタ追従が要る SCSS だけ合わせてよい。見た目の微調整はしない。  
   接続できないときは、規約確認は続行し、記録に `vnu skipped — <理由>` を残す（実装完了は妨げない）。

3. **規約**  
   M-6 の正本に、手順 1 のファイルを照らす。HTML は `frontend-base/html.mdc`（「vnu（構文）」「アクセシビリティ」を含む。vnu が見ない `alt` の妥当さ、リンクの目的、キーボード順も）。SCSS は `frontend-base/css.mdc` と `project/css/`。JS は `frontend-base/javascript.mdc` と `project/javascript/`。class・PHP テンプレートは `project/template/`。  
   コントラストは測らない。lint とビルドは走らせない。明らかな違反は対象ファイルで直す。サイト横断の棚卸し（不要コード、誤字、他ページ）はしない。

4. **仮置き**（一覧のみ。編集しない）  
   手順 1 のテンプレートだけ。検索語と画像・href の観点は [pre-launch-check/reference.md](../pre-launch-check/reference.md)「M-4」。他ページは見ない。  
   完了報告に、パス・種別・短い抜粋。無ければ「仮置きなし」。残っていても `Page-check` は ok のまま。

5. **フォーム**（そのページにフォームがあるときだけ。一覧のみ。編集しない）  
   `data-feature="formValidator"` または CF7 等のフォームがテンプレートに無いときは対象外。  
   正本は `project/template/form-implementation.mdc`「formValidator」と「formValidator との契約」。本文は複写しない。見るのは `data-form-validator-input` と `data-form-validator-err` のキー対応、検証が要る項目の `data-form-validator-validate`、非表示枝の `hidden` と `data-form-validator-inactive="true"`。入力から完了までの動作は見ない。  
   完了報告に不足があればパスと内容。無ければ「フォーム契約: 不足なし」または「フォーム: 対象外」。

6. **PC と SP**（依頼または計画に両方あるときだけ）  
   正本は `figma/responsive.mdc`「両デザイン」。片方だけの依頼では見ない。同値のプロパティにメディアクエリを足さない。ピクセル比較はしない。  
   見るのは、もう一方が未着手かである。ファースト側だけで、計画にある差分（テンプレートの DOM 差分、スタイルの上書き）がページ SCSS に無いときが未着手。差分が計画上ない（同値）ならメディアクエリ無しでよく、完了報告に「同値のため上書きなし」と 1 行残す。  
   未着手のときはスタイルを書かない。`Page-check: open — 片側のみ`。計画ファイルは残す。バッチは次の画面に進まない。

7. **記録**  
   計画があるときは Progress、無いときは完了報告に 1 行。仮置き・フォーム・PC/SP の結果も完了報告に書く。  
   `Page-check: ok` / `Page-check: fixed` / `Page-check: skipped — user` / `Page-check: open — 片側のみ`  
   vnu だけ届かないとき: `Page-check: rules ok; vnu skipped — <理由>`（規約も直したときは `rules fixed`）。片側のみの open が同時なら、vnu の記録を続けて書く。
