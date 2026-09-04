<?php

/***************************************************
 * CF7 スパム対策（reCAPTCHA 非依存）
 *
 * - ハニーポット: 非表示フィールドへの入力を拒否
 * - 送信時間チェック: 表示直後の即時送信を拒否
 ****************************************************/

/** 送信までに必要な最低秒数 */
const UDS_CF7_SPAM_MIN_SECONDS = 3;

/**
 * ハニーポット・送信時間でスパム判定
 *
 * @param bool              $spam
 * @param WPCF7_Submission  $submission
 * @return bool
 */
function uds_cf7_spam_protection_check($spam, $submission)
{
    if ($spam || !($submission instanceof WPCF7_Submission)) {
        return $spam;
    }

    $posted = $submission->get_posted_data();
    if (!is_array($posted)) {
        return $spam;
    }

    $honeypot = isset($posted['uds-honeypot']) ? trim((string) $posted['uds-honeypot']) : '';
    if ($honeypot !== '') {
        $submission->add_spam_log([
            'agent'  => 'uds_spam_protection',
            'reason' => 'Honeypot field was filled.',
        ]);

        return true;
    }

    $loaded_at = isset($posted['uds-form-time']) ? (int) $posted['uds-form-time'] : 0;
    if ($loaded_at > 0) {
        $elapsed = time() - $loaded_at;
        if ($elapsed < UDS_CF7_SPAM_MIN_SECONDS) {
            $submission->add_spam_log([
                'agent'  => 'uds_spam_protection',
                'reason' => sprintf('Form submitted too quickly (%d seconds).', $elapsed),
            ]);

            return true;
        }
    }

    return $spam;
}

add_filter('wpcf7_spam', 'uds_cf7_spam_protection_check', 10, 2);
