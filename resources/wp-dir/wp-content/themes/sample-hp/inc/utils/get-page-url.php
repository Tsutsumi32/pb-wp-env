<?php

/**
 * 固定ページスラッグからページオブジェクトを解決する
 * - まず pages.php の parent 定義からフルパスを組み立てて探索
 * - 見つからない場合は slug 単体で探索
 * - さらに見つからない場合は slug 一致でページを1件取得
 *
 * @param string $slug 固定ページキー（スラッグ）
 * @return WP_Post|null 公開済み（publish）のページのみ
 */
function resolve_page_by_slug(string $slug): ?WP_Post
{
    if (!Page::exists($slug)) {
        return null;
    }

    $segments = [];
    $cursor   = $slug;
    $visited  = [];

    while ($cursor) {
        if (isset($visited[$cursor])) {
            break;
        }
        $visited[$cursor] = true;
        $segments[]       = $cursor;
        $cursor           = Page::getParent($cursor);
    }

    $path = implode('/', array_reverse($segments));
    $page = get_page_by_path($path, OBJECT, 'page');
    if ($page instanceof WP_Post && $page->post_status === 'publish') {
        return $page;
    }

    $page = get_page_by_path($slug, OBJECT, 'page');
    if ($page instanceof WP_Post && $page->post_status === 'publish') {
        return $page;
    }

    $pages = get_posts([
        'post_type'      => 'page',
        'name'           => $slug,
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ]);

    return $pages[0] ?? null;
}

/**
 * スラッグから固定ページURL/カスタム投稿アーカイブURLを取得する
 *
 * @param string $slug 画面キー（固定ページ or カスタム投稿）
 * @return string URL（未取得時・非公開時は空文字）
 */
function get_page_url(string $slug): string
{
    if ($slug === Page::TOP) {
        return esc_url(home_url('/'));
    }

    if (Page::exists($slug)) {
        $page = resolve_page_by_slug($slug);
        if (!$page || empty($page->ID)) {
            return '';
        }

        $permalink = get_permalink((int) $page->ID);
        if (!$permalink) {
            return '';
        }

        return esc_url($permalink);
    }

    if (Post::exists($slug)) {
        $archive_link = get_post_type_archive_link($slug);
        if (!$archive_link) {
            return '';
        }

        return esc_url($archive_link);
    }

    return '';
}
