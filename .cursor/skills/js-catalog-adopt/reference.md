# js-catalog-adopt リファレンス

## 初期化の書き方（例）

```js
// setup/project/initProject.js（カタログ採用例）
import { duplicateSibling } from '../../features/duplicateSibling.js';

export function initProject() {
  duplicateSibling.init();
}
```

```js
// pages/about.js の startPage 内
import { splitTextChars } from '../features/splitTextChars.js';

const startPage = () => {
  splitTextChars.init();
};
```

`initCommon.js` には案件固有・カタログ採用分を足さない。
`lottieAnimation` / `scrollHint` はコア常駐のため、カタログ採用なしで `initProject` または page から呼べる。

## 依存の典型

| カタログ | 案件側に必要なもの |
|----------|-------------------|
| `themeToggle` | `config/themeSystemInit.js`（コア想定） |
| `anchorLinkList` | `setup/tasks/smoothAnchorLink.js`（コア想定） |
| `chartDonut` | Chart.js |
| `scrollTriggerActiveClass` | 同梱 `setUpScrollTrigger.js`（必ずセット採用） |
| `videoHls` | `hls.js`（手順は `utils/videoHls.md`） |
| `html-mock/` | 静的モック用途。本番案件では通常不要 |
| 多く | `constans/global.js`・`utils/delegate.js`（コア想定） |

※ `lottieAnimation` / `scrollHint` は **コア常駐**（カタログ対象外）。CDN／プラグイン読込は案件の `assets-plugins` 等を確認。

## カタログが見つからないとき

1. ワークスペースに `catalog/js` が無いか確認
2. development-os を別ディレクトリで持っているなら、その絶対パスをユーザーに聞く
3. パスが分かるまでコピーしない（再発明で同等実装を新規作成しない。カタログ待ちかユーザー判断）

## コアとの境界

正本: `catalog/js/README.md`。カタログ INDEX に無い＝コア or 未整備。コアをカタログへ移す／カタログをコアへ上げる変更は、README・INDEX の更新を同ターンで行う。
