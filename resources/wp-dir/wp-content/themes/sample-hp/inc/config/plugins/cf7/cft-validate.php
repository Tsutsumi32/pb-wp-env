<?php

/***************************************************
 * Contact Form 7 サーバー側バリデーション
 * formValidator.js（フロント）とルール・文言を揃えること
 *
 * 種別出し分け・inactive 時の SWV 補完は cft-branches.php を参照。
 * フィールド検証のスキップ判定は cft_is_branch_field_active() を使う。
 ***************************************************/

/**
 * メール形式（formValidator.js の validateEMail と同一正規表現）
 *
 * @param string $value
 * @return bool
 */
function cft_valid_email_format($value)
{
    $pattern = '/^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/';

    return (bool) preg_match($pattern, $value);
}

/**
 * 電話・FAX形式（formValidator.js の validateTel と同一）
 *
 * @param string $value
 * @return bool
 */
function cft_valid_tel_format($value)
{
    return (bool) preg_match('/^(\d{2,4}-?\d{2,4}-?\d{4})$/', $value);
}

/**
 * 郵便番号形式（formValidator.js の validateZip と同一）
 *
 * @param string $value
 * @return bool
 */
function cft_valid_zip_format($value)
{
    return (bool) preg_match('/^\d{3}-?\d{4}$/', $value);
}

/**
 * 全角カタカナ（formValidator.js の validateKatakana と同一）
 *
 * @param string $value
 * @return bool
 */
function cft_valid_katakana($value)
{
    return (bool) preg_match('/^[ァ-ヶー　]+$/u', $value);
}

/**
 * 全角ひらがな（formValidator.js の validateHiragana と同一）
 *
 * @param string $value
 * @return bool
 */
function cft_valid_hiragana($value)
{
    return (bool) preg_match('/^[ぁ-んー　]+$/u', $value);
}

/**
 * [text] 系フィールド
 *
 * @param WPCF7_Validation $result
 * @param array|string     $tag
 * @return WPCF7_Validation
 */
function cft_validate_input($result, $tag)
{
    $tag  = new WPCF7_FormTag($tag);
    $name = $tag->name;

    $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';

    switch ($name) {
        case 'your-name':
            if ($value === '') {
                $result->invalidate($tag, 'お名前を入力してください。');
            } elseif (mb_strlen($value) > 60) {
                $result->invalidate($tag, 'お名前は60文字以下で入力してください。');
            }
            break;

        case 'your-furigana':
            if ($value === '') {
                $result->invalidate($tag, 'ふりがなを入力してください。');
                break;
            }
            if (mb_strlen($value) > 60) {
                $result->invalidate($tag, 'ふりがなは60文字以下で入力してください。');
                break;
            }
            if (!cft_valid_hiragana($value)) {
                $result->invalidate($tag, '全角ひらがなで入力してください。');
            }
            break;

            /** CF7 例: [text your-hiragana] ＋ data-form-validator-validate="hiragana maxLength"（任意・現状フォーム未使用） */
        case 'your-hiragana':
            if ($value === '') {
                break;
            }
            if (mb_strlen($value) > 60) {
                $result->invalidate($tag, 'ふりがなは60文字以下で入力してください。');
                break;
            }
            if (!cft_valid_hiragana($value)) {
                $result->invalidate($tag, '全角ひらがなで入力してください。');
            }
            break;

        case 'your-company':
            if (!cft_is_branch_field_active($name)) {
                break;
            }
            if ($value === '') {
                $result->invalidate($tag, '貴社名を入力してください。');
            } elseif (mb_strlen($value) > 60) {
                $result->invalidate($tag, '貴社名は60文字以下で入力してください。');
            }
            break;

        case 'your-email':
            if ($value === '') {
                $result->invalidate($tag, 'メールアドレスを入力してください。');
            } elseif (!cft_valid_email_format($value)) {
                $result->invalidate($tag, '有効なメールアドレスを入力してください。');
            }
            break;

        case 'your-email-confirm':
            if ($value === '') {
                $result->invalidate($tag, 'メールアドレス（確認）を入力してください。');
            } elseif (!cft_valid_email_format($value)) {
                $result->invalidate($tag, '有効なメールアドレスを入力してください。');
            } else {
                $email = isset($_POST['your-email']) ? trim((string) $_POST['your-email']) : '';
                if ($email !== $value) {
                    $result->invalidate($tag, 'メールアドレスが一致しません。');
                }
            }
            break;

        case 'your-zip':
            if ($value === '') {
                $result->invalidate($tag, '郵便番号を入力してください。');
                break;
            }
            if (!cft_valid_zip_format($value)) {
                $result->invalidate($tag, '正しい郵便番号を入力してください。');
            }
            break;

        case 'your-prefecture':
            if ($value === '') {
                $result->invalidate($tag, '都道府県を入力してください。');
            } elseif (mb_strlen($value) > 20) {
                $result->invalidate($tag, '都道府県は20文字以下で入力してください。');
            }
            break;

        case 'your-city':
            if ($value === '') {
                break;
            }
            if (mb_strlen($value) > 60) {
                $result->invalidate($tag, '市区町村は60文字以下で入力してください。');
            }
            break;

        case 'your-address2':
            if ($value === '') {
                break;
            }
            if (mb_strlen($value) > 120) {
                $result->invalidate($tag, 'それ以降の住所は120文字以下で入力してください。');
            }
            break;

        case 'your-address':
            if ($value === '') {
                $result->invalidate($tag, '市区町村・番地・建物名を入力してください。');
            } elseif (mb_strlen($value) > 120) {
                $result->invalidate($tag, '市区町村・番地・建物名は120文字以下で入力してください。');
            }
            break;

        case 'your-tel':
            if ($value === '') {
                break;
            }
            if (!cft_valid_tel_format($value)) {
                $result->invalidate($tag, '正しい形式の番号を入力してください。');
            }
            break;

        case 'your-fax':
            if ($value === '') {
                break;
            }
            if (!cft_valid_tel_format($value)) {
                $result->invalidate($tag, '正しい形式の番号を入力してください。');
            }
            break;

        default:
            break;
    }

    return $result;
}

add_filter('wpcf7_validate_text', 'cft_validate_input', 20, 2);
add_filter('wpcf7_validate_email', 'cft_validate_input', 20, 2);
add_filter('wpcf7_validate_tel', 'cft_validate_input', 20, 2);

/**
 * [radio] inquiry-type（お問い合わせ種別）
 *
 * @param WPCF7_Validation $result
 * @param array|string     $tag
 * @return WPCF7_Validation
 */
function cft_validate_radio($result, $tag)
{
    $tag  = new WPCF7_FormTag($tag);
    $name = $tag->name;

    if ('your-inquiry-type' === $name) {
        $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
        if ($value === '') {
            $result->invalidate($tag, 'お問い合わせ種別を選択してください。');
        }

        return $result;
    }

    if ('entry-type' === $name) {
        if (!cft_is_branch_field_active($name)) {
            return $result;
        }

        $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
        if ($value === '') {
            $result->invalidate($tag, 'エントリー種別を選択してください。');
        }

        return $result;
    }

    return $result;
}

add_filter('wpcf7_validate_radio', 'cft_validate_radio', 20, 2);

/**
 * [textarea] your-message（お問い合わせ内容など）
 *
 * @param WPCF7_Validation $result
 * @param array|string     $tag
 * @return WPCF7_Validation
 */
function cft_validate_content($result, $tag)
{
    $tag  = new WPCF7_FormTag($tag);
    $name = $tag->name;

    if ('your-message' === $name) {
        if (!cft_is_branch_field_active($name)) {
            return $result;
        }

        $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';

        if ($value === '') {
            $result->invalidate($tag, 'お問い合わせ内容を入力してください。');
        } elseif (mb_strlen($value) > 1000) {
            $result->invalidate($tag, 'お問い合わせ内容は1000文字以下で入力してください。');
        }

        return $result;
    }

    if ('entry-remarks' === $name) {
        if (!cft_is_branch_field_active($name)) {
            return $result;
        }

        $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
        if ($value !== '' && mb_strlen($value) > 1000) {
            $result->invalidate($tag, '備考は1000文字以下で入力してください。');
        }

        return $result;
    }

    return $result;
}

add_filter('wpcf7_validate_textarea', 'cft_validate_content', 20, 2);

/**
 * [select] location（所在地・都道府県など）
 *
 * @param WPCF7_Validation $result
 * @param array|string     $tag
 * @return WPCF7_Validation
 */
function cft_validate_select($result, $tag)
{
    $tag  = new WPCF7_FormTag($tag);
    $name = $tag->name;

    if ('location' !== $name) {
        return $result;
    }

    $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
    if ($value === '' || $value === '選択してください') {
        $result->invalidate($tag, '所在地（都道府県）を選択してください。');
    }

    return $result;
}

add_filter('wpcf7_validate_select', 'cft_validate_select', 20, 2);

/**
 * 同意チェック（agree）
 *
 * @param WPCF7_Validation $result
 * @param array|string     $tag
 * @return WPCF7_Validation
 */
function cft_validate_acceptance($result, $tag)
{
    $tag = new WPCF7_FormTag($tag);

    if ('agree' !== $tag->name) {
        return $result;
    }

    $value = isset($_POST[$tag->name]) ? $_POST[$tag->name] : '';
    if (empty($value)) {
        $result->invalidate($tag, 'プライバシーポリシーに同意してください。');
    }

    return $result;
}

add_filter('wpcf7_validate_acceptance', 'cft_validate_acceptance', 20, 2);

/**
 * 同意チェック（checkbox agree）
 *
 * @param WPCF7_Validation $result
 * @param array|string     $tag
 * @return WPCF7_Validation
 */
function cft_validate_checkbox_agree($result, $tag)
{
    $tag = new WPCF7_FormTag($tag);

    if ('agree' !== $tag->name) {
        return $result;
    }

    $values = isset($_POST[$tag->name]) ? (array) $_POST[$tag->name] : [];
    if ($values === [] || !in_array('1', $values, true)) {
        $result->invalidate($tag, 'プライバシーポリシーに同意してください。');
    }

    return $result;
}

add_filter('wpcf7_validate_checkbox', 'cft_validate_checkbox_agree', 20, 2);

/**
 * ファイル必須（履歴書・採用エントリー時）
 *
 * @param WPCF7_Validation $result
 * @param array|string     $tag
 * @return WPCF7_Validation
 */
function cft_validate_file_required($result, $tag)
{
    $tag  = new WPCF7_FormTag($tag);
    $name = $tag->name;

    if ('resume-file' !== $name || !cft_is_branch_field_active($name)) {
        return $result;
    }

    $file_name = isset($_FILES[$name]['name']) ? trim((string) $_FILES[$name]['name']) : '';
    if ($file_name === '') {
        $result->invalidate($tag, '履歴書をアップロードしてください。');
    }

    return $result;
}

add_filter('wpcf7_validate_file', 'cft_validate_file_required', 10, 2);

/**
 * ファイル添付（upfile1〜5）: 拡張子・サイズ（formValidator.js の validateFile と揃える）
 *
 * CF7 はアップロード成功後に wpcf7_validate_file を第3引数 uploaded_files 付きで呼ぶ。
 *
 * @param WPCF7_Validation $result
 * @param array|string     $tag
 * @param array|null       $context
 * @return WPCF7_Validation
 */
function cft_validate_file_fields($result, $tag, $context = null)
{
    $tag  = new WPCF7_FormTag($tag);
    $name = $tag->name;

    $targets = ['upfile1', 'upfile2', 'upfile3', 'upfile4', 'upfile5', 'resume-file', 'work-history-file'];
    if (!in_array($name, $targets, true)) {
        return $result;
    }

    $uploaded = (is_array($context) && isset($context['uploaded_files'])) ? $context['uploaded_files'] : null;
    if ($uploaded === null || is_wp_error($uploaded) || !is_array($uploaded) || $uploaded === []) {
        return $result;
    }

    $max_bytes = 10 * 1024 * 1024;
    $allowed   = ['pdf', 'xlsx', 'xls', 'docx', 'doc'];

    foreach ($uploaded as $path) {
        if (!is_string($path) || $path === '' || !is_readable($path)) {
            continue;
        }

        $size = @filesize($path);
        if ($size !== false && (int) $size > $max_bytes) {
            $result->invalidate($tag, '10MB以下のファイルをアップロードしてください。');

            return $result;
        }

        $filename = basename($path);
        $ext      = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if ($ext === '' || !in_array($ext, $allowed, true)) {
            $result->invalidate($tag, 'PDF・Excel・Wordファイルのいずれかを選択してください。');

            return $result;
        }
    }

    return $result;
}

add_filter('wpcf7_validate_file', 'cft_validate_file_fields', 20, 3);

/**
 * CF7標準のファイルアップロード系メッセージを上書き
 *
 * @param array $messages
 * @return array
 */
function cft_override_cf7_file_messages($messages)
{
    if (!is_array($messages)) {
        return $messages;
    }

    if (isset($messages['upload_file_too_large']) && is_array($messages['upload_file_too_large'])) {
        $messages['upload_file_too_large']['default'] = '10MB以下のファイルをアップロードしてください。';
    }

    if (isset($messages['upload_file_type_invalid']) && is_array($messages['upload_file_type_invalid'])) {
        $messages['upload_file_type_invalid']['default'] = 'PDF・Excel・Wordファイルのいずれかを選択してください。';
    }

    if (isset($messages['upload_failed_php_error']) && is_array($messages['upload_failed_php_error'])) {
        $messages['upload_failed_php_error']['default'] = 'アップロード上限を超えています。ファイルサイズをご確認ください。';
    }

    return $messages;
}

add_filter('wpcf7_messages', 'cft_override_cf7_file_messages', 20, 1);
