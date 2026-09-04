<?php

/************************************************
 * カスタム投稿クラス
 *************************************************/
class Post
{
    // カスタム投稿キー一覧(スラッグ)
    public const NEWS = 'news';

    // タクソノミーキー一覧(スラッグ)
    public const NEWS_TAXONOMY  = 'news-category';
    public const NEWS2_TAXONOMY = 'news2-category';

    // カスタム投稿情報
    protected static $posts = [
        self::NEWS => [
            'title'       => 'サンプル', // タイトル
            'description' => '', // ディスクリプション
            'breadcrumbs' => [], // パンくず nameとslugの配列
            'noindex'     => false, // noindex設定 tureでnoindex
            'assets_name' => null, // css jsのファイル名 nullならキー名 指定した場合指定名
            // ブロックエディタで許可するブロック（supports に editor がある場合のみ有効）
            // 未設定時は allowed-blocks.php の共通設定を使用
            // 例: 'allowed_blocks' => ['core/paragraph', 'core/heading', 'core/image'],
            // カスタム投稿の登録に必要な設定
            'post_type_settings' => [
                'label'         => 'サンプル',
                'supports'      => ['title', 'thumbnail', 'revisions', 'editor'], // thumbnail: 記事カードブロック用
                'menu_position' => 2,
                'has_archive'   => true, // falseでアーカイブページなし。wp-cli側のページ生成等の判定にも使用
                'has_single'   => true, // falseでsingleテンプレート生成しない。詳細画面へのリンクを制御
            ],
            // アーカイブ一覧のメインクエリ
            // 原則該当テンプレート内でのメインクエリを使用してデータ取得を行う運用
            // テンプレート外の投稿を取得したい場合のみ、サブクエリを使用する
            'archive_query' => [
                'posts_per_page' => 10,
                'orderby'        => 'modified',
                'order'          => 'DESC',
            ],
            // カスタム投稿のタクソノミー(カテゴリ)設定
            // 複数設定時は配列に追加する
            'category_settings' => [
                [
                    'slug'        => self::NEWS_TAXONOMY,
                    'label'       => 'サンプルカテゴリ',
                    'default'     => 'others', // 作成時にデフォルトで設定するタームのスラッグ
                    'has_archive'  => true, // カテゴリ一覧画面を作るかどうか(template生成も制御)
                    'meta_box_cb' => false, // 管理画面のサイドバーに選択ボックスを表示しない
                ],
            ],
            // 登録するターム(カテゴリ)設定
            // 検索・一覧・絞り込み当、いわゆるカテゴリについてはテンプレート仕組みの恩恵を請けるために、タクソノミーで実装し、acf側で紐づけすること
            // taxonomy_slug => term配列 の形式で定義する
            // WPに反映させるにはwp-create-postsを実行する
            'term_settings' => [
                self::NEWS_TAXONOMY => [
                    [
                        'slug'  => 'blog',
                        'label' => 'ブログ',
                        'order' => 1, // taxonomy-terms-order の term_order（UDS_TERM_ORDER_CODE_SYNC_DEV_MODE が true のときのみコードから反映）
                    ],
                    [
                        'slug'  => 'news',
                        'label' => 'おしらせ',
                        'order' => 2,
                    ],
                    [
                        'slug'  => 'others',
                        'label' => 'その他',
                        'order' => 3,
                    ],
                ],
            ],

            // 投稿タイプ別のグループバリエーション例
            // 'group_variations' => ['group', 'group-grid'],
        ],
    ];

    /**
     * カスタム投稿情報取得
     */
    public static function get(string $key): ?array
    {
        return self::$posts[$key] ?? null;
    }

    /**
     * 指定キーの存在チェック
     */
    public static function exists(string $key): bool
    {
        return array_key_exists($key, self::$posts);
    }

    /**
     * タイトル取得
     */
    public static function getTitle(string $key): ?string
    {
        return self::get($key)['title'] ?? null;
    }

    /**
     * URL取得
     */
    public static function getUrl(string $key): ?string
    {
        return self::get($key)['url'] ?? null;
    }

    /**
     * ディスクリプション取得
     */
    public static function getDescription(string $key): ?string
    {
        return self::get($key)['description'] ?? null;
    }

    /**
     * パンくず情報取得
     */
    public static function getBreadcrumbs(string $key): array
    {
        return self::get($key)['breadcrumbs'] ?? [];
    }

    /**
     * noindex取得
     */
    public static function getNoindex(string $key): bool
    {
        return self::get($key)['noindex'] ?? false;
    }

    /**
     * asset名の取得
     */
    public static function getAssetsName(string $key): ?string
    {
        return self::get($key)['assets_name'] ?? null;
    }

    /**
     * ブロックエディタで許可するブロック一覧を取得
     *
     * @return array<string>|null 未設定時は null（制限なし）
     */
    public static function getAllowedBlocks(string $key): ?array
    {
        $post = self::get($key);
        if ($post === null || !array_key_exists('allowed_blocks', $post)) {
            return null;
        }

        return BlockEditor::normalizeBlocks($post['allowed_blocks']);
    }

    /**
     * 埋め込みブロックで許可するバリエーション名を取得
     *
     * @return array<string>|null 未設定時は null（共通設定へフォールバック）
     */
    public static function getEmbedVariations(string $key): ?array
    {
        $post = self::get($key);
        if ($post === null || !array_key_exists('embed_variations', $post)) {
            return null;
        }

        return AllowedBlocks::normalizeNames($post['embed_variations']);
    }

    /**
     * グループブロックで許可するバリエーション名を取得（投稿タイプ別）
     *
     * 未設定時は null（allowed-blocks.php へフォールバック）
     *
     * 設定例（self::MARKET_REPORT 定義内）:
     * 'group_variations' => ['group', 'group-grid'],
     *
     * @return array<string>|null
     */
    public static function getGroupVariations(string $key): ?array
    {
        $post = self::get($key);
        if ($post === null || !array_key_exists('group_variations', $post)) {
            return null;
        }

        return AllowedBlocks::normalizeNames($post['group_variations']);
    }

    /**
     * 設定情報取得
     */
    public static function getPostTypeSettings(string $key): ?array
    {
        return self::get($key)['post_type_settings'] ?? null;
    }

    /**
     * 詳細ページ（single）を持つかどうか（未設定時は true）
     */
    public static function hasSingle(string $key): bool
    {
        $settings = self::getPostTypeSettings($key);
        if ($settings === null || !array_key_exists('has_single', $settings)) {
            return true;
        }

        return (bool) $settings['has_single'];
    }

    /**
     * post_type_settings.supports に thumbnail がある投稿タイプのスラッグ一覧
     */
    public static function getPostTypeSlugsWithThumbnailSupport(): array
    {
        $slugs = [];
        foreach (self::$posts as $slug => $config) {
            $supports = $config['post_type_settings']['supports'] ?? [];
            if (is_array($supports) && in_array('thumbnail', $supports, true)) {
                $slugs[] = $slug;
            }
        }
        return $slugs;
    }

    /**
     * カテゴリ設定情報取得
     */
    public static function getCategorySettings(string $key): ?array
    {
        $category_settings = self::get($key)['category_settings'] ?? null;
        if ($category_settings === null) {
            return null;
        }

        // 旧形式（単体定義）も配列化して返す
        if (isset($category_settings['slug'])) {
            return [$category_settings];
        }

        return $category_settings;
    }

    /**
     * タクソノミーにフロント一覧（taxonomy archive）があるか（未設定時は true）
     */
    public static function taxonomyHasArchive(string $postType, string $taxonomySlug): bool
    {
        $category_settings = self::getCategorySettings($postType) ?? [];
        foreach ($category_settings as $category) {
            if (($category['slug'] ?? '') !== $taxonomySlug) {
                continue;
            }

            if (!array_key_exists('has_archive', $category)) {
                return true;
            }

            return (bool) $category['has_archive'];
        }

        return true;
    }

    /**
     * 各カテゴリー(ターム)取得
     */
    public static function getTermSettings(string $key): ?array
    {
        $term_settings = self::get($key)['term_settings'] ?? null;
        if ($term_settings === null) {
            return null;
        }

        // 旧形式（ターム配列のみ）は先頭タクソノミーへ紐づける
        if (isset($term_settings[0]['slug'])) {
            $categories          = self::getCategorySettings($key) ?? [];
            $first_taxonomy_slug = $categories[0]['slug'] ?? '';
            if ($first_taxonomy_slug === '') {
                return [];
            }
            return [$first_taxonomy_slug => $term_settings];
        }

        return $term_settings;
    }

    /**
     * アーカイブのメインクエリ設定（archive_query 未設定の投稿タイプは null）
     */
    public static function getArchiveQuery(string $key): ?array
    {
        $cfg = self::get($key);
        if ($cfg === null || !array_key_exists('archive_query', $cfg)) {
            return null;
        }
        return array_merge(
            [
                'posts_per_page' => 10,
                'orderby'        => 'modified',
                'order'          => 'DESC',
            ],
            $cfg['archive_query'],
        );
    }

    /**
     * 全情報を取得
     */
    public static function getAll(): array
    {
        return self::$posts;
    }

    /**
     * WP-CLI側に出力する処理（ターム作成・テンプレート生成・JSONインポート対象の判定）
     */
    public static function exportBashAssociativeArray(): void
    {
        echo 'declare -A POST_TYPES=(' . PHP_EOL;

        foreach (self::$posts as $typeKey => $config) {
            $prefix = str_replace('.', '_', $typeKey); // 念のためドット除去

            echo "  [${prefix}_slug]=\"{$typeKey}\"" . PHP_EOL;
            echo "  [${prefix}_label]=\"{$config['title']}\"" . PHP_EOL;
            $category_settings = $config['category_settings'] ?? [];
            if (!empty($category_settings) && isset($category_settings['slug'])) {
                $category_settings = [$category_settings];
            }
            $term_settings = self::getTermSettings($typeKey) ?? [];
            foreach ($category_settings as $category) {
                $taxonomy_slug = $category['slug'] ?? '';
                if ($taxonomy_slug === '') {
                    continue;
                }
                $taxonomy_key = preg_replace('/[^a-zA-Z0-9]+/', '_', $taxonomy_slug);
                $taxonomy_key = trim((string) $taxonomy_key, '_');
                if ($taxonomy_key === '') {
                    continue;
                }

                echo "  [${prefix}_taxonomy_${taxonomy_key}_slug]=\"{$taxonomy_slug}\"" . PHP_EOL;

                $hasTaxonomyArchive = self::taxonomyHasArchive($typeKey, $taxonomy_slug);
                echo '  [' .
                    $prefix .
                    '_taxonomy_' .
                    $taxonomy_key .
                    '_has_archive]="' .
                    ($hasTaxonomyArchive ? '1' : '0') .
                    '"' .
                    PHP_EOL;

                $taxonomy_terms = $term_settings[$taxonomy_slug] ?? [];
                foreach ($taxonomy_terms as $term) {
                    $slug = $term['slug'] ?? '';
                    if ($slug === '') {
                        continue;
                    }
                    $label = $term['label'] ?? '';
                    $order = $term['order'] ?? '';
                    echo "  [${prefix}_taxonomy_${taxonomy_key}_term_${slug}_slug]=\"$slug\"" .
                        PHP_EOL;
                    echo "  [${prefix}_taxonomy_${taxonomy_key}_term_${slug}_label]=\"$label\"" .
                        PHP_EOL;
                    echo "  [${prefix}_taxonomy_${taxonomy_key}_term_${slug}_order]=\"$order\"" .
                        PHP_EOL;
                }
            }

            if (!empty($config['post_type_settings']['has_archive'])) {
                echo "  [${prefix}_has_archive]=\"{$config['post_type_settings']['has_archive']}\"" .
                    PHP_EOL;
            }

            $hasSingle = self::hasSingle($typeKey);
            echo '  [' . $prefix . '_has_single]="' . ($hasSingle ? '1' : '0') . '"' . PHP_EOL;
        }

        echo ')' . PHP_EOL;
    }
}
