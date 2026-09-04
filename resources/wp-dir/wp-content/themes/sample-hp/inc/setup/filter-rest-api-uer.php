<?php

/***************************************************
    rest api ユーザー特定防止
 ****************************************************/
function filter_rest_api_uer($endpoints)
{
    if (isset($endpoints['/wp/v2/users'])) {
        unset($endpoints['/wp/v2/users']);
    }
    if (isset($endpoints['/wp/v2/users/(?P[\d]+)'])) {
        unset($endpoints['/wp/v2/users/(?P[\d]+)']);
    }
    return $endpoints;
}
add_filter('rest_endpoints', 'filter_rest_api_uer');
