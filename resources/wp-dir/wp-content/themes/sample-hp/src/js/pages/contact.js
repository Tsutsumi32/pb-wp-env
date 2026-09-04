/************************************************************
 * お問い合わせページ
 * - クライアント側バリデーション（formValidator）
 * - お問い合わせの種類に応じた入力ブロックの出し分け（formBranchToggle）
 ************************************************************/
import { createPage } from '../lifecycle/createPage.js';
import { formBranchToggle } from '../features/formBranchToggle.js';
import { formValidator } from '../features/formValidator.js';

/**
 * CF7 の form に枝分け用 data 属性を付与して formBranchToggle を初期化
 * （CF7 が生成する form 要素へ属性を載せる必要がある）
 * @returns {void}
 */
const initFormBranchToggle = () => {
  const formRoot = document.querySelector(
    '[data-feature="formValidator"][data-form-validator-form="contact"]'
  );
  const cf7Form = formRoot?.closest('form');
  if (!(cf7Form instanceof HTMLFormElement)) {
    formBranchToggle.init();
    return;
  }

  cf7Form.setAttribute('data-form-branch-toggle', '');
  cf7Form.setAttribute('data-form-branch-control', 'your-inquiry-type');
  formBranchToggle.init({ form: cf7Form });
};

createPage(() => {
  // WordPress(CF7): 確認画面切替 → 確認画面から CF7 送信
  formValidator.init({ platform: 'wordpressCf7' });
  initFormBranchToggle();
});
