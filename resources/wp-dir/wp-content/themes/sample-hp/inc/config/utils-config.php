<?php

/************************************************
 * utils関連で使用する定数
 *************************************************/
/***********************************
 * render-img
 /********************************* */
 // ブレイクポイント
const BREAKPOINT_SP = 767;
const BREAKPOINT_PC = BREAKPOINT_SP + 1;

// 画像ファイル末尾サフィックス
const IMAGE_SUFFIX_SP = '_sp'; // pcファーストの場合、render-imgでspを指定した場合に、末尾に「_sp」が付くファイル名を読み込む
const IMAGE_SUFFIX_PC = '_pc'; // spファーストの場合、render-imgでpcを指定した場合に、末尾に「_pc」が付くファイル名を読み込む
// 画像パス（公開URLのベースは IMAGE_BASE_URI。テーマ直下は functions.php で define）
const IMAGE_DIR_WEBP        = 'webp';
const IMAGE_DIR_AVIF        = 'avif';
const IMAGE_DIR_COMPRESSION = 'compression';
// AVIF対応するか true:する
const RENDER_IMG_ENABLE_AVIF = true;

// SVG（インライン出力用）
const IMAGE_DIR_SVG = 'svg';
