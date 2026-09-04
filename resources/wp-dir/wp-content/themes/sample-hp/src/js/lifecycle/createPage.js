/************************************************************
 * MPA の起動入口
 * ※メモ:abort等を使用してイベント破棄するライフサイクルは、MPAは一旦不要なため、複雑化を避けるためにも排除し、簡潔な構成とする
 * - DOM 構築後に initCommon → initProject を1回実行 → ページの start を実行
 *
 * ※各ファイルがエントリーのため、root要素の存在確認等もなしのシンプル構成
 ************************************************************/
import { initBodyPageState } from './bodyPageState.js';
import { domReady } from './domReady.js';
import { initCommon } from '../setup/initCommon.js';
import { initProject } from '../setup/project/initProject.js';

/**
 * ページの start 関数を DOM 準備後に実行する
 * @param {() => void} startPage
 */
export const createPage = async (startPage) => {
  await domReady();

  // ロード完了のクラス付与
  initBodyPageState();

  await initCommon();
  initProject();

  startPage();
};
