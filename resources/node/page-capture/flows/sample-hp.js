/**
 * お問い合わせフォーム（CF7）のキャプチャ用フロー。
 * プロジェクト固有。フォーム項目変更時はここを更新する。
 */

const SAMPLE = {
  nameSei: '川本',
  nameMei: '太郎',
  kanaSei: 'かわもと',
  kanaMei: 'たろう',
  school: '〇〇大学',
  zip: '4600008',
  pref: '愛知県',
  address1: '名古屋市中区栄',
  address2: '1-1-1',
  tel: '0522499814',
  email: 'capture@example.com',
  question: 'キャプチャ用の入力テストです。',
  reason: 'キャプチャ用の転職希望理由です。',
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
const selectFirstRealOption = async (page, name) => {
  const select = page.locator(`select[name="${name}"]`);
  const options = await select.locator('option').evaluateAll((nodes) =>
    nodes.map((node) => ({
      value: node.getAttribute('value') ?? '',
      label: node.textContent?.trim() ?? '',
    })),
  );
  const target = options.find((opt) => opt.value && !['都道府県', '西暦', '月', '日', '選択'].includes(opt.label));
  if (!target) {
    throw new Error(`No selectable option for select[name="${name}"]`);
  }
  await select.selectOption(target.value);
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
const fillSharedFields = async (page) => {
  await page.locator('input[name="recruit-name-sei"]').fill(SAMPLE.nameSei);
  await page.locator('input[name="recruit-name-mei"]').fill(SAMPLE.nameMei);
  await page.locator('input[name="recruit-kana-sei"]').fill(SAMPLE.kanaSei);
  await page.locator('input[name="recruit-kana-mei"]').fill(SAMPLE.kanaMei);
  await page.locator('input[name="recruit-sex"][value="男性"]').check();

  await selectFirstRealOption(page, 'recruit-birth-y');
  await selectFirstRealOption(page, 'recruit-birth-m');
  await selectFirstRealOption(page, 'recruit-birth-d');

  await page.locator('input[name="recruit-school"]').fill(SAMPLE.school);
  await selectFirstRealOption(page, 'recruit-grad-y');
  await selectFirstRealOption(page, 'recruit-grad-m');

  await page.locator('input[name="recruit-zip"]').fill(SAMPLE.zip);
  await page.locator('select[name="recruit-pref"]').selectOption({ label: SAMPLE.pref });
  await page.locator('input[name="recruit-address1"]').fill(SAMPLE.address1);
  await page.locator('input[name="recruit-address2"]').fill(SAMPLE.address2);
  await page.locator('input[name="recruit-tel"]').fill(SAMPLE.tel);

  await page.locator('input[name="recruit-co-zip"]').fill(SAMPLE.zip);
  await page.locator('select[name="recruit-co-pref"]').selectOption({ label: SAMPLE.pref });
  await page.locator('input[name="recruit-co-address1"]').fill(SAMPLE.address1);
  await page.locator('input[name="recruit-co-address2"]').fill(SAMPLE.address2);
  await page.locator('input[name="recruit-co-tel"]').fill(SAMPLE.tel);

  await page.locator('input[name="recruit-email"]').fill(SAMPLE.email);
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} recruitType
 * @returns {Promise<void>}
 */
const selectRecruitType = async (page, recruitType) => {
  await page.locator(`input[name="recruit-type"][value="${recruitType}"]`).check();
  await page.waitForTimeout(200);
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export const contactNewGradInput = async (page) => {
  await selectRecruitType(page, '新卒');
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export const contactMidCareerInput = async (page) => {
  await selectRecruitType(page, '中途');
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
const fillNewGradFields = async (page) => {
  await page.locator('textarea[name="recruit-question-new"]').fill(SAMPLE.question);
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
const fillMidCareerFields = async (page) => {
  await page.locator('textarea[name="recruit-reason"]').fill(SAMPLE.reason);
  await selectFirstRealOption(page, 'recruit-count');

  await selectFirstRealOption(page, 'recruit-exp1-start-y');
  await selectFirstRealOption(page, 'recruit-exp1-start-m');
  await page.locator('input[name="recruit-exp1-company"]').fill('株式会社サンプル');
  await page.locator('textarea[name="recruit-exp1-contents"]').fill('キャプチャ用の職務内容です。');
  await selectFirstRealOption(page, 'recruit-exp1-occupation');
  await selectFirstRealOption(page, 'recruit-exp1-contract');
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
const agreePrivacy = async (page) => {
  const agree = page.locator('input[name="agree[]"], input[name="agree"]');
  await agree.first().check();
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
const goToConfirm = async (page) => {
  await page.locator('[data-action="formValidator.submit"]').click();
  const confirm = page.locator('[data-form-validator-page="confirm"]');
  await confirm.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(200);
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export const contactConfirmNewGrad = async (page) => {
  await selectRecruitType(page, '新卒');
  await fillSharedFields(page);
  await fillNewGradFields(page);
  await agreePrivacy(page);
  await goToConfirm(page);
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} tabKey
 * @returns {Promise<void>}
 */
export const recruitmentTab = async (page, tabKey) => {
  await page.locator(`[data-tab-trigger][data-tab="${tabKey}"]`).click();
  await page.waitForTimeout(200);
};

/** flow 名 → 実行関数 */
export const FLOW_RUNNERS = {
  contactNewGrad: contactNewGradInput,
  contactMidCareer: contactMidCareerInput,
  contactConfirmNewGrad: contactConfirmNewGrad,
  recruitmentTab,
};
