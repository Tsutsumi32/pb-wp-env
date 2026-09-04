/************************************************************
 * 画像ダウンロード（ZIP）
 * - data-action="imgDownload.download" でトリガー
 * - data-img-download-img の画像を data-img-download-folder の data-img-download-folder-name 名で ZIP 化
 ************************************************************/

import { delegate } from '../utils/delegate.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
// const FEATURE_NAME = 'imgDownload';
const FEATURE_ATTR_NAME = 'img-download';
const FEATURE_DATA_PREFIX = `data-${FEATURE_ATTR_NAME}`;

const ATTR_IMG = `${FEATURE_DATA_PREFIX}-img`;
const ATTR_FOLDER = `${FEATURE_DATA_PREFIX}-folder`;
const ATTR_FOLDER_NAME = `${FEATURE_DATA_PREFIX}-folder-name`;
const ATTR_SRC = `${FEATURE_DATA_PREFIX}-src`;
const ATTR_NAME = `${FEATURE_DATA_PREFIX}-name`;
/** ZIP ダウンロードのイベント委譲トリガー */
const ACTION_DOWNLOAD = 'imgDownload.download';

const SELECTOR_IMG = `[${ATTR_IMG}]`;
const SELECTOR_FOLDER = `[${ATTR_FOLDER}]`;

function getExtensionFromUrl(url) {
  let pathname = '';
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = '';
  }
  const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match?.[1]) return match[1].toLowerCase();
  const m = String(url).match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return m?.[1]?.toLowerCase() ?? 'jpg';
}

/**
 * 画像を ZIP でダウンロード
 */
async function downloadImagesAsZip() {
  const images = document.querySelectorAll(SELECTOR_IMG);
  const folderEl = document.querySelector(SELECTOR_FOLDER);
  if (!folderEl) return;

  const folderName = folderEl.getAttribute(ATTR_FOLDER_NAME) || 'images';
  const JSZip = window.JSZip;
  const saveAs = window.saveAs;
  if (!JSZip || !saveAs) {
    console.warn('JSZip または saveAs が読み込まれていません。');
    return;
  }

  const zip = JSZip().folder(folderName);
  let i = 0;
  for (const img of images) {
    const url = img.getAttribute(ATTR_SRC);
    const name = img.getAttribute(ATTR_NAME);
    const ext = getExtensionFromUrl(url || '');
    const filename = (name ? `${name}-${i + 1}` : `image-${i + 1}`) + `.${ext}`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      zip.file(filename, blob);
    } catch (e) {
      console.error(`画像の取得に失敗しました: ${url}`, e);
    }
    i++;
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${folderName}.zip`);
}

/**
 * 初期化（document に delegate。data-action="imgDownload.download" をトリガーに）
 */
const init = () => {
  delegate(document, 'click', {
    [ACTION_DOWNLOAD]: () => downloadImagesAsZip(),
  });
};

export const imgDownload = { init };
