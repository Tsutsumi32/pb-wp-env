<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * テーマ内 JSON / CSV からカスタム投稿をインポートする
 *
 * 対象ファイル（data/{post_type}/ 配下。サブディレクトリ含む）:
 *   本番: posts.json または posts.csv（同時配置は中止）
 *   開発: posts.dev.json または posts.dev.csv（WP_IMPORT_ENV=dev。同時配置は中止）
 *
 * CSV は 1行目がヘッダー。入れ子はドット区切りでフラット化する。
 *
 * 例:
 *   _external_id,post_title,acf.works_period,acf.works_location
 *   works-001,足立区マンション,2026年,東京
 *
 * group の例:
 *   acf.members_question_1.question,acf.members_question_1.answer
 *
 * ACF スラッグは acf. なしでも可（works_period → acf.works_period）。
 * タクソノミーの複数指定は | 区切り。空セルは未指定として扱う。
 * 文字コードは UTF-8（BOM 可）と Shift-JIS に対応する。
 *************************************************/

class ThemePostJsonImporter
{
    private const RESERVED_KEYS = ['_external_id', '_thumbnail', 'acf', 'taxonomies'];

    private const POST_KEYS = [
        'post_title',
        'post_content',
        'post_excerpt',
        'post_status',
        'post_date',
        'post_date_gmt',
        'post_name',
        'menu_order',
    ];

    private const ENV_PROD = 'prod';

    private const ENV_DEV = 'dev';

    private const PROD_BASENAMES = ['posts.json', 'posts.csv'];

    private const DEV_BASENAMES = ['posts.dev.json', 'posts.dev.csv'];

    private string $post_type;

    private string $import_env;

    private string $import_dir;

    /** @var array<string, array<string, mixed>> */
    private array $acf_field_map = [];

    public function __construct(string $post_type, string $import_env = self::ENV_PROD)
    {
        $this->post_type     = $post_type;
        $this->import_env    = self::normalizeImportEnv($import_env);
        $this->import_dir    = trailingslashit(get_template_directory()) . POST_IMPORT_DATA_DIR . '/' . $post_type;
        $this->acf_field_map = $this->buildAcfFieldMap();
    }

    public static function normalizeImportEnv(string $import_env): string
    {
        $normalized = strtolower(trim($import_env));
        if ($normalized === '' || $normalized === self::ENV_PROD || $normalized === 'production') {
            return self::ENV_PROD;
        }

        if ($normalized === self::ENV_DEV || $normalized === 'develop' || $normalized === 'development') {
            return self::ENV_DEV;
        }

        throw new InvalidArgumentException(
            "WP_IMPORT_ENV が不正です: {$import_env}（prod または dev を指定してください）",
        );
    }

    public function run(): void
    {
        if (!Post::exists($this->post_type)) {
            throw new RuntimeException(
                "投稿タイプ '{$this->post_type}' は posts.php に定義されていません。",
            );
        }

        if (!is_dir($this->import_dir)) {
            throw new RuntimeException(
                "インポート用ディレクトリが見つかりません: {$this->import_dir}",
            );
        }

        $import_files = $this->collectImportFiles($this->import_dir);
        if ($import_files === []) {
            $expected = implode(' / ', $this->getAllowedBasenames());
            throw new RuntimeException(
                "インポート対象ファイルが見つかりません: {$this->import_dir}"
                . "（環境: {$this->import_env} / 対象ファイル名: {$expected}）",
            );
        }

        $this->assertExclusiveJsonOrCsv($import_files);

        echo "インポート環境: {$this->import_env} / 対象: " . implode(', ', $this->getAllowedBasenames()) . "\n";

        $imported = 0;
        $skipped  = 0;

        foreach ($import_files as $import_file) {
            $base_theme_relative_dir = $this->getThemeRelativeDir($import_file);
            $entries                 = $this->loadEntries($import_file);

            foreach ($entries as $index => $entry) {
                if (!is_array($entry)) {
                    echo "[WARN] {$import_file} の {$index} 件目はオブジェクトではないためスキップします。\n";
                    $skipped++;
                    continue;
                }

                $result = $this->importEntry($entry, $base_theme_relative_dir, $import_file, $index);
                if ($result === 'imported') {
                    $imported++;
                } else {
                    $skipped++;
                }
            }
        }

        echo "インポート完了: {$this->post_type} / 成功 {$imported} 件 / スキップ {$skipped} 件\n";
    }

    /**
     * @return list<string>
     */
    private function collectImportFiles(string $directory): array
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
        );

        $files = [];
        foreach ($iterator as $file) {
            if (!($file instanceof SplFileInfo) || !$file->isFile()) {
                continue;
            }

            $basename = strtolower($file->getFilename());
            if (!in_array($basename, $this->getAllowedBasenames(), true)) {
                continue;
            }

            $files[] = $file->getPathname();
        }

        sort($files);

        return $files;
    }

    /**
     * JSON と CSV が同時にある場合は、意図しない取り込みを防ぐため中止する
     *
     * @param list<string> $import_files
     */
    private function assertExclusiveJsonOrCsv(array $import_files): void
    {
        $json_files = [];
        $csv_files  = [];

        foreach ($import_files as $import_file) {
            $extension = strtolower(pathinfo($import_file, PATHINFO_EXTENSION));
            if ($extension === 'json') {
                $json_files[] = $import_file;
            } elseif ($extension === 'csv') {
                $csv_files[] = $import_file;
            }
        }

        if ($json_files === [] || $csv_files === []) {
            return;
        }

        $format_list = static function (string $label, array $files): string {
            $lines = array_map(
                static fn (string $path): string => "  - {$path}",
                $files,
            );

            return $label . ":\n" . implode("\n", $lines) . "\n";
        };

        throw new RuntimeException(
            'JSON と CSV が同時に存在するため、インポートを中止しました。'
            . " 意図しない取り込みを防ぐため、どちらか一方にしてください。\n"
            . $format_list('JSON', $json_files)
            . $format_list('CSV', $csv_files),
        );
    }

    /**
     * @return list<string>
     */
    private function getAllowedBasenames(): array
    {
        if ($this->import_env === self::ENV_DEV) {
            return self::DEV_BASENAMES;
        }

        return self::PROD_BASENAMES;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function loadEntries(string $import_file): array
    {
        $extension = strtolower(pathinfo($import_file, PATHINFO_EXTENSION));
        if ($extension === 'csv') {
            return $this->loadCsvEntries($import_file);
        }

        return $this->loadJsonEntries($import_file);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function loadJsonEntries(string $json_file): array
    {
        $raw = file_get_contents($json_file);
        if ($raw === false) {
            throw new RuntimeException("JSON を読み込めません: {$json_file}");
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new RuntimeException("JSON の形式が不正です: {$json_file}");
        }

        if (isset($data['posts']) && is_array($data['posts'])) {
            return array_values($data['posts']);
        }

        if (array_is_list($data)) {
            return $data;
        }

        return [$data];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function loadCsvEntries(string $csv_file): array
    {
        $utf8   = $this->readFileAsUtf8($csv_file);
        $handle = fopen('php://temp', 'r+');
        if ($handle === false) {
            throw new RuntimeException("CSV を読み込めません: {$csv_file}");
        }

        fwrite($handle, $utf8);
        rewind($handle);

        $headers = null;
        $entries = [];

        while (($row = fgetcsv($handle, 0, ',', '"', '')) !== false) {
            if ($this->isEmptyCsvRow($row)) {
                continue;
            }

            if ($headers === null) {
                $headers = $this->normalizeCsvHeaders($row, $csv_file);
                continue;
            }

            $assoc = [];
            foreach ($headers as $index => $header) {
                if ($header === '') {
                    continue;
                }

                $assoc[$header] = $row[$index] ?? '';
            }

            $entry = $this->unflattenCsvRow($assoc);
            if ($entry !== []) {
                $entries[] = $entry;
            }
        }

        fclose($handle);

        if ($headers === null) {
            throw new RuntimeException("CSV のヘッダー行がありません: {$csv_file}");
        }

        if (!in_array('_external_id', $headers, true)) {
            echo "[WARN] {$csv_file}: `_external_id` 列がありません。\n";
        }

        return $entries;
    }

    /**
     * @param list<string|null> $raw_headers
     * @return list<string>
     */
    private function normalizeCsvHeaders(array $raw_headers, string $csv_file): array
    {
        $headers = [];
        $seen    = [];

        foreach ($raw_headers as $index => $raw_header) {
            $header = $this->normalizeCsvHeader((string) $raw_header);
            if ($header === '') {
                $headers[] = '';
                continue;
            }

            $root = explode('.', $header, 2)[0];
            if (!$this->isKnownHeaderRoot($root)) {
                echo "[WARN] {$csv_file}: 未知の列 '{$raw_header}' は無視します。\n";
                $headers[] = '';
                continue;
            }

            if (isset($seen[$header])) {
                echo "[WARN] {$csv_file}: 列 '{$header}' が重複しています。後ろの列を使います。\n";
            }

            $seen[$header] = $index;
            $headers[]     = $header;
        }

        return $headers;
    }

    private function normalizeCsvHeader(string $header): string
    {
        $header = trim($header);
        if ($header === '') {
            return '';
        }

        $root = explode('.', $header, 2)[0];
        if (isset($this->acf_field_map[$root])) {
            return 'acf.' . $header;
        }

        return $header;
    }

    private function isKnownHeaderRoot(string $root): bool
    {
        if (in_array($root, self::RESERVED_KEYS, true) || in_array($root, self::POST_KEYS, true)) {
            return true;
        }

        return isset($this->acf_field_map[$root]);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function unflattenCsvRow(array $row): array
    {
        $entry = [];

        foreach ($row as $path => $raw_value) {
            if (!is_string($path) || $path === '') {
                continue;
            }

            $value = $this->normalizeCsvCellValue($path, (string) $raw_value);
            if ($value === '') {
                continue;
            }

            $this->assignNestedValue($entry, $path, $value);
        }

        return $entry;
    }

    private function normalizeCsvCellValue(string $path, string $value): mixed
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        if (str_starts_with($path, 'taxonomies.')) {
            $terms = array_values(array_filter(
                array_map('trim', explode('|', $value)),
                static fn (string $term): bool => $term !== '',
            ));

            if ($terms === []) {
                return '';
            }

            return count($terms) === 1 ? $terms[0] : $terms;
        }

        if ($path === 'menu_order' && is_numeric($value)) {
            return (int) $value;
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $target
     */
    private function assignNestedValue(array &$target, string $path, mixed $value): void
    {
        $parts = explode('.', $path);
        $ref   = &$target;

        foreach ($parts as $index => $part) {
            if ($part === '') {
                return;
            }

            $is_last = $index === array_key_last($parts);
            if ($is_last) {
                $ref[$part] = $value;

                return;
            }

            if (!isset($ref[$part]) || !is_array($ref[$part])) {
                $ref[$part] = [];
            }

            $ref = &$ref[$part];
        }
    }

    /**
     * @param list<string|null> $row
     */
    private function isEmptyCsvRow(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    private function readFileAsUtf8(string $path): string
    {
        $raw = file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException("CSV を読み込めません: {$path}");
        }

        if (str_starts_with($raw, "\xEF\xBB\xBF")) {
            return substr($raw, 3);
        }

        if (!function_exists('mb_convert_encoding')) {
            return $raw;
        }

        if (str_starts_with($raw, "\xFF\xFE")) {
            return mb_convert_encoding(substr($raw, 2), 'UTF-8', 'UTF-16LE');
        }

        if (str_starts_with($raw, "\xFE\xFF")) {
            return mb_convert_encoding(substr($raw, 2), 'UTF-8', 'UTF-16BE');
        }

        if (!function_exists('mb_check_encoding') || mb_check_encoding($raw, 'UTF-8')) {
            return $raw;
        }

        return mb_convert_encoding($raw, 'UTF-8', 'SJIS-win');
    }

    private function getThemeRelativeDir(string $json_file): string
    {
        $theme_dir = trailingslashit(wp_normalize_path(get_template_directory()));
        $json_dir  = wp_normalize_path(dirname($json_file));
        $relative  = ltrim(str_replace($theme_dir, '', trailingslashit($json_dir)), '/');

        return normalize_theme_relative_path($relative);
    }

    /**
     * @param array<string, mixed> $entry
     */
    private function importEntry(
        array $entry,
        string $base_theme_relative_dir,
        string $json_file,
        int $index,
    ): string {
        $external_id = $entry['_external_id'] ?? null;
        if (!is_string($external_id) || $external_id === '') {
            echo "[WARN] {$json_file} の {$index} 件目: _external_id が無いためスキップします。\n";

            return 'skipped';
        }

        $existing_post = $this->getExistingPostByExternalId($external_id);
        if ($existing_post && get_post_meta($existing_post->ID, '_manual_edit', true)) {
            echo "[SKIP] _external_id={$external_id} は手動編集済みのため更新しません（ID: {$existing_post->ID}）。\n";

            return 'skipped';
        }

        $post_args = [
            'post_type' => $this->post_type,
        ];

        foreach (self::POST_KEYS as $key) {
            if (array_key_exists($key, $entry)) {
                $post_args[$key] = $entry[$key];
            }
        }

        if ($existing_post) {
            $post_args['ID'] = $existing_post->ID;
            $post_id         = wp_update_post($post_args, true);
            $action          = '更新';
        } else {
            if (!isset($post_args['post_status'])) {
                $post_args['post_status'] = 'publish';
            }
            $post_id = wp_insert_post($post_args, true);
            $action  = '作成';
        }

        if (is_wp_error($post_id)) {
            echo "[ERROR] _external_id={$external_id}: {$post_id->get_error_message()}\n";

            return 'skipped';
        }

        update_post_meta($post_id, '_external_id', $external_id);

        $thumbnail = $entry['_thumbnail'] ?? null;
        if (is_string($thumbnail) && $thumbnail !== '') {
            $this->setThumbnail($post_id, $thumbnail, $base_theme_relative_dir);
        }

        $acf_values = $entry['acf'] ?? [];
        if (is_array($acf_values)) {
            $this->applyAcfValues($post_id, $acf_values, $base_theme_relative_dir);
        }

        $taxonomies = $entry['taxonomies'] ?? [];
        if (is_array($taxonomies)) {
            $this->applyTaxonomies($post_id, $taxonomies);
        }

        echo "[OK] {$action}しました: _external_id={$external_id} / post_id={$post_id}\n";

        return 'imported';
    }

    private function setThumbnail(int $post_id, string $path, string $base_theme_relative_dir): void
    {
        $supports = Post::getPostTypeSettings($this->post_type)['supports'] ?? [];
        if (!is_array($supports) || !in_array('thumbnail', $supports, true)) {
            return;
        }

        $theme_relative_path = resolve_theme_relative_path_from_base(
            $base_theme_relative_dir,
            $path,
        );
        if ($theme_relative_path === '') {
            return;
        }

        $attachment_id = attach_theme_image_to_media($theme_relative_path, $post_id);
        if ($attachment_id) {
            set_post_thumbnail($post_id, $attachment_id);
        }
    }

    /**
     * @param array<string, mixed> $acf_values
     */
    private function applyAcfValues(
        int $post_id,
        array $acf_values,
        string $base_theme_relative_dir,
    ): void {
        if (!function_exists('update_field')) {
            return;
        }

        foreach ($acf_values as $field_key => $value) {
            if (!is_string($field_key) || $field_key === '') {
                continue;
            }

            $field_def = $this->acf_field_map[$field_key] ?? null;
            if (is_array($field_def)) {
                $value = resolve_acf_import_value(
                    $value,
                    $field_def,
                    $post_id,
                    $base_theme_relative_dir,
                );
            }

            update_field($field_key, $value, $post_id);
        }
    }

    /**
     * @param array<string, mixed> $taxonomies
     */
    private function applyTaxonomies(int $post_id, array $taxonomies): void
    {
        foreach ($taxonomies as $taxonomy => $terms) {
            if (!is_string($taxonomy) || $taxonomy === '' || $terms === null || $terms === '') {
                continue;
            }

            wp_set_object_terms($post_id, $terms, $taxonomy);
        }
    }

    private function getExistingPostByExternalId(string $external_id): ?WP_Post
    {
        $query = new WP_Query([
            'post_type'      => $this->post_type,
            'posts_per_page' => 1,
            'post_status'    => ['publish', 'draft', 'private', 'pending', 'future'],
            'meta_query'     => [
                [
                    'key'   => '_external_id',
                    'value' => $external_id,
                ],
            ],
            'fields'        => 'ids',
            'no_found_rows' => true,
        ]);

        if (!$query->have_posts()) {
            return null;
        }

        return get_post((int) $query->posts[0]);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function buildAcfFieldMap(): array
    {
        $fields = AcfField::getField($this->post_type) ?? [];
        $map    = [];

        foreach ($fields as $field) {
            $slug = $field['slug'] ?? '';
            if ($slug === '') {
                continue;
            }

            $map[$slug] = $field;
        }

        return $map;
    }
}
