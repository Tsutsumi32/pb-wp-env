<?php

/***************************************************
    ACF設定のロード用ファイル
 ****************************************************/
require_once __DIR__ . '/../../../config/plugins/acf/acfFileds.php';
add_action('after_setup_theme', function () {
    AcfField::init();

    require_once __DIR__ . '/../code-sync-dev-mode.php';

    // ACF設定 セットアップ
    require_once __DIR__ . '/acf-setup.php';

    // ACF 画像を管理画面に
    require_once __DIR__ . '/acf-admin-img-display.php';
});
