/************************************************************
 * フロントエンドビルド設定定数
 * resources/配下のスクリプトで使用する設定を定義する
 * DIR_SRC_PATH / DIR_DIST_PATH を基準にパスを連結して定義する
 ************************************************************/
const FRONT_DIR = 'wp-dir/wp-content/themes/sample-hp';

const DIR_SRC_PATH = `${FRONT_DIR}/src/`;
const DIR_DIST_PATH = `${FRONT_DIR}/dist/`;

/**
 * ビルド設定
 */
export const BUILD_CONFIG = {
  // パス設定(npm実行階層からの相対)
  DIR_SRC_PATH,
  DIR_DIST_PATH,
  // 変換前の元画像（jpg/png）。npm 実行階層（resources/）からの相対。テーマ外に置ける
  DIR_IMAGE_ORIGIN_PATH: '_origin/',
  // 変換後画像（webp / avif / compression）と SVG の格納親ディレクトリ（公開パス）
  DIR_IMAGE_TARGET_PATH: `${FRONT_DIR}/assets/images/`,
  // フォントの格納親ディレクトリ
  DIR_FONT_TARGET_PATH: `${FRONT_DIR}/assets/fonts/`,

  // SCSS/CSS関連（パスを連結して指定）
  SCSS: {
    DIR_SRC: DIR_SRC_PATH + 'scss/',
    DIR_DIST: DIR_DIST_PATH + 'css/',
  },
  // 出力の際にディレクトリ階層を維持するか
  PRESERVE_DIRECTORY_STRUCTURE: false,

  // JS関連（パスを連結して指定）
  JS: {
    DIR_SRC: DIR_SRC_PATH + 'js/',
    DIR_DIST: DIR_DIST_PATH + 'js/',

    // ビルドモード
    // - 'entry': ページごとエントリ（entry/*.js → dist/*.js）。entry 変更時はその1件のみ、依存変更時は全エントリをビルド。
    // - 'dynamic': 単一エントリ（main.js）で動的 import。pages 等はチャンクで出力。依存変更時はその1ビルドを実行。
    BUILD_MODE: 'entry',

    // ---- entry モード用（動的 import が使えないプロジェクト向け）----
    // エントリ配置ディレクトリ（直下の *.js を dist/*.js で出力。pages 直下をエントリとして使用）
    ENTRY_DIRS: [DIR_SRC_PATH + 'js/pages'],
    // 同名の entry のみビルドする依存ディレクトリ（未使用時は []。pages をエントリにしているため空）
    ENTRY_DEPENDS_NAMED_DIRS: [],
    // 上以外の依存ディレクトリ（ここが変更されたら全エントリを再ビルド）
    ENTRY_DEPENDS_DIRS: [
      DIR_SRC_PATH + 'js/common',
      DIR_SRC_PATH + 'js/constans',
      DIR_SRC_PATH + 'js/features',
      DIR_SRC_PATH + 'js/lifecycle',
      DIR_SRC_PATH + 'js/setup',
      DIR_SRC_PATH + 'js/modules',
      DIR_SRC_PATH + 'js/utils',
      DIR_SRC_PATH + 'js/services',
    ],

    // ---- dynamic モード用（BUILD_MODE === 'dynamic' のとき使用）----
    // 動的 import の単一エントリ（entry/ の外。entry モードではコンパイル対象外）
    DYNAMIC_ENTRY: DIR_SRC_PATH + 'js/main.js',
    // 動的 import で読み込まれるディレクトリ（ここが変更されたら dynamic ビルドを実行＝チャンクが更新される）
    DYNAMIC_DEPENDS_DIRS: [
      DIR_SRC_PATH + 'js/pages',
      DIR_SRC_PATH + 'js/lifecycle',
      DIR_SRC_PATH + 'js/setup',
      DIR_SRC_PATH + 'js/common',
      DIR_SRC_PATH + 'js/core',
      DIR_SRC_PATH + 'js/modules',
    ],
  },

  // SCSSインデックス生成設定（複数指定可能）
  // 各エントリは「生成するファイル」と「そのファイルに読み込むターゲットパス」をセットで管理
  SCSS_INDEX: [
    {
      // 生成するエントリーファイルのパス（npm実行階層からの相対パス）
      OUTPUT_FILE: DIR_SRC_PATH + 'scss/global.scss',
      TARGET_DIRS: [DIR_SRC_PATH + 'scss/global'],
      IMPORT_TYPE: 'use',
      PARTIAL_CHANGE_COMPILE: 'entry',
      AUTO_GENERATE: false,
    },
    {
      // 生成するエントリーファイルのパス（npm実行階層からの相対パス）
      OUTPUT_FILE: DIR_SRC_PATH + 'scss/common.scss',
      // 対象ディレクトリの配列（上から順に読み込まれる）
      // 各ディレクトリは npm実行階層からの相対パス
      TARGET_DIRS: [
        DIR_SRC_PATH + 'scss/animations/mixins',
        DIR_SRC_PATH + 'scss/animations/keyframes',
        DIR_SRC_PATH + 'scss/animations/contracts',
        DIR_SRC_PATH + 'scss/helpers',
        DIR_SRC_PATH + 'scss/utils',
        DIR_SRC_PATH + 'scss/modules/elements',
        DIR_SRC_PATH + 'scss/modules/blocks',
        DIR_SRC_PATH + 'scss/modules/footer',
        DIR_SRC_PATH + 'scss/modules/header',
        DIR_SRC_PATH + 'scss/modules/layouts',
      ],
      // SCSS_INDEX 収集時に再帰探索から除外するディレクトリ（サンプル・参照用など）
      EXCLUDE_DIRS: [
        DIR_SRC_PATH + 'scss/modules/elements/sample',
        DIR_SRC_PATH + 'scss/modules/blocks/sample',
      ],
      // 読み込み方法: 'use' または 'forward'（省略時は 'use'）
      IMPORT_TYPE: 'use',
      // PARTIAL_CHANGE_COMPILE: パーシャル変更時 'entry'=属するエントリのみ / 'all'=全ファイル
      PARTIAL_CHANGE_COMPILE: 'entry',
    },
    {
      OUTPUT_FILE: DIR_SRC_PATH + 'scss/foundation/index.scss',
      TARGET_DIRS: [
        DIR_SRC_PATH + 'scss/foundation/functions',
        DIR_SRC_PATH + 'scss/foundation/mixins/setup',
        DIR_SRC_PATH + 'scss/foundation/mixins/judgement',
        DIR_SRC_PATH + 'scss/foundation/mixins/base',
        DIR_SRC_PATH + 'scss/foundation/mixins/util',
        DIR_SRC_PATH + 'scss/foundation/variables',
        DIR_SRC_PATH + 'scss/foundation/project',
      ],
      IMPORT_TYPE: 'forward',
      PARTIAL_CHANGE_COMPILE: 'entry',
    },
  ],

  // Browser Sync設定
  // プロキシモード: 例: 'php:80'、サーバーモード: null
  BROWSER_SYNC_PROXY: 'wordpress:80',
  // フロント/WordPressコンテナ内の実体パス
  BROWSER_SYNC_WATCH_DIR: FRONT_DIR,

  // 画像変換設定
  IMAGE_CONVERT: {
    // 各形式の出力有効/無効
    ENABLE_AVIF: true,
    ENABLE_WEBP: true,
    ENABLE_COMPRESSION: true,
    // AVIF変換のクオリティ設定
    // quality: 1〜100（数値が高いほど高品質、ファイルサイズも大きくなる）
    // effort: 0〜9（数値が高いほど圧縮効率が良いが処理時間が長くなる）
    AVIF_QUALITY: 80,
    AVIF_EFFORT: 3,
    // WebP変換のクオリティ設定
    // quality: 1〜100（数値が高いほど高品質、ファイルサイズも大きくなる）
    WEBP_QUALITY: 80,
    // compression画像の変換方法
    // 'width': 横幅を指定（COMPRESSION_WIDTHを使用）
    // 'scale': 圧縮率を指定（COMPRESSION_SCALEを使用）
    // 例: COMPRESSION_MODE: 'width', COMPRESSION_WIDTH: 1200
    // 例: COMPRESSION_MODE: 'scale', COMPRESSION_SCALE: 0.5
    COMPRESSION_MODE: 'scale', // 'width' または 'scale'
    // compression画像の横幅（ピクセル単位、COMPRESSION_MODEが'width'の場合に使用、アスペクト比は維持される）
    COMPRESSION_WIDTH: 900,
    // compression画像の圧縮率（0.0〜1.0、COMPRESSION_MODEが'scale'の場合に使用、アスペクト比は維持される）
    // 例: 0.5 = 50%のサイズ、0.8 = 80%のサイズ
    COMPRESSION_SCALE: 0.6,
    // compression画像のJPEG画質設定（元画像がjpg/jpegの場合に使用）
    // quality: 1〜100（数値が高いほど高品質、ファイルサイズも大きくなる）
    // 例: 85 = 高品質、70 = 標準、50 = 低品質
    COMPRESSION_JPEG_QUALITY: 90,
  },

  // フォントサブセット生成設定
  FONT_SUBSET: {
    DIR: `${FRONT_DIR}/assets/fonts/font-subset/`,
    FILE_CHARS_BASE: `${FRONT_DIR}/assets/fonts/font-subset/chars_base.txt`,
    FILE_CHARS_CRAWLED: `${FRONT_DIR}/assets/fonts/font-subset/chars_crawled.txt`,
    FILE_CHARS_MERGED: `${FRONT_DIR}/assets/fonts/font-subset/chars_merged.txt`,
    FILE_CONFIG: `${FRONT_DIR}/assets/fonts/font-subset/fonts.config.json`,
    // クローラー設定（同一オリジン内リンクのみ巡回）
    // CRAWL_START_PATHS: ['/'],
    // CRAWL_MAX_PAGES: 200,
    // CRAWL_MAX_DEPTH: 3,
    // CRAWL_EXCLUDE_PATTERNS: ['/wp-admin', '/wp-login', '/logout'],
  },
};

