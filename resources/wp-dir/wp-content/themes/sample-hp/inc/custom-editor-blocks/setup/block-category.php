<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * テーマ独自ブロックカテゴリ
 *************************************************/

/**
 * @param array<int, array<string, mixed>> $categories
 * @return array<int, array<string, mixed>>
 */
function sample_hp_register_block_category(array $categories): array
{
    $categories[] = [
        'slug'  => 'custom-block',
        'title' => 'カスタム',
    ];

    return $categories;
}
add_filter('block_categories_all', 'sample_hp_register_block_category');
