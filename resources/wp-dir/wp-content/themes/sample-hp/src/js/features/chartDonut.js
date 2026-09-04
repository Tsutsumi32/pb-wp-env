/**
 * data-chart / data-chart-type / data-chart-related / data-chart-value に基づいて
 * Chart.js でグラフを生成するユーティリティ
 * - data-chart: グラフを描画する要素（canvas）の識別子
 * - data-chart-type: グラフ種別（例: doughnut）
 * - data-chart-related: 上記識別子と同じ値を持つ要素が、そのグラフのデータ元
 * - data-chart-value: データ値（data-chart-related を持つ要素に付与）
 * - data-chart-label: ラベル（任意。無い場合は "Label 1" 等で代替）
 * - data-chart-color: 色（任意。指定時はその色をグラフに使用）
 */

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化）
// ---------------------------------------------------------------------------
/** グラフを描画する canvas の識別子 */
const ATTR_CHART = 'data-chart';
/** グラフ種別（例: doughnut） */
const ATTR_CHART_TYPE = 'data-chart-type';
/** ATTR_CHART と同じ値を持つ要素が、そのグラフのデータ元 */
const ATTR_CHART_RELATED = 'data-chart-related';
/** データ値 */
const ATTR_CHART_VALUE = 'data-chart-value';
/** ラベル（任意） */
const ATTR_CHART_LABEL = 'data-chart-label';
/** 色（任意） */
const ATTR_CHART_COLOR = 'data-chart-color';

const SELECTOR_CHART = `[${ATTR_CHART}]`;

const DEFAULT_COLORS = [
  'rgba(74, 144, 226, 0.9)',
  'rgba(100, 180, 255, 0.9)',
  'rgba(150, 200, 255, 0.9)',
  'rgba(180, 220, 255, 0.9)',
  'rgba(120, 160, 220, 0.9)',
  'rgba(90, 140, 210, 0.9)',
  'rgba(160, 200, 240, 0.9)',
];

const CUTOUT = '65%';

/** アニメーション時間（ミリ秒）。0 で無効 */
const ANIMATION_DURATION = 2000;

/**
 * 指定した chartId に対応するデータ要素を収集し、labels と values を返す
 * @param {string} chartId - data-chart の値
 * @param {HTMLElement|Document} root - 検索範囲
 * @returns {{ labels: string[], values: number[], colors: (string|undefined)[] }}
 */
const collectChartData = (chartId, root) => {
  const scope = root instanceof Document ? document.body : root;
  const dataEls = scope.querySelectorAll(`[${ATTR_CHART_RELATED}="${chartId}"]`);
  const labels = [];
  const values = [];
  const colors = [];

  dataEls.forEach((el) => {
    const valueAttr = el.getAttribute(ATTR_CHART_VALUE);
    if (valueAttr === null || valueAttr === '') return;
    const value = Number(valueAttr);
    if (Number.isNaN(value)) return;
    // ラベル: data-chart-label 優先、なければ親内の .*kind / .*name 要素のテキスト
    let label = el.getAttribute(ATTR_CHART_LABEL);
    if (label == null || label === '') {
      const parent = el.closest('li');
      const labelEl = parent?.querySelector('[class*="kind"], [class*="name"]');
      label = labelEl?.textContent?.trim() || `Label ${labels.length + 1}`;
    }
    const color = el.getAttribute(ATTR_CHART_COLOR)?.trim() || undefined;
    labels.push(label);
    values.push(value);
    colors.push(color);
  });

  return { labels, values, colors };
};

/**
 * 1つの canvas 要素に Chart.js でグラフを描画
 * @param {HTMLCanvasElement} canvas - 描画先の canvas
 * @param {string} chartType - Chart の type（doughnut など）
 * @param {{ labels: string[], values: number[], colors: (string|undefined)[] }} data
 */
const createChart = (canvas, chartType, { labels, values, colors: dataColors }) => {
  if (typeof window.Chart === 'undefined') return;
  if (!labels.length || !values.length) return;

  const colors = values.map((_, i) => {
    const c = dataColors[i];
    return c != null && c !== '' ? c : DEFAULT_COLORS[i % DEFAULT_COLORS.length];
  });

  new window.Chart(canvas, {
    type: chartType,
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: CUTOUT,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      animation:
        ANIMATION_DURATION > 0
          ? {
              duration: ANIMATION_DURATION,
              animateRotate: true,
              animateScale: false,
            }
          : false,
      // hover等無効化
    },
  });
};

/**
 * data-chart を持つ canvas を探し、表示域に入ったタイミングでグラフを生成（アニメーションが視認できるようにする）
 * @param {HTMLElement|Document} [container=document] - 検索対象
 */
export const initCharts = (container = document) => {
  const root = container instanceof Document ? document.body : container;
  const chartEls = root.querySelectorAll(SELECTOR_CHART);

  if (typeof window.Chart === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const canvas = entry.target;
        observer.unobserve(canvas);

        const chartId = canvas.getAttribute(ATTR_CHART);
        const chartType = canvas.getAttribute(ATTR_CHART_TYPE) || 'doughnut';
        if (!chartId) return;

        const { labels, values, colors } = collectChartData(chartId, root);
        if (!values.length) return;

        createChart(canvas, chartType, { labels, values, colors });
      });
    },
    { rootMargin: '0px', threshold: 0.1 }
  );

  chartEls.forEach((el) => {
    if (el.tagName !== 'CANVAS') return;
    observer.observe(el);
  });
};
