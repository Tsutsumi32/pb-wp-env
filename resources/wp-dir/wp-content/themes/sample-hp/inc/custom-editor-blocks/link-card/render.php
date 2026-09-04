<?php

if (!defined('ABSPATH')) {
    exit();
}

require_once dirname(__DIR__) . '/utils/card-image.php';

/************************************************
 * リンクカードブロック（custom-block/link-card）
 *************************************************/

/**
 * @param array<string, mixed> $attributes
 * @param string               $content
 * @param WP_Block             $wp_block
 */
function sample_hp_render_link_card_block(
    array $attributes,
    string $content,
    WP_Block $wp_block
): string {
    $image_id = isset($attributes['imageId']) ? (int) $attributes['imageId'] : 0;
    $title    = isset($attributes['title']) ? (string) $attributes['title'] : '';
    $url      = isset($attributes['url']) ? (string) $attributes['url'] : '';

    if ($title === '' && $url === '' && $image_id <= 0) {
        return sample_hp_render_link_card_empty(
            __('リンクカードの内容を設定してください。', 'custom-block')
        );
    }

    $thumb_html = sample_hp_render_link_card_thumbnail($image_id, 'bl_linkCard_media');
    $title_text = $title !== '' ? $title : __('（タイトル未設定）', 'custom-block');

    $body_html = sprintf(
        '<div class="bl_linkCard_body"><p class="bl_linkCard_title">%s</p></div>',
        esc_html($title_text)
    );

    if (sample_hp_is_custom_block_editor_preview()) {
        return sprintf(
            '<div class="bl_linkCard bl_linkCard__editorPreview wp-block-custom-block-link-card">%s%s</div>',
            $thumb_html,
            $body_html
        );
    }

    $href       = $url !== '' ? esc_url($url) : '#';
    $link_attrs = $url === '' ? ' aria-disabled="true"' : ' target="_blank" rel="noopener noreferrer"';

    return sprintf(
        '<a class="bl_linkCard wp-block-custom-block-link-card" href="%s"%s>%s%s</a>',
        $href,
        $link_attrs,
        $thumb_html,
        $body_html
    );
}

function sample_hp_render_link_card_empty(string $message): string
{
    return sprintf(
        '<div class="bl_linkCard bl_linkCard__empty wp-block-custom-block-link-card"><p class="bl_linkCard_emptyMessage">%s</p></div>',
        esc_html($message)
    );
}
