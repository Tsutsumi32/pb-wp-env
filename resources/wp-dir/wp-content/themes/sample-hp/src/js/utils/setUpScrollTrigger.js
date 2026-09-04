/**
 * スクロールトリガー設定ユーティリティ
 * 指定した要素の範囲内にビューポートまたはターゲットが入ったタイミングで
 * onEnter / onOut コールバックを実行する。
 */

/**
 * 複数のトリガー設定を一括で登録する
 * @param {Array<Object>} configs - setupMultipleTriggerRegions に渡す設定オブジェクトの配列
 */
export const setUpScrollTrigger = (configs) => {
  configs.forEach((config) => {
    setupMultipleTriggerRegions({
      ...config,
    });
  });
};

/**
 * 複数セットの「開始・終了・ターゲット」をまとめてトリガー登録する
 * startSelector で取得した要素の数だけ、それぞれ start〜end の範囲でトリガーを張る
 *
 * @param {string} startSelector - 範囲の開始要素のセレクタ（例: '#start1', '.start'）
 * @param {string|null} endSelector - 範囲の終了要素のセレクタ。null のときは rangeMode: 'after' で start 以降が範囲
 * @param {string} targetSelector - 位置チェックの基準になる要素（mode: 'target' 時）や、範囲内で操作する要素のセレクタ
 * @param {string} mode - 'scroll': ビューポート基準で範囲判定 / 'target': targetEl の位置で範囲判定
 * @param {Object} anchor - 判定に使う「どこの位置」か（position: 'top'|'center'|'bottom', offset: 数値）
 * @param {Object} startAnchor - 開始要素のどの位置を範囲の開始Yにするか
 * @param {Object} endAnchor - 終了要素のどの位置を範囲の終了Yにするか
 * @param {string} rangeMode - 'between': start〜end の間 / 'after': start 以降
 * @param {boolean} once - true: 範囲内に入ったら1回だけ onEnter / false: 範囲外に出たら onOut も発火
 * @param {boolean} onOutWhenFullyAboveViewport - true のとき onOut は「範囲外」ではなく「要素が画面の上に完全に出たとき」のみ発火
 * @param {Function} onEnter - 範囲内に入ったとき (index, { startEl, endEl, targetEl }) => void
 * @param {Function} onOut - 範囲外に出たとき（once: false のときのみ）。onOutWhenFullyAboveViewport 時は要素が完全に画面上部に消えたとき
 */
export const setupMultipleTriggerRegions = ({
  startSelector,
  endSelector = null,
  targetSelector,
  mode = 'target',
  anchor = { position: 'center', offset: 0 },
  startAnchor = { position: 'top', offset: 0 },
  endAnchor = { position: 'bottom', offset: 0 },
  rangeMode = 'between',
  once = true,
  onOutWhenFullyAboveViewport = false,
  onEnter = (_index, _elements) => {},
  onOut = (_index, _elements) => {},
}) => {
  const startEls = document.querySelectorAll(startSelector);
  const endEls = endSelector ? document.querySelectorAll(endSelector) : [];
  const targetEls = document.querySelectorAll(targetSelector);

  // ターゲットが1つの場合は全 start で同じ要素を参照、複数なら index で対応
  const getTargetEl = (i) => {
    if (targetEls.length === 1) return targetEls[0];
    return targetEls[i] || targetEls[targetEls.length - 1];
  };

  startEls.forEach((startEl, i) => {
    const endEl = endSelector ? endEls[i] || endEls[endEls.length - 1] : null;
    const targetEl = getTargetEl(i);

    setupTriggerBetweenElements({
      mode,
      anchor,
      startAnchor,
      endAnchor,
      startEl,
      endEl,
      targetEl,
      rangeMode,
      once,
      onOutWhenFullyAboveViewport,
      onEnter: () => onEnter(i, { startEl, endEl, targetEl }),
      onOut: () => onOut(i, { startEl, endEl, targetEl }),
    });
  });
};

/**
 * 1組の「開始・終了・ターゲット」に対してスクロールトリガーを1つ張る（内部用）
 * スクロール／リサイズ時に「判定用のY座標」が範囲内かどうかをチェックし、onEnter / onOut を呼ぶ
 */
const setupTriggerBetweenElements = ({
  startEl,
  endEl = null,
  targetEl,
  mode = 'scroll',
  anchor = { position: 'center', offset: 0 },
  startAnchor = { position: 'top', offset: 0 },
  endAnchor = { position: 'top', offset: 0 },
  rangeMode = 'between',
  once = true,
  onOutWhenFullyAboveViewport = false,
  onEnter = () => {},
  onOut = () => {},
}) => {
  // 要素の top / center / bottom をドキュメント基準のY座標（px）で返す
  const getElementY = (el, anchor) => {
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    const base = {
      top: rect.top,
      center: rect.top + rect.height / 2,
      bottom: rect.bottom,
    }[anchor.position || 'top'];
    return scrollY + base + (anchor.offset || 0);
  };

  // ビューポートの上端・中央・下端のドキュメント基準Y座標を返す（スクロール位置の基準に使う）
  const getViewportY = (anchor) => {
    const scrollY = window.scrollY;
    const base = {
      top: 0,
      center: window.innerHeight / 2,
      bottom: window.innerHeight,
    }[anchor.position || 'center'];
    return scrollY + base + (anchor.offset || 0);
  };

  let hasFired = false;

  const handleCheck = () => {
    const startY = getElementY(startEl, startAnchor);
    const endY = endEl ? getElementY(endEl, endAnchor) : null;

    // 範囲判定に使う「現在のY」: ビューポートの位置か、ターゲット要素の位置か
    let checkY = mode === 'scroll' ? getViewportY(anchor) : getElementY(targetEl, anchor);

    let isInRange = false;

    if (rangeMode === 'between') {
      if (!endEl) return;
      isInRange = checkY >= startY && checkY <= endY;
    } else if (rangeMode === 'after') {
      isInRange = checkY >= startY;
    }

    // 範囲内に初めて入ったときだけ onEnter
    if (isInRange && !hasFired) {
      onEnter();
      hasFired = true;
    }

    // onOut の発火条件
    if (!once && hasFired) {
      if (onOutWhenFullyAboveViewport) {
        // 要素が画面の上に完全に出たとき（下端がビューポート上端より上）のみ onOut(-50は余裕分)
        let rect = getElementY(startEl, 0);
        rect -= 50;
        if (checkY < rect) {
          onOut();
          hasFired = false;
        }
      } else if (!isInRange) {
        // 従来: 範囲外に出たときに onOut
        onOut();
        hasFired = false;
      }
    }
  };

  window.addEventListener('scroll', handleCheck);

  // リサイズでレイアウトが変わっても再判定（100ms debounce）
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleCheck, 100);
  });

  // ページ読み込み時点で既に範囲内にいる場合のために初回実行
  handleCheck();
};
