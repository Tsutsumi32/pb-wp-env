// .envファイルから環境変数を読み取る共通ユーティリティ
import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * .env ファイルの探索パス
 * - cwd/.env: resources 直下に .env がある場合
 * - プロジェクトルート/.env: ホストで npm run する場合
 * - /var/www/.env: frontend コンテナ（docker-compose でマウント）
 */
function resolveEnvPath() {
  const candidates = [
    process.env.ENV_FILE,
    join(process.cwd(), '.env'),
    resolve(__dirname, '../../.env'),
  ].filter(Boolean);

  return candidates.find((path) => existsSync(path));
}

// .envファイルから環境変数を読み取る
export function loadEnv() {
  try {
    const envPath = resolveEnvPath();
    if (!envPath) {
      return {};
    }

    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return envVars;
  } catch (error) {
    // .envファイルが存在しない場合は空のオブジェクトを返す
    return {};
  }
}

// 環境変数から値を取得するヘルパー関数
export function getEnv(key, defaultValue) {
  const env = loadEnv();
  return process.env[key] || env[key] || defaultValue;
}

// 真偽値の環境変数を取得するヘルパー関数
export function getEnvBool(key, defaultValue) {
  const value = getEnv(key, defaultValue);
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}

