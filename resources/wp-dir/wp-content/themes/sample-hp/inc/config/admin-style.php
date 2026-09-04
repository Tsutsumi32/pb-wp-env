<?php

if (!defined('ABSPATH')) {
    exit();
}

/***************************************************
 * 管理画面デザイン設定（色/枠などの値を集約）
 * 適用 ON/OFF は config.php（ADMIN_STYLE_ENABLE_LOGIN / ADMIN_STYLE_ENABLE_ADMIN）
 ****************************************************/
/* ---------------------------
 * style
 * --------------------------- */
// ログイン画面
const STYLE_LOGIN_BG        = '#2a2d31'; // フォーム背景
const STYLE_PRMARY          = '#ffffff'; // アクセント色
const STYLE_PRMARY_BTN_BG   = '#1473b9'; // ボタン背景(塗りボタン)
const STYLE_PRMARY_BTN_TEXT = '#FFFFFF'; // ボタンテキスト(塗りボタン)
const STYLE_LINK_TEXT       = '#ffffff'; // リンクテキスト
// 管理画面
const ADMIN_BG            = '#2A2D31'; // 管理画面背景系(暗めの色適用)
const ADMIN_PRIMARY_LIGHT = '#198cdf'; // 管理画面アクセント系(暗めの上にのる色)
const ADMIN_PRIMARY_DARK  = '#1a5780'; // 管理画面アクセント系(明るめの上にのる色)
const ADMIN_SELECTED_ROW  = 'rgba(20,115,185,.3)'; // 選択行系背景(明るめ)
const ADMIN_POINT_COLOR   = '#d63638'; // プラグインupdate通知等

/* ---------------------------
 * Gutenberg / 管理画面 CSS 変数（--wp-admin-theme-color 等）
 * --------------------------- */
const ADMIN_STYLE_WP_THEME_COLOR               = ADMIN_PRIMARY_LIGHT;
const ADMIN_STYLE_WP_THEME_COLOR_RGB           = '';
const ADMIN_STYLE_WP_THEME_COLOR_DARKER_10     = '#1a5780';
const ADMIN_STYLE_WP_THEME_COLOR_DARKER_10_RGB = '';
const ADMIN_STYLE_WP_THEME_COLOR_DARKER_20     = ADMIN_PRIMARY_DARK;
const ADMIN_STYLE_WP_THEME_COLOR_DARKER_20_RGB = '';
const ADMIN_STYLE_WP_BORDER_WIDTH_FOCUS        = '1.5px';

/* ---------------------------
 * Gutenberg ブロックエディタ本文（.editor-styles-wrapper）
 * コア reset が serif を指定するため上書きする
 * --------------------------- */
// 'sans' … ゴシック系 / 'serif' … 明朝系
const ADMIN_STYLE_BLOCK_EDITOR_FONT_FAMILY      = 'sans';
const ADMIN_STYLE_BLOCK_EDITOR_FONT_STACK_SANS  = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Yu Gothic", "Meiryo", sans-serif';
const ADMIN_STYLE_BLOCK_EDITOR_FONT_STACK_SERIF = '"Hiragino Mincho ProN", "Yu Mincho", "MS PMincho", serif';

/* ---------------------------
 * Login screen 固定値指定箇所は基本変更なし
 * --------------------------- */
const ADMIN_STYLE_LOGIN_BG                         = STYLE_LOGIN_BG;
const ADMIN_STYLE_LOGIN_FORM_BG_COLOR              = '#FFFFFF';
const ADMIN_STYLE_LANG_BUTTON_BG                   = '#FFFFFF';
const ADMIN_STYLE_LOGIN_FORM_BORDER                = '3px solid #A0A0A0';
const ADMIN_STYLE_LOGIN_FOCUS_BOX_SHADOW           = '0 0 0 1px ' . STYLE_PRMARY;
const ADMIN_STYLE_LOGIN_LOST_PASSWORD_COLOR        = STYLE_PRMARY;
const ADMIN_STYLE_LOGIN_LINK_COLOR                 = STYLE_LINK_TEXT;
const ADMIN_STYLE_LOGIN_LABEL_COLOR                = '#333333';
const ADMIN_STYLE_LOGIN_BUTTON_ICON_COLOR          = '#333333';
const ADMIN_STYLE_LOGIN_BUTTON_PRIMARY_BG          = STYLE_PRMARY_BTN_BG;
const ADMIN_STYLE_LOGIN_BUTTON_PRIMARY_BORDER      = '0';
const ADMIN_STYLE_LOGIN_BUTTON_PRIMARY_FONT_WEIGHT = 'bold';
const ADMIN_STYLE_LOGIN_BUTTON_PRIMARY_COLOR       = STYLE_PRMARY_BTN_TEXT;
const ADMIN_STYLE_LOGIN_NOTICE_BORDER_COLOR        = STYLE_PRMARY;
const ADMIN_STYLE_LOGIN_LOGO_IMAGE_PATH            = '/assets/settings/admin-logo.png'; // Login logo

/* ---------------------------
 * Admin screen
 * --------------------------- */
const ADMIN_STYLE_ADMIN_WELCOM                       = ADMIN_BG;
const ADMIN_STYLE_ADMIN_BG_COLOR                     = 'rgb(243, 243, 243)';
const ADMIN_STYLE_ADMINBAR_BG_COLOR                  = ADMIN_BG;
const ADMIN_STYLE_ADMINMENU_BG_COLOR                 = ADMIN_BG;
const ADMIN_STYLE_ADMINMENU_CURRENT_SUBMENU_BG_COLOR = ADMIN_PRIMARY_LIGHT;
const ADMIN_STYLE_ADMINMENU_HOVER                    = ADMIN_PRIMARY_LIGHT;
const ADMIN_STYLE_ADMINMENU_HOVER_LIGHTBACK          = ADMIN_PRIMARY_DARK; // 背景が明るい場所のhover色
const ADMIN_STYLE_ADMIN_SUBMENU_LINK_COLOR           = '#FFFFFF';
const ADMIN_STYLE_ADMIN_SECOND_BTN                   = ADMIN_BG; // 公開ボタン等の重要ボタン背景色
const ADMIN_STYLE_ADMIN_THEME_BTN                    = ADMIN_BG; // 投稿画面のボタン
const ADMIN_STYLE_ADMIN_LINK                         = ADMIN_PRIMARY_DARK; // 投稿画面のリンク系
const ADMIN_STYLE_ADMIN_INPUT_PRIMARY                = ADMIN_PRIMARY_LIGHT; // インプット系の配色
const ADMIN_STYLE_ADMIN_CHECKBOX_ICON_FILL           = ADMIN_PRIMARY_DARK; // チェックボックスアイコンSVGの塗り色
const ADMIN_STYLE_ADMIN_ACTIVE                       = ADMIN_SELECTED_ROW; // プラグイン一覧等、アクティブ背景色
const ADMIN_STYLE_POINT_COLOR                        = ADMIN_POINT_COLOR; // プラグインアップデート通知色等
