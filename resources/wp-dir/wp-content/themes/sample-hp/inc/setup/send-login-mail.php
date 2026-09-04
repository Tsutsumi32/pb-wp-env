<?php

/***************************************************
    ログイン通知メール送信
 ****************************************************/
function send_login_mail($user_login)
{
    date_default_timezone_set('Asia/Tokyo');
    $date    = date('Y.n.j H:i');
    $tosend  = get_option('admin_email');
    $title   = get_bloginfo('name') . 'にログインがありました';
    $message = get_bloginfo('name') . 'にログインがありました。' . "\n";
    $message .= "\n";
    $message .= '======ログイン情報======' . "\n";
    $message .= 'ユーザー：' . ' ' . $user_login . "\n";
    $message .= '日時:' . ' ' . $date . "\n";
    $message .= "\n";
    $message .= '----------------------' . "\n";
    $message .= 'Wordpressから送信';
    wp_mail($tosend, $title, $message);
}
add_action('wp_login', 'send_login_mail', 10, 1);
