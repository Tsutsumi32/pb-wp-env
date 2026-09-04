<?php

if (!defined('ABSPATH')) {
    exit();
}

/**
 * 設定用固定ページから ACF フィールド値を取得する
 *
 * @return mixed
 */
function get_cpt_page_setting_field(string $settings_key, string $field_slug)
{
    if (!function_exists('get_field')) {
        return null;
    }

    $page_id = get_cpt_page_settings_page_id($settings_key);
    if ($page_id <= 0) {
        return null;
    }

    return get_field($field_slug, $page_id);
}

/**
 * ACF ファイルフィールドの値から URL を解決する
 *
 * @param mixed $file_field
 */
function resolve_acf_file_url(mixed $file_field): string
{
    if (is_string($file_field) && $file_field !== '') {
        return $file_field;
    }

    if (is_array($file_field)) {
        return (string) ($file_field['url'] ?? '');
    }

    if (is_numeric($file_field)) {
        $url = wp_get_attachment_url((int) $file_field);

        return is_string($url) ? $url : '';
    }

    return '';
}

/**
 * 設定用固定ページの日付フィールドを表示用に整形する
 *
 * @param mixed $date_value
 */
function format_cpt_page_setting_date(mixed $date_value): string
{
    if (!is_string($date_value) || $date_value === '') {
        return '';
    }

    if (preg_match('/^\d{8}$/', $date_value) === 1) {
        return substr($date_value, 0, 4) .
            '.' .
            substr($date_value, 4, 2) .
            '.' .
            substr($date_value, 6, 2);
    }

    $timestamp = strtotime($date_value);
    if ($timestamp === false) {
        return '';
    }

    return wp_date('Y.m.d', $timestamp);
}
