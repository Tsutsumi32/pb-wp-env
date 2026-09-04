<?php

/***************************************************
 * CF7 メールテンプレート（お問い合わせ / 採用エントリー）
 *
 * お問い合わせ: inquiry テンプレート（cf7.php の初期値）
 * 採用エントリー: entry テンプレート（送信直前に差し替え）
 *
 * 構成:
 * 1. メール共通設定（送信元・宛先・Reply-To）
 * 2. 送信内容ブロック / 自動返信フッター
 * 3. mail / mail_2 テンプレート組み立て
 * 4. 採用エントリー時のテンプレート差し替え
 ***************************************************/

/* ==================================================
 * 1. メール共通設定（ここを編集）
 * ================================================== */

/** 送信元（From）— 管理通知・自動返信共通 */
const CFT_MAIL_SENDER = '[_site_title] <[_site_admin_email]>';

/** 管理通知メール（mail）の送信先 */
const CFT_MAIL_ADMIN_RECIPIENT = '[_site_admin_email]';

/** 管理通知メールの Reply-To（問い合わせ者のメールへ返信しやすくする） */
const CFT_MAIL_ADMIN_REPLY_TO = '[your-email]';

/** 自動返信メール（mail_2）の送信先 */
const CFT_MAIL_USER_RECIPIENT = '[your-email]';

/** 自動返信メールの Reply-To（ユーザーが返信すると管理者へ届く） */
const CFT_MAIL_USER_REPLY_TO = '[_site_admin_email]';

/**
 * Reply-To ヘッダ文字列を組み立てる
 *
 * @param string $address
 * @return string
 */
function cft_mail_reply_to_header(string $address): string
{
    return 'Reply-To: ' . $address . "\n";
}

/* ==================================================
 * 2. 送信内容ブロック / 自動返信フッター
 * ================================================== */

/**
 * 送信内容ブロック（お問い合わせ）
 *
 * @return string
 */
function cft_mail_fields_inquiry(): string
{
    return "お問い合わせ種別: [your-inquiry-type]\n"
        . "お名前: [your-name]\n"
        . "ふりがな: [your-furigana]\n"
        . "貴社名: [your-company]\n"
        . "メールアドレス: [your-email]\n"
        . "電話番号: [your-tel]\n"
        . "郵便番号: [your-zip]\n"
        . "都道府県: [your-prefecture]\n"
        . "住所: [your-address]\n"
        . "お問い合わせ内容:\n[your-message]";
}

/**
 * 送信内容ブロック（採用エントリー）
 *
 * @return string
 */
function cft_mail_fields_entry(): string
{
    return "お問い合わせ種別: [your-inquiry-type]\n"
        . "エントリー種別: [entry-type]\n"
        . "お名前: [your-name]\n"
        . "ふりがな: [your-furigana]\n"
        . "メールアドレス: [your-email]\n"
        . "電話番号: [your-tel]\n"
        . "郵便番号: [your-zip]\n"
        . "都道府県: [your-prefecture]\n"
        . "住所: [your-address]\n"
        . "備考:\n[entry-remarks]";
}

/**
 * 自動返信フッター
 *
 * @return string
 */
function cft_mail_user_footer(): string
{
    return "--\n[_site_title]\n[_site_url]";
}

/* ==================================================
 * 3. mail / mail_2 テンプレート組み立て
 * ================================================== */

/**
 * CF7 mail / mail_2 テンプレートを取得
 *
 * @param 'inquiry'|'entry' $branch
 * @param 'admin'|'user' $audience
 * @return array<string, mixed>
 */
function cft_get_cf7_mail_template(string $branch, string $audience): array
{
    $is_entry = $branch === 'entry';
    $fields  = $is_entry ? cft_mail_fields_entry() : cft_mail_fields_inquiry();

    if ($audience === 'admin') {
        $noun    = $is_entry ? '採用エントリー' : 'お問い合わせ';
        $subject = '【' . $noun . '】[_site_title]';
        $body    = "以下の内容で{$noun}がありました。\n\n"
            . $fields
            . "\n\n"
            . "--\n"
            . 'このメールは [_site_title]（[_site_url]）から送信されました。';

        return [
            'active'             => true,
            'recipient'          => CFT_MAIL_ADMIN_RECIPIENT,
            'sender'             => CFT_MAIL_SENDER,
            'subject'            => $subject,
            'body'               => $body,
            'additional_headers' => cft_mail_reply_to_header(CFT_MAIL_ADMIN_REPLY_TO),
            'attachments'        => $is_entry ? '[resume-file][work-history-file]' : '',
            'use_html'           => false,
            'exclude_blank'      => true,
        ];
    }

    $noun    = $is_entry ? '採用エントリー' : 'お問い合わせ';
    $subject = '【自動返信】' . $noun . 'ありがとうございます';
    $body    = "[your-name] 様\n\n"
        . "このたびは{$noun}いただき、ありがとうございます。\n"
        . "以下の内容で受け付けました。\n\n"
        . $fields
        . "\n\n"
        . "担当者より改めてご連絡いたします。\n\n"
        . cft_mail_user_footer();

    return [
        'active'             => true,
        'recipient'          => CFT_MAIL_USER_RECIPIENT,
        'sender'             => CFT_MAIL_SENDER,
        'subject'            => $subject,
        'body'               => $body,
        'additional_headers' => cft_mail_reply_to_header(CFT_MAIL_USER_REPLY_TO),
        'attachments'        => '',
        'use_html'           => false,
        'exclude_blank'      => true,
    ];
}

/* ==================================================
 * 4. 採用エントリー時のテンプレート差し替え
 * ================================================== */

/**
 * 採用エントリー時は件名・本文をエントリー用に差し替える
 *
 * @param WPCF7_ContactForm $contact_form
 * @return void
 */
function cft_swap_entry_mail_templates($contact_form): void
{
    if (cft_get_branch_control_value() !== '採用エントリー') {
        return;
    }

    if (!($contact_form instanceof WPCF7_ContactForm)) {
        return;
    }

    $properties           = $contact_form->get_properties();
    $properties['mail']   = cft_get_cf7_mail_template('entry', 'admin');
    $properties['mail_2'] = cft_get_cf7_mail_template('entry', 'user');
    $contact_form->set_properties($properties);
}

add_action(
    'wpcf7_before_send_mail',
    static function ($contact_form): void {
        cft_swap_entry_mail_templates($contact_form);
    },
    10,
    1
);
