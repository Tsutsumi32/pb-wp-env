/************************************************************
 * フォームファイルのドラッグ&ドロップ（features）
 * - data-feature="formFileDrop" を付与した要素内の file input に D&D でファイルをセット
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

/** @type {WeakMap<HTMLElement, number>} */
const dragDepthByZone = new WeakMap();

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
 * @param {HTMLInputElement} fileInput
 * @returns {void}
 */
const bindDropZone = (zone, fileInput) => {
  if (boundZones.has(zone)) return;
  boundZones.add(zone);

  const setDragover = (isActive) => {
    zone.classList.toggle(CLASS_DRAGOVER, isActive);
  };

  zone.addEventListener('dragenter', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (fileInput.disabled) return;

    const depth = (dragDepthByZone.get(zone) ?? 0) + 1;
    dragDepthByZone.set(zone, depth);
    if (depth === 1) setDragover(true);
  });

  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (fileInput.disabled) return;

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  });

  zone.addEventListener('dragleave', (event) => {
    event.preventDefault();
    event.stopPropagation();

    const depth = Math.max(0, (dragDepthByZone.get(zone) ?? 0) - 1);
    dragDepthByZone.set(zone, depth);
    if (depth === 0) setDragover(false);
  });

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthByZone.set(zone, 0);
    setDragover(false);

    if (fileInput.disabled) return;

    const files = event.dataTransfer?.files;
    const file = files && files.length > 0 ? files[0] : null;
    if (!file) return;

    assignFileToInput(fileInput, file);
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

    const zone = featureRoot.querySelector(`[${ATTR_FILE_WRAPPER}]`);
    const fileInput = featureRoot.querySelector('input[type="file"]');

    if (!(zone instanceof HTMLElement) || !(fileInput instanceof HTMLInputElement)) return;

    bindDropZone(zone, fileInput);
  });
};

export const formFileDrop = { init };
