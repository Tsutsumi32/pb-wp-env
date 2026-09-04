<?php

/***************************************************
    通常投稿機能の削除(管理画面上)
 ****************************************************/
function remove_post_menu()
{
    remove_menu_page('edit.php');
}
add_action('admin_menu', 'remove_post_menu');
