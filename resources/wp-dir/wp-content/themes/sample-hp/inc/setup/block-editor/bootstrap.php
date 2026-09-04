<?php

if (!defined('ABSPATH')) {
    exit();
}

/**
 * ブロックエディタの表示・制限設定
 *
 * - block-editor.php … 設定値の解決（BlockEditor クラス）
 * - restrictions.php … allowed_blocks / バリエーション制限 / oEmbed 制限
 * - typography.php … 編集画面本文のフォント系統
 * - block-styles.php … コアブロックのブロックスタイル登録
 * - enqueue-styles.php … wp-block-styles.css の読み込み
 * - guide/ … 編集者向けコンテンツ編集ガイド（管理画面。ENABLE_ADMIN_EDIT_GUIDE が true のとき）
 * - js/ … 編集画面用スクリプト
 */
require_once __DIR__ . '/block-editor.php';
require_once __DIR__ . '/restrictions.php';
require_once __DIR__ . '/typography.php';
require_once __DIR__ . '/block-styles.php';
require_once __DIR__ . '/enqueue-styles.php';

if (defined('ENABLE_ADMIN_EDIT_GUIDE') && ENABLE_ADMIN_EDIT_GUIDE) {
    require_once __DIR__ . '/guide/admin-page.php';
}
