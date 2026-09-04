<?php

/**
 * 実行環境の判定（production / develop）
 *
 * src/js/config/resolveAppMode.js と同じ基準でホスト名からランタイム判定する。
 */

/**
 * リクエストのホスト名（ポート除く）
 */
function request_hostname(): string
{
    $host = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? ($_SERVER['HTTP_HOST'] ?? '');
    $host = trim(explode(',', (string) $host, 2)[0]);

    if ($host === '') {
        return '';
    }

    // IPv6（[::1] または [::1]:port）
    if ($host[0] === '[') {
        $end = strpos($host, ']');
        if ($end !== false) {
            return substr($host, 1, $end - 1);
        }
    }

    // hostname:port / IPv4:port（IPv6 生表記はコロンが多いので触らない）
    if (substr_count($host, ':') === 1) {
        return explode(':', $host, 2)[0];
    }

    return $host;
}

/**
 * プライベート IP（LAN 開発・実機確認向け）かどうか
 */
function is_private_ip(string $hostname): bool
{
    $parts = array_map('intval', explode('.', $hostname));
    if (count($parts) !== 4) {
        return false;
    }

    [$a, $b] = $parts;

    return $a === 10 || ($a === 172 && $b >= 16 && $b <= 31) || ($a === 192 && $b === 168);
}

/**
 * ローカル開発ホストかどうか
 */
function is_local_dev_host(?string $hostname = null): bool
{
    $hostname = $hostname ?? request_hostname();
    if ($hostname === '') {
        return false;
    }

    $localHostnames = ['localhost', '127.0.0.1', '::1'];
    $localSuffixes  = ['.local', '.test'];

    if (in_array($hostname, $localHostnames, true)) {
        return true;
    }

    foreach ($localSuffixes as $suffix) {
        if (substr($hostname, -strlen($suffix)) === $suffix) {
            return true;
        }
    }

    return is_private_ip($hostname);
}

/**
 * @return 'production'|'develop'
 */
function app_mode(): string
{
    return is_local_dev_host() ? 'develop' : 'production';
}
