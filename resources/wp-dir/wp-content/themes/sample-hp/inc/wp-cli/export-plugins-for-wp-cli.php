<?php

/***************************************************
 * wp-plugin.sh 向けに plugins.php の行を標準出力する
 ****************************************************/
$plugins = require __DIR__ . '/../config/plugins.php';
foreach ($plugins as $entry) {
    echo $entry, PHP_EOL;
}
