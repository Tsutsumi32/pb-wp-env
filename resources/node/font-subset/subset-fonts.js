import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { BUILD_CONFIG } from '../../build-config.js';

const ROOT_DIR = process.cwd();
const FONT_SUBSET_CONFIG = BUILD_CONFIG.FONT_SUBSET;
const CONFIG_PATH = path.resolve(ROOT_DIR, FONT_SUBSET_CONFIG.FILE_CONFIG);
const MERGED_CHARS_PATH = path.resolve(ROOT_DIR, FONT_SUBSET_CONFIG.FILE_CHARS_MERGED);

// 外部コマンド実行を共通化し、失敗時は即終了する。
const runCommand = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
};

// コマンドの存在チェック
const commandExists = (command) => {
  const result = spawnSync('bash', ['-lc', `command -v ${command}`], { stdio: 'pipe' });
  return result.status === 0;
};

// pyftsubset 実行方法を解決（pip 版 CLI / Debian apt は python3 -m のみの場合あり）
const resolveSubsetRunner = () => {
  for (const command of ['pyftsubset', 'pyftsubset3']) {
    if (commandExists(command)) {
      return { command, prefixArgs: [] };
    }
  }

  const moduleCheck = spawnSync('python3', ['-m', 'fontTools.subset', '--help'], { stdio: 'pipe' });
  if (moduleCheck.status === 0) {
    return { command: 'python3', prefixArgs: ['-m', 'fontTools.subset'] };
  }

  throw new Error(
    'fonttools (pyftsubset) is not installed. Rebuild the frontend image (make build-docker).',
  );
};

const main = async () => {
  const subsetRunner = resolveSubsetRunner();

  const configRaw = await fs.readFile(CONFIG_PATH, 'utf8');
  const config = JSON.parse(configRaw);
  const fonts = Array.isArray(config.fonts) ? config.fonts : [];

  if (fonts.length === 0) {
    throw new Error(`No fonts found in config: ${CONFIG_PATH}`);
  }

  // 設定ファイルの全フォントに対して同じ文字セットで subset を生成する。
  for (const font of fonts) {
    const inputPath = path.resolve(ROOT_DIR, font.input);
    const outputPath = path.resolve(ROOT_DIR, font.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    console.log(`Subsetting: ${font.name || path.basename(inputPath)}`);
    runCommand(subsetRunner.command, [
      ...subsetRunner.prefixArgs,
      inputPath,
      `--text-file=${MERGED_CHARS_PATH}`,
      '--flavor=woff2',
      `--output-file=${outputPath}`,
    ]);
    console.log(`Saved: ${outputPath}`);
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
