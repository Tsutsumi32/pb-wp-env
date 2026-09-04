<?php

/***************************************************
    WP-CLI に投稿タイプ・ターム定義を渡すファイル
 ****************************************************/
require_once __DIR__ . '/../../../../../wp-load.php';
require_once __DIR__ . '/../config/posts.php';
Post::exportBashAssociativeArray();
