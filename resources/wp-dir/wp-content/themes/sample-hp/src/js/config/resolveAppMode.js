/************************************************************
 * 実行環境の判定（production / develop）
 * - ビルド不要。ホスト名からランタイム判定
 * - コンソール出力の有無などで使用する
 ************************************************************/

const LOCAL_HOSTNAMES = ['localhost'];
const LOCAL_HOST_SUFFIXES = ['.local', '.test'];

/**
 * プライベート IP（LAN 開発・実機確認向け）
 * @param {string} hostname
 * @returns {boolean}
 */
const isPrivateIp = (hostname) => {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;

  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
};

/**
 * ローカル開発環境かどうか
 * @param {string} hostname
 * @returns {boolean}
 */
const isLocalDevHost = (hostname) => {
  if (!hostname) return false;

  return (
    LOCAL_HOSTNAMES.includes(hostname) ||
    LOCAL_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    isPrivateIp(hostname)
  );
};

const isLocalDev = isLocalDevHost(globalThis.location?.hostname ?? '');

/** @type {'production' | 'develop'} */
export const MODE = isLocalDev ? 'develop' : 'production';
