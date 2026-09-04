<?php

/***************************************************
    CF7設定のロード用ファイル
 ****************************************************/

// CF7 フォーム枝分け設定（メール差し替えでも参照）
require_once __DIR__ . '/../../../config/plugins/cf7/cft-branches.php';

// CF7 メールテンプレート（cf7.php から参照するためセットアップより先）
require_once __DIR__ . '/../../../config/plugins/cf7/cft-mail.php';

// CF7セットアップ
require_once __DIR__ . '/cf7-setup.php';

// CF7 スパム対策（ハニーポット + 送信時間）
require_once __DIR__ . '/cf7-spam-protection.php';

// CF7 pタグ無効化
require_once __DIR__ . '/cf7-remove-tag.php';

// CF7側のバリデーション定義
require_once __DIR__ . '/../../../config/plugins/cf7/cft-validate.php';
