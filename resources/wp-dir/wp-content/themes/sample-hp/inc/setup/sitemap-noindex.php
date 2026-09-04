<?php

if (!defined('ABSPATH')) {
    exit();
}

/***************************************************
 * コアサイトマップ（wp-sitemap.xml）と noindex 設定の整合
 *
 * - 固定ページ: inc/config/pages.php の noindex が true のスラッグを除外
 * - カスタム投稿タイプ: inc/config/posts.php で noindex のタイプをサイトマップ対象から外す
 * - 上記 CPT に紐づくタクソノミーもサイトマップから外す（アーカイブ URL の取りこぼし防止）
 ****************************************************/

/**
 * pages.php で noindex の固定ページをサイトマップの url 一覧から除外する。
 *
 * @param array<string, mixed> $entry
 * @return array<string, mixed>
 */
function sample_hp_sitemaps_posts_entry_respect_page_noindex(
    array $entry,
    WP_Post $post,
    string $post_type
): array {
    if ($post_type === 'page') {
        $slug = $post->post_name;
        if ($slug !== '' && Page::exists($slug) && Page::getNoindex($slug)) {
            return [];
        }

        return $entry;
    }

    if (Post::exists($post_type) && !Post::hasSingle($post_type)) {
        return [];
    }

    return $entry;
}
add_filter('wp_sitemaps_posts_entry', 'sample_hp_sitemaps_posts_entry_respect_page_noindex', 10, 3);

/**
 * posts.php で noindex のカスタム投稿タイプをサイトマップの対象から外す。
 *
 * @param string[] $post_types
 * @return string[]
 */
function sample_hp_sitemaps_post_types_exclude_noindexed_cpts(array $post_types): array
{
    $exclude = [];
    foreach (Post::getAll() as $type_slug => $_config) {
        if (Post::getNoindex($type_slug)) {
            $exclude[] = $type_slug;
        }
    }

    if ($exclude === []) {
        return $post_types;
    }

    return array_values(array_diff($post_types, $exclude));
}
add_filter('wp_sitemaps_post_types', 'sample_hp_sitemaps_post_types_exclude_noindexed_cpts');

/**
 * noindex の CPT に紐づくタクソノミーをサイトマップから外す。
 *
 * @param string[] $taxonomies
 * @return string[]
 */
function sample_hp_sitemaps_taxonomies_exclude_for_noindexed_cpts(array $taxonomies): array
{
    $exclude = [];
    foreach (Post::getAll() as $type_slug => $_config) {
        if (!Post::getNoindex($type_slug)) {
            continue;
        }
        $cats = Post::getCategorySettings($type_slug) ?? [];
        foreach ($cats as $cat) {
            $tax_slug = $cat['slug'] ?? '';
            if ($tax_slug !== '') {
                $exclude[] = $tax_slug;
            }
        }
    }

    if ($exclude === []) {
        return $taxonomies;
    }

    return array_values(array_diff($taxonomies, array_unique($exclude)));
}
add_filter('wp_sitemaps_taxonomies', 'sample_hp_sitemaps_taxonomies_exclude_for_noindexed_cpts');
