<?php

/***************************************************
    CF7セットアップ
 *
 * - cf7.php の CONTACT_FORMS（フォーム本文・mail / mail_2）を DB へ反映
 * - モードは UDS_CF7_CODE_SYNC_DEV_MODE（config.php）で切替
 *   - true  : コード制御モード — コード定義のみ DB に反映（コード外は削除）
 *   - false : 配信モード — コードからの登録・更新・削除を行わない
 ****************************************************/
require_once __DIR__ . '/../code-sync-dev-mode.php';
require_once __DIR__ . '/../../../config/plugins/cf7/cf7.php';

/**
 * タイトルで CF7 の投稿IDを取得（WP_Query の title 引数はWPバージョンで未対応のことがあるため $wpdb で確定させる）
 *
 * @param string $title フォームタイトル（投稿タイトルと一致）
 * @return int 0 のときは未検出
 */
function uds_cf7_find_form_post_id_by_title($title)
{
    global $wpdb;

    $title = (string) $title;
    if ($title === '') {
        return 0;
    }

    $id = (int) $wpdb->get_var(
        $wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts}
            WHERE post_type = %s
            AND post_status != 'trash'
            AND post_title = %s
            ORDER BY ID ASC
            LIMIT 1",
            'wpcf7_contact_form',
            $title
        )
    );

    return $id > 0 ? $id : 0;
}

/**
 * コード定義（CONTACT_FORMS）に含まれるフォームタイトル一覧
 *
 * @return array<string>
 */
function uds_cf7_get_managed_form_titles(): array
{
    $titles = [];
    foreach (CONTACT_FORMS as $form) {
        if (!empty($form['title'])) {
            $titles[] = (string) $form['title'];
        }
    }

    return array_values(array_unique($titles));
}

/**
 * コード定義に無い CF7 フォーム（および同一タイトルの重複）を削除
 *
 * @return int 削除件数
 */
function uds_cf7_delete_unmanaged_contact_forms(): int
{
    global $wpdb;

    $managed_titles = uds_cf7_get_managed_form_titles();
    if ($managed_titles === []) {
        return 0;
    }

    $keep_ids = [];
    foreach ($managed_titles as $title) {
        $id = uds_cf7_find_form_post_id_by_title($title);
        if ($id > 0) {
            $keep_ids[] = $id;
        }
    }
    $keep_ids = array_values(array_unique($keep_ids));

    $all_ids = $wpdb->get_col(
        $wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts}
            WHERE post_type = %s
            AND post_status != 'trash'",
            'wpcf7_contact_form'
        )
    );

    if (!is_array($all_ids) || $all_ids === []) {
        WPCF7_ContactForm::get_instance(0);

        return 0;
    }

    $deleted = 0;
    foreach ($all_ids as $id) {
        $id = (int) $id;
        if (in_array($id, $keep_ids, true)) {
            continue;
        }

        $contact_form = WPCF7_ContactForm::get_instance($id);
        if ($contact_form && method_exists($contact_form, 'delete') && $contact_form->delete()) {
            ++$deleted;
            continue;
        }

        if (wp_delete_post($id, true)) {
            ++$deleted;
        }
    }

    WPCF7_ContactForm::get_instance(0);

    return $deleted;
}

/**
 * CONTACT_FORMS をDBへ反映
 *
 * @param bool $overwrite_existing true: 既存フォームを上書き / false: 既存フォームは維持
 * @return void
 */
function uds_cf7_sync_contact_forms_from_code($overwrite_existing = true)
{
    foreach (CONTACT_FORMS as $form) {
        $form_id = uds_cf7_find_form_post_id_by_title($form['title']);

        if ($form_id > 0) {
            if (!$overwrite_existing) {
                continue;
            }
            $contact_form = WPCF7_ContactForm::get_instance($form_id);
            if ($contact_form) {
                $properties         = $contact_form->get_properties();
                $properties['form'] = $form['form'];
                if (isset($form['mail']) && is_array($form['mail'])) {
                    $properties['mail'] = $form['mail'];
                }
                if (isset($form['mail_2']) && is_array($form['mail_2'])) {
                    $properties['mail_2'] = $form['mail_2'];
                }
                $contact_form->set_properties($properties);
                $contact_form->save();
            }
        } else {
            $properties = [
                'title'  => $form['title'],
                'form'   => $form['form'],
                'locale' => determine_locale(),
            ];
            if (isset($form['mail']) && is_array($form['mail'])) {
                $properties['mail'] = $form['mail'];
            }
            if (isset($form['mail_2']) && is_array($form['mail_2'])) {
                $properties['mail_2'] = $form['mail_2'];
            }

            if (function_exists('wpcf7_save_contact_form')) {
                wpcf7_save_contact_form($properties);
                continue;
            }

            // CF7のバージョン差異で helper 関数が無い場合のフォールバック
            if (method_exists('WPCF7_ContactForm', 'get_template')) {
                $contact_form = WPCF7_ContactForm::get_template();
                if ($contact_form instanceof WPCF7_ContactForm) {
                    $contact_form->set_properties($properties);
                    $contact_form->save();
                }
            }
        }
    }

    if ($overwrite_existing) {
        uds_cf7_delete_unmanaged_contact_forms();
    }

    // get_instance() / get_template() が static $current を更新するため、
    // 同期後はクリアしないと CF7 管理画面の一覧が最後のフォーム編集画面になる
    WPCF7_ContactForm::get_instance(0);
}

/**
 * CF7 初期化時: モードに応じて同期
 *
 * @return void
 */
function cf7_setup()
{
    if (!class_exists('WPCF7_ContactForm')) {
        return;
    }

    if (!uds_cf7_is_code_sync_dev_mode()) {
        return;
    }

    uds_cf7_sync_contact_forms_from_code(true);
}

add_action('wpcf7_init', 'cf7_setup');
