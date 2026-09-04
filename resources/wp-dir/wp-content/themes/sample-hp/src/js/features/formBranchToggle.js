/************************************************************
 * フォーム入力ブロックの出し分け（features）
 * - フォームに data-form-branch-toggle を付与し、data-form-branch-control にコントロール名（name）を指定
 * - ラジオ or セレクトの選択値に応じて、data-form-branch に列挙した値のいずれかに一致するブロックだけ表示
 * - 非表示ブロックは hidden・data-form-validator-inactive="true"・配下の入力 disabled とし、
 *   formValidator の subtree クリアと blur ウォッチ解除を行う（formValidator 利用時）
 * - CF7 利用時は非表示枝の未送信対策を <theme>/inc/config/plugins/cf7/cft-branches.php で管理する
 *
 * マークアップ例:
 * <form data-form-branch-toggle data-form-branch-control="inquiry_type">
 *   <input type="radio" name="inquiry_type" value="a" />
 *   <input type="radio" name="inquiry_type" value="b" />
 *   <div data-form-branch="a c">AまたはCのとき表示</div>
 *   <div data-form-branch="b" hidden data-form-validator-inactive="true">Bのとき表示</div>
 * </form>
 ************************************************************/

import { formValidator } from './formValidator.js';

// ---------------------------------------------------------------------------
// data 属性（値はケバブケースのまま定数化）
// ---------------------------------------------------------------------------
/** この属性がある form のみ init 時に自動束ねる */
const ATTR_TOGGLE = 'data-form-branch-toggle';
/** 出し分けの基準となる input / select の name */
const ATTR_CONTROL = 'data-form-branch-control';
/** 空白区切りで、コントロールの value と照合する（いずれか一致で表示） */
const ATTR_BRANCH = 'data-form-branch';
const INACTIVE_ATTR = 'data-form-validator-inactive';

/** @type {WeakSet<HTMLElement>} */
const boundForms = new WeakSet();

/**
 * @param {string} name
 * @returns {string}
 */
const escapeControlNameForSelector = (name) => {
  const cssApi =
    typeof window !== 'undefined'
      ? /** @type {{ escape?: (s: string) => string }} */ (
          /** @type {Record<string, unknown>} */ (window).CSS
        )
      : undefined;
  if (cssApi && typeof cssApi.escape === 'function') {
    return cssApi.escape(name);
  }
  return name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

/**
 * @param {string | null} raw
 * @returns {string[]}
 */
const parseBranchValues = (raw) =>
  (raw ?? '')
    .trim()
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * @param {HTMLElement} form
 * @param {string} controlName
 * @returns {string}
 */
const getControlValue = (form, controlName) => {
  const esc = escapeControlNameForSelector(controlName);

  const radioChecked = form.querySelector(`input[type="radio"][name="${esc}"]:checked`);
  if (radioChecked instanceof HTMLInputElement) return radioChecked.value;

  const select = form.querySelector(`select[name="${esc}"]`);
  if (select instanceof HTMLElement && 'value' in select) {
    return String(/** @type {{ value: string }} */ (select).value);
  }

  return '';
};

/**
 * @param {EventTarget | null} target
 * @param {string} controlName
 * @returns {boolean}
 */
const isControlTarget = (target, controlName) => {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target instanceof HTMLInputElement &&
    target.type === 'radio' &&
    target.name === controlName
  ) {
    return true;
  }
  if (target.tagName === 'SELECT' && target.getAttribute('name') === controlName) {
    return true;
  }
  return false;
};

/**
 * @param {HTMLElement} form
 * @param {string} controlName
 * @returns {void}
 */
const syncBranches = (form, controlName) => {
  const current = getControlValue(form, controlName);

  form.querySelectorAll(`[${ATTR_BRANCH}]`).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const tokens = parseBranchValues(node.getAttribute(ATTR_BRANCH));
    const show = tokens.length > 0 && tokens.includes(current);

    node.hidden = !show;
    if (show) {
      node.removeAttribute(INACTIVE_ATTR);
    } else {
      node.setAttribute(INACTIVE_ATTR, 'true');
    }

    node.querySelectorAll('input, select, textarea').forEach((field) => {
      if (!(field instanceof HTMLElement)) return;
      if (field instanceof HTMLInputElement && field.type === 'hidden') return;
      field.disabled = !show;
    });
  });

  form.querySelectorAll(`[${INACTIVE_ATTR}="true"]`).forEach((sub) => {
    if (sub instanceof HTMLElement) {
      formValidator.clearValidationMessagesInSubtree(sub);
    }
  });
  formValidator.clearBlurWatchForForm(form);
};

/**
 * @param {HTMLElement} form
 * @returns {void}
 */
const bindForm = (form) => {
  if (!(form instanceof HTMLElement) || form.tagName !== 'FORM') return;
  if (boundForms.has(form)) return;

  const controlName = form.getAttribute(ATTR_CONTROL)?.trim();
  if (!controlName) return;

  boundForms.add(form);
  syncBranches(form, controlName);

  form.addEventListener('change', (event) => {
    if (!isControlTarget(event.target, controlName)) return;
    syncBranches(form, controlName);
  });
};

/**
 * @param {{ root?: ParentNode; form?: HTMLElement | null }} [options]
 * - 省略時: `root` 配下の `form[data-form-branch-toggle]` をすべて束ねる（既定 root は document）
 * - `form` を渡した場合はそのフォームのみ（同一ページに複数あるときの明示用。`data-form-branch-control` は必須）
 * @returns {void}
 */
const init = (options = {}) => {
  const root = options.root ?? document;

  if (options.form instanceof HTMLElement && options.form.tagName === 'FORM') {
    bindForm(options.form);
    return;
  }

  Array.from(root.querySelectorAll(`form[${ATTR_TOGGLE}]`))
    .filter((el) => el instanceof HTMLElement && el.tagName === 'FORM')
    .forEach((form) => bindForm(form));
};

export const formBranchToggle = { init };
