---
name: gsap
description: GSAPを使った実装（アニメーション全般・ScrollTrigger・ScrollSmoother・Flip・Lenis併用・スムーススクロール導入）を依頼されたときに読み込む。npm必須導入、ScrollSmoother と Lenis の選定（fixed 層・canvas 演出・z-index 重なり）、Safari/WebKitで顕著な橋渡し問題（ハッシュ退避・overflow:clip・allowNestedScroll限定・fixed portal・Flip後のインライン除去・pin/scrub refresh・Lenis の ticker 接続/prevent/stop/BFCache）、reduced-motion 対応（装飾は停止・追従の pin は CSS sticky・横スクロールは制限なし）を扱う。通常CSSのSafari問題は frontend-base/safari-webkit.md。
---

# GSAP 実装ルール

GSAP / スムーススクロール系プラグイン導入時の必須要件と、**プラグインが誘発しやすい Safari / iOS WebKit 問題**の対処方針。

## 構成

1. 導入方法（npm 必須）
2. スムーススクロールの方式選定（ScrollSmoother / Lenis）
3. Safari / WebKit との橋渡し（ScrollSmoother / ScrollTrigger / Flip）
4. Lenis 使用時の橋渡し
5. 動きの配慮（reduced-motion）
6. チェックリスト
7. 参照

各橋渡し項目は **症状 → 要因 → 推奨 → 禁止** の順。プラグイン非依存の CSS 問題（0.5px 線・autofill・100vh・appearance・mask プレフィックス単体など）は書かない → `.claude/rules/frontend-base/safari-webkit.md`（B）。

## 導入方法（npm 必須）

- CDN の `<script>` 読み込みは使わない。**`npm install gsap` で導入**し、ES Modules として `import` する。
- 必要なプラグインのみ import し、`gsap.registerPlugin(...)` で登録する（未使用プラグインを一括 import しない）。
- 既に GSAP が導入済みのプロジェクトでは、二重インストール・重複 import を避けるため、既存の import 元（`modules/` 等）を先に確認してから使う。
- 新しいパッケージ（`lenis` 等）を import する前に、`package.json` の dependencies と `node_modules` にあるか確認する。無ければ実装と同時にインストールが必要な旨を報告し、依頼者の了承を得てから `npm install` する（未導入のまま import すると watch のビルドが失敗し、変更が反映されない）。

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
```

## スムーススクロールの方式選定

ページ全体のスムーススクロールを依頼されたら、**実装前に対象ページの `position: fixed` 要素と z-index の重なりを洗い出して**方式を決める。

| 方式 | 仕組み | 向いているページ |
|------|--------|------------------|
| ScrollSmoother | content を `transform` で動かす（仮想スクロール） | fixed 要素が少なく、smoother の外（portal）へ逃がせる。`effects`（data-speed / lag）を使いたい |
| Lenis | ネイティブスクロールのまま、スクロール位置を補間する | 下記のどれかに当たる |

**Lenis を選ぶ目安**（ScrollSmoother だと構造の作り直しが必要になる）:

- 背景・canvas・オーバーレイなどの fixed 層が content 内に複数あり、content の外へ出せない
- fixed 層の z-index が content 内のセクションの間に挟まる（例: 背景 1 < canvas 2 < セクション 3）。content の外へ出すと、`transform` が作る重なりの文脈（stacking context）を越えられず、間に挟めない
- pin を抜けた後も `position: fixed` へ切り替えて残す演出がある
- pin が多い scroll-driven 演出で、`pinType: fixed` の前提で組まれている

- 判断がつかない、または既存の演出の見た目が変わる恐れがあるときは、選択肢と理由を示して依頼者に確認する
- **Lenis でも Safari 対応は必要**。ScrollSmoother の transform 起因の問題（下記の項目 1・4 など）は出ないが、別の注意点がある（「Lenis 使用時の橋渡し」）

## Safari / WebKit との橋渡し

ScrollSmoother 等でページ全体のスムーススクロールを入れる場合、特に Safari は衝突しやすい。実装後は同一ページ内アンカー・別ページからのハッシュ付き遷移・内側スクロール枠を **Safari を含めて**確認する。

### 1. ハッシュ付き URL

- **症状**: アンカー遷移後にスクロール不能・位置ずれ（Safari で顕著）
- **要因**: ブラウザ標準のハッシュジャンプと ScrollSmoother の衝突
- **推奨**:
  - **別ページから `#section` 付きで来る場合**: 対象要素が出る前（`<body>` 先頭のインライン `script` 等）で `location.hash` を `data-gsap-pending-hash` へ退避し、`history.replaceState` で URL から hash を外す。`history.scrollRestoration = 'manual'`。`initGsapScrollSmoother` が smoother 初期化後に `initGsapHashScrollOnLoad`（画像読込・`refreshScrollTrigger` のあと `smoothScrollTo` → hash 復帰）を行う
  - **同一ページ内アンカー**: `initSmoothAnchorLink`（`setup/tasks/smoothAnchorLink.js`）が `preventDefault()` し標準遷移を使わない。smoother 稼働中は `setSmoothScrollToHandler` 経由で `smoother.scrollTo` に委譲（`initGsapScrollSmoother` が bind / kill 時に解除）
  - **責務分離**: クリック判定・座標計算・デフォルト rAF スクロールは `smoothAnchorLink.js`（gsap 非依存）。ScrollSmoother 委譲と hash 復帰だけ `features/gsap.js`。`initCommon` は前者のみ呼ぶ
- **禁止**: クエリに逃がしてアンカーを捨てる（保守不能）。smoother 無し案件への無条件インライン挿入。`smoothAnchorLink.js` から gsap を静的 import すること。API・引数は導入バージョンのドキュメントで確認

```js
// features/gsap.js（initGsapScrollSmoother 内）
setSmoothScrollToHandler((targetPosition) => {
  ScrollSmoother.get()?.scrollTo(targetPosition, true);
});
void initGsapHashScrollOnLoad();
```

```js
// setup/tasks/smoothAnchorLink.js（デフォルト。handler 未設定時）
export function smoothScrollTo(targetPosition, duration) {
  if (smoothScrollToHandler) {
    smoothScrollToHandler(targetPosition, duration);
    return;
  }
  // requestAnimationFrame + window.scrollTo
}
```

### 2. `overflow: hidden` と `normalizeScroll` / `allowNestedScroll`

- **症状**: ページ全体がスクロール不能
- **要因**: Safari が `overflow: hidden` をネストスクロールと誤認しやすい
- **推奨**: ページ止め・クリップ用途は **`overflow: clip`**。`allowNestedScroll` に **`true` を渡さない**。許可は関数／セレクタで限定し、対象は **`[data-gsap-nested-scroll]` 配下と `textarea` / `select`** のみ。中身をスクロールする枠には `data-gsap-nested-scroll` を付与
- **禁止**: `allowNestedScroll: true` の全面許可。大きな箱への安易な `overflow: hidden`（次項も参照）

### 3. 大きなセクションの `overflow: hidden`

- **症状**: 同上（特定ページのみ止まって見えることが多い）
- **要因**: 同上。広いラッパーがネストスクロール扱いになる
- **推奨**: クリップは **必要最小の子**（カルーセル・画像枠等）に。可能なら **`overflow: clip`**。`overflow-x: hidden` だけを大きな箱に付けるのも避ける（もう一方の軸が `auto` 扱いになりやすい）
- **禁止**: ページ幅ラッパー／大きなセクション根への `overflow: hidden`。※ ScrollSmoother 用 wrapper 自身の `position: fixed` + `overflow: hidden` はライブラリ前提のため対象外

### 4. `position: fixed` が画面に対して固定されない

- **症状**: モーダル・固定ヘッダー等がスクロールに追従して動く／contain される
- **要因**: smoother の content に `transform` があり containing block になる
- **推奨**: fixed オーバーレイは **smoother の content / wrapper の外**（portal 等）
- **禁止**: smoother content 内に fixed オーバーレイを置くこと（ネストスクロール許可で代用しない）

### 5. `opacity: 0` なのに角丸背景の輪郭が残る（白枠ゴースト）

- **症状**: 非表示のはずの白枠・リングだけ残る（TOP ヘッダー等のフェードで顕著）
- **要因**: 根本は WebKit の描画。Smoother の transform スクロールで **誘発・併発しやすい**
- **推奨**: smoother 使用時はフェード要素で特に出る。**B（`safari-webkit.md`）の対処を必須**（非表示時に `background` を `transparent` にする等）
- **禁止**: A 側だけで「見た目のハック」を重ねて B を省略すること

### 6. Flip 後の表示崩れ

- **症状**: Flip 完了後にレイアウト・表示がおかしい
- **要因**: Flip 由来のインラインスタイル残留
- **推奨**: 完了コールバック等で不要インラインを除去
- **禁止**: 残留インラインを上書き CSS だけでごまかし続けること

### 7. pin / scrub のガタ・ズレ

- **症状**: pin 区間のガタつき、scrub のズレ
- **要因**: レイアウト未確定時の計測、画像読込後の高さ変化、二重スクロール
- **推奨**: 適切な `refresh` タイミング、`pinType` の見直し、画像読込後の `ScrollTrigger.refresh()`。Lenis 併用時は ticker 接続を必須（「Lenis 使用時の橋渡し」L1）
- **禁止**: ネイティブ／smoother／Lenis の二重スクロール

### 8. IntersectionObserver だけに依存した表示切替

- **症状**: transform スクロール下で表示切替の発火がずれる／欠ける
- **要因**: 仮想スクロールと IO の交差判定の差
- **推奨**: 重要な連動は ScrollTrigger も検討する
- **禁止**: 重要 UI を IO のみに任せきりにすること（smoother 案件）

## Lenis 使用時の橋渡し

Lenis はネイティブスクロールのため、fixed・pin（`pinType: fixed`）・IntersectionObserver はそのまま動く。代わりに **Lenis の補間とブラウザ標準の動きが食い違う箇所**を橋渡しする。実装例: `features/lenis.js`（`initLenis`）。

### L1. 駆動の二重化と ScrollTrigger の同期

- **症状**: pin / scrub がガタつく、1 フレーム遅れる、タブ復帰時に飛ぶ
- **要因**: Lenis 自身の rAF と GSAP ticker の二重駆動。ticker の lagSmoothing による時間の詰め
- **推奨**: `autoRaf: false` にし、`gsap.ticker.add((time) => lenis.raf(time * 1000))` で駆動する。`lenis.on('scroll', ScrollTrigger.update)`。`gsap.ticker.lagSmoothing(0)`（破棄時は既定値 `500, 33` に戻す）。`ScrollTrigger` の `refresh` 後に `lenis.resize()`（pin-spacer の増減でスクロール上限が変わるため）
- **禁止**: `autoRaf: true` と ticker 駆動の併用。ScrollSmoother との併用

### L2. 内側スクロール（`prevent`）

- **症状**: モーダル本文やスクロール枠が動かない／背面のページが動く。逆に、ページ内の枠の上で端に達した・溢れていないときにページがスクロールしない
- **要因**: Lenis が wheel を受けてページを動かす。停止中（`stop()`）は wheel / touch を `preventDefault` するため、`prevent` に当たらない枠はスクロールできない。`prevent` が常に true だと、端・溢れなしでもページへ渡らない
- **推奨**: `prevent` 関数で **`[data-gsap-nested-scroll]` と `textarea` / `select` のみ**を対象にし、さらに **ジェスチャの方向にまだスクロールできる場合だけ** true を返す（移動量は `virtualScroll` オプションで記録。`prevent` には要素しか渡らない）。内側スクロール枠（`overflow: auto` のモーダル本文・規約欄・カード本文など）には `data-gsap-nested-scroll` を付与する。`overscroll-behavior: contain` は **背面へ連鎖させたくないオーバーレイ（モーダル・メニュー）だけ**に付ける
- **禁止**: `allowNestedScroll: true` による全面許可（毎回の祖先走査が重く、Safari では `overflow: hidden` の誤検知も起こる）。ページ内の枠への `overscroll-behavior: contain`（`overflow: auto` なら溢れていなくても連鎖が止まり、iOS のタッチでもページがスクロールしない）

### L3. スクロールロックとの連携

- **症状**: モーダル表示中やオープニング再生中に背面がスクロールする
- **要因**: `body { overflow: hidden }` や wheel の `preventDefault` だけでは、Lenis のスクロールが止まらない
- **推奨**: スクロールロック処理（`bodyScrollControll`）から `lenis.stop()` / `start()` を呼ぶ（`bindLenis`）。wheel を止める型のロック（`disableScrollPrevent`）も対象にする。ロックより先に Lenis を初期化する
- **禁止**: スクロールバーを残す型のロックと併用するときに、lenis.css の `.lenis-stopped { overflow: clip }` を入れること（スクロールバーが消えて幅が変わる）

### L4. `window.scrollTo` の直接操作

- **症状**: アンカー移動の後にスクロールが戻る／揺れる
- **要因**: Lenis の内部の目標位置が古いまま残り、補間と競合する
- **推奨**: アンカー移動は `lenis.scrollTo` に委譲する（`setSmoothScrollToHandler` / `setScrollJumpHandler`。瞬間移動は `{ immediate: true }`）
- **禁止**: Lenis 稼働中の `window.scrollTo` によるページ遷移相当の移動（ロック中に先頭へ戻す処理など、Lenis 停止中の補正は可）

### L5. BFCache 復元（Safari）

- **症状**: 戻る／進むの直後、最初のホイールで別の位置へ飛ぶ
- **要因**: Safari は scroll イベントなしで位置を復元するため、Lenis の内部位置がずれたまま残る
- **推奨**: `pageshow` で `event.persisted` のとき `lenis.resize()` → `lenis.scrollTo(window.scrollY, { immediate: true, force: true })` → `ScrollTrigger.update()`（BFCache の一般論は B の項目 9）
- **禁止**: 内部位置を合わせないまま放置すること

### L6. タッチ・CSS・動きの配慮

- **推奨**:
  - `syncTouch: false`（iOS Safari の標準の慣性スクロールを優先する）
  - lenis.css は JS から読み込まない（esbuild では空になる）。`_plugin.scss` に `html.lenis, html.lenis body { height: auto }`、`.lenis.lenis-smooth { scroll-behavior: auto !important }`（CSS の smooth との二重補間を防ぐ）、`.lenis.lenis-smooth iframe { pointer-events: none }` を定義する
  - `prefers-reduced-motion: reduce` では作成しない（`gsap.matchMedia` で作成・破棄）
  - 慣性の強さは `lerp`（既定 0.1。小さいほど強い）で調整し、ページ側から渡す
- **禁止**: `syncTouch: true` を理由なく有効化すること（iOS でスクロールが重く、慣性も不自然になる）

## 動きの配慮（reduced-motion）

前提（reduce でもコンテンツはすべて見える）と動きの分類は `.claude/rules/frontend-base/reduced-motion.md` が正本。ここでは GSAP での実装方法のみ扱う。

| 演出 | reduce 時の実装 |
|------|----------------|
| 装飾（入場・パララックス・scrub の移動/拡縮・カーソル追従など） | 作成しない。要素は最終状態で表示 |
| 追従のみの pin | pin を作成しない。CSS の `position: sticky` で留める |
| 横スクロールコンテンツ（pin + scrub で横移動） | **reduce で分岐させず通常どおり作成する**（止めると横方向のコンテンツが見られない） |
| スムーススクロール（ScrollSmoother / Lenis） | 作成しない（ネイティブスクロール） |

- **推奨**:
  - 装飾演出・追従の pin は `gsap.matchMedia()` の `(prefers-reduced-motion: no-preference)` 内で作成する。隠す初期状態（`gsap.set` / `from` の開始値）も同じ条件内で付与し、reduce への切替時に revert で表示状態へ戻るようにする
  - CSS 側で初期状態を隠す場合も `@media (prefers-reduced-motion: no-preference)` 内に限定する
  - 追従の sticky は `@media (prefers-reduced-motion: reduce)` 内で該当要素に `position: sticky` と `top` を指定する。sticky が効く構造か（祖先の `overflow`・`transform`）を確認する（B の項目 3・5）
  - pin 中に中身も動く演出は、中身の動きを止めて sticky のみ残す
  - 横スクロール内の付随装飾（パララックス等）は no-preference 内に分けて作成し、横移動本体と切り離す
- **禁止**: reduce 時に初期状態（`opacity: 0` 等）だけが残る実装。追従の pin を reduce で単に外して、sticky を当てないこと。横スクロール本体を reduce 判定で止めること

```js
const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

// 装飾・追従の pin は no-preference のときだけ作成（reduce への切替で revert）
gsap.matchMedia().add(MOTION_QUERY, () => {
  gsap.from(target, { autoAlpha: 0, y: 40, scrollTrigger: { trigger: target } });
  ScrollTrigger.create({ trigger: section, pin: follower, start: 'top top', end: 'bottom bottom' });
});

// 横スクロールは reduce でも作成
gsap.to(track, {
  x: () => -(track.scrollWidth - track.clientWidth),
  scrollTrigger: { trigger: section, pin: true, scrub: true, end: () => `+=${track.scrollWidth}` },
});
```

```scss
.un_feature_follower {
  @media (prefers-reduced-motion: reduce) {
    position: sticky;
    top: s(80);
  }
}
```

## チェックリスト

**実装時**

- [ ] npm 導入・必要プラグインのみ register。新規パッケージは導入済みか確認
- [ ] fixed 層と z-index の重なりを洗い出し、ScrollSmoother / Lenis を選定（迷えば依頼者に確認）
- [ ] ハッシュ退避 → 初期化／refresh 後 scrollTo → hash 復帰（smoother 案件）
- [ ] `allowNestedScroll` は限定許可。大きな箱は `clip`／最小子へ
- [ ] fixed オーバーレイは smoother 外
- [ ] フェード要素の白枠は B の対処を適用
- [ ] Flip 後のインライン除去。pin/scrub は refresh・Lenis ticker
- [ ] Lenis: ticker 駆動・`lagSmoothing(0)`・refresh 後の `resize`。`prevent` は限定許可かつ方向付きのスクロール可否判定。`contain` はオーバーレイのみ。ロックで `stop` / `start`。`scrollTo` は Lenis 経由。`pageshow` で位置同期。`syncTouch: false`。reduced-motion では作成しない
- [ ] reduced-motion: 装飾は no-preference 内で作成（初期状態も同条件）。追従の pin は reduce で sticky。横スクロール本体は reduce でも作成。reduce エミュレート＋リロードで全コンテンツが見えるか確認

**Safari 確認時**

- [ ] 同一ページ内アンカー／別ページハッシュ付き遷移
- [ ] 内側スクロール枠・ページ全体スクロール
- [ ] fixed オーバーレイ・pin 区間
- [ ] Lenis: ページ内の内側スクロール枠の端・溢れなしでページへ渡るか、モーダル・ロック中の背面スクロール、戻る／進む直後のホイール、iOS のタッチ慣性

## 参照

- Safari / iOS WebKit（プラグイン非依存 CSS）: `.claude/rules/frontend-base/safari-webkit.md`
- 動きの配慮（前提・分類）: `.claude/rules/frontend-base/reduced-motion.md`
- 一般的な JavaScript 実装ルール: `.claude/rules/frontend-base/javascript.md`
- DOM 参照（class/id 禁止・data-* 必須）: `.claude/rules/project/javascript/coading.md`
