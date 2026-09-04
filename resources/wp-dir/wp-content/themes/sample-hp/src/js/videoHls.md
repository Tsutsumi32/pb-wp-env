# HLS動画対応ユーティリティ

## 概要
HLS.jsを使用して動画を再生し、エラー時やサポートされていない環境では自動的にMP4にフォールバックする機能を提供します。

## 動画ファイルの配置

**重要**: HLS動画ファイル（`.m3u8`と`.ts`セグメント）は必ず`public`ディレクトリに配置してください。

`.ts`拡張子はTypeScriptと誤認識される問題を避けるため、ビルド処理の対象外となる`public`ディレクトリに配置する必要があります。

```
public/
└── videos/
    ├── logo_animation/
    │   ├── ithingstudio_logo_animation.mp4
    │   ├── ithingstudio_logo_animation.m3u8
    │   └── ithingstudio_logo_animation_000.ts
    └── mv_profile/
        ├── mv_profile.mp4
        ├── mv_profile.m3u8
        └── mv_profile_000.ts
```

## インストール
```bash
npm install hls.js
```

## 使用方法

### 基本的な使い方

```typescript
import { initVideoHls, getHlsUrl } from '@utils/videoHls.js';
import videoMp4 from "@videos/sample.mp4";

const videoElement = document.querySelector('.js_video') as HTMLVideoElement;

// HLS対応の動画を初期化
const cleanup = initVideoHls({
  hlsUrl: getHlsUrl(videoMp4),  // MP4パスから.m3u8パスを生成
  mp4Url: videoMp4,              // フォールバック用MP4
  videoElement: videoElement,    // video要素
  onError: (error) => {
    console.error('動画読み込みエラー:', error);
  },
  onLoad: () => {
    console.log('動画読み込み完了');
  }
});

// クリーンアップ（ページ遷移時など）
cleanup();
```

### Astroコンポーネントでの使用例

```astro
---
// profile.astro
---

<video class="js_profileVideo" playsinline muted loop autoplay></video>

<script>
  import { initVideoHls, getHlsUrl } from '@utils/videoHls.js';
  
  const mvProfile = "/videos/mv_profile/mv_profile.mp4";
  const videoElement = document.querySelector('.js_profileVideo') as HTMLVideoElement;
  
  if (videoElement) {
    const cleanup = initVideoHls({
      hlsUrl: getHlsUrl(mvProfile),
      mp4Url: mvProfile,
      videoElement: videoElement,
      onError: (error) => {
        console.error('動画エラー:', error);
      }
    });
  }
</script>
```

**注意**: `public`ディレクトリ内のファイルは絶対パス（`/videos/...`）で参照します。

## 動作の仕組み

1. **Safari / iOS**: ネイティブHLS対応ブラウザは`.m3u8`ファイルを直接再生
2. **Chrome / Edge / Firefox / Android**: hls.jsを使用して`.m3u8`を再生
3. **古いブラウザ**: HLS非対応の場合は`.mp4`ファイルを再生
4. **エラー時**: HLS再生中にエラーが発生した場合は自動的に`.mp4`にフォールバック

## API

### `initVideoHls(options: VideoHlsOptions): () => void`

HLS動画を初期化し、適切な再生方法を選択します。

#### パラメータ
- `hlsUrl` (string): HLS配信URL (.m3u8)
- `mp4Url` (string): フォールバック用MP4 URL
- `videoElement` (HTMLVideoElement): 動画要素
- `onError?` (function): エラー時のコールバック（オプション）
- `onLoad?` (function): 読み込み完了時のコールバック（オプション）

#### 戻り値
クリーンアップ関数を返します。この関数を呼び出すことでHLSインスタンスを破棄できます。

### `getHlsUrl(mp4Path: string): string`

MP4ファイルパスをHLS URL (.m3u8) に変換するヘルパー関数です。

#### パラメータ
- `mp4Path` (string): MP4ファイルパス

#### 戻り値
`.m3u8`拡張子に置き換えられたパス

## 注意事項

1. HLS動画ファイル（`.m3u8`と関連セグメント）は別途準備する必要があります
2. 動画ファイルは適切なCORSヘッダーで配信される必要があります
3. `getHlsUrl()`は単純に拡張子を置き換えるだけなので、実際のファイル配置に合わせて調整が必要な場合があります

## 実装されている箇所

- `/src/layouts/Intro.astro` - ロゴアニメーション動画
  - 動画: `/public/videos/logo_animation/ithingstudio_logo_animation.{mp4,m3u8}`
- `/src/pages/profile.astro` - プロフィールMV動画
  - 動画: `/public/videos/mv_profile/mv_profile.{mp4,m3u8}`

