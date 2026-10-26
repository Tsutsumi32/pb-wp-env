# Safari / iOS WebKit 実装ルール

プラグイン無しでも起きる **Safari / iOS WebKit 固有（または顕著）な表示・挙動問題**の対処方針。GSAP / ScrollSmoother 等が誘発する橋渡し問題はここへ書かない。

## 構成

1. 境界（A との分担）
2. 項目（各: 症状 → 要因 → 推奨 → 禁止）
3. チェックリスト
4. 参考例（任意）
5. 参照

## 境界（A との分担）

| 振り分け | 正本 |
|---|---|
| ScrollSmoother の hash / nested scroll / fixed portal / Flip / pin・Lenis | `@gsap`（`.claude/skills/gsap/SKILL.md`） |
| プラグイン非依存の CSS・フォーム・viewport・mask 等 | **本ファイル（B）** |

白枠ゴーストは WebKit 描画が根本だが smoother で誘発しやすい → **対処の詳細は本ファイル**。A は「誘発・併発の注意と B 必須」のみ。

## 項目

### 1. 細い線（0.5px 等）が出ない・太さが安定しない

- **症状**: hairline が消える／端末で太さがばらつく
- **要因**: サブピクセル描画の差
- **推奨（王道）**: 疑似要素を **2 倍サイズで描き `scale(0.5)`** で調整する
- **禁止**: box-shadow や gradient を第一選択にすること（環境差あり。代替は王道が難しいときのみ）

### 2. `opacity: 0` + `border-radius` + `background` の輪郭残存

- **症状**: 非表示のはずの白枠・リングだけ残る（Chrome では消えることが多い）
- **要因**: WebKit のレイヤー合成／角丸背景の残描画。`overflow: hidden` + radius の 1px リングも類縁
- **推奨**: 非表示時は **`background` を `transparent` に切る**。必要なら `translateZ(0)` + `backface-visibility: hidden`。表示時のみ背景色を戻す。可能なら `overflow: clip`
- **禁止**: `opacity: 0` だけに頼って背景色を残したままにすること（smoother 案件は `@gsap` 項5も参照）

### 3. 祖先の `transform` / `filter` による `fixed` / `sticky` の破綻

- **症状**: `fixed` / `sticky` が想定の基準（viewport）で効かない
- **要因**: 祖先の `transform` / `filter` / `perspective` 等が containing block になる
- **推奨**: fixed / sticky が必要な要素の祖先から不要な transform 系を外す。配置基準を見直す
- **禁止**: ※ smoother 起因の fixed 破綻は `@gsap`（portal）。本項は **一般的な transform 付き親**に留める

### 4. `100vh` と iOS アドレスバー

- **症状**: フルハイトがアドレスバー分ずれて溢れる／足りない
- **要因**: `vh` が動的 UI を含まない古典的挙動
- **推奨**: `dvh` / `svh` を使う。フォールバックは `vh` を書いたうえで `dvh` で上書き
- **禁止**: iOS 向けに `100vh` のみでフルスクリーンを確定すること

### 5. `sticky` 無効

- **症状**: `position: sticky` が効かない
- **要因**: 祖先の `overflow: hidden` / `auto` / `scroll` 等
- **推奨**: sticky 対象の祖先の `overflow` を見直す（不要なら外す／`visible`）
- **禁止**: sticky 要素側だけの指定増やしで祖先 overflow を無視すること

### 6. `backdrop-filter` / `mask`

- **症状**: ぼかしや mask が効かない／欠けて見える
- **要因**: プレフィックス・未対応時の見え方
- **推奨**: `-webkit-` を併記する。色・不透明背景など **フォールバック**を用意する
- **禁止**: 未対応時にコンテンツが読めなくなる指定だけにすること

### 7. フォーム

- **症状**: ネイティブ見た目の残り、autofill 黄背景、date/time 表示の差、iOS フォーカス時ズーム
- **要因**: WebKit のフォーム描画・補完・viewport ズーム閾値
- **推奨**:
  - **`appearance` / `-webkit-appearance` / tap-highlight / date・time indicator**: テーマの **`_reset.scss`（または同等の global reset）に従う**。既に担保済みなら重複定義しない
  - **autofill 黄背景**: inset の大きな `box-shadow` + `-webkit-text-fill-color`（既存のフォーム部品 mixin があればそれを使う）
  - **iOS フォーカスズーム**: 入力の `font-size` は **16px 以上**
- **禁止**: reset 済みの appearance をコンポーネントで無意味に二重上書きすること

### 8. メディア

- **症状**: iOS で動画が自動再生されない／インラインにならない
- **要因**: 再生ポリシー・属性不足
- **推奨**: `muted` + `playsinline`（必要なら `webkit-playsinline`）。静止画の `<picture>` フォールバックは `.claude/rules/frontend-base/html.md`「静的 HTML の画像」に任せ、ここでは Safari 実機確認観点のみ意識する
- **禁止**: 自動再生前提で `muted` / playsinline を省略すること

### 9. BFCache（任意・短節）

- **症状**: 戻る／進むで JS 状態やスクロール連動が古い
- **要因**: pageshow で BFCache 復元される
- **推奨**: `pageshow` で `event.persisted` のとき状態を再適用する（プラグイン非依存）
- **禁止**: `unload` だけに依存した片付けで BFCache を壊す／無視し続けること

## チェックリスト

**実装時**

- [ ] hairline は 2x + `scale(0.5)`
- [ ] フェード非表示は背景を `transparent`（必要なら合成ヒント／`clip`）
- [ ] フルハイトは `dvh`/`svh`（`vh` フォールバック可）
- [ ] sticky 祖先の overflow を確認
- [ ] `backdrop-filter` / `mask` は `-webkit-` とフォールバック
- [ ] フォームは reset／既存 mixin 準拠。入力 16px 以上。video は muted + playsinline

**Safari 確認時**

- [ ] 細い線・フェード要素のゴースト
- [ ] sticky / fixed（一般 transform 親）
- [ ] iOS アドレスバー込みの高さ、入力フォーカスズーム
- [ ] autofill・動画インライン（該当時）
- [ ] ScrollSmoother 案件は `@gsap` チェックリストも実施

## 参考例（任意）

- reset（appearance / tap-highlight / date・time indicator）: `<theme-root>/src/scss/global/_reset.scss`
- autofill 中和 mixin の一例: `<theme-root>/src/scss/modules/elements/` 配下のフォーム部品

## 参照

- GSAP / ScrollSmoother 起因（A）: `.claude/skills/gsap/SKILL.md`
- 画像の `<picture>` 出し分け: `.claude/rules/frontend-base/html.md`「静的 HTML の画像」（PHP の `render_img()` 規約は `.cursor/rules/project/template/image.mdc`。未移行）
- CSS 共通（コメント・プロパティ順）: `.claude/rules/frontend-base/css.md`
