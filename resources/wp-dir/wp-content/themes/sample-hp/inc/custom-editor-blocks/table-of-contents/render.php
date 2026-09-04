<?php

if (!defined('ABSPATH')) {
    exit();
}

require_once dirname(__DIR__) . '/utils/heading-anchor.php';

/************************************************
 * 目次ブロック（custom-block/table-of-contents）
 *************************************************/

/**
 * @param array<string, mixed> $attributes
 * @param string               $content
 * @param WP_Block             $wp_block
 */
function sample_hp_render_table_of_contents_block(
    array $attributes,
    string $content,
    WP_Block $wp_block
): string {
    $post = get_post();
    if (!($post instanceof WP_Post)) {
        return sample_hp_render_table_of_contents_empty();
    }

    SampleHp_Heading_Anchor::prepare((int) $post->ID, (string) $post->post_content);
    $headings = SampleHp_Heading_Anchor::get_headings();

    if ($headings === []) {
        return sample_hp_render_table_of_contents_empty();
    }

    $items_html = '';
    foreach ($headings as $heading) {
        $items_html .= sprintf(
            '<li class="bl_tableOfContents_item"><a class="bl_tableOfContents_link" href="#%s">%s</a></li>',
            esc_attr($heading['id']),
            esc_html($heading['text'])
        );
    }

    return sprintf(
        '<nav class="bl_tableOfContents wp-block-custom-block-table-of-contents" aria-label="%1$s">' .
            '<div class="bl_tableOfContents_header">' .
            '<p class="bl_tableOfContents_title">%2$s</p>' .
            '</div>' .
            '<div class="bl_tableOfContents_contentsInner">' .
            '<ul class="bl_tableOfContents_list">%3$s</ul>' .
            '</div>' .
            '</nav>',
        esc_attr__('目次', 'custom-block'),
        esc_html__('目次', 'custom-block'),
        $items_html
    );
}

function sample_hp_render_table_of_contents_empty(): string
{
    return sprintf(
        '<div class="bl_tableOfContents bl_tableOfContents__empty wp-block-custom-block-table-of-contents" aria-label="%s"><p class="bl_tableOfContents_emptyMessage">%s</p></div>',
        esc_attr__('目次', 'custom-block'),
        esc_html__('見出し2が見つかりません。', 'custom-block')
    );
}
