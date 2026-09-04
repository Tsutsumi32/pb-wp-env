/************************************************************
 * リサイズ判定 PC or SP か
 * PCファースト: 768px 以上 = PC、未満 = SP
 * ブレイクポイントを跨いだ際に実行する処理を制御可能
 ************************************************************/
import { BREAKPOINTS } from '../constans/global.js';

/**
 * SP 用 matchMedia（768px 未満）。change リスナー登録などに利用
 * @returns {MediaQueryList}
 */
export const getSpMediaQuery = () => window.matchMedia(`(max-width: ${BREAKPOINTS.SP - 1}px)`);

/**
 * SPレイアウトかどうか判定
 * @returns {boolean} SPレイアウトの場合true、PCレイアウトの場合false
 */
export const isSp = () => getSpMediaQuery().matches;

/**
 * PCレイアウトかどうか判定
 * @returns {boolean} PCレイアウトの場合true、SPレイアウトの場合false
 */
export const isPc = () => !isSp();

/**
 * PC SP 切り替わり時に一度だけ実行する
 * @param {Function} funcPc - PCレイアウト時の実行関数
 * @param {Function} funcSp - SPレイアウト時の実行関数
 */
export const resizeTimingControl = (funcPc, funcSp) => {
  // pc領域かどうか
  let change_pc_check = false;
  isPc() && (change_pc_check = true);
  // sp領域かどうか
  let change_sp_check = false;
  isSp() && (change_sp_check = true);

  window.addEventListener('resize', () => {
    if (isPc()) {
      if (!change_pc_check) {
        funcPc && funcPc();
        change_pc_check = true;
      }
      change_sp_check = false;
    } else {
      if (!change_sp_check) {
        funcSp && funcSp();
        change_sp_check = true;
      }
      change_pc_check = false;
    }
  });
};
