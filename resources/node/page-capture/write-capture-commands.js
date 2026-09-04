import { writeCaptureCommandsMd } from './write-capture-commands-md.js';

const main = async () => {
  const outputPath = await writeCaptureCommandsMd(process.cwd());
  console.log(`[capture-commands] wrote: ${outputPath}`);
};

main().catch((error) => {
  console.error('[capture-commands] failed:', error);
  process.exit(1);
});
