<?php

if (!defined('ABSPATH')) {
    exit();
}

require_once __DIR__ . '/../config/admin-style.php';

/***************************************************
    WordPress 管理画面テーマ色 CSS 変数
 ****************************************************/
function admin_style_hex_to_rgb(string $hex): array
{
    $hex = ltrim($hex, '#');

    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }

    return [hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2))];
}

function admin_style_rgb_to_string(array $rgb): string
{
    return implode(', ', $rgb);
}

/**
 * CSS 変数 --*-rgb 用の値を返す（空なら hex から自動算出）
 */
function admin_style_resolve_theme_color_rgb(string $hex, string $rgb_override): string
{
    if ($rgb_override !== '') {
        return $rgb_override;
    }

    return admin_style_rgb_to_string(admin_style_hex_to_rgb($hex));
}

function get_admin_wp_theme_color_css(): string
{
    $theme_rgb = admin_style_resolve_theme_color_rgb(
        ADMIN_STYLE_WP_THEME_COLOR,
        ADMIN_STYLE_WP_THEME_COLOR_RGB
    );
    $darker_10_rgb = admin_style_resolve_theme_color_rgb(
        ADMIN_STYLE_WP_THEME_COLOR_DARKER_10,
        ADMIN_STYLE_WP_THEME_COLOR_DARKER_10_RGB
    );
    $darker_20_rgb = admin_style_resolve_theme_color_rgb(
        ADMIN_STYLE_WP_THEME_COLOR_DARKER_20,
        ADMIN_STYLE_WP_THEME_COLOR_DARKER_20_RGB
    );

    // コア CSS（Gutenberg 等）が :root / body に後から変数を定義するため、
    // 管理画面配色クラスも含めてフッターで上書きする。
    $selectors = implode(', ', [
        ':root',
        'body',
        'body.admin-color-modern',
        'body.admin-color-fresh',
        'body.admin-color-light',
        'body.admin-color-blue',
        'body.admin-color-coffee',
        'body.admin-color-ectoplasm',
        'body.admin-color-midnight',
        'body.admin-color-ocean',
        'body.admin-color-sunrise',
    ]);

    return '
    ' .
        $selectors .
        ' {
        --wp-admin-theme-color: ' .
        ADMIN_STYLE_WP_THEME_COLOR .
        ' !important;
        --wp-admin-theme-color--rgb: ' .
        $theme_rgb .
        ' !important;
        --wp-admin-theme-color-darker-10: ' .
        ADMIN_STYLE_WP_THEME_COLOR_DARKER_10 .
        ' !important;
        --wp-admin-theme-color-darker-10--rgb: ' .
        $darker_10_rgb .
        ' !important;
        --wp-admin-theme-color-darker-20: ' .
        ADMIN_STYLE_WP_THEME_COLOR_DARKER_20 .
        ' !important;
        --wp-admin-theme-color-darker-20--rgb: ' .
        $darker_20_rgb .
        ' !important;
        --wp-admin-border-width-focus: ' .
        ADMIN_STYLE_WP_BORDER_WIDTH_FOCUS .
        ' !important;
    }
    ';
}

function print_admin_wp_theme_color_override(): void
{
    echo '<style id="makino-admin-theme-color">' . get_admin_wp_theme_color_css() . '</style>';
}

if (ADMIN_STYLE_ENABLE_ADMIN) {
    add_action('admin_print_footer_scripts', 'print_admin_wp_theme_color_override', 999);
}

if (ADMIN_STYLE_ENABLE_LOGIN) {
    add_action('login_footer', 'print_admin_wp_theme_color_override', 999);
}

function add_admin_wp_theme_color_to_block_editor(array $settings): array
{
    if (!isset($settings['styles'])) {
        $settings['styles'] = [];
    }

    $settings['styles'][] = [
        'css' => get_admin_wp_theme_color_css(),
    ];

    return $settings;
}

if (ADMIN_STYLE_ENABLE_ADMIN) {
    add_filter('block_editor_settings_all', 'add_admin_wp_theme_color_to_block_editor');
}

/***************************************************
    管理画面デザイン変更
 ****************************************************/
function login_design()
{
    echo '
    <style type="text/css">
    .login {
        background: ' .
        ADMIN_STYLE_LOGIN_BG .
        ' !important;
    }
    #loginform {
        background-color: ' .
        ADMIN_STYLE_LOGIN_FORM_BG_COLOR .
        ' !important;
        border: ' .
        ADMIN_STYLE_LOGIN_FORM_BORDER .
        ' !important;
        border-radius: ' .
        '10px' .
        ' !important;
    }
    .login .language-switcher .button {
        border-color: ' . STYLE_PRMARY . '
    }
    #loginform #user_login.input {
        background-color: ' .
        ADMIN_STYLE_LOGIN_FORM_BG_COLOR .
        ' !important;
        border: ' .
        ADMIN_STYLE_LOGIN_FORM_BORDER .
        ' !important;

    }
    #loginform #user_pass.input {
        background-color: ' .
        ADMIN_STYLE_LOGIN_FORM_BG_COLOR .
        ' !important;
        border: ' .
        ADMIN_STYLE_LOGIN_FORM_BORDER .
        ' !important;
    }
    input[type=checkbox]:focus, input[type=color]:focus, input[type=date]:focus, input[type=datetime-local]:focus, input[type=datetime]:focus, input[type=email]:focus, input[type=month]:focus, input[type=number]:focus, input[type=password]:focus, input[type=radio]:focus, input[type=search]:focus, input[type=tel]:focus, input[type=text]:focus, input[type=time]:focus, input[type=url]:focus, input[type=week]:focus, select:focus, textarea:focus {
        border-color: ' .
        'unset' .
        ' !important;
        box-shadow: ' .
        ADMIN_STYLE_LOGIN_FOCUS_BOX_SHADOW .
        ' !important;
        outline: 0 !important;
    }
    .login .wp-login-lost-password {
        color: ' .
        ADMIN_STYLE_LOGIN_LOST_PASSWORD_COLOR .
        ' !important;
    }
    .login #backtoblog a {
        color: ' .
        ADMIN_STYLE_LOGIN_LINK_COLOR .
        ' !important;
    }
    #loginform label {
        color: ' .
        ADMIN_STYLE_LOGIN_LABEL_COLOR .
        ' !important;
        font-weight: bold !important;
    }
    #loginform .button-primary {
        background: ' .
        ADMIN_STYLE_LOGIN_BUTTON_PRIMARY_BG .
        ' !important;
        border: ' .
        ADMIN_STYLE_LOGIN_BUTTON_PRIMARY_BORDER .
        ' !important;
        font-weight: bold !important;
        color: ' .
        ADMIN_STYLE_LOGIN_BUTTON_PRIMARY_COLOR .
        ' !important;
    }
    .wp-core-ui .button {
        background-color:  ' .
        ADMIN_STYLE_LANG_BUTTON_BG .
        ' !important;
    }
    .wp-core-ui .button-secondary {
        color:  ' .
        ADMIN_STYLE_LOGIN_BUTTON_ICON_COLOR .
        ' !important;
        background-color: transparent !important;
    }
    .dashicons-translation:before {
        color: ' .
        ADMIN_STYLE_LOGIN_LOST_PASSWORD_COLOR .
        ';
    }
    .login h1 a {
        background-image: url(' .
        get_theme_file_uri(ADMIN_STYLE_LOGIN_LOGO_IMAGE_PATH) .
        ') !important;
        background-size: contain !important;
        width: 100% !important;
    }
    .login .message, .login .notice, .login .success {
        border-color: ' .
        ADMIN_STYLE_LOGIN_NOTICE_BORDER_COLOR .
        ' !important;
    }
    </style>
    ';
}

if (ADMIN_STYLE_ENABLE_LOGIN) {
    add_action('login_head', 'login_design');
}

function admin_design()
{
    $checkbox_icon_fill = rawurlencode(ADMIN_STYLE_ADMIN_CHECKBOX_ICON_FILL);
    echo '
    <style type="text/css">
    .acf-required {
        color: transparent !important;
        &::before {
            content: "必須";
            color: white;
            background-color: red;
            border-radius: 4px;
            padding: 2px 5px;
            font-size: 12px;
        }
    }
    .welcome-panel {
        background: ' .
        ADMIN_STYLE_ADMIN_WELCOM .
        ';
    }
    .welcome-panel-header-image {
        display: none;
    }
    .wp-admin {
        background-color:' .
        ADMIN_STYLE_ADMIN_BG_COLOR .
        ' !important;
    }
    #wpadminbar {
        background: ' .
        ADMIN_STYLE_ADMINBAR_BG_COLOR .
        ' !important;
    }
    #adminmenu, #adminmenu .wp-submenu, #adminmenuback, #adminmenuwrap {
        background: ' .
        ADMIN_STYLE_ADMINMENU_BG_COLOR .
        ' !important;
    }
    #adminmenu li.wp-has-current-submenu a.wp-has-current-submenu,
    #adminmenu li.current a.menu-top {
        background: ' .
        ADMIN_STYLE_ADMINMENU_CURRENT_SUBMENU_BG_COLOR .
        ';
        pointer-events: none;
    }
    #adminmenu .update-plugins {
        background: ' .
        ADMIN_STYLE_POINT_COLOR .
        ';
        pointer-events: none;
    }
    #adminmenu .wp-submenu a {
        color: ' .
        ADMIN_STYLE_ADMIN_SUBMENU_LINK_COLOR .
        ' !important;
    }
    #adminmenu li.menu-top:hover, #adminmenu li.opensub>a.menu-top, #adminmenu li>a.menu-top:focus {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER .
        ' !important;
        background-color: unset !important;
    }
    #adminmenu li a:focus div.wp-menu-image:before, #adminmenu li.opensub div.wp-menu-image:before, #adminmenu li:hover div.wp-menu-image:before {
        color: ' .
        ADMIN_STYLE_ADMIN_SUBMENU_LINK_COLOR .
        ' !important;
    }
    #adminmenu .wp-submenu a:focus, #adminmenu .wp-submenu a:hover, #adminmenu a:hover, #adminmenu li.menu-top>a:focus {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER .
        ' !important;
        opacity: 1 !important;
        background-color: ' .
        ADMIN_STYLE_ADMINMENU_BG_COLOR .
        '!important
    }
    #adminmenu a:hover div.wp-menu-image:before {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER .
        ' !important;
    }
    #collapse-button:hover,
    #collapse-button:focus {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER .
        ' !important;
    }
    .wp-core-ui .button.button-primary,
    .wp-core-ui a.button.button-primary,
    .wp-core-ui .button-primary {
        background-color: ' .
        ADMIN_STYLE_ADMIN_THEME_BTN .
        ' !important;
        border-color: ' .
        ADMIN_STYLE_ADMIN_THEME_BTN .
        ' !important;
        color: white !important;
    }
    .wp-core-ui .button, .wp-core-ui .button-secondary {
        border-color: ' .
        ADMIN_STYLE_ADMIN_SECOND_BTN .
        ' !important;
        color : ' .
        ADMIN_STYLE_ADMIN_SECOND_BTN .
        ' !important;
    }
    .wp-core-ui #wpbody a.page-title-action {
        color: ' .
        ADMIN_STYLE_ADMIN_SECOND_BTN .
        ';
        border-color: ' .
        ADMIN_STYLE_ADMIN_SECOND_BTN .
        ';
    }
    .wp-core-ui #wpbody a.page-title-action:focus {
        box-shadow: 0 0 0 1px ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    .wp-core-ui #wpbody a {
        color: ' .
        ADMIN_STYLE_ADMIN_LINK .
        ';
    }
    .wp-core-ui #wpbody a:hover {
        color: ' .
        ADMIN_STYLE_ADMIN_LINK .
        ';
        opacity: .7;
    }
    .wp-core-ui select {

    }
    .wp-core-ui select:hover {
        color: currentColor !important;
    }
    .wp-core-ui select::picker {
        // appearance: base-select;
    }
    .wp-core-ui select::picker {

    }
    .wp-core-ui select option {

    }
    .wp-core-ui select option:hover {

    }
    input[type=radio]:checked::before {
        background-color: ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    input[type=checkbox]:checked::before {
        content: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 640%22%3E%3Cpath fill=%22' .
        $checkbox_icon_fill .
        '%22 d=%22M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z%22/%3E%3C/svg%3E");
    }
    input[type=checkbox]:focus, input[type=color]:focus, input[type=date]:focus, input[type=datetime-local]:focus, input[type=datetime]:focus, input[type=email]:focus, input[type=month]:focus, input[type=number]:focus, input[type=password]:focus, input[type=radio]:focus, input[type=search]:focus, input[type=tel]:focus, input[type=text]:focus, input[type=time]:focus, input[type=url]:focus, input[type=week]:focus, select:focus, textarea:focus {
        border-color: ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
        box-shadow: 0 0 0 1px ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    #footer-thankyou a {
        color: ' .
        ADMIN_STYLE_ADMIN_LINK .
        ' !important;
        opacity: .7;
    }
    .wp-core-ui .button-link,
    .wp-core-ui .button-link:hover {
        color: ' .
        ADMIN_STYLE_ADMIN_LINK .
        ' !important;
        opacity: .7;
    }
    .plugins .active td,
    .plugins .active th {
        background-color: ' .
        ADMIN_STYLE_ADMIN_ACTIVE .
        ';
        border-color: ' .
        ADMIN_STYLE_ADMIN_ACTIVE .
        ' !important;
    }
    .wp-person a:focus .gravatar, a:focus, a:focus .media-icon img, a:focus .plugin-icon {
        box-shadow: 0 0 0 2px ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    .wp-core-ui .button-secondary:focus, .wp-core-ui .button.focus, .wp-core-ui .button:focus {
        box-shadow: 0 0 0 1px ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    .postbox .handle-order-higher:focus, .postbox .handle-order-lower:focus, .postbox .handlediv:focus {
        box-shadow: 0 0 0 2px ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    #wpadminbar .ab-top-menu>li.hover>.ab-item, #wpadminbar.nojq .quicklinks .ab-top-menu>li>.ab-item:focus, #wpadminbar:not(.mobile) .ab-top-menu>li:hover>.ab-item, #wpadminbar:not(.mobile) .ab-top-menu>li>.ab-item:focus {
        background: unset !important;
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER .
        ' !important;
    }
    #wpadminbar:not(.mobile)>#wp-toolbar a:focus span.ab-label, #wpadminbar:not(.mobile)>#wp-toolbar li:hover span.ab-label, #wpadminbar>#wp-toolbar li.hover span.ab-label {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER .
        ' !important;
    }
    #wpadminbar .quicklinks .ab-sub-wrapper .menupop.hover>a, #wpadminbar .quicklinks .menupop ul li a:focus, #wpadminbar .quicklinks .menupop ul li a:focus strong, #wpadminbar .quicklinks .menupop ul li a:hover, #wpadminbar .quicklinks .menupop ul li a:hover strong, #wpadminbar .quicklinks .menupop.hover ul li a:focus, #wpadminbar .quicklinks .menupop.hover ul li a:hover, #wpadminbar .quicklinks .menupop.hover ul li div[tabindex]:focus, #wpadminbar .quicklinks .menupop.hover ul li div[tabindex]:hover, #wpadminbar li #adminbarsearch.adminbar-focused:before, #wpadminbar li .ab-item:focus .ab-icon:before, #wpadminbar li .ab-item:focus:before, #wpadminbar li a:focus .ab-icon:before, #wpadminbar li.hover .ab-icon:before, #wpadminbar li.hover .ab-item:before, #wpadminbar li:hover #adminbarsearch:before, #wpadminbar li:hover .ab-icon:before, #wpadminbar li:hover .ab-item:before, #wpadminbar.nojs .quicklinks .menupop:hover ul li a:focus, #wpadminbar.nojs .quicklinks .menupop:hover ul li a:hover {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER .
        ' !important;
    }
    .editor-document-tools .editor-document-tools__left>.components-button.has-icon:focus:not(:disabled), .editor-document-tools .editor-document-tools__left>.components-dropdown>.components-button.has-icon:focus:not(:disabled) {
        box-shadow: 0 0 0 2px ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    .components-button:focus:not(:disabled) {
        box-shadow: 0 0 0 2px ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    .components-button:hover:not(:disabled,[aria-disabled=true]), .components-button[aria-expanded=true] {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER_LIGHTBACK .
        ';
    }
    .components-button.is-tertiary {
        color: ' .
        ADMIN_STYLE_ADMIN_LINK .
        ';
    }
    .components-button.is-primary, {
        background-color: ' .
        ADMIN_STYLE_ADMIN_THEME_BTN .
        ' !important;
        border-color: ' .
        ADMIN_STYLE_ADMIN_THEME_BTN .
        ' !important;
        color: white !important;
    }
    .components-button.is-tertiary:hover:not(:disabled,[aria-disabled=true],.is-pressed) {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER_LIGHTBACK .
        ';
        background: unset;
    }
    .css-19xrdu3:not([aria-disabled="true"]):is(:hover, [data-focus-visible]) {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER_LIGHTBACK .
        ' !important ;
    }
    .css-1nuemzt[aria-orientation="horizontal"]::before {
        border-color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER_LIGHTBACK .
        ' !important ;
    }
    .components-button.block-editor-block-types-list__item:not(:disabled,[aria-disabled=true]):hover .block-editor-block-types-list__item-title {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER_LIGHTBACK .
        ' !important ;
    }
    .components-button.block-editor-block-types-list__item:not(:disabled,[aria-disabled=true]):hover svg {
        color: ' .
        ADMIN_STYLE_ADMINMENU_HOVER_LIGHTBACK .
        ' !important ;
    }
    .css-1ozdl0t:focus-within:not(:has(:is(.em5sgkm8, .em5sgkm7):focus-within)) .em5sgkm6,
    .efec--aa-c-fdbacab-1ozdl0t:focus-within:not(:has(:is(.em5sgkm8, .em5sgkm7):focus-within)) .em5sgkm6 { {
        box-shadow: 0 0 0 2px ' .
        ADMIN_STYLE_ADMIN_INPUT_PRIMARY .
        ' !important;
    }
    .block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon:hover {
        background: ' .
        ADMIN_STYLE_ADMIN_THEME_BTN .
        ' !important;
        opacity: .6;
    }

    </style>
    ';
}

if (ADMIN_STYLE_ENABLE_ADMIN) {
    add_action('admin_head', 'admin_design');
}
