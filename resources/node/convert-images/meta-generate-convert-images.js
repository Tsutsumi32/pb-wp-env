import path from 'path';
import fs from 'fs-extra';
import {
  getAllFiles,
  INPUT_DIR,
  META_FILE,
  supportedExtensions
} from './logic-convert-images.js';

// 現状の画像データを元にメタファイルを生成
async function generateMetaFile() {

  // INPUT_DIRが存在するか確認
  if (!(await fs.pathExists(INPUT_DIR))) {
    console.log(`⚠️ 入力ディレクトリが存在しません: ${INPUT_DIR}`);
    return;
  }

  // すべての画像ファイルを取得
  const files = await getAllFiles(INPUT_DIR);
  const imageMeta = {};

  // 各画像ファイルのメタ情報を収集
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!supportedExtensions.includes(ext)) continue;

    try {
      const stat = await fs.stat(filePath);
      const relativePath = path.relative(INPUT_DIR, filePath);
      imageMeta[relativePath] = {
        mtimeMs: stat.mtimeMs
      };
    } catch (error) {
      console.error(`❌ エラー: ${filePath}`, error);
    }
  }

  // メタファイルを保存
  await fs.writeJSON(META_FILE, imageMeta, { spaces: 2 });
  // Docker環境での権限問題を解決: メタファイルの権限を666に設定
  await fs.chmod(META_FILE, 0o666);

  const count = Object.keys(imageMeta).length;
  console.log(`✅ メタファイルの再生成が完了しました (${count}件の画像を登録)`);
}

generateMetaFile();

