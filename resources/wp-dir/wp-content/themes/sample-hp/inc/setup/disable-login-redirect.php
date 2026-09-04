<?php

/***************************************************
    ログインリダイレクト禁止
 ****************************************************/
function disable_login_redirect()
{
    remove_action('template_redirect', 'wp_redirect_admin_locations', 1000);
}
add_action('init', 'disable_login_redirect');

function stop_redirect($scheme)
{
    if ($user_id = wp_validate_auth_cookie('', $scheme)) {
        return $scheme;
    }
    global $wp_query;
    $wp_query->set_404();
    get_template_part(404);
    exit();
}
add_filter('auth_redirect_scheme', 'stop_redirect', 9999);
