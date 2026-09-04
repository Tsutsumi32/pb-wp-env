<?php

/**
 * 現在ページのスラッグ(画面キー)を取得する
 * トップページや404の場合は指定した文字列(画面キー)を返却する
 * 投稿一覧や詳細ページの場合は、該当のカスタム投稿スラッグを返却する
 *
 * @return string|null スラッグ（トップは 'top' など）、該当しなければ null
 */
function get_current_slug(): ?string
{
    global $post;

    // トップページ
    if (is_front_page() || is_home()) {
        return Page::TOP;
    }

    // 投稿・カスタム投稿の詳細ページ
    if (is_single()) {
        $post_type = get_post_type();
        return is_string($post_type) && $post_type !== '' ? $post_type : null;
    }

    // 固定ページ
    if (is_page()) {
        return $post->post_name ?? null;
    }

    // 投稿タイプのアーカイブページ（投稿0件でも global $post は null になり得る）
    if (is_post_type_archive()) {
        $queried = get_queried_object();
        if ($queried instanceof WP_Post_Type) {
            return $queried->name;
        }

        $post_type = get_query_var('post_type');
        if (is_array($post_type)) {
            $post_type = $post_type[0] ?? '';
        }

        return is_string($post_type) && $post_type !== '' ? $post_type : null;
    }

    // タクソノミー（カテゴリ・タグなど）
    if (is_tax() || is_category() || is_tag()) {
        $term = get_queried_object();
        if ($term instanceof WP_Term) {
            $taxonomy  = get_taxonomy($term->taxonomy);
            $post_type = $taxonomy->object_type[0] ?? '';
            if (is_string($post_type) && $post_type !== '' && Post::exists($post_type)) {
                return $post_type;
            }

            return $term->slug ?? null;
        }

        return null;
    }

    // 404（実スラッグではなく画面キーのみ返す）
    if (is_404()) {
        return Page::NOT_FOUND;
    }

    return null;
}
