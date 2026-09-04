/************************************************************
 * HLS動画対応ユーティリティ
 *
 * HLS.js を使用して動画を再生し、エラー時はmp4にフォールバック
 * Safari/iOS はネイティブHLS対応のため直接再生
 ************************************************************/
import Hls from 'hls.js';

/**
 * HLS動画を初期化し、適切な再生方法を選択
 *
 * @param {Object} options - 動画設定オプション
 * @param {string} options.hlsUrl - HLS配信URL (.m3u8)
 * @param {string} options.mp4Url - フォールバック用MP4 URL
 * @param {HTMLVideoElement} options.videoElement - 動画要素
 * @param {Function} [options.onError] - エラー時のコールバック
 * @param {Function} [options.onLoad] - ロード時のコールバック
 */
export function initVideoHls(options) {
  const { hlsUrl, mp4Url, videoElement, onError, onLoad } = options;

  let hlsInstance = null;

  const onceOpts = { once: true };

  // ネイティブHLS対応ブラウザ (Safari / iOS)
  if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = hlsUrl;

    if (onLoad) {
      videoElement.addEventListener('loadeddata', onLoad, onceOpts);
    }

    videoElement.addEventListener(
      'error',
      (e) => {
        console.warn('HLS native playback error, falling back to MP4:', e);
        videoElement.src = mp4Url;
        if (onError) onError(e);
      },
      onceOpts
    );
  }
  // hls.js が使えるブラウザ (Chrome, Edge, Firefox, Android等)
  else if (Hls.isSupported()) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
    });

    hlsInstance.loadSource(hlsUrl);
    hlsInstance.attachMedia(videoElement);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      if (onLoad) onLoad();
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.warn('HLS.js fatal error, falling back to MP4:', data);

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('Network error encountered');
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('Media error encountered');
            break;
          default:
            console.error('Fatal error encountered');
            break;
        }

        // HLSインスタンスを破棄してMP4にフォールバック
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
        videoElement.src = mp4Url;

        if (onError) onError(data);
      }
    });
  }
  // 古いブラウザ → 直接MP4を使用
  else {
    console.warn('HLS not supported, using MP4 fallback');
    videoElement.src = mp4Url;

    if (onLoad) {
      videoElement.addEventListener('loadeddata', onLoad, onceOpts);
    }
  }
}

/**
 * 動画URLをHLS URLに変換するヘルパー関数
 *
 * @param {string} mp4Path - MP4ファイルパス
 * @returns {string} HLS URL (.m3u8)
 */
export function getHlsUrl(mp4Path) {
  // .mp4 を .m3u8 に置き換え
  return mp4Path.replace(/\.mp4$/, '.m3u8');
}
