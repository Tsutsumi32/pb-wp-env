<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * ブロックエディタ制限クラス
 *
 * 設定値:
 * - inc/config/allowed-blocks.php … 全共通
 * - pages.php / posts.php … 個別（共通より優先）
 *************************************************/
class BlockEditor
{
    /**
     * 編集対象の投稿から allowed_blocks を解決する
     *
     * 優先順位:
     * 1. 固定ページ … pages.php のスラッグ別設定
     * 2. カスタム投稿 … posts.php の投稿タイプ別設定
     * 3. 全共通 … allowed-blocks.php
     *
     * @return array<string>|null null の場合は制限しない
     */
    public static function resolveAllowedBlocks(WP_Post $post): ?array
    {
        if ($post->post_type === 'page' && Page::exists($post->post_name)) {
            $blocks = Page::getAllowedBlocks($post->post_name);
            if ($blocks !== null) {
                return $blocks;
            }
        }

        if (Post::exists($post->post_type)) {
            $blocks = Post::getAllowedBlocks($post->post_type);
            if ($blocks !== null) {
                return $blocks;
            }
        }

        return self::normalizeBlocks(AllowedBlocks::get());
    }

    /**
     * 編集対象の投稿から embed_variations を解決する
     *
     * 優先順位は resolveAllowedBlocks と同じ
     *
     * @return array<string>|null null の場合は制限なし
     */
    public static function resolveEmbedVariations(WP_Post $post): ?array
    {
        if ($post->post_type === 'page' && Page::exists($post->post_name)) {
            $variations = Page::getEmbedVariations($post->post_name);
            if ($variations !== null) {
                return $variations;
            }
        }

        if (Post::exists($post->post_type)) {
            $variations = Post::getEmbedVariations($post->post_type);
            if ($variations !== null) {
                return $variations;
            }
        }

        return AllowedBlocks::getEmbedVariations();
    }

    /**
     * 編集対象の投稿から group_variations を解決する
     *
     * 優先順位:
     * 1. 固定ページ … pages.php の共通設定
     * 2. カスタム投稿 … posts.php の投稿タイプ別設定
     * 3. 全共通 … allowed-blocks.php
     *
     * @return array<string>|null null の場合は制限なし
     */
    public static function resolveGroupVariations(WP_Post $post): ?array
    {
        if ($post->post_type === 'page') {
            $variations = Page::getGroupVariations();
            if ($variations !== null) {
                return $variations;
            }
        }

        if (Post::exists($post->post_type)) {
            $variations = Post::getGroupVariations($post->post_type);
            if ($variations !== null) {
                return $variations;
            }
        }

        return AllowedBlocks::getGroupVariations();
    }

    /**
     * oEmbed 制限用マッチャー一覧を解決する（投稿コンテキストあり）
     */
    public static function resolveEmbedOembedMatchers(?WP_Post $post = null): ?array
    {
        if ($post instanceof WP_Post) {
            $variations = self::resolveEmbedVariations($post);
            if ($variations !== null) {
                return AllowedBlocks::buildOembedMatchers($variations);
            }
        }

        return AllowedBlocks::getEmbedOembedMatchers();
    }

    /**
     * ブロック名配列を正規化する
     *
     * @param array<string>|null $blocks
     * @return array<string>|null
     */
    public static function normalizeBlocks(?array $blocks): ?array
    {
        if ($blocks === null) {
            return null;
        }

        $normalized = [];
        foreach ($blocks as $block) {
            if (!is_string($block) || $block === '') {
                continue;
            }
            $normalized[] = $block;
        }

        return $normalized;
    }
}
