/************************************************************
 * プロジェクト固有の共通初期化（Sample）
 * - 横断テンプレートで共通の initCommon のあとに実行する
 * - 他案件へ移植するときは本ファイルの内容を差し替える
 ************************************************************/
import { header } from '../../modules/header.js';

/**
 * プロジェクト固有の全画面共通初期化（1ドキュメントにつき1回）
 */
export function initProject() {
  // Lottie（data-feature="lottieAnimation" がある画面のみ描画）
  // _lottieAnimation.init();
  // フローティング SCROLL ボタン（下端で非表示）
  // flowBtn.init();
  header.init({
    lockScroll: true,
  });
}
