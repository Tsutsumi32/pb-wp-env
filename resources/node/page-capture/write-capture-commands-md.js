import fs from 'node:fs/promises';
import path from 'node:path';
import { CAPTURE_CONFIG } from './capture-config.js';
import { buildCaptureJobs } from './build-capture-jobs.js';

/**
 * ジョブから make capture-page コマンドを組み立てる
 * @param {{
 *   slug: string;
 *   path: string;
 *   mode?: string;
 *   flow?: string;
 *   beforeCapture?: string;
 *   beforeCaptureArg?: string;
 * }} job
 * @returns {string}
 */
export const buildCapturePageCommand = (job) => {
  const parts = [
    'make capture-page',
    `CAPTURE_PATH=${job.path}`,
    `CAPTURE_SLUG=${job.slug}`,
  ];

  if (job.mode && job.mode !== 'input') {
    parts.push(`CAPTURE_MODE=${job.mode}`);
  }
  if (job.flow) {
    parts.push(`CAPTURE_FLOW=${job.flow}`);
  }
  if (job.beforeCapture) {
    parts.push(`CAPTURE_BEFORE=${job.beforeCapture}`);
  }
  if (job.beforeCaptureArg) {
    parts.push(`CAPTURE_BEFORE_ARG=${job.beforeCaptureArg}`);
  }

  return parts.join(' ');
};

/**
 * 保存先ディレクトリ（コンテナはマウント済み /capture-out、ホストは _docs/capture）
 * @param {string} resourcesRoot
 * @returns {Promise<string>}
 */
const resolveOutputDir = async (resourcesRoot) => {
  const dockerDir = CAPTURE_CONFIG.outputDir;
  try {
    const stat = await fs.stat(dockerDir);
    if (stat.isDirectory()) {
      return dockerDir;
    }
  } catch {
    // ホスト実行時はマウント先が無い
  }
  return path.resolve(resourcesRoot, '../_docs/capture');
};

/**
 * `_docs/capture/README.md` を生成する
 * @param {string} resourcesRoot
 * @returns {Promise<string>} 書き出したファイルパス
 */
export const writeCaptureCommandsMd = async (resourcesRoot) => {
  const jobs = await buildCaptureJobs(resourcesRoot);
  const outputDir = await resolveOutputDir(resourcesRoot);
  const outputPath = path.join(outputDir, 'README.md');

  const pageRows = jobs
    .map((job) => {
      const file = `capture-${job.slug}.png`;
      const command = buildCapturePageCommand(job);
      return `| \`${file}\` | \`${command}\` |`;
    })
    .join('\n');

  const pageCommands = jobs.map((job) => buildCapturePageCommand(job)).join('\n');

  const markdown = `# 画面キャプチャコマンド

このディレクトリの PNG を撮り直すときのコマンド一覧です。
\`capture-config.js\` / \`flows/\` から自動生成しています。手編集しないでください。

前提:
- \`make dev\` で Browser Sync 起動済み（\`make up\` だけではポートは開きません）
- Playwright は \`host.docker.internal\` + \`.env\` の \`WP_CHAGE_PORT\` 経由でホストの開発サーバへ接続します
- HTML 内の \`localhost\` 向け CSS/JS URL は自動でリライトされます（\`CAPTURE_PUBLIC_ORIGIN\`）
- 別 URL を使うときは \`CAPTURE_BASE_URL=\` で上書き（例: \`http://host.docker.internal:8000\`）

## 全画面

既存 PNG はスキップされます。上書きするときは \`CAPTURE_FORCE=1\`。

\`\`\`bash
make capture-all
make capture-all CAPTURE_FORCE=1
\`\`\`

特定ジョブだけ（ファイル名の slug）:

\`\`\`bash
make capture-all CAPTURE_SLUG={slug} CAPTURE_FORCE=1
\`\`\`

## ページごと

| 保存ファイル | コマンド |
|--------------|----------|
${pageRows}

コピペ用:

\`\`\`bash
${pageCommands}
\`\`\`

## コンテナ

\`\`\`bash
make capture-page-up
make capture-page-down
\`\`\`
`;

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, markdown, 'utf8');
  return outputPath;
};
