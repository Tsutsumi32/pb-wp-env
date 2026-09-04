<?php

/************************************************
 * meta関連で使用する定数
 *************************************************/
// サイト情報
const SITE_NAME = '株式会社テスト';

// テーマカラー
const THEME_COLOR = '';

// webfonts
const FONT_TAGS = '';
// const FONT_TAGS = '<link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
// <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Zen+Kaku+Gothic+Antique:wght@400;500;700&display=swap" rel="stylesheet">';


/************************************************
 * 管理画面
 *************************************************/
// 左メニュー「編集ガイド」の表示（true: 表示 / false: 非表示）
const ENABLE_ADMIN_EDIT_GUIDE = false;

// 管理画面デザインの適用（false: 適用しない / true: 適用する）
const ADMIN_STYLE_ENABLE_LOGIN = false; // ログイン画面のスタイル
const ADMIN_STYLE_ENABLE_ADMIN = false; // 管理画面のスタイル


/*************************************************
 * カスタム投稿関連
 *************************************************/
// JSON / CSV インポート用データ（テーマルートからの相対パス: data/{post_type}/posts.json など）
const POST_IMPORT_DATA_DIR = 'data';



/* ※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※
* 注意！！！！！！！！！！！！！
* trueの場合DBがコード側の設定内容に書き換えられます。
* 管理画面上で既に運用している場合は要注意。
* ※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※/
/************************************************
 * プラグイン設定のコード同期モード
 *************************************************/
// true  : コード制御モード — コード定義のみ DB に反映（コード外は削除・既存も上書き）
// false : 配信モード — コードからの登録・更新・削除を行わない
// CF7（inc/config/plugins/cf7/cf7.php）
const UDS_CF7_CODE_SYNC_DEV_MODE = true;

// ACF（inc/config/plugins/acf/acfFileds.php）
const UDS_ACF_CODE_SYNC_DEV_MODE = true;

// ターム表示順（posts.php term_settings の order / taxonomy-terms-order）
// ※ターム自体の登録はwp-cliのため、特に制御不要
const UDS_TERM_ORDER_CODE_SYNC_DEV_MODE = true;