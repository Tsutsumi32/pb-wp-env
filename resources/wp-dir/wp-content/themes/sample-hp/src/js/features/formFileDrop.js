/************************************************************
 * フォームファイルのドラッグ&ドロップ（features）
 * - data-feature="formFileDrop" を付与した要素内の file input に D&D でファイルをセット
 * - クリックでファイル選択ダイアログを開く（ネイティブ input はヒット判定に使わない）
 * - formValidator のファイル UI（選択名表示・削除）と連携するため change / input を発火
 *
 * マークアップ例:
 * <div class="el_fileUploader" data-feature="formFileDrop">
 *   <div class="el_fileUploader_inner" data-form-validator-file-wrapper>
 *     [file resume-file ...]
 *   </div>
 * </div>
 ************************************************************/

import { DATA_ATTR } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性・状態 class
// ---------------------------------------------------------------------------
const FEATURE_NAME = 'formFileDrop';
const SELECTOR_FEATURE = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;
const ATTR_FILE_WRAPPER = 'data-form-validator-file-wrapper';
const CLASS_DRAGOVER = 'is_dragover';

/** @type {WeakSet<HTMLElement>} */
const boundZones = new WeakSet();

/**
 * ポインタ座標が要素の描画矩形内か
 * @param {HTMLElement} el
 * @param {number} clientX
 * @param {number} clientY
 * @returns {boolean}
 */
const isPointInElement = (el, clientX, clientY) => {
  const rect = el.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
};

/**
 * file input に単一ファイルをセットし、formValidator 連携用イベントを発火
 * @param {HTMLInputElement} fileInput
 * @param {File} file
 * @returns {void}
 */
const assignFileToInput = (fileInput, file) => {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  fileInput.dispatchEvent(new Event('input', { bubbles: true }));
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
};

/**
 * D&D ゾーンにイベントを束ねる
 * @param {HTMLElement} zone
 * @param {HTMLElement} visual
 * @param {HTMLInputElement} fileInput
 * @returns {void}
 */
const bindDropZone = (zone, visual, fileInput) => {
  if (boundZones.has(zone)) return;
  boundZones.add(zone);

  /**
   * ドラッグオーバー見た目を切替
   * @param {boolean} isActive
   * @returns {void}
   */
  const setDragover = (isActive) => {
    visual.classList.toggle(CLASS_DRAGOVER, isActive);
  };

  zone.addEventListener('dragenter', (event) => {
    event.preventDefault();
    if (fileInput.disabled) return;
    setDragover(true);
  });

  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (fileInput.disabled) return;

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    setDragover(true);
  });

  zone.addEventListener('dragleave', (event) => {
    event.preventDefault();
    const related = event.relatedTarget;
    if (related instanceof Node && zone.contains(related)) return;
    if (isPointInElement(zone, event.clientX, event.clientY)) return;
    setDragover(false);
  });

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragover(false);

    if (fileInput.disabled) return;

    const files = event.dataTransfer?.files;
    const file = files && files.length > 0 ? files[0] : null;
    if (!file) return;

    assignFileToInput(fileInput, file);
  });

  zone.addEventListener('click', (event) => {
    if (fileInput.disabled) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('button')) return;
    if (event.target.closest('input[type="file"]')) return;
    fileInput.click();
  });
};

/**
 * data-feature="formFileDrop" 配下のファイル入力に D&D を有効化
 * @param {{ root?: ParentNode }} [options]
 * - 省略時: document 全体から対象を束ねる
 * @returns {void}
 */
const init = (options = {}) => {
  const root = options.root ?? document;

  Array.from(root.querySelectorAll(SELECTOR_FEATURE)).forEach((featureRoot) => {
    if (!(featureRoot instanceof HTMLElement)) return;

    const fileWrapper = featureRoot.querySelector(`[${ATTR_FILE_WRAPPER}]`);
    const visual = fileWrapper instanceof HTMLElement ? fileWrapper : featureRoot;
    const fileInput = featureRoot.querySelector('input[type="file"]');

    if (!(fileInput instanceof HTMLInputElement)) return;

    bindDropZone(featureRoot, visual, fileInput);
  });
};

export const formFileDrop = { init };
