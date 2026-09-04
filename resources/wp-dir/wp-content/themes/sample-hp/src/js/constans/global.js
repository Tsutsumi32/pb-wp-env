/************************************************************
 * global グローバル定数
 ************************************************************/
// ----------------------------------------------------------
// 環境
// ----------------------------------------------------------
// production or develop（判定処理は config/resolveAppMode.js）
export { MODE } from '../config/resolveAppMode.js';

// ----------------------------------------------------------
// data属性
// ----------------------------------------------------------
/**
 * 決まった命名の data 属性（data-module / data-page / data-action）
 * - モジュールルート・ページルート・イベントトリガーで共通利用
 */
export const DATA_ATTR = Object.freeze({
  /** モジュールルート */
  MODULE: 'data-module',
  /** ページルート（body 等） */
  PAGE: 'data-page',
  /** イベントトリガー（委譲対象） */
  ACTION: 'data-action',
  /** 機能の適用対象（features） */
  FEATURE: 'data-feature',
});

// ----------------------------------------------------------
// クラス
// ----------------------------------------------------------
/**
 * 状態変化に伴うクラス（CSS側でも使用すること。このオブジェクトから参照する）
 * - JS・CSS 双方で状態クラスはここに集約し、一貫して使用する
 */
export const STATE_CLASSES = Object.freeze({
  /** アクティブ（開いている・選択中 等） */
  ACTIVE: 'is_active',
  /** 非アクティブ（無効化） */
  DISABLED: 'is_disabled',
  /** 表示 */
  VISIBLE: 'is_visible',
  /** 非表示 */
  HIDDEN: 'is_hidden',
  /** プラグインの初期化完了状態 */
  CLASS_PLUGIN_READY: 'is_pluginReady',
  /** DOMContentLoaded 後（body に付与） */
  DOM_LOADED: 'is_domLoaded',
  /** window load 後（body に付与） */
  WINDOW_LOADED: 'is_windowLoaded',
  /** 遷移直前（MPA の document 離脱トランジション用・body に付与） */
  PAGE_UNMOUNT: 'is_unMount',
  /** セッション内の再訪問（2回目以降の表示） */
  REVISIT_CLASS: 'is_alreadyVisit',
});

// ----------------------------------------------------------
// sessionStorage キー
// ----------------------------------------------------------
/**
 * セッション内のページ表示回数（2 回目以降で is_alreadyVisit を付与）
 * ※ header.php のインライン script と同じキー（変更時は双方を合わせる）
 */
export const VISIT_COUNT_KEY = 'already_visited_app_count';

// ----------------------------------------------------------
// CSS カスタムプロパティ（SCSS の :root 変数名と揃える）
// ----------------------------------------------------------
export const CSS_VARS = Object.freeze({
  /** スクロールバー幅（JS で実測値に更新。JS 無効時は SCSS フォールバック） */
  SCROLLBAR_WIDTH: '--scrollbar-width',
  /** スクロールバー除外幅の 1%（JS で実測値に更新） */
  VIEWPORT_UNIT: '--viewport-unit',
});

// ----------------------------------------------------------
// ブレイクポイント（PCファースト・SCSS の $breakpoints と揃える (未満で判定)）
// ----------------------------------------------------------
export const BREAKPOINTS = Object.freeze({
  TAB: 1200,
  SP: 768,
  SP_S: 570
});
