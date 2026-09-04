/************************************************************
 * トップページ
 * - トップスライダー（modules/swiper.js のリニアモード）
 ************************************************************/
import { createPage } from '../lifecycle/createPage.js';
import {
  MODE,
  BREAKPOINTS as _BREAKPOINTS,
  STATE_CLASSES as _STATE_CLASSES,
} from '../constans/global.js';
import { getSpMediaQuery as _getSpMediaQuery } from '../utils/resizeControl.js';

createPage(async () => {
  if (MODE === 'develop') {
    console.log('top');
  }
});
