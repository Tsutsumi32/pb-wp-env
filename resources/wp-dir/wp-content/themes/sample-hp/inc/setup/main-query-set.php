<?php

/***************************************************
    メインクエリの条件指定
 ****************************************************/

/**
 * メインクエリから対象の投稿タイプスラッグを1つ取得（投稿タイプアーカイブ）
 */
function main_query_archive_post_type($query): ?string
{
    if (!$query->is_post_type_archive()) {
        return null;
    }

    $pt = $query->get('post_type');
    if (is_array($pt)) {
        return $pt[0] ?? null;
    }

    return is_string($pt) && $pt !== '' ? $pt : null;
}

/**
 * メインクエリに適用する archive_query を取得
 */
function main_query_resolve_archive_cfg($query): ?array
{
    $post_type = main_query_archive_post_type($query);
    if ($post_type !== null) {
        return Post::getArchiveQuery($post_type);
    }

    foreach (Post::getAll() as $post_type_slug => $post_config) {
        if (!array_key_exists('archive_query', $post_config)) {
            continue;
        }

        foreach (Post::getCategorySettings($post_type_slug) ?? [] as $category) {
            $taxonomy_slug = (string) ($category['slug'] ?? '');
            if ($taxonomy_slug === '') {
                continue;
            }

            $is_taxonomy_archive = $query->is_tax($taxonomy_slug) || $query->get($taxonomy_slug) !== '';
            if ($is_taxonomy_archive) {
                return Post::getArchiveQuery($post_type_slug);
            }
        }
    }

    return null;
}

function main_query_set($query)
{
    if (is_admin() || !$query->is_main_query()) {
        return;
    }

    if (!$query->is_archive()) {
        return;
    }

    $archive_cfg = main_query_resolve_archive_cfg($query);

    if ($archive_cfg !== null) {
        $query->set('posts_per_page', (int) $archive_cfg['posts_per_page']);
        $query->set('orderby', $archive_cfg['orderby']);
        $query->set('order', strtoupper((string) $archive_cfg['order']) === 'ASC' ? 'ASC' : 'DESC');
        return;
    }

    // Post:: に archive_query がないアーカイブ（通常投稿の日付・カテゴリ等）
    $query->set('posts_per_page', 10);
    $query->set('orderby', 'modified');
    $query->set('order', 'DESC');
}
add_action('pre_get_posts', 'main_query_set');
