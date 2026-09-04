import { exec } from 'child_process';
import { promisify } from 'util';
import browserSync from 'browser-sync';
import { getEnv } from '../load-env.js';
import { BUILD_CONFIG } from '../../build-config.js';

const execAsync = promisify(exec);

/**
 * 既存のブラウザシンクプロセスを終了
 * 現在のプロセス（自分自身）は除外する
 */
async function killExistingBrowserSync() {
  try {
    const currentPid = process.pid;
    // ブラウザシンクプロセスを検索（現在のプロセスを除外）
    const { stdout } = await execAsync(`pgrep -f "browser-sync" || true`);
    if (stdout.trim()) {
      const pids = stdout.trim().split('\n').filter(pid => {
        const pidNum = parseInt(pid.trim());
        // 現在のプロセスとその親プロセスを除外
        return pidNum !== currentPid && pidNum !== process.ppid;
      });

      if (pids.length > 0) {
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid} 2>/dev/null || true`);
          } catch (error) {
            // プロセスが既に終了している場合は無視
          }
        }
        console.log('🔄 既存のブラウザシンクプロセスを終了しました');
      }
    }
  } catch (error) {
    // プロセスが存在しない場合はエラーを無視
    // console.log('既存のブラウザシンクプロセスは見つかりませんでした');
  }
}

/**
 * 指定されたポートを使用しているプロセスを終了
 * 現在のプロセス（自分自身）は除外する
 * @param {string} port - ポート番号
 */
async function killProcessOnPort(port) {
  try {
    const currentPid = process.pid;
    // lsofでポートを使用しているプロセスを検索して終了
    // lsofが利用できない環境でもエラーにならないようにする
    try {
      const { stdout } = await execAsync(`lsof -ti:${port} 2>/dev/null || true`);
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n').filter(pid => {
          const pidNum = parseInt(pid.trim());
          // 現在のプロセスとその親プロセスを除外
          return pidNum !== currentPid && pidNum !== process.ppid && pid;
        });

        if (pids.length > 0) {
          for (const pid of pids) {
            try {
              await execAsync(`kill -9 ${pid} 2>/dev/null || true`);
            } catch (error) {
              // プロセスが既に終了している場合は無視
            }
          }
          console.log(`🔄 ポート ${port} を使用していたプロセスを終了しました`);
        }
      }
    } catch (error) {
      // lsofが利用できない環境では、fuserを試す（Linux環境）
      // ただし、fuserは現在のプロセスを除外できないため、より慎重に
      try {
        // fuserは使用しない（現在のプロセスも終了してしまう可能性があるため）
        // await execAsync(`fuser -k ${port}/tcp 2>/dev/null || true`);
      } catch (error) {
        // 無視
      }
    }
  } catch (error) {
    // ポートが使用されていない場合はエラーを無視
  }
}

/**
 * ブラウザシンクを起動
 */
async function startBrowserSync() {
  // ポートは環境変数から取得（docker-compose.ymlで使用）
  const port = getEnv('FRONT_PORT', '3000');
  // その他の設定は定数から取得
  const proxyTarget = BUILD_CONFIG.BROWSER_SYNC_PROXY;
  const watchDir = BUILD_CONFIG.BROWSER_SYNC_WATCH_DIR;
  const localAddress = getEnv('LOCAL_ADDRESS', 'localhost');

  // 既存のプロセスを終了
  await killExistingBrowserSync();
  await killProcessOnPort(port);

  // 少し待ってから起動（プロセス終了の完了を待つ）
  await new Promise(resolve => setTimeout(resolve, 500));

  // 監視するファイルパターン（ディレクトリ部分のみ環境変数で管理）
  const watchFilesArray = [
    `${watchDir}/*.html`,
    `${watchDir}/*.php`,
    `${watchDir}/**/*.html`,
    `${watchDir}/**/*.php`,
    `${watchDir}/**/*.css`,
    `${watchDir}/**/*.js`
  ];

  // ブラウザシンク起動（API）:
  // WordPressが受け取るHostが `wordpress:3000` になってしまうと、WordPress側で
  // `Location: http://wordpress:3000/...` のリダイレクトが発生するため、
  // プロキシ時のHostヘッダを `localhost:${port}` に上書きする。
  const bs = browserSync.create();

  const proxyHostHeader = `${localAddress}:${port}`;

  if (proxyTarget) {
    console.log(`🚀 Browser Sync starting with proxy: ${proxyTarget}`);
    bs.init({
      // proxyを文字列ではなくオブジェクトで渡す（reqHeadersを効かせるため）
      proxy: {
        target: proxyTarget,
        // WordPressが参照するHost情報を安定化させる
        reqHeaders: {
          host: proxyHostHeader,
          'x-forwarded-host': proxyHostHeader,
          'x-forwarded-port': String(port),
        },
      },
      port,
      files: watchFilesArray,
      open: false,
    });
  } else {
    console.log(`🚀 Browser Sync starting in server mode (${watchDir})`);
    bs.init({
      server: watchDir,
      port,
      files: watchFilesArray,
      open: false,
    });
  }
}

// ブラウザシンクを起動
startBrowserSync();
