<?php

declare(strict_types=1);

/**
 * PHP CS Fixer（コンテナ内では resources が /var/www/html にマウントされる）
 *
 * 対象ディレクトリ・ルールはこのファイルで管理する。
 * テーマ名は .env の WP_THEME_NAME と揃える（wordpress サービスに渡した環境変数を参照）。
 */
$wpSubDir  = getenv('WP_SUB_DIR') ?: 'wp-dir';
$themeName = getenv('WP_THEME_NAME') ?: 'sample-hp';

$finder = (new PhpCsFixer\Finder())
    ->in([sprintf('%s/%s/wp-content/themes/%s', __DIR__, $wpSubDir, $themeName)])
    ->name('*.php')
    ->exclude(['vendor', 'node_modules']);

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(true)
    ->setUsingCache(false)
    ->setRules([
        // '@PSR12'                 => true,
        // 'statement_indentation'  => true,
        'binary_operator_spaces' => [
            'default'   => 'single_space',
            'operators' => [
                '=>' => 'align_single_space_minimal',
                '='  => 'align_single_space_minimal',
            ],
        ],
    ])
    ->setFinder($finder);
