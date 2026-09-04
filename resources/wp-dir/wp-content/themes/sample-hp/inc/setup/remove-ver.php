<?php

/***************************************************
    WP本体バージョンと一致する ver クエリのみ削除
    （テーマ・プラグイン独自のキャッシュバスト用 ver は残す）
 ****************************************************/
function remove_ver($src)
{
    if (strpos($src, 'ver=' . get_bloginfo('version')) !== false) {
        $src = remove_query_arg('ver', $src);
    }
    return $src;
}
add_filter('style_loader_src', 'remove_ver', 9999);
add_filter('script_loader_src', 'remove_ver', 9999);
