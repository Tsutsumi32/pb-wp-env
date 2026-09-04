/************************************************************
 * 全画面共通初期化（プロジェクト横断）
 * - WordPress テンプレート系で再利用する処理のみ
 * - 案件固有の処理は project/initProject.js へ
 ************************************************************/

import { scrollObserver } from '../features/scrollObserver.js';
import { selectActiveState } from '../features/selectActiveState.js';
import { initImgSaveGuards } from './tasks/imgSaveGuards.js';
import { initMainMinHeightToViewportFooter } from './tasks/mainMinHeightToViewportFooter.js';
import { initScrollbarWidthSync } from './tasks/scrollbarWidthSync.js';
import { initSmoothAnchorLink, initHashScrollOnLoad } from './tasks/smoothAnchorLink.js';
import { initViewportUnitSync } from './tasks/viewportUnitSync.js';
import { duplicateSibling } from '../features/duplicateSibling.js';

/**
 * 全画面共通初期化（1ドキュメントにつき1回呼ぶ想定）
 */
export async function initCommon() {
  // スクロールバー幅・スクロールバー除外幅の1%をCSS変数に反映
  initScrollbarWidthSync();
  initViewportUnitSync();

  // select選択時のアクティブクラス付与
  selectActiveState.init();

  // スクロール(IntersectionObserver)アクティブクラス付与処理
  scrollObserver.init();

  // アンカーリンク
  initSmoothAnchorLink();
  // 画面遷移を伴うアンカーリンク（#hash 付きURLでの初回読み込み時）のスクロール調整
  initHashScrollOnLoad();

  // 画像選択制御
  initImgSaveGuards();

  // footer高さ調整
  initMainMinHeightToViewportFooter();

  // 指定要素を同階層の兄弟として複製
  duplicateSibling.init();
}
