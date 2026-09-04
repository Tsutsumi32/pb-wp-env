import path from 'path';
import fs from 'fs-extra';
import {
  ensureBaseDirs,
  INPUT_DIR,
  OUTPUT_DIRS,
  getAllFiles,
  getOutputPaths,
  convertImage,
  handleImageDeleted,
  removeEmptyDirsUp
} from './logic-convert-images.js';

const META_FILE = path.resolve('.image-meta.json');
const supportedExtensions = ['.jpg', '.jpeg', '.png'];
let imageMeta = {};

// メタ情報を読み込む
async function loadMeta() {
  if (await fs.pathExists(META_FILE)) {
    imageMeta = await fs.readJSON(META_FILE);
  }
}

// メタ情報を保存
async function saveMeta() {
  await fs.writeJSON(META_FILE, imageMeta, { spaces: 2 });
  // Docker環境での権限問題を解決: メタファイルの権限を666に設定
  await fs.chmod(META_FILE, 0o666);
}

// メタに登録されたが_originに存在しない画像を削除
async function cleanMetaRemovedFiles(originFilesSet) {
  const currentKeys = Object.keys(imageMeta);
  for (const key of currentKeys) {
    const fullOriginPath = path.join(INPUT_DIR, key);
    if (!originFilesSet.has(fullOriginPath)) {
      await handleImageDeleted(fullOriginPath);
      delete imageMeta[key];
    }
  }
}

// 不要な出力画像を削除
async function removeOrphanedConvertedFiles(validOutputPaths) {
  for (const [_, baseDir] of Object.entries(OUTPUT_DIRS)) {
    const files = await getAllFiles(baseDir);
    for (const file of files) {
      if (!validOutputPaths.has(path.resolve(file))) {
        await fs.remove(file);
        console.log(`🗑️ 削除: ${file}`);
        await removeEmptyDirsUp(path.dirname(file), baseDir);
      }
    }
  }
}

// 変換出力先の空ディレクトリをすべて削除
async function cleanAllEmptyConvertedDirs() {
  for (const baseDir of Object.values(OUTPUT_DIRS)) {
    async function removeEmptyRecursive(dir) {
      if (!(await fs.pathExists(dir))) return;

      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await removeEmptyRecursive(full);
        }
      }

      const remaining = await fs.readdir(dir);
      if (remaining.length === 0) {
        await fs.remove(dir);
        console.log(`🗂️ 空ディレクトリ削除: ${dir}`);
      }
    }
    await removeEmptyRecursive(baseDir);
  }
}

// 初期処理: 全_origin画像を変換し、不要ファイル削除
async function initialConvertFromOrigin() {
  console.log('🖼️ 初期変換処理を開始...');
  await ensureBaseDirs();
  await loadMeta();

  const files = await getAllFiles(INPUT_DIR);
  const validOutputPaths = new Set();
  const originFilesSet = new Set();

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!supportedExtensions.includes(ext)) continue;

    originFilesSet.add(filePath);
    const key = path.relative(INPUT_DIR, filePath);
    const stat = await fs.stat(filePath);
    const isChanged = !imageMeta[key] || imageMeta[key].mtimeMs !== stat.mtimeMs;

    const outputs = getOutputPaths(filePath);
    const exists = await Promise.all(Object.values(outputs).map(p => fs.pathExists(p)));
    const isComplete = exists.every(Boolean);

    if (isChanged || !isComplete) {
      console.log(`🔄 変換対象: ${filePath}`);
      await convertImage(filePath);
      imageMeta[key] = { mtimeMs: stat.mtimeMs };
    }

    Object.values(outputs).forEach(p => validOutputPaths.add(path.resolve(p)));
  }

  await cleanMetaRemovedFiles(originFilesSet);
  await removeOrphanedConvertedFiles(validOutputPaths);
  await cleanAllEmptyConvertedDirs();
  await saveMeta();
  console.log('✅ 初期変換完了');
}

initialConvertFromOrigin();
