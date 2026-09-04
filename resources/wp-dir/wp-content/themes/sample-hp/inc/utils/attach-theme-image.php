<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * テーマ内画像をメディアライブラリへ登録する
 *************************************************/

const THEME_IMAGE_SOURCE_META = '_theme_image_source';

/** @var list<string> */
const THEME_ASSET_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

/** @var list<string> */
const THEME_ASSET_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

/**
 * テーマルートからの相対パスを正規化する
 */
function normalize_theme_image_relative_path(string $relative_path): string
{
    $relative_path = str_replace('\\', '/', $relative_path);
    $parts         = [];

    foreach (explode('/', $relative_path) as $segment) {
        if ($segment === '' || $segment === '.') {
            continue;
        }

        if ($segment === '..') {
            array_pop($parts);

            continue;
        }

        $parts[] = $segment;
    }

    return implode('/', $parts);
}

/**
 * JSON 配置ディレクトリ（テーマルート基準）と JSON 内パスから、テーマルート相対パスを解決する
 */
function resolve_theme_relative_path_from_base(
    string $base_theme_relative_dir,
    string $path
): string {
    $path = trim(str_replace('\\', '/', $path));

    if ($path === '') {
        return '';
    }

    if (preg_match('#^(https?:)?//#i', $path)) {
        return '';
    }

    $base_theme_relative_dir = normalize_theme_image_relative_path(
        trim($base_theme_relative_dir, '/')
    );

    if (str_starts_with($path, '/')) {
        return normalize_theme_image_relative_path(ltrim($path, '/'));
    }

    $joined = $base_theme_relative_dir === ''
        ? $path
        : $base_theme_relative_dir . '/' . $path;

    return normalize_theme_image_relative_path($joined);
}

/**
 * テーマアセットの拡張子かどうか
 */
function is_theme_asset_relative_path(mixed $value, array $extensions): bool
{
    if (!is_string($value) || $value === '' || ctype_digit($value)) {
        return false;
    }

    if (preg_match('#^(https?:)?//#i', $value)) {
        return false;
    }

    $extension = strtolower((string) pathinfo($value, PATHINFO_EXTENSION));

    return $extension !== '' && in_array($extension, $extensions, true);
}

/**
 * テーマルートからの相対パスを正規化する（後方互換エイリアス）
 */
function normalize_theme_relative_path(string $relative_path): string
{
    return normalize_theme_image_relative_path($relative_path);
}

/**
 * サンプル用の画像パス文字列かどうか（attachment ID は false）
 */
function is_theme_image_relative_path(mixed $value): bool
{
    return is_theme_asset_relative_path($value, THEME_ASSET_IMAGE_EXTENSIONS);
}

/**
 * テーマ内ファイル（画像以外）のパス文字列かどうか
 */
function is_theme_file_relative_path(mixed $value): bool
{
    return is_theme_asset_relative_path($value, THEME_ASSET_FILE_EXTENSIONS);
}

/**
 * テーマ内ファイルをメディアに登録し、添付 ID を返す
 */
function attach_theme_file_to_media(string $relative_path, int $post_id = 0): int|false
{
    return attach_theme_asset_to_media($relative_path, $post_id);
}

/**
 * テーマ内画像をメディアに登録し、添付 ID を返す
 * 同一相対パスは _theme_image_source メタで再利用し、内容が変わった場合のみ上書きする
 */
function attach_theme_image_to_media(string $relative_path, int $post_id = 0): int|false
{
    return attach_theme_asset_to_media($relative_path, $post_id);
}

/**
 * 既存添付の実ファイルをテーマ側ソースで差し替え、メタデータを再生成する
 */
function replace_theme_attachment_file(int $attach_id, string $source_path): bool
{
    $dest_path = get_attached_file($attach_id);
    if (!$dest_path) {
        return false;
    }

    $meta = wp_get_attachment_metadata($attach_id);
    if (is_array($meta) && !empty($meta['sizes']) && is_array($meta['sizes'])) {
        $dir = dirname($dest_path);
        foreach ($meta['sizes'] as $size) {
            if (empty($size['file']) || !is_string($size['file'])) {
                continue;
            }

            $size_path = $dir . '/' . $size['file'];
            if (is_file($size_path)) {
                unlink($size_path);
            }
        }
    }

    $contents = file_get_contents($source_path);
    if ($contents === false || file_put_contents($dest_path, $contents) === false) {
        return false;
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attach_data = wp_generate_attachment_metadata($attach_id, $dest_path);
    wp_update_attachment_metadata($attach_id, $attach_data);

    return true;
}

/**
 * テーマ内アセットをメディアに登録し、添付 ID を返す
 * 同一相対パスが既にある場合は再利用し、ソースと実ファイルのハッシュが異なれば上書きする
 */
function attach_theme_asset_to_media(string $relative_path, int $post_id = 0): int|false
{
    $relative_path = normalize_theme_image_relative_path($relative_path);
    if ($relative_path === '') {
        return false;
    }

    $full_path = get_template_directory() . '/' . $relative_path;
    if (!file_exists($full_path)) {
        return false;
    }

    $existing = get_posts([
        'post_type'      => 'attachment',
        'post_status'    => 'inherit',
        'posts_per_page' => 1,
        'meta_query'     => [
            [
                'key'   => THEME_IMAGE_SOURCE_META,
                'value' => $relative_path,
            ],
        ],
        'fields' => 'ids',
    ]);

    if (!empty($existing)) {
        $attach_id = (int) $existing[0];
        $dest_path = get_attached_file($attach_id);

        if (
            $dest_path
            && is_file($dest_path)
            && hash_file('sha256', $full_path) === hash_file('sha256', $dest_path)
        ) {
            return $attach_id;
        }

        if (replace_theme_attachment_file($attach_id, $full_path)) {
            return $attach_id;
        }

        return false;
    }

    $filename = basename($relative_path);
    $filetype = wp_check_filetype($filename, null);
    $upload   = wp_upload_bits($filename, null, file_get_contents($full_path));

    if (!empty($upload['error'])) {
        return false;
    }

    $attachment = [
        'guid'           => $upload['url'],
        'post_mime_type' => $filetype['type'],
        'post_title'     => sanitize_file_name($filename),
        'post_content'   => '',
        'post_status'    => 'inherit',
    ];

    $attach_id = wp_insert_attachment($attachment, $upload['file'], $post_id);

    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
    wp_update_attachment_metadata($attach_id, $attach_data);
    update_post_meta($attach_id, THEME_IMAGE_SOURCE_META, $relative_path);

    return (int) $attach_id;
}

/**
 * ACF フィールド向けに JSON 値を解決する
 */
function resolve_acf_import_value(
    mixed $value,
    array $field_def,
    int $post_id,
    string $base_theme_relative_dir
): mixed {
    $type = $field_def['type'] ?? 'text';

    if ($type === 'group' && is_array($value)) {
        $sub_fields = $field_def['sub_fields'] ?? null;
        if (!is_array($sub_fields) || $sub_fields === []) {
            return $value;
        }

        $sub_field_map = [];
        foreach ($sub_fields as $sub_field) {
            if (!is_array($sub_field)) {
                continue;
            }

            $sub_slug = $sub_field['slug'] ?? '';
            if ($sub_slug === '') {
                continue;
            }

            $sub_field_map[$sub_slug] = $sub_field;
        }

        $resolved = [];
        foreach ($value as $sub_key => $sub_value) {
            if (!is_string($sub_key)) {
                continue;
            }

            $sub_field_def = $sub_field_map[$sub_key] ?? null;
            if (is_array($sub_field_def)) {
                $resolved[$sub_key] = resolve_acf_import_value(
                    $sub_value,
                    $sub_field_def,
                    $post_id,
                    $base_theme_relative_dir
                );
                continue;
            }

            $resolved[$sub_key] = $sub_value;
        }

        return $resolved;
    }

    if ($type === 'image' && is_string($value) && !ctype_digit($value)) {
        $path = resolve_theme_relative_path_from_base($base_theme_relative_dir, $value);
        if ($path !== '') {
            $attachment_id = attach_theme_image_to_media($path, $post_id);

            return $attachment_id ?: $value;
        }
    }

    if ($type === 'file' && is_string($value) && !ctype_digit($value)) {
        $path = resolve_theme_relative_path_from_base($base_theme_relative_dir, $value);
        if ($path !== '') {
            $attachment_id = attach_theme_file_to_media($path, $post_id);

            return $attachment_id ?: $value;
        }
    }

    return $value;
}
