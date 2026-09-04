<?php

/************************************************
 * Contact Form 7 フォーム定義
 * 管理画面で実装する際には、このタグを設定し、
 * 画面側の取得処理を変更すれば対応可
 *************************************************/
// 完了画面URL
$url_thanks = get_page_url(Page::CONTACT_THANKS);
$icon_upload_url = get_template_directory_uri() . '/assets/images/svg/icon_upload.svg';

ob_start();
require get_template_directory() . '/modules/privacy-policy.php';
$privacy_policy_html = ob_get_clean();

$prefecture_options = '"都道府県"';
$prefectures        = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];
foreach ($prefectures as $prefecture) {
    $prefecture_options .= ' "' . $prefecture . '"';
}

// cf7定義
// titleは読み込み側との突合
define('CONTACT_FORM_GENERAL', [
    'title' => 'お問い合わせ',
    'form'  => '
<div class="bl_form h-adr" data-feature="formValidator" data-form-validator-form="contact">
    <span class="p-country-name" hidden>Japan</span>

    <p class="bl_form_sendValidateError" data-form-validator-server-error style="display:none;">エラーが発生しました。<br>入力内容を修正し、再度送信を行ってください。</p>

    <div class="bl_form_inputWrap" data-form-validator-input="inquiry-type" data-form-validator-validate="require" data-form-validator-label="お問い合わせ種別" data-bookmarklet-input="radio">
        <div class="bl_form_headWrap">
            <span class="bl_form_head">お問い合わせ種別<span class="bl_form_req" aria-hidden="true">必須</span></span>
        </div>
        <div class="bl_form_inputInner __radio">
            <div class="bl_form_radioWrap">
                [radio your-inquiry-type default:1 use_label_element "お問い合わせ" "採用エントリー"]
            </div>
            <p class="bl_form_validate" data-form-validator-err="inquiry-type" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-branch="採用エントリー" hidden data-form-validator-inactive="true" data-form-validator-input="entry-type" data-form-validator-validate="require" data-form-validator-label="エントリー種別" data-bookmarklet-input="radio">
        <div class="bl_form_headWrap">
            <span class="bl_form_head">エントリー種別<span class="bl_form_req" aria-hidden="true">必須</span></span>
        </div>
        <div class="bl_form_inputInner __radio">
            <div class="bl_form_radioWrap">
                [radio entry-type default:1 use_label_element "現場代理人" "電気工事士" "精算課"]
            </div>
            <p class="bl_form_validate" data-form-validator-err="entry-type" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-validator-input="name" data-form-validator-validate="require maxLength" data-form-validator-max="60" data-form-validator-label="お名前" data-bookmarklet-input="name">
        <div class="bl_form_headWrap">
            <label class="bl_form_head" for="txtName">お名前<span class="bl_form_req" aria-hidden="true">必須</span></label>
        </div>
        <div class="bl_form_inputInner">
            [text* your-name class:el_input id:txtName placeholder "例）山田　太郎"]
            <p class="bl_form_validate" data-form-validator-err="name" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-validator-input="furigana" data-form-validator-validate="require hiragana maxLength" data-form-validator-max="60" data-form-validator-label="ふりがな" data-bookmarklet-input="hiragana">
        <div class="bl_form_headWrap">
            <label class="bl_form_head" for="txtFurigana">ふりがな<span class="bl_form_req" aria-hidden="true">必須</span></label>
        </div>
        <div class="bl_form_inputInner">
            [text* your-furigana class:el_input id:txtFurigana placeholder "例）やまだ　たろう"]
            <p class="bl_form_validate" data-form-validator-err="furigana" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-branch="お問い合わせ" data-form-validator-input="company" data-form-validator-validate="require maxLength" data-form-validator-max="60" data-form-validator-label="貴社名" data-bookmarklet-input="text">
        <div class="bl_form_headWrap">
            <label class="bl_form_head" for="txtCompany">貴社名<span class="bl_form_req" aria-hidden="true">必須</span></label>
        </div>
        <div class="bl_form_inputInner">
            [text your-company class:el_input id:txtCompany placeholder "例）牧野電設株式会社"]
            <p class="bl_form_validate" data-form-validator-err="company" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-validator-input="email" data-form-validator-validate="require email" data-form-validator-label="メールアドレス" data-bookmarklet-input="email">
        <div class="bl_form_headWrap">
            <label class="bl_form_head" for="txtMail">メールアドレス<span class="bl_form_req" aria-hidden="true">必須</span></label>
        </div>
        <div class="bl_form_inputInner">
            [email* your-email class:el_input id:txtMail placeholder "例）example@example.com"]
            <p class="bl_form_validate" data-form-validator-err="email" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-validator-input="tel" data-form-validator-validate="tel" data-form-validator-label="電話番号" data-bookmarklet-input="tel">
        <div class="bl_form_headWrap">
            <label class="bl_form_head" for="txtTel">電話番号<span class="bl_form_opt" aria-hidden="true">任意</span></label>
        </div>
        <div class="bl_form_inputInner">
            [tel your-tel class:el_input id:txtTel placeholder "例）09012345678"]
            <p class="bl_form_validate" data-form-validator-err="tel" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_inputWrap">
        <div class="bl_form_headWrap">
            <span class="bl_form_head">住所<span class="bl_form_req" aria-hidden="true">必須</span></span>
        </div>
        <div class="bl_form_inputInner">
            <div class="bl_form_addressGrid">
                <div class="bl_form_addressCell">
                    <div class="bl_form_inputInner" data-form-validator-input="zip" data-form-validator-validate="require zip" data-form-validator-label="郵便番号" data-form-validator-err-group="address" data-bookmarklet-input="zip">
                        [text* your-zip class:el_input class:p-postal-code id:txtZip placeholder "〒000-0000"]
                    </div>
                </div>
                <div class="bl_form_addressCell">
                    <div
                        class="bl_form_inputInner"
                        data-form-validator-input="prefecture"
                        data-form-validator-validate="require"
                        data-form-validator-label="都道府県"
                        data-form-validator-err-group="address"
                        data-bookmarklet-input="prefecture">
                        [select your-prefecture first_as_label class:el_select2 class:p-region data-feature:selectActiveState id:txtPrefecture ' . $prefecture_options . ']
                    </div>
                </div>
                <div class="bl_form_addressCell __full">
                    <div class="bl_form_inputInner" data-form-validator-input="address" data-form-validator-validate="require maxLength" data-form-validator-max="120" data-form-validator-label="市区町村・番地・建物名" data-form-validator-err-group="address" data-bookmarklet-input="city">
                        [text* your-address class:el_input class:p-locality id:txtAddress placeholder "市町村・番地・建物名"]
                    </div>
                </div>
            </div>
            <div class="bl_form_validate __group" data-form-validator-err-group-area="address" role="alert"></div>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-branch="お問い合わせ" data-form-validator-input="area" data-form-validator-validate="require maxLength" data-form-validator-max="1000" data-form-validator-label="お問い合わせ内容" data-bookmarklet-input="text">
        <div class="bl_form_headWrap">
            <label class="bl_form_head" for="areaContent">お問い合わせ内容<span class="bl_form_req" aria-hidden="true">必須</span></label>
        </div>
        <div class="bl_form_inputInner">
            [textarea your-message class:el_input class:el_input__area id:areaContent placeholder "お問い合わせ内容をご記入ください"]
            <p class="bl_form_validate" data-form-validator-err="area" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-branch="採用エントリー" hidden data-form-validator-inactive="true">
        <div class="bl_form_headWrap">
            <span class="bl_form_head">履歴書<span class="bl_form_req" aria-hidden="true">必須</span></span>
        </div>
        <div class="bl_form_inputInner">
            <div class="el_fileUploader" data-feature="formFileDrop" data-form-validator-input="resume" data-form-validator-validate="require file" data-form-validator-max-size="10" data-form-validator-label="履歴書" data-bookmarklet-input="file">
                <div class="el_fileUploader_inner" data-form-validator-file-wrapper>
                    <div class="el_fileUploader_content">
                        <span class="el_fileUploader_icon" aria-hidden="true">
                            <img src="' . esc_url($icon_upload_url) . '" alt="" width="24" height="24" decoding="async">
                        </span>
                        <p class="el_fileUploader_lead">ファイルをドラッグ&amp;ドロップ<br>またはクリックして選択</p>
                        <p class="el_fileUploader_note">PDF / Excel / Word</p>
                    </div>
                    [file resume-file limit:10mb filetypes:pdf|xlsx|xls|docx|doc]
                </div>
                <p class="bl_form_validate" data-form-validator-err="resume" role="alert"></p>
            </div>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-branch="採用エントリー" hidden data-form-validator-inactive="true">
        <div class="bl_form_headWrap">
            <span class="bl_form_head">職務経歴書<span class="bl_form_opt" aria-hidden="true">任意</span></span>
        </div>
        <div class="bl_form_inputInner">
            <div class="el_fileUploader" data-feature="formFileDrop" data-form-validator-input="work-history" data-form-validator-validate="file" data-form-validator-max-size="10" data-form-validator-label="職務経歴書" data-bookmarklet-input="file">
                <div class="el_fileUploader_inner" data-form-validator-file-wrapper>
                    <div class="el_fileUploader_content">
                        <span class="el_fileUploader_icon" aria-hidden="true">
                            <img src="' . esc_url($icon_upload_url) . '" alt="" width="24" height="24" decoding="async">
                        </span>
                        <p class="el_fileUploader_lead">ファイルをドラッグ&amp;ドロップ<br>またはクリックして選択</p>
                        <p class="el_fileUploader_note">PDF / Excel / Word</p>
                    </div>
                    [file work-history-file limit:10mb filetypes:pdf|xlsx|xls|docx|doc]
                </div>
                <p class="bl_form_validate" data-form-validator-err="work-history" role="alert"></p>
            </div>
        </div>
    </div>

    <div class="bl_form_inputWrap" data-form-branch="採用エントリー" hidden data-form-validator-inactive="true" data-form-validator-input="remarks" data-form-validator-validate="maxLength" data-form-validator-max="1000" data-form-validator-label="備考" data-bookmarklet-input="text">
        <div class="bl_form_headWrap">
            <label class="bl_form_head" for="areaRemarks">備考<span class="bl_form_opt" aria-hidden="true">任意</span></label>
        </div>
        <div class="bl_form_inputInner">
            [textarea entry-remarks class:el_input class:el_input__area id:areaRemarks placeholder "お伝えしたい事項等があればご記入ください"]
            <p class="bl_form_validate" data-form-validator-err="remarks" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_policyBlock">
        <div class="bl_form_inputWrap">
            <div class="bl_form_headWrap">
                <span class="bl_form_head">プライバシーポリシー</span>
            </div>
            <div class="bl_form_inputInner">
                <div class="bl_form_policyWrap bl_privacyPolicy">
                    ' . $privacy_policy_html . '
                </div>
            </div>
        </div>
        <div class="bl_form_policyAgree" data-form-validator-input="privacy" data-form-validator-validate="requireCheck" data-form-validator-label="プライバシーポリシーへの同意" data-bookmarklet-input="checkbox">
            <div class="bl_form_policyAgreeRow">
                [checkbox agree use_label_element "1"]
                <p class="bl_form_policyAgreeText">プライバシーポリシーに同意する</p>
            </div>
            <p class="bl_form_validate" data-form-validator-err="privacy" role="alert"></p>
        </div>
    </div>

    <div class="bl_form_btnWrap">
        <button type="button" class="el_button __fit" data-action="formValidator.submit">
            <span class="el_button_text">確認へ</span>
        </button>
    </div>

    <div class="bl_form_btn bl_form_btn__submit" hidden>
        [submit "送信"]
    </div>
</div>

<script>
document.addEventListener("wpcf7mailsent", function () {
    location = "' . $url_thanks . '";
}, false);
</script>
',
    /** メール設定（2は自動返信。採用エントリー時は cft-mail.php で差し替え） */
    'mail'   => cft_get_cf7_mail_template('inquiry', 'admin'),
    'mail_2' => cft_get_cf7_mail_template('inquiry', 'user'),
]);

// Contact Form 7 フォーム設定配列
const CONTACT_FORMS = [CONTACT_FORM_GENERAL];
