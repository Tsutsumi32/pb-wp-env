import fs from 'node:fs/promises';
import path from 'node:path';
import { BUILD_CONFIG } from '../../build-config.js';

const ROOT_DIR = process.cwd();
const FONT_SUBSET_CONFIG = BUILD_CONFIG.FONT_SUBSET;
const BASE_FILE_PATH = path.resolve(ROOT_DIR, FONT_SUBSET_CONFIG.FILE_CHARS_BASE);
const CRAWLED_FILE_PATH = path.resolve(ROOT_DIR, FONT_SUBSET_CONFIG.FILE_CHARS_CRAWLED);
const MERGED_FILE_PATH = path.resolve(ROOT_DIR, FONT_SUBSET_CONFIG.FILE_CHARS_MERGED);
const USE_CRAWLED_CHARS = process.env.FONT_SUBSET_USE_CRAWLED !== '0';

// 文字ファイルを1文字配列として読み込む。未生成の crawled は空配列許容。
const readChars = async (filePath, required = true) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return [...content.normalize('NFC')].filter((char) => char !== '\n' && char !== '\r');
  } catch (error) {
    if (!required && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const main = async () => {
  // 手動定義文字とクロール抽出文字を読み込む。
  const baseChars = await readChars(BASE_FILE_PATH, true);
  const crawledChars = USE_CRAWLED_CHARS ? await readChars(CRAWLED_FILE_PATH, false) : [];

  // 重複除去してソートし、pyftsubset の入力文字セットとして固定化する。
  const merged = new Set([...baseChars, ...crawledChars]);
  const sorted = [...merged].sort((a, b) => a.localeCompare(b, 'ja'));

  await fs.mkdir(path.dirname(MERGED_FILE_PATH), { recursive: true });
  await fs.writeFile(MERGED_FILE_PATH, sorted.join('') + '\n', 'utf8');

  console.log(`Base chars: ${baseChars.length}`);
  console.log(`Crawled chars: ${crawledChars.length} (use_crawled=${USE_CRAWLED_CHARS})`);
  console.log(`Merged unique chars: ${sorted.length}`);
  console.log(`Saved: ${MERGED_FILE_PATH}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
