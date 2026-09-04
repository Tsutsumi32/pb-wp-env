import path from 'node:path';

/**
 * プロジェクト固有のキャプチャ定義（正本）。
 * 初回セットアップ時にエージェントがこのファイルを調整する想定。
 * 2回目以降は make capture-page / make capture-all で手動実行。
 */
export const CAPTURE_CONFIG = {
  /** pages.php の相対パス（resources ルート基準） */
  pagesPhpPath: 'wp-dir/wp-content/themes/kawamoto-service-hp/inc/config/pages.php',
  /** 保存先（Playwright コンテナ内。docker-compose でホスト _docs/capture にマウント） */
  outputDir: '/capture-out',
  /** pages.php から自動列挙した slug のうち除外するキー */
  excludeSlugs: ['error', 'not-found'],
  /** slug → パス上書き（未指定時は top=/、他は /{slug}/） */
  pathOverrides: {
    top: '/',
  },
};

/**
 * pages.php に無いバリアント・確認画面などの追加ジョブ。
 * slug は capture-{slug}.png のファイル名に対応。
 */
export const CAPTURE_VARIANT_JOBS = [
  {
    slug: 'recruitment-new',
    path: '/recruitment/',
    beforeCapture: 'recruitmentTab',
    beforeCaptureArg: 'new',
  },
  {
    slug: 'recruitment-mid',
    path: '/recruitment/',
    beforeCapture: 'recruitmentTab',
    beforeCaptureArg: 'mid',
  },
  {
    slug: 'contact-new',
    path: '/contact/',
    mode: 'input',
    flow: 'contactNewGrad',
  },
  {
    slug: 'contact-mid',
    path: '/contact/',
    mode: 'input',
    flow: 'contactMidCareer',
  },
  {
    slug: 'contact-confirm-new',
    path: '/contact/',
    mode: 'confirm',
    flow: 'contactConfirmNewGrad',
  },
];

/**
 * pages.php から列挙するが、バリアントジョブで別名撮影する slug（重複防止）
 */
export const CAPTURE_SLUGS_REPLACED_BY_VARIANTS = ['recruitment', 'contact'];
