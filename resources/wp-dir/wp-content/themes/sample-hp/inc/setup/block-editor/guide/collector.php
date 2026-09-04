<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * コンテンツ編集ガイド用データ収集（編集者向け・自動生成）
 *************************************************/

/**
 * 仕様書に出さない内部ブロック（親と一緒に挿入されるもの）
 *
 * @var list<string>
 */
const SAMPLE_HP_BLOCK_GUIDE_CHILD_BLOCKS = [
    'core/list-item',
    'core/button',
];

/**
 * 埋め込みバリエーションの表示名
 *
 * @var array<string, string>
 */
const SAMPLE_HP_BLOCK_GUIDE_EMBED_LABELS = [
    'youtube' => 'YouTube',
    'vimeo'   => 'Vimeo',
    'twitter' => 'X（旧 Twitter）',
];

/**
 * グループバリエーションの表示名
 *
 * @var array<string, string>
 */
const SAMPLE_HP_BLOCK_GUIDE_GROUP_LABELS = [
    'group'       => 'グループ（標準）',
    'group-row'   => '横並び',
    'group-stack' => '縦積み',
    'group-grid'  => 'グリッド',
];

/**
 * ブロック名のフォールバック表示名（未登録時）
 *
 * @var array<string, string>
 */
const SAMPLE_HP_BLOCK_GUIDE_BLOCK_LABELS = [
    'core/paragraph'                 => '段落',
    'core/heading'                   => '見出し',
    'core/list'                      => 'リスト',
    'core/list-item'                 => 'リスト項目',
    'core/quote'                     => '引用',
    'core/table'                     => 'テーブル',
    'core/image'                     => '画像',
    'core/buttons'                   => 'ボタン',
    'core/button'                    => 'ボタン（単体）',
    'core/spacer'                    => 'スペーサー',
    'core/html'                      => 'カスタムHTML',
    'core/group'                     => 'グループ',
    'core/embed'                     => '埋め込み',
    'custom-block/table-of-contents' => '目次',
    'custom-block/description-list'  => '説明リスト',
    'custom-block/post-card'         => '記事カード',
    'custom-block/link-card'         => 'リンクカード',
];

/**
 * ACF フィールドタイプの表示名
 *
 * @var array<string, string>
 */
const SAMPLE_HP_GUIDE_ACF_TYPE_LABELS = [
    'text'         => 'テキスト',
    'textarea'     => 'テキストエリア',
    'url'          => 'URL',
    'true_false'   => 'ON/OFF',
    'post_object'  => '投稿選択',
    'image'        => '画像',
    'number'       => '数値',
    'email'        => 'メール',
    'select'       => 'セレクト',
    'checkbox'     => 'チェックボックス',
    'radio'        => 'ラジオボタン',
    'wysiwyg'      => 'リッチエディタ',
    'relationship' => '関連投稿',
];

/**
 * 投稿 supports の表示名
 *
 * @var array<string, string>
 */
const SAMPLE_HP_GUIDE_SUPPORT_LABELS = [
    'title'     => 'タイトル',
    'editor'    => '本文（ブロックエディタ）',
    'thumbnail' => 'アイキャッチ画像',
    'revisions' => 'リビジョン',
    'excerpt'   => '抜粋',
];

/**
 * ガイド用の集約データを返す
 *
 * @return array<string, mixed>
 */
function sample_hp_block_editor_guide_collect(): array
{
    return array_merge(
        sample_hp_guide_collect_block_editor(),
        [
            'plugins' => sample_hp_guide_collect_plugins(),
            'pages'   => sample_hp_guide_collect_pages(),
            'posts'   => sample_hp_guide_collect_posts(),
            'acf'     => sample_hp_guide_collect_acf(),
        ]
    );
}

/**
 * ブロックエディタ関連
 *
 * @return array<string, mixed>
 */
function sample_hp_guide_collect_block_editor(): array
{
    $allowed  = AllowedBlocks::get() ?? [];
    $registry = WP_Block_Type_Registry::get_instance();

    $blocks = [];
    foreach ($allowed as $block_name) {
        if (!is_string($block_name) || $block_name === '') {
            continue;
        }

        $type  = $registry->get_registered($block_name);
        $title = is_object($type) && isset($type->title) && is_string($type->title) && $type->title !== ''
            ? $type->title
            : (SAMPLE_HP_BLOCK_GUIDE_BLOCK_LABELS[$block_name] ?? $block_name);
        $description = is_object($type) && isset($type->description) && is_string($type->description)
            ? $type->description
            : '';

        $blocks[] = [
            'name'        => $block_name,
            'title'       => $title,
            'description' => $description,
            'is_child'    => in_array($block_name, SAMPLE_HP_BLOCK_GUIDE_CHILD_BLOCKS, true),
        ];
    }

    $registered_styles = [];
    foreach (sample_hp_get_registered_core_block_styles() as $block_name => $styles) {
        $block_title = sample_hp_guide_block_title($block_name, $registry);
        foreach ($styles as $style) {
            $registered_styles[] = [
                'block'       => $block_name,
                'block_title' => $block_title,
                'label'       => $style['label'],
            ];
        }
    }

    $disallowed_styles = [];
    foreach (sample_hp_get_disallowed_core_block_styles() as $block_name => $styles) {
        $block_title = sample_hp_guide_block_title($block_name, $registry);
        foreach ($styles as $style) {
            $disallowed_styles[] = [
                'block'       => $block_name,
                'block_title' => $block_title,
                'label'       => $style['label'],
            ];
        }
    }

    $embed_variations = [];
    foreach (AllowedBlocks::getEmbedVariations() ?? [] as $name) {
        $embed_variations[] = [
            'name'  => $name,
            'label' => SAMPLE_HP_BLOCK_GUIDE_EMBED_LABELS[$name] ?? $name,
        ];
    }

    $group_variations = [];
    foreach (AllowedBlocks::getGroupVariations() ?? [] as $name) {
        $group_variations[] = [
            'name'  => $name,
            'label' => SAMPLE_HP_BLOCK_GUIDE_GROUP_LABELS[$name] ?? $name,
        ];
    }

    return [
        'blocks'            => $blocks,
        'registered_styles' => $registered_styles,
        'disallowed_styles' => $disallowed_styles,
        'embed_variations'  => $embed_variations,
        'group_variations'  => $group_variations,
    ];
}

/**
 * プラグイン利用状況（テーマ定義 + 有効状態）
 *
 * @return array{
 *   acf: array{configured: bool, active: bool, label: string, note: string},
 *   cf7: array{configured: bool, active: bool, label: string, note: string},
 * }
 */
function sample_hp_guide_collect_plugins(): array
{
    $configured = sample_hp_guide_theme_plugin_slugs();
    $acf_slug   = 'advanced-custom-fields';
    $cf7_slug   = 'contact-form-7';

    $acf_configured = in_array($acf_slug, $configured, true);
    $cf7_configured = in_array($cf7_slug, $configured, true);
    $acf_active     = function_exists('is_plugin_active')
        ? (is_plugin_active($acf_slug . '/acf.php') || function_exists('get_field'))
        : function_exists('get_field');
    $cf7_active = function_exists('is_plugin_active')
        ? is_plugin_active($cf7_slug . '/wp-contact-form-7.php')
        : defined('WPCF7_VERSION');

    return [
        'acf' => [
            'configured' => $acf_configured,
            'active'     => $acf_active,
            'label'      => 'Advanced Custom Fields（カスタムフィールド）',
            'note'       => $acf_configured
                ? 'テーマ設定で利用対象です。投稿・固定ページの追加項目は下記「カスタムフィールド」を参照してください。'
                : 'テーマのプラグイン一覧には含まれていません。',
        ],
        'cf7' => [
            'configured' => $cf7_configured,
            'active'     => $cf7_active,
            'label'      => 'Contact Form 7（お問い合わせフォーム）',
            'note'       => $cf7_configured
                ? 'テーマ設定で利用対象です。'
                : '本サイトでは Contact Form 7 を使いません。お問い合わせ・掲載変更依頼は外部フォーム（または固定ページ本文への埋め込み）で運用します。',
        ],
    ];
}

/**
 * 固定ページの編集方針
 *
 * @return list<array<string, mixed>>
 */
function sample_hp_guide_collect_pages(): array
{
    $pages       = [];
    $acf_by_page = sample_hp_guide_acf_fields_by_page_slug();

    foreach (Page::getAll() as $slug => $page) {
        if (!is_string($slug) || !is_array($page)) {
            continue;
        }

        $edit    = sample_hp_guide_resolve_page_edit_mode($slug);
        $pages[] = [
            'slug'        => $slug,
            'title'       => (string) ($page['title'] ?? $slug),
            'noindex'     => !empty($page['noindex']),
            'edit_mode'   => $edit['mode'],
            'edit_label'  => $edit['label'],
            'edit_detail' => $edit['detail'],
            'acf_fields'  => $acf_by_page[$slug] ?? [],
        ];
    }

    return $pages;
}

/**
 * カスタム投稿の編集方針
 *
 * @return list<array<string, mixed>>
 */
function sample_hp_guide_collect_posts(): array
{
    $posts       = [];
    $acf_by_post = sample_hp_guide_acf_fields_by_post_type();

    foreach (Post::getAll() as $slug => $post) {
        if (!is_string($slug) || !is_array($post)) {
            continue;
        }

        $settings = is_array($post['post_type_settings'] ?? null)
            ? $post['post_type_settings']
            : [];
        $supports_raw = is_array($settings['supports'] ?? null)
            ? $settings['supports']
            : [];
        $supports = [];
        foreach ($supports_raw as $support) {
            if (!is_string($support) || $support === '') {
                continue;
            }
            $supports[] = SAMPLE_HP_GUIDE_SUPPORT_LABELS[$support] ?? $support;
        }

        $taxonomies        = [];
        $category_settings = is_array($post['category_settings'] ?? null)
            ? $post['category_settings']
            : [];
        foreach ($category_settings as $tax) {
            if (!is_array($tax)) {
                continue;
            }
            $taxonomies[] = (string) ($tax['label'] ?? $tax['slug'] ?? '');
        }

        $has_editor = in_array('editor', $supports_raw, true);
        $has_single = Post::hasSingle($slug);

        $posts[] = [
            'slug'         => $slug,
            'title'        => (string) ($post['title'] ?? $settings['label'] ?? $slug),
            'supports'     => $supports,
            'taxonomies'   => array_values(array_filter($taxonomies)),
            'has_archive'  => !empty($settings['has_archive']),
            'has_single'   => $has_single,
            'editor'       => $has_editor,
            'editor_label' => $has_editor
                ? '本文はブロックエディタで編集できます'
                : '本文（ブロックエディタ）はありません',
            'single_note' => $has_single
                ? ''
                : '個別ページ（シングル）は公開されません。一覧でのみ利用します。',
            'acf_fields' => $acf_by_post[$slug] ?? [],
        ];
    }

    return $posts;
}

/**
 * ACF フィールドグループ一覧
 *
 * @return list<array<string, mixed>>
 */
function sample_hp_guide_collect_acf(): array
{
    if (!class_exists('AcfField')) {
        return [];
    }

    $groups = [];
    foreach (AcfField::getAllSettings() as $key => $setting) {
        if (!is_array($setting)) {
            continue;
        }

        $items = [];
        foreach ((array) ($setting['items'] ?? []) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $type    = (string) ($item['type'] ?? '');
            $items[] = [
                'label'      => (string) ($item['label'] ?? $item['slug'] ?? ''),
                'type'       => $type,
                'type_label' => SAMPLE_HP_GUIDE_ACF_TYPE_LABELS[$type] ?? $type,
                'required'   => !empty($item['required']),
            ];
        }

        $groups[] = [
            'key'      => (string) $key,
            'label'    => (string) ($setting['label'] ?? $key),
            'location' => sample_hp_guide_acf_location_label($setting),
            'items'    => $items,
        ];
    }

    return $groups;
}

/**
 * @return list<string>
 */
function sample_hp_guide_theme_plugin_slugs(): array
{
    $path = get_template_directory() . '/inc/config/plugins.php';
    if (!is_readable($path)) {
        return [];
    }

    $list = include $path;
    if (!is_array($list)) {
        return [];
    }

    $slugs = [];
    foreach ($list as $item) {
        if (!is_string($item) || $item === '') {
            continue;
        }
        $slugs[] = explode(':', $item, 2)[0];
    }

    return array_values(array_unique($slugs));
}

/**
 * 固定ページの本文編集可否をテンプレートから判定
 *
 * @return array{mode: string, label: string, detail: string}
 */
function sample_hp_guide_resolve_page_edit_mode(string $slug): array
{
    if ($slug === Page::NOT_FOUND) {
        return [
            'mode'   => 'virtual',
            'label'  => 'システム用（WP固定ページなし）',
            'detail' => '404 表示用の定義です。管理画面から編集するページではありません。',
        ];
    }

    if ($slug === Page::TOP) {
        return [
            'mode'   => 'template',
            'label'  => 'テンプレート固定（レイアウト編集不可）',
            'detail' => '表示はテーマの front-page.php です。文言・レイアウトの変更は開発対応になります。トップ向けの設定項目は「トップページ設定」固定ページのカスタムフィールドで行います。',
        ];
    }

    if ($slug === Page::TOP_SETTINGS) {
        return [
            'mode'   => 'acf_only',
            'label'  => '設定専用（公開ページではない）',
            'detail' => 'トップページ表示用の設定を保存するページです。カスタムフィールドのみ編集してください。',
        ];
    }

    $theme_dir       = get_template_directory();
    $custom_template = $theme_dir . '/page-' . $slug . '.php';
    if (is_readable($custom_template)) {
        $source = (string) file_get_contents($custom_template);
        if (str_contains($source, 'the_content(') || str_contains($source, 'the_content ()')) {
            return [
                'mode'   => 'editor',
                'label'  => '本文編集可',
                'detail' => '専用テンプレート内で本文（ブロックエディタ）を表示します。',
            ];
        }

        return [
            'mode'   => 'template',
            'label'  => 'テンプレート固定（レイアウト編集不可）',
            'detail' => 'レイアウトはテーマのテンプレートファイル実装です。管理画面の本文ではページ構成を変えられません。設定用のカスタムフィールドがある場合はそちらを編集してください。',
        ];
    }

    return [
        'mode'   => 'editor',
        'label'  => '本文編集可',
        'detail' => '共通テンプレート（page.php）で本文を表示します。ブロックエディタで編集できます。',
    ];
}

/**
 * @return array<string, list<array{label: string, type_label: string, required: bool, group: string}>>
 */
function sample_hp_guide_acf_fields_by_page_slug(): array
{
    $map = [];
    if (!class_exists('AcfField')) {
        return $map;
    }

    foreach (AcfField::getAllSettings() as $setting) {
        if (!is_array($setting)) {
            continue;
        }

        $group_label   = (string) ($setting['label'] ?? '');
        $location_type = (string) ($setting['location_type'] ?? 'post_type');
        $target_slugs  = [];

        if ($location_type === 'page') {
            $page_slug = (string) ($setting['page_slug'] ?? '');
            if ($page_slug !== '') {
                $target_slugs[] = $page_slug;
            }
        } elseif ($location_type === 'shared_content' && !empty($setting['page_all'])) {
            $excluded = array_map('strval', (array) ($setting['page_exclude_slugs'] ?? []));
            foreach (array_keys(Page::getAll()) as $slug) {
                if (!is_string($slug) || in_array($slug, $excluded, true)) {
                    continue;
                }
                if (in_array($slug, [Page::NOT_FOUND, Page::TOP_SETTINGS], true)) {
                    continue;
                }
                $target_slugs[] = $slug;
            }
        }

        foreach ($target_slugs as $slug) {
            foreach ((array) ($setting['items'] ?? []) as $item) {
                if (!is_array($item)) {
                    continue;
                }
                $type         = (string) ($item['type'] ?? '');
                $map[$slug][] = [
                    'label'      => (string) ($item['label'] ?? ''),
                    'type_label' => SAMPLE_HP_GUIDE_ACF_TYPE_LABELS[$type] ?? $type,
                    'required'   => !empty($item['required']),
                    'group'      => $group_label,
                ];
            }
        }
    }

    return $map;
}

/**
 * @return array<string, list<array{label: string, type_label: string, required: bool, group: string}>>
 */
function sample_hp_guide_acf_fields_by_post_type(): array
{
    $map = [];
    if (!class_exists('AcfField')) {
        return $map;
    }

    foreach (AcfField::getAllSettings() as $setting) {
        if (!is_array($setting)) {
            continue;
        }

        $group_label   = (string) ($setting['label'] ?? '');
        $location_type = (string) ($setting['location_type'] ?? 'post_type');
        $target_types  = [];

        if ($location_type === 'shared_content') {
            $target_types = array_map('strval', (array) ($setting['post_types'] ?? []));
        } elseif ($location_type === 'page') {
            $target_types = [];
        } else {
            $post_type = (string) ($setting['post_type'] ?? '');
            if ($post_type !== '') {
                $target_types[] = $post_type;
            }
        }

        foreach ($target_types as $post_type) {
            foreach ((array) ($setting['items'] ?? []) as $item) {
                if (!is_array($item)) {
                    continue;
                }
                $type              = (string) ($item['type'] ?? '');
                $map[$post_type][] = [
                    'label'      => (string) ($item['label'] ?? ''),
                    'type_label' => SAMPLE_HP_GUIDE_ACF_TYPE_LABELS[$type] ?? $type,
                    'required'   => !empty($item['required']),
                    'group'      => $group_label,
                ];
            }
        }
    }

    return $map;
}

/**
 * @param array<string, mixed> $setting
 */
function sample_hp_guide_acf_location_label(array $setting): string
{
    $location_type = (string) ($setting['location_type'] ?? 'post_type');

    if ($location_type === 'page') {
        $slug  = (string) ($setting['page_slug'] ?? '');
        $page  = $slug !== '' ? Page::get($slug) : null;
        $title = is_array($page) ? (string) ($page['title'] ?? $slug) : $slug;

        return '固定ページ「' . $title . '」';
    }

    if ($location_type === 'shared_content') {
        $post_labels = [];
        foreach ((array) ($setting['post_types'] ?? []) as $post_type) {
            if (!is_string($post_type) || $post_type === '') {
                continue;
            }
            $post          = Post::getAll()[$post_type] ?? null;
            $post_labels[] = is_array($post)
                ? (string) ($post['title'] ?? $post_type)
                : $post_type;
        }

        $parts = [];
        if ($post_labels !== []) {
            $parts[] = '投稿タイプ: ' . implode(' / ', $post_labels);
        }
        if (!empty($setting['page_all'])) {
            $excluded = array_map('strval', (array) ($setting['page_exclude_slugs'] ?? []));
            $parts[]  = '固定ページ全般'
                . ($excluded !== [] ? '（除外: ' . implode(', ', $excluded) . '）' : '');
        }

        return $parts !== [] ? implode(' ＋ ', $parts) : '共通';
    }

    $post_type = (string) ($setting['post_type'] ?? '');
    $post      = $post_type !== '' ? (Post::getAll()[$post_type] ?? null) : null;
    $title     = is_array($post) ? (string) ($post['title'] ?? $post_type) : $post_type;

    return '投稿タイプ「' . $title . '」';
}

function sample_hp_guide_block_title(string $block_name, WP_Block_Type_Registry $registry): string
{
    $type = $registry->get_registered($block_name);
    if (is_object($type) && isset($type->title) && is_string($type->title) && $type->title !== '') {
        return $type->title;
    }

    return SAMPLE_HP_BLOCK_GUIDE_BLOCK_LABELS[$block_name] ?? $block_name;
}
