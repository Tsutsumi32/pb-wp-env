<?php

/***************************************************
 * ACFのセットアップ処理
 *
 * 設定ファイル（acfFileds.php）に従いフィールドグループを構築する。
 *
 * モードは UDS_ACF_CODE_SYNC_DEV_MODE（config.php）で切替:
 * - true  : コード制御モード — コード定義のみ DB に反映（コード外は削除）
 * - false : 配信モード — コードからの登録・更新・削除を行わない
 *
 * 配信モード初回は、コード制御モードで一度同期するか
 * `wp eval-file inc/wp-cli/sync-acf-from-code.php` を実行して DB へ反映する。
 ****************************************************/

/**
 * フィールドグループ key を生成（安定した一意キー）
 */
function uds_acf_group_key(string $slug): string
{
    return 'group_' . $slug;
}

/**
 * フィールド key を生成（安定した一意キー）
 */
function uds_acf_field_key(string $slug): string
{
    return 'field_' . $slug;
}

/**
 * acfFileds.php の items から ACF フィールド配列を生成
 *
 * @param array<int, array<string, mixed>> $acf_items
 * @return array<int, array<string, mixed>>
 */
function set_acf_settings(array $acf_items, string $group_key): array
{
    if ($acf_items === []) {
        return [];
    }

    $acf_settings = [];
    foreach ($acf_items as $acf_item) {
        if (empty($acf_item['slug'])) {
            continue;
        }

        $slug = (string) $acf_item['slug'];

        $field = [
            'key'    => uds_acf_field_key($slug),
            'name'   => $slug,
            'label'  => $acf_item['label'] ?? $slug,
            'type'   => $acf_item['type'] ?? 'text',
            'parent' => $group_key,
        ];

        foreach ($acf_item as $key => $value) {
            if (in_array($key, ['slug', 'sample'], true)) {
                continue;
            }

            if ($key === 'instruction') {
                $field['instructions'] = $value;
                continue;
            }

            if ($key === 'conditional_logic' && ($value === '' || $value === null)) {
                continue;
            }

            $field[$key] = $value;
        }

        $acf_settings[] = $field;
    }

    return $acf_settings;
}

/**
 * 設定から ACF の location ルールを生成する
 *
 * location_type:
 * - post_type（省略時）: カスタム投稿タイプ
 * - page: 固定ページ（page_slug で対象ページを指定）
 * - page_template: ページテンプレート（page_template で対象テンプレートを指定）
 *
 * @return array<int, array<int, array<string, string>>>
 */
function build_acf_location(array $setting): array
{
    $location_type = $setting['location_type'] ?? 'post_type';

    if ($location_type === 'page_template') {
        $page_template = $setting['page_template'] ?? '';
        if ($page_template === '') {
            return [];
        }

        return [
            [
                [
                    'param'    => 'page_template',
                    'operator' => '==',
                    'value'    => $page_template,
                ],
            ],
        ];
    }

    if ($location_type === 'page') {
        $page_slug = $setting['page_slug'] ?? '';
        if ($page_slug === '') {
            return [];
        }

        $page = get_page_by_path($page_slug);
        if (!($page instanceof WP_Post)) {
            return [];
        }

        return [
            [
                [
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'page',
                ],
                [
                    'param'    => 'page',
                    'operator' => '==',
                    'value'    => (string) $page->ID,
                ],
            ],
        ];
    }

    $post_type = $setting['post_type'] ?? '';
    if ($post_type === '') {
        return [];
    }

    return [
        [
            [
                'param'    => 'post_type',
                'operator' => '==',
                'value'    => $post_type,
            ],
        ],
    ];
}

/**
 * AcfField 設定 1 件から ACF インポート用フィールドグループ配列を生成
 *
 * @return array<string, mixed>|null
 */
function uds_acf_build_field_group_from_setting(array $setting): ?array
{
    $items = $setting['items'] ?? null;
    if (!is_array($items) || $items === [] || empty($setting['slug'])) {
        return null;
    }

    $location = build_acf_location($setting);
    if ($location === []) {
        return null;
    }

    $group_key = uds_acf_group_key((string) $setting['slug']);

    return [
        'key'                   => $group_key,
        'title'                 => $setting['label'] ?? $setting['slug'],
        'fields'                => set_acf_settings($items, $group_key),
        'location'              => $location,
        'menu_order'            => 0,
        'position'              => 'acf_after_title',
        'style'                 => 'default',
        'label_placement'       => 'top',
        'instruction_placement' => 'label',
        'active'                => true,
        'modified'              => time(),
    ];
}

/**
 * グループ key（post_name）に一致する acf-field-group の投稿 ID 一覧
 *
 * @return array<int>
 */
function uds_acf_get_field_group_post_ids_by_key(string $group_key): array
{
    $posts = get_posts([
        'post_type'      => 'acf-field-group',
        'post_status'    => 'any',
        'posts_per_page' => -1,
        'name'           => $group_key,
        'fields'         => 'ids',
        'orderby'        => 'ID',
        'order'          => 'ASC',
    ]);

    return array_values(array_map('intval', $posts));
}

/**
 * 同一 key の重複フィールドグループを削除（1 件だけ残す）
 *
 * @param int|null $keep_id 残す投稿 ID。null のとき最大 ID を残す
 * @return int 削除件数
 */
function uds_acf_remove_duplicate_field_groups(string $group_key, ?int $keep_id = null): int
{
    $ids = uds_acf_get_field_group_post_ids_by_key($group_key);
    if ($ids === []) {
        return 0;
    }

    if ($keep_id === null) {
        $keep_id = max($ids);
    }

    $deleted = 0;
    foreach ($ids as $id) {
        if ($id === $keep_id) {
            continue;
        }

        if (function_exists('acf_delete_field_group')) {
            acf_delete_field_group($id);
        } else {
            wp_delete_post($id, true);
        }
        ++$deleted;
    }

    return $deleted;
}

/**
 * 親フィールドグループが存在しない acf-field 投稿を削除
 *
 * @return int 削除件数
 */
function uds_acf_cleanup_orphan_fields(): int
{
    global $wpdb;

    $orphan_ids = $wpdb->get_col(
        "SELECT p.ID
        FROM {$wpdb->posts} p
        LEFT JOIN {$wpdb->posts} parent ON p.post_parent = parent.ID
        WHERE p.post_type = 'acf-field'
        AND p.post_parent > 0
        AND parent.ID IS NULL"
    );

    if (!is_array($orphan_ids) || $orphan_ids === []) {
        return 0;
    }

    $deleted = 0;
    foreach ($orphan_ids as $id) {
        if (wp_delete_post((int) $id, true)) {
            ++$deleted;
        }
    }

    return $deleted;
}

/**
 * フィールドグループ内の重複フィールド・コード定義外フィールドを削除
 *
 * acf_import_field_group 実行後に同一 key の acf-field が残ることがあるため、
 * 同期のたびにコード定義どおり 1 件に整理する。
 *
 * @param array<string> $expected_field_keys field_ で始まる ACF フィールド key 一覧
 * @return int 削除件数
 */
function uds_acf_cleanup_group_fields(int $group_post_id, array $expected_field_keys): int
{
    if ($group_post_id <= 0) {
        return 0;
    }

    $fields = get_posts([
        'post_type'      => 'acf-field',
        'post_status'    => 'any',
        'post_parent'    => $group_post_id,
        'posts_per_page' => -1,
        'orderby'        => 'ID',
        'order'          => 'ASC',
    ]);

    if ($fields === []) {
        return 0;
    }

    $expected_field_keys = array_values(array_unique($expected_field_keys));
    $seen_keys           = [];
    $deleted             = 0;

    foreach ($fields as $field) {
        $field_key     = (string) $field->post_name;
        $should_delete = false;

        if ($expected_field_keys !== [] && !in_array($field_key, $expected_field_keys, true)) {
            $should_delete = true;
        } elseif (isset($seen_keys[$field_key])) {
            $should_delete = true;
        } else {
            $seen_keys[$field_key] = (int) $field->ID;
        }

        if (!$should_delete) {
            continue;
        }

        if (function_exists('acf_delete_field')) {
            acf_delete_field($field->ID);
        } elseif (wp_delete_post($field->ID, true)) {
            ++$deleted;
        }
    }

    return $deleted;
}

/**
 * コード定義から同期対象のフィールドグループ key 一覧を取得
 *
 * @return array<string>
 */
function uds_acf_get_managed_group_keys(): array
{
    $keys = [];
    foreach (AcfField::getAllSettings() as $setting) {
        $field_group = uds_acf_build_field_group_from_setting($setting);
        if ($field_group === null) {
            continue;
        }
        $keys[] = (string) $field_group['key'];
    }

    foreach (AcfField::getAllPageSettings() as $setting) {
        $field_group = uds_acf_build_field_group_from_setting($setting);
        if ($field_group === null) {
            continue;
        }
        $keys[] = (string) $field_group['key'];
    }

    return array_values(array_unique($keys));
}

/**
 * コード定義に無い ACF フィールドグループを削除
 *
 * @return int 削除件数
 */
function uds_acf_delete_unmanaged_field_groups(): int
{
    $managed_keys = uds_acf_get_managed_group_keys();
    if ($managed_keys === []) {
        return 0;
    }

    $posts = get_posts([
        'post_type'      => 'acf-field-group',
        'post_status'    => 'any',
        'posts_per_page' => -1,
    ]);

    if ($posts === []) {
        return 0;
    }

    $deleted = 0;
    foreach ($posts as $post) {
        if (in_array($post->post_name, $managed_keys, true)) {
            continue;
        }

        if (function_exists('acf_delete_field_group')) {
            acf_delete_field_group($post->ID);
        } else {
            wp_delete_post($post->ID, true);
        }
        ++$deleted;
    }

    return $deleted;
}

/**
 * コード定義のフィールドグループを DB へ同期
 *
 * acf_add_local_field_group では ACF 管理画面に表示されないため、
 * acf_import_field_group で DB へ反映する。
 *
 * @param bool $overwrite_existing true: 既存グループをコード定義で上書き
 */
function uds_acf_sync_field_groups_from_code(bool $overwrite_existing = true): void
{
    if (!function_exists('acf_import_field_group')) {
        return;
    }

    ensure_cpt_page_settings_pages();

    $settings = array_merge(AcfField::getAllSettings(), AcfField::getAllPageSettings());

    foreach ($settings as $setting) {
        $field_group = uds_acf_build_field_group_from_setting($setting);
        if ($field_group === null) {
            continue;
        }

        $group_key    = (string) $field_group['key'];
        $existing_ids = uds_acf_get_field_group_post_ids_by_key($group_key);

        if (count($existing_ids) > 1) {
            $keep_id = max($existing_ids);
            uds_acf_remove_duplicate_field_groups($group_key, $keep_id);
            $existing_ids = [$keep_id];
        }

        if (!$overwrite_existing && $existing_ids !== []) {
            continue;
        }

        if ($existing_ids !== []) {
            $field_group['ID'] = $existing_ids[0];
        }

        acf_import_field_group($field_group);

        $group_post_ids = uds_acf_get_field_group_post_ids_by_key($group_key);
        if ($group_post_ids !== []) {
            $expected_field_keys = array_map(
                static fn (array $field): string => (string) ($field['key'] ?? ''),
                $field_group['fields']
            );
            uds_acf_cleanup_group_fields((int) $group_post_ids[0], $expected_field_keys);
        }
    }

    if ($overwrite_existing) {
        uds_acf_delete_unmanaged_field_groups();
    }

    uds_acf_cleanup_orphan_fields();
}

/**
 * ACF 初期化時: モードに応じて同期
 */
function uds_acf_setup(): void
{
    if (!uds_acf_is_code_sync_dev_mode()) {
        return;
    }

    uds_acf_sync_field_groups_from_code(true);
}

add_action('acf/init', 'uds_acf_setup', 5);
