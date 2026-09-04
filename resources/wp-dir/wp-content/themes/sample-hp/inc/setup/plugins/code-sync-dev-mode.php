<?php

if (!defined('ABSPATH')) {
    exit();
}

/***************************************************
 * プラグイン設定のコード同期 — コード制御 / 配信モード共通
 *
 * コード制御モード（各定数 true）: コードが正本。毎リクエスト DB へ同期し、コード外の項目は削除する。
 * 配信モード（false）            : コードからの同期なし。管理画面の DB 設定が正本。
 ****************************************************/

/**
 * CF7 がコード制御モードか
 */
function uds_cf7_is_code_sync_dev_mode(): bool
{
    return !defined('UDS_CF7_CODE_SYNC_DEV_MODE') || UDS_CF7_CODE_SYNC_DEV_MODE;
}

/**
 * ACF がコード制御モードか
 */
function uds_acf_is_code_sync_dev_mode(): bool
{
    return !defined('UDS_ACF_CODE_SYNC_DEV_MODE') || UDS_ACF_CODE_SYNC_DEV_MODE;
}

/**
 * ターム表示順がコード制御モードか
 */
function uds_term_order_is_code_sync_dev_mode(): bool
{
    return !defined('UDS_TERM_ORDER_CODE_SYNC_DEV_MODE') || UDS_TERM_ORDER_CODE_SYNC_DEV_MODE;
}

/**
 * コード制御モード時の管理画面警告 HTML
 */
function uds_code_sync_dev_mode_notice_html(string $plugin_label, string $config_path): string
{
    return '<div class="notice notice-warning is-dismissible"><p><strong>コード制御モード</strong>: ' .
        esc_html($plugin_label) .
        ' の設定はコード（<code>' .
        esc_html($config_path) .
        '</code>）が正本です。コードに無い項目は削除され、変更はリロード時に上書きされます。</p></div>';
}

/**
 * CF7 管理画面か（一覧は post_type を持たないため page / screen id も判定）
 */
function uds_is_cf7_admin_screen(?WP_Screen $screen): bool
{
    if ($screen instanceof WP_Screen) {
        if ($screen->post_type === 'wpcf7_contact_form') {
            return true;
        }

        if ($screen->id === 'toplevel_page_wpcf7' || str_contains($screen->id, '_page_wpcf7')) {
            return true;
        }
    }

    $page = isset($_GET['page']) ? (string) $_GET['page'] : '';

    return $page === 'wpcf7' || str_starts_with($page, 'wpcf7-');
}

/**
 * ACF 管理画面か
 */
function uds_is_acf_admin_screen(?WP_Screen $screen): bool
{
    if ($screen instanceof WP_Screen && $screen->post_type === 'acf-field-group') {
        return true;
    }

    $page = isset($_GET['page']) ? (string) $_GET['page'] : '';

    return str_starts_with($page, 'acf-');
}

/**
 * ターム表示順の設定対象カスタム投稿の管理画面か
 */
function uds_is_term_order_admin_screen(?WP_Screen $screen): bool
{
    if (!$screen instanceof WP_Screen || !class_exists('Post')) {
        return false;
    }

    if ($screen->base !== 'edit' || $screen->post_type === '') {
        return false;
    }

    $term_settings = Post::getTermSettings($screen->post_type) ?? [];

    return $term_settings !== [];
}

/**
 * CF7 / ACF / ターム表示順 管理画面にコード制御モード警告を表示
 */
function uds_code_sync_dev_mode_admin_notices(): void
{
    if (!function_exists('get_current_screen')) {
        return;
    }

    $screen = get_current_screen();

    if (uds_acf_is_code_sync_dev_mode() && uds_is_acf_admin_screen($screen)) {
        echo uds_code_sync_dev_mode_notice_html('ACF', 'inc/config/plugins/acf/acfFileds.php');
    }

    if (uds_cf7_is_code_sync_dev_mode() && uds_is_cf7_admin_screen($screen)) {
        echo uds_code_sync_dev_mode_notice_html('Contact Form 7', 'inc/config/plugins/cf7/cf7.php');
    }

    if (uds_term_order_is_code_sync_dev_mode() && uds_is_term_order_admin_screen($screen)) {
        echo uds_code_sync_dev_mode_notice_html(
            'ターム表示順',
            'inc/config/posts.php（term_settings の order）'
        );
    }
}

if (!defined('UDS_CODE_SYNC_DEV_MODE_BOOTSTRAPPED')) {
    define('UDS_CODE_SYNC_DEV_MODE_BOOTSTRAPPED', true);
    add_action('admin_notices', 'uds_code_sync_dev_mode_admin_notices');
}
