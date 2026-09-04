<?php

/***************************************************
    Contact Form 7の自動pタグ無効
 ****************************************************/
add_filter('wpcf7_autop_or_not', 'wpcf7_autop_return_false');
function wpcf7_autop_return_false()
{
    return false;
}

function set_fs_method($args)
{
    return 'direct';
}
add_filter('filesystem_method', 'set_fs_method');
