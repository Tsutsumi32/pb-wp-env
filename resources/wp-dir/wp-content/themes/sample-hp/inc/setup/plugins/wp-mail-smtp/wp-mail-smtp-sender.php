<?php

/**
 * WP Mail SMTP の送信元強制を無効化し、CF7 の sender を優先する.
 *
 * SMTP 側で送信元を固定する場合は functions.php の require をコメントアウトし、
 * .env の WPMS_MAIL_FROM / WPMS_MAIL_FROM_NAME を設定して make wp-config-smtp を実行する。
 */
add_filter(
    'wp_mail_smtp_options_get',
    static function ($value, $group, $key) {
        if ($group !== 'mail') {
            return $value;
        }
        if (in_array($key, ['from_email_force', 'from_name_force'], true)) {
            return false;
        }

        return $value;
    },
    100,
    3
);
