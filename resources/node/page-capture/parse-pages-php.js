import fs from 'node:fs/promises';

/**
 * pages.php から固定ページ slug 一覧を抽出する（WP 実行不要の簡易パーサ）
 * @param {string} filePath
 * @returns {Promise<string[]>}
 */
export const parsePagesPhpSlugs = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  const constMap = {};

  for (const match of content.matchAll(/public const (\w+)\s*=\s*'([^']+)'/g)) {
    constMap[match[1]] = match[2];
  }

  const pagesBlockMatch = content.match(/protected static \$pages\s*=\s*\[([\s\S]*?)\n\s*\];/);
  if (!pagesBlockMatch) {
    throw new Error(`pages block not found in ${filePath}`);
  }

  const slugs = [];
  for (const match of pagesBlockMatch[1].matchAll(/self::(\w+)\s*=>/g)) {
    const key = match[1];
    const slug = constMap[key] ?? key.toLowerCase().replace(/_/g, '-');
    slugs.push(slug);
  }

  return slugs;
};
