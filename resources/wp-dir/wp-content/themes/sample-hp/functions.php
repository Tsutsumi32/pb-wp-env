<?php

if (!defined('ABSPATH')) {
    exit();
}

/*********************************************
 * config
 ********************************************/
// 定数
require_once __DIR__ . '/inc/config/consts.php';
require_once __DIR__ . '/inc/config/config.php';
require_once __DIR__ . '/inc/config/utils-config.php';

// render-img 用: テーマディレクトリ基準の画像URL（サイト直下 /assets では404になるため）
if (!defined('IMAGE_BASE_URI')) {
    define('IMAGE_BASE_URI', rtrim(get_template_directory_uri(), '/') . '/assets/images');
}

// 固定ページ情報
require_once __DIR__ . '/inc/config/pages.php';

// メッセージ・文言定義（エラー固定ページ用、その他）
require_once __DIR__ . '/inc/config/message.php';

// カスタム投稿情報
require_once __DIR__ . '/inc/config/posts.php';

// CPT 紐づけ非公開固定ページ設定
require_once __DIR__ . '/inc/config/cpt-page-settings.php';

// ブロックエディタ共通設定
require_once __DIR__ . '/inc/config/allowed-blocks.php';

// 外部プラグイン（CDN 等）の読み込み定義
require_once __DIR__ . '/inc/config/assets-plugins.php';

/*********************************************
 * utils
 ********************************************/
require_once __DIR__ . '/inc/utils/get-current-slug.php';
require_once __DIR__ . '/inc/utils/get-page-url.php';
require_once __DIR__ . '/inc/utils/the-pagination.php';
require_once __DIR__ . '/inc/utils/auto-link-text.php';
require_once __DIR__ . '/inc/utils/attach-theme-image.php';
require_once __DIR__ . '/inc/utils/render-img.php';
require_once __DIR__ . '/inc/utils/render-inline-svg.php';
require_once __DIR__ . '/inc/utils/format-template-html.php';
require_once __DIR__ . '/inc/utils/archive-back-url.php';
require_once __DIR__ . '/inc/utils/cpt-page-settings.php';
require_once __DIR__ . '/inc/utils/resolve-app-mode.php';

// GTM・アナリティクス等（ホスト判定のため resolve-app-mode の後）
require_once __DIR__ . '/inc/config/tracking-tags.php';


/*********************************************
 * meta
 ********************************************/
// CSS・JS読み込み
require_once __DIR__ . '/inc/meta/assets.php';


/*********************************************
 * setup
 ********************************************/
// コメント機能オフ
require_once __DIR__ . '/inc/setup/comment-off.php';

// 通常投稿機能の削除(管理画面上)
require_once __DIR__ . '/inc/setup/remove-post-menu.php';

// アイキャッチの有効化
require_once __DIR__ . '/inc/setup/add-support-thumbnails.php';

// メインクエリの条件指定
require_once __DIR__ . '/inc/setup/main-query-set.php';

// 管理画面の投稿一覧に更新日を表示
require_once __DIR__ . '/inc/setup/add-mod-day.php';

// ウィジェット有効化
require_once __DIR__ . '/inc/setup/widgets-init.php';

// 管理画面デザイン変更
require_once __DIR__ . '/inc/setup/custom-admin-style.php';

// emoji対応js削除
require_once __DIR__ . '/inc/setup/remobe-emoij.php';

// author特定防止
require_once __DIR__ . '/inc/setup/author-redirect.php';

// rest api ユーザー特定防止
require_once __DIR__ . '/inc/setup/filter-rest-api-uer.php';

// meta genarator 削除
require_once __DIR__ . '/inc/setup/remove-meta-genarator.php';

// WP本体バージョンの ver クエリ削除（独自 ver は残す）
require_once __DIR__ . '/inc/setup/remove-ver.php';

//　カスタム投稿タイプ セットアップ
require_once __DIR__ . '/inc/setup/custom-post-setup.php';

// CPT 紐づけ非公開固定ページ設定
require_once __DIR__ . '/inc/setup/cpt-page-settings.php';

// JSON インポート投稿の手動編集保護
require_once __DIR__ . '/inc/setup/post-manual-edit-protection.php';

// コアサイトマップと noindex（pages.php / posts.php）の整合
require_once __DIR__ . '/inc/setup/sitemap-noindex.php';

// ブロックエディタの表示・制限設定
require_once __DIR__ . '/inc/setup/block-editor/bootstrap.php';

// ブロックエディタ用カスタムブロック
require_once __DIR__ . '/inc/custom-editor-blocks/register.php';

// ログインリダイレクト禁止
require_once __DIR__ . '/inc/setup/disable-login-redirect.php';

// ログイン通知メール送信
// require_once __DIR__ . '/inc/setup/send-login-mail.php';


/*********************************************
 * setup - plugin
 ********************************************/
// taxonomy-terms-order（表示順のコード同期・管理画面メニュー制御）
require_once __DIR__ .
    '/inc/setup/plugins/custom-taxonomy-order/custom-taxonomy-order-settings.php';

// ACF設定のロード
require_once __DIR__ . '/inc/setup/plugins/acf/acf-inc.php';

// CF7設定のロード
require_once __DIR__ . '/inc/setup/plugins/cf7/cf7-inc.php';

// WP Mail SMTP（CF7 sender 優先。SMTP 送信元を使う場合は下記 require をコメントアウト）
require_once __DIR__ . '/inc/setup/plugins/wp-mail-smtp/wp-mail-smtp-sender.php';
