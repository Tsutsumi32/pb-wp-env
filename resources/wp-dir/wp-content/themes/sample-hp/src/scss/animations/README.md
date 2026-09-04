# CSS animation リファレンス

## 書き方

```css
animation: name duration timing-function delay iteration-count direction fill-mode play-state;
```

| 値 | 意味 |
|----|------|
| `slideIn` | アニメーション名（`@keyframes` で定義した名前） |
| `2s` | 2秒かけて実行 |
| `ease-in-out` | ゆっくり始まりゆっくり終わる |
| `0.5s` | 0.5秒待ってから開始 |
| `3` | 3回繰り返す |
| `alternate` | 往復再生する |
| `forwards` | 終了後も最後の状態を維持 |
| `running` | 再生中 |

省略した値はブラウザの初期値が使われる。不要な値は省略してよい。

```css
animation: fadeIn 0.5s ease forwards;
animation: spin 1s linear infinite;
```

### @keyframes

```scss
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
```

`keyframes/` に定義し、使う側で `animation: slideIn 0.5s ease-out forwards;` のように指定する。

---

## animation-direction

アニメーションの再生方向。

### normal（デフォルト）

毎回、最初 → 最後

```css
animation: slideIn 1s normal;
```

```
1回目: →→→
2回目: →→→
3回目: →→→
```

### reverse

毎回、最後 → 最初

```css
animation: slideIn 1s reverse;
```

```
1回目: ←←←
2回目: ←←←
3回目: ←←←
```

### alternate

奇数回は順方向、偶数回は逆方向。往復運動によく使う。

```css
animation: slideIn 1s alternate 4;
```

```
1回目: →→→
2回目: ←←←
3回目: →→→
4回目: ←←←
```

```css
animation: bounce 1s infinite alternate;
```

### alternate-reverse

`alternate` の逆スタート。

```css
animation: slideIn 1s alternate-reverse 4;
```

```
1回目: ←←←
2回目: →→→
3回目: ←←←
4回目: →→→
```

---

## animation-fill-mode

アニメーションの開始前・終了後の状態。

### none（デフォルト）

終了後に元の状態へ戻る。

```css
.box {
  opacity: 0;
  animation: fadeIn 1s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

結果: `0 → 1 → 0`

### forwards

終了後に最後の状態を保持。表示アニメの定番。

```css
animation: fadeIn 1s forwards;
```

結果: `0 → 1 → 1`

### backwards

`delay` があるとき、待機中に `from` の状態が適用される。

```css
animation: fadeIn 1s 2s backwards;
```

```
待機中: opacity 0
  ↓ 開始
opacity 1
```

### both

`forwards` + `backwards`。開始前も終了後もアニメーション状態を維持。

```css
animation: fadeIn 1s 2s both;
```

```
待機中 → from状態
  ↓ 実行
終了後 → to状態
```

---

## よくある組み合わせ

| 用途 | 指定例 |
|------|--------|
| フェードインして表示しっぱなし | `animation: fadeIn 0.5s ease forwards;` |
| 左右に揺れる | `animation: shake 0.3s infinite alternate;` |
| ローディング | `animation: spin 1s linear infinite;` |
| スライドインしてその位置に固定 | `animation: slideIn 0.5s ease-out forwards;` |

- **表示時アニメーション** → `forwards` が定番
- **往復運動・ゆらゆら** → `alternate` が定番
