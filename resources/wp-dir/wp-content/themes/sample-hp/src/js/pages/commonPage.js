/************************************************************
 * 共通のみページ用エントリ
 * - ページ固有の処理がない画面で使用（createPage のみ、start はプレースホルダ）
 * - HTML では <script src="dist/commonPage.js"> を読み込む
 ************************************************************/
import { MODE } from '../constans/global.js';
import { createPage } from '../lifecycle/createPage.js';

createPage(() => {
  if (MODE === 'develop') {
    console.log('該当のjsファイルを持たない画面に適用する処理です');
  }
});
