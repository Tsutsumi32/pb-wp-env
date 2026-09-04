<?php

/***************************************************
 * CF7 フォーム枝分け（formBranchToggle）設定
 *
 * フロントの data-form-branch / data-form-branch-control と対応させる。
 * 非表示枝の disabled 入力が未送信になると、CF7 の SWV（特に [radio] 必須）で
 * validation_failed になるため、inactive 時の SWV 回避・メール除外をここで管理する。
 *
 * 構成:
 * - control … 枝分け基準の input name（data-form-branch-control と同じ）
 * - fields  … CF7 フィールド name をキーに、表示・検証・SWV 補完を定義
 *   - branches        : このフィールドが有効な control の value（data-form-branch と同じ文字列）
 *   - swv_placeholder : inactive かつ未送信時、$_POST に入れる値（CF7 SWV 通過用。選択肢の1つであること）
 *   - clear_posted    : inactive 時、posted_data を空にしてメール（exclude_blank）から除外
 ***************************************************/

define('CFT_FORM_BRANCH', [
    'control' => 'your-inquiry-type',
    'fields'  => [
        // --- お問い合わせ専用 ---
        'your-company' => [
            'branches' => ['お問い合わせ'],
        ],
        'your-message' => [
            'branches' => ['お問い合わせ'],
        ],

        // --- 採用エントリー専用 ---
        // [radio] は CF7 が常に必須扱い → 他種別選択時は SWV 用プレースホルダが必要
        'entry-type' => [
            'branches'        => ['採用エントリー'],
            'swv_placeholder' => '現場代理人',
            'clear_posted'    => true,
        ],
        'entry-remarks' => [
            'branches'     => ['採用エントリー'],
            'clear_posted' => true,
        ],
        'resume-file' => [
            'branches' => ['採用エントリー'],
        ],
        'work-history-file' => [
            'branches' => ['採用エントリー'],
        ],
    ],
]);

/**
 * 枝分け設定を取得
 *
 * @return array{control: string, fields: array<string, array<string, mixed>>}
 */
function cft_get_form_branch_config(): array
{
    if (!defined('CFT_FORM_BRANCH') || !is_array(CFT_FORM_BRANCH)) {
        return ['control' => '', 'fields' => []];
    }

    return CFT_FORM_BRANCH;
}

/**
 * 枝分けコントロールの現在値（$_POST）
 *
 * @return string
 */
function cft_get_branch_control_value(): string
{
    $config  = cft_get_form_branch_config();
    $control = isset($config['control']) ? (string) $config['control'] : '';
    if ($control === '') {
        return '';
    }

    return isset($_POST[$control]) ? trim((string) $_POST[$control]) : '';
}

/**
 * お問い合わせ種別を取得（後方互換）
 *
 * @return string
 */
function cft_get_inquiry_type()
{
    return cft_get_branch_control_value();
}

/**
 * 採用エントリーかどうか（後方互換）
 *
 * @return bool
 */
function cft_is_recruit_entry()
{
    return cft_get_inquiry_type() === '採用エントリー';
}

/**
 * 指定フィールドが現在の種別で有効か
 * 設定に無いフィールドは常に有効とみなす
 *
 * @param string $field_name CF7 フィールド name
 * @return bool
 */
function cft_is_branch_field_active(string $field_name): bool
{
    $config = cft_get_form_branch_config();
    $fields = isset($config['fields']) && is_array($config['fields']) ? $config['fields'] : [];

    if (!isset($fields[$field_name]) || !is_array($fields[$field_name])) {
        return true;
    }

    $branches = isset($fields[$field_name]['branches'])
        ? (array) $fields[$field_name]['branches']
        : [];

    if ($branches === []) {
        return true;
    }

    return in_array(cft_get_branch_control_value(), $branches, true);
}

/**
 * $_POST 値が空かどうか
 *
 * @param mixed $value
 * @return bool
 */
function cft_is_posted_value_empty($value): bool
{
    if ($value === null || $value === '' || $value === []) {
        return true;
    }

    if (is_array($value)) {
        foreach ($value as $item) {
            if (trim((string) $item) !== '') {
                return false;
            }
        }

        return true;
    }

    return trim((string) $value) === '';
}

/**
 * inactive 枝の CF7 必須相当フィールドを SWV 用に補完し、メール用 posted_data を整える
 *
 * formBranchToggle が非表示枝を disabled にするため未送信になるケースを吸収する。
 *
 * @param array $posted_data
 * @return array
 */
function cft_fill_inactive_branch_fields($posted_data)
{
    if (!is_array($posted_data)) {
        return $posted_data;
    }

    $config = cft_get_form_branch_config();
    $fields = isset($config['fields']) && is_array($config['fields']) ? $config['fields'] : [];
    if ($fields === [] || cft_get_branch_control_value() === '') {
        return $posted_data;
    }

    foreach ($fields as $name => $field_config) {
        if (!is_string($name) || $name === '' || !is_array($field_config)) {
            continue;
        }

        if (cft_is_branch_field_active($name)) {
            continue;
        }

        $placeholder = $field_config['swv_placeholder'] ?? null;
        if ($placeholder !== null && $placeholder !== '') {
            $posted = isset($_POST[$name]) ? $_POST[$name] : '';
            if (cft_is_posted_value_empty($posted)) {
                $_POST[$name] = $placeholder;
            }
        }

        if (!empty($field_config['clear_posted'])) {
            $posted_data[$name] = '';
        }
    }

    return $posted_data;
}

add_filter('wpcf7_posted_data', 'cft_fill_inactive_branch_fields', 10, 1);
