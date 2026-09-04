<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * カード系ブロック共通: 画像出力
 *************************************************/

/**
 * ブロックエディタの SSR プレビューかどうか
 */
function sample_hp_is_custom_block_editor_preview(): bool
{
    return defined('REST_REQUEST') && REST_REQUEST;
}

/**
 * アイキャッチ未設定時のフォールバック画像 HTML
 */
function sample_hp_render_card_fallback_image(string $media_class, string $thumb_class): string
{
    $src = IMAGE_BASE_URI . '/' . IMAGE_DIR_WEBP . '/noImg.webp';

    return sprintf(
        '<img class="%s %s" src="%s" alt="" width="225" height="150" loading="lazy">',
        esc_attr($media_class),
        esc_attr($thumb_class),
        esc_url($src)
    );
}

/**
 * 投稿のアイキャッチ画像 HTML を返す
 */
function sample_hp_render_card_post_thumbnail(
    int $post_id,
    string $wrap_class,
    string $media_class,
    string $thumb_class
): string {
    $inner_html = '';

    if ($post_id > 0 && has_post_thumbnail($post_id)) {
        $html = get_the_post_thumbnail($post_id, 'medium_large', [
            'class'   => trim($media_class . ' ' . $thumb_class),
            'loading' => 'lazy',
        ]);

        if (is_string($html) && $html !== '') {
            $inner_html = $html;
        }
    }

    if ($inner_html === '') {
        $inner_html = sample_hp_render_card_fallback_image($media_class, $thumb_class);
    }

    return '<div class="' . esc_attr($wrap_class) . '">' . $inner_html . '</div>';
}

/**
 * 投稿のアイキャッチ画像 HTML を返す（記事カードブロック用）
 */
function sample_hp_render_post_card_thumbnail(int $post_id, string $class_name): string
{
    return sample_hp_render_card_post_thumbnail(
        $post_id,
        'bl_postCard_thumbWrap',
        $class_name . ' bl_postCard_media',
        'bl_postCard_thumb'
    );
}

/**
 * メディアライブラリ画像 HTML を返す
 */
function sample_hp_render_link_card_thumbnail(int $attachment_id, string $class_name): string
{
    $inner_html = '';

    if ($attachment_id > 0) {
        $html = wp_get_attachment_image($attachment_id, 'medium_large', false, [
            'class'   => $class_name . ' bl_linkCard_media bl_linkCard_thumb',
            'loading' => 'lazy',
        ]);

        if (is_string($html) && $html !== '') {
            $inner_html = $html;
        }
    }

    if ($inner_html === '') {
        $inner_html = sample_hp_render_card_fallback_image(
            'bl_linkCard_media',
            'bl_linkCard_thumb'
        );
    }

    return '<div class="bl_linkCard_thumbWrap">' . $inner_html . '</div>';
}

/**
 * 更新日を Figma 形式（Y.m.d）で返す
 */
function sample_hp_format_post_card_date(int $post_id): string
{
    $timestamp = (int) get_post_modified_time('U', true, $post_id);
    if ($timestamp <= 0) {
        return '';
    }

    return wp_date('Y.m.d', $timestamp);
}
