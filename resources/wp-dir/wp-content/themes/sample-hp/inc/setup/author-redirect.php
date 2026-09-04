<?php

/***************************************************
    author特定防止
 ****************************************************/
function author_redirect()
{
    if (is_author()) {
        wp_redirect(home_url());
        exit();
    }
}
add_action('template_redirect', 'author_redirect');
