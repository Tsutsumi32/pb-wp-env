<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * 説明リストブロック（custom-block/description-list）
 *************************************************/

/**
 * @param array<string, mixed> $attributes
 * @param string               $content
 * @param WP_Block             $wp_block
 */
function sample_hp_render_description_list_block(
    array $attributes,
    string $content,
    WP_Block $wp_block
): string {
    $items = sample_hp_normalize_description_list_items($attributes['items'] ?? []);

    if ($items === []) {
        return sample_hp_render_description_list_empty(
            __('説明リストの項目を入力してください。', 'custom-block')
        );
    }

    $items_html = '';
    foreach ($items as $item) {
        $items_html .= sample_hp_render_description_list_item(
            (string) $item['term'],
            (string) $item['description']
        );
    }

    return sprintf(
        '<dl class="bl_descriptionList wp-block-custom-block-description-list">%s</dl>',
        $items_html
    );
}

/**
 * @param mixed $items
 * @return array<int, array{term: string, description: string}>
 */
function sample_hp_normalize_description_list_items(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }

    $normalized = [];
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $term        = isset($item['term']) ? trim((string) $item['term']) : '';
        $description = isset($item['description']) ? (string) $item['description'] : '';
        $description = str_contains($description, '<')
            ? trim($description)
            : rtrim($description, "\r\n");

        if ($term === '' && $description === '') {
            continue;
        }

        $normalized[] = [
            'term'        => $term,
            'description' => $description,
        ];
    }

    return $normalized;
}

/**
 * dd 内の改行を1要素内のテキスト改行として出力する
 * 旧データ（p タグ区切り）も br に正規化する
 */
function sample_hp_format_description_list_description(string $description): string
{
    if ($description === '') {
        return '';
    }

    if (str_contains($description, '<')) {
        if (str_contains($description, '<p')) {
            $description = preg_replace('/<\/p>\s*<p[^>]*>/i', '<br>', $description) ?? $description;
            $description = preg_replace('/<\/?p[^>]*>/i', '', $description) ?? $description;
        }

        return wp_kses_post($description);
    }

    return nl2br(esc_html($description), false);
}

function sample_hp_render_description_list_item(string $term, string $description): string
{
    $term_html = $term !== '' ? sprintf('<dt class="bl_descriptionList_term">%s</dt>', esc_html($term)) : '';

    $description_html = $description !== ''
            ? sprintf(
                '<dd class="bl_descriptionList_desc">%s</dd>',
                sample_hp_format_description_list_description($description)
            )
            : '';

    if ($term_html === '' && $description_html === '') {
        return '';
    }

    return sprintf(
        '<div class="bl_descriptionList_item">%s%s</div>',
        $term_html,
        $description_html
    );
}

function sample_hp_render_description_list_empty(string $message): string
{
    return sprintf(
        '<div class="bl_descriptionList bl_descriptionList__empty wp-block-custom-block-description-list"><p class="bl_descriptionList_emptyMessage">%s</p></div>',
        esc_html($message)
    );
}
