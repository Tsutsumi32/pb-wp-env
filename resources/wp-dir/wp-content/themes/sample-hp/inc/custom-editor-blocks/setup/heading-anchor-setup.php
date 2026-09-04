<?php

if (!defined('ABSPATH')) {
    exit();
}

require_once __DIR__ . '/../utils/heading-anchor.php';

/************************************************
 * 見出し2へのアンカー ID 付与
 *************************************************/

/**
 * 本文レンダリング前に見出し2のアンカー ID を事前計算する
 */
function sample_hp_prepare_heading_anchors(string $content): string
{
    $post = get_post();
    if (!($post instanceof WP_Post)) {
        return $content;
    }

    SampleHp_Heading_Anchor::prepare((int) $post->ID, (string) $post->post_content);
    SampleHp_Heading_Anchor::reset_render_index();

    return $content;
}
add_filter('the_content', 'sample_hp_prepare_heading_anchors', 1);

/**
 * core/heading（level 2）の出力にアンカー ID を付与する
 *
 * @param string               $block_content
 * @param array<string, mixed> $block
 */
function sample_hp_add_anchor_to_h2_heading(string $block_content, array $block): string
{
    if (($block['blockName'] ?? '') !== 'core/heading') {
        return $block_content;
    }

    $level = isset($block['attrs']['level']) ? (int) $block['attrs']['level'] : 2;
    if ($level !== 2 || $block_content === '') {
        return $block_content;
    }

    $id = SampleHp_Heading_Anchor::next_render_id();
    if ($id === '') {
        return $block_content;
    }

    return SampleHp_Heading_Anchor::inject_id_into_heading_tag($block_content, $id);
}
add_filter('render_block', 'sample_hp_add_anchor_to_h2_heading', 10, 2);
