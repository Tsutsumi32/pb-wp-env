<?php

/***************************************************
    ウィジェット機能有効化
 ****************************************************/
function widgets_init()
{
    register_sidebar([
        'name' => 'Main Sidebar',
        'id'   => 'main-sidebar',
    ]);
}
add_action('widgets_init', 'widgets_init');
