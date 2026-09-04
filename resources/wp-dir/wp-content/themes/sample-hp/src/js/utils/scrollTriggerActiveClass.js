import { setUpScrollTrigger } from '../utils/setUpScrollTrigger.js';

export const initScrollTriggerActiveClass = () => {
  const targets = document.querySelectorAll('.js-active-animation');

  if (!targets) return;

  const scrollAnimationConfig = [
    {
      startSelector: '.js-active-animation',
      targetSelector: '.js-active-animation',
      mode: 'scroll',
      anchor: { position: 'bottom', offset: 0 },
      startAnchor: { position: 'top', offset: 180 },
      rangeMode: 'after',
      once: false,
      onOutWhenFullyAboveViewport: true, // is_active を外すのは要素が画面の上に完全に消えたときのみ
      onEnter: (index, { startEl }) => {
        startEl.classList.add('is_active');
      },
      onOut: (index, { startEl }) => {
        startEl.classList.remove('is_active');
      },
    },
  ];

  setUpScrollTrigger(scrollAnimationConfig);
};
