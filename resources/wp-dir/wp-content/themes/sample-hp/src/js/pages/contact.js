/************************************************************
 * お問い合わせページ
 * - クライアント側バリデーション（formValidator）
 * - お問い合わせの種類に応じた入力ブロックの出し分け（formBranchToggle）
 ************************************************************/
import { createPage } from '../lifecycle/createPage.js';
import { formBranchToggle } from '../features/formBranchToggle.js';
import { formValidator } from '../features/formValidator.js';

createPage(() => {
  formValidator.init({ platform: 'externalService' });
  formBranchToggle.init();
});
