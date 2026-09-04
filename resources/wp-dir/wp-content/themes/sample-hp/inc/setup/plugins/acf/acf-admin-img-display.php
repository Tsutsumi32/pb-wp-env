<?php

/***************************************************
 * 投稿タイプごとに管理画面の一覧で表示する画像フィールドを定義
 * 通常のサムネイルではなく、ACFのサムネイルを使用するために必要
 ****************************************************/

// 投稿タイプごとに一覧で表示する画像フィールドを設定ファイルから取得
$custom_thumbnail_fields = [];
foreach (AcfField::getAllSettings() as $setting) {
    $post_type           = $setting['post_type'] ?? null;
    $thumbnail_field_key = $setting['thumbnail'] ?? null;
    if (
        is_string($post_type) &&
        $post_type !== '' &&
        is_string($thumbnail_field_key) &&
        $thumbnail_field_key !== ''
    ) {
        $custom_thumbnail_fields[$post_type] = $thumbnail_field_key;
    }
}

// 投稿一覧に「サムネイル」カラムを追加
foreach ($custom_thumbnail_fields as $post_type => $field_key) {
    add_filter("manage_{$post_type}_posts_columns", function ($columns) use ($field_key) {
        $columns[$field_key] = 'サムネイル';
        return $columns;
    });
}

// サムネイルカラムにACF画像を表示
foreach ($custom_thumbnail_fields as $post_type => $field_key) {
    add_action(
        "manage_{$post_type}_posts_custom_column",
        function ($column, $post_id) use ($field_key) {
            if ($column === $field_key) {
                $image = get_field($field_key, $post_id);

                if (is_array($image) && isset($image['ID'])) {
                    echo wp_get_attachment_image($image['ID'], 'thumbnail');
                } elseif (is_numeric($image)) {
                    echo wp_get_attachment_image($image, 'thumbnail');
                } elseif (is_string($image)) {
                    echo '<img src="' . esc_url($image) . '" style="max-width:60px;" />';
                } else {
                    echo '—';
                }
            }
        },
        10,
        2
    );
}
