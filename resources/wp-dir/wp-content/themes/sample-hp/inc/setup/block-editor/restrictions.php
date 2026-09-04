<?php

if (!defined('ABSPATH')) {
    exit();
}

/**
 * ブロックエディタ用 JS のパスを返す
 */
function sample_hp_block_editor_js_path(string $filename): string
{
    return __DIR__ . '/js/' . ltrim($filename, '/');
}

/**
 * ブロックエディタ用 JS の URL を返す
 */
function sample_hp_block_editor_js_uri(string $filename): string
{
    return get_template_directory_uri() . '/inc/setup/block-editor/js/' . ltrim($filename, '/');
}

/***************************************************
 * ブロックエディタの allowed_blocks 制限
 * pages.php / posts.php / allowed-blocks.php の設定を反映
 ****************************************************/
function restrict_allowed_block_types($allowed_block_types, $context)
{
    if (!is_object($context) || !isset($context->post) || !($context->post instanceof WP_Post)) {
        return $allowed_block_types;
    }

    $blocks = BlockEditor::resolveAllowedBlocks($context->post);
    if ($blocks === null) {
        return $allowed_block_types;
    }

    return $blocks;
}
add_filter('allowed_block_types_all', 'restrict_allowed_block_types', 10, 2);

/**
 * 埋め込みブロックのバリエーション制限（JS）
 * 編集対象の投稿に応じて embed_variations を反映
 */
function enqueue_block_editor_embed_restrictions(): void
{
    $post       = get_post();
    $variations = $post instanceof WP_Post
            ? BlockEditor::resolveEmbedVariations($post)
            : AllowedBlocks::getEmbedVariations();

    if ($variations === null) {
        return;
    }

    if ($post instanceof WP_Post) {
        $blocks = BlockEditor::resolveAllowedBlocks($post);
        if ($blocks !== null && !in_array('core/embed', $blocks, true)) {
            return;
        }
    }

    $script_file = 'embed-variations.js';
    $script_path = sample_hp_block_editor_js_path($script_file);
    if (!is_readable($script_path)) {
        return;
    }

    wp_enqueue_script(
        'sample-hp-block-editor-embed',
        sample_hp_block_editor_js_uri($script_file),
        ['wp-blocks', 'wp-dom-ready', 'wp-edit-post'],
        (string) filemtime($script_path),
        true
    );

    wp_localize_script('sample-hp-block-editor-embed', 'allowedBlocksEmbedConfig', [
        'variations' => $variations,
    ]);
}
add_action('enqueue_block_editor_assets', 'enqueue_block_editor_embed_restrictions');

/**
 * グループブロックのバリエーション制限（JS）
 * 編集対象の投稿に応じて group_variations を反映
 */
function enqueue_block_editor_group_restrictions(): void
{
    $post       = get_post();
    $variations = $post instanceof WP_Post
            ? BlockEditor::resolveGroupVariations($post)
            : AllowedBlocks::getGroupVariations();

    if ($variations === null) {
        return;
    }

    if ($post instanceof WP_Post) {
        $blocks = BlockEditor::resolveAllowedBlocks($post);
        if ($blocks !== null && !in_array('core/group', $blocks, true)) {
            return;
        }
    }

    $script_file = 'group-variations.js';
    $script_path = sample_hp_block_editor_js_path($script_file);
    if (!is_readable($script_path)) {
        return;
    }

    wp_enqueue_script(
        'sample-hp-block-editor-group',
        sample_hp_block_editor_js_uri($script_file),
        ['wp-blocks', 'wp-dom-ready', 'wp-edit-post'],
        (string) filemtime($script_path),
        true
    );

    wp_localize_script('sample-hp-block-editor-group', 'allowedBlocksGroupConfig', [
        'variations' => $variations,
    ]);
}
add_action('enqueue_block_editor_assets', 'enqueue_block_editor_group_restrictions');

/**
 * oEmbed プロバイダー制限
 * allowed-blocks.php の embed_variations に含まれないサービスを無効化
 *
 * @param array<string, array{0: string, 1: string|bool}> $providers
 * @return array<string, array{0: string, 1: string|bool}>
 */
function restrict_oembed_providers_for_allowed_embeds(array $providers): array
{
    $matchers = AllowedBlocks::getEmbedOembedMatchers();
    if ($matchers === null) {
        return $providers;
    }

    return array_filter(
        $providers,
        static function (string $pattern) use ($matchers): bool {
            foreach ($matchers as $matcher) {
                if (stripos($pattern, $matcher) !== false) {
                    return true;
                }
            }

            return false;
        },
        ARRAY_FILTER_USE_KEY
    );
}
add_filter('oembed_providers', 'restrict_oembed_providers_for_allowed_embeds');
