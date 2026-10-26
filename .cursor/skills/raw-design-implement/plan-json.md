# 解析計画 JSON

実装前の中間正本。会話記憶に頼らない。  
保存先: `.cursor/tmp/raw-design-plans/<page-slug>.json`（または同ディレクトリの md＋json）。

## 粒度

| 載せる | 載せない（実装時に決定） |
|--------|--------------------------|
| セクション境界・入れ子 | 全テキストの最終 HTML タグ名（`p`/`a`/`li` 等） |
| 各ノードの `role`（色枠相当: `section` / `container` / `group` / `component` / `media` / `text` / `other`） | class 名の一字一句の確定を人手必須にすること |
| `render`: `html` / `img` / `svg` / `bg-later` / `component` | |
| メディア `ext`: jpg/png/svg | |
| コンポーネント候補名 | |
| JSON テキスト突合の参照（概位置・contents 抜粋） | |
| `uncertain` / notes | |

人が直すのは **塊と切り分け**。タグ微調整までやると手書きコードの方が早い。

## スキーマ（最小）

```json
{
  "pageSlug": "about",
  "annotate": "on",
  "mode": "template",
  "sources": {
    "design": ".cursor/design/exports/about/about-pc.png",
    "annotate": ".cursor/design/exports/about/about-pc-annotate.png",
    "aiJson": ".cursor/design/exports/about/about-pc.json"
  },
  "artboard": { "width": 1400, "height": null },
  "sections": [
    {
      "id": "s1",
      "role": "section",
      "nameHint": "hero",
      "uncertain": false,
      "children": [
        {
          "id": "s1-t1",
          "role": "text",
          "render": "html",
          "textFrom": "aiJson",
          "contentsPreview": "見出し…",
          "uncertain": false
        },
        {
          "id": "s1-m1",
          "role": "media",
          "render": "img",
          "ext": "jpg",
          "uncertain": false
        }
      ]
    }
  ],
  "tokensDraft": {
    "sectionSpaces": [],
    "containers": [],
    "paletteAdds": [],
    "fontsNeeded": []
  },
  "notes": []
}
```

- `annotate: "off"` のとき `role`/`render` は推定。`uncertain: true` を惜しまない
- `render: "bg-later"` … annotate:on の枠外相当（計画に残すなら notes でも可）
- 実装開始後も計画を更新してよい（進捗用キーは任意）

## 確認の温度感

- 単純・枠が明確 → 計画を出して問題なければ実装へ
- 複雑・`uncertain` 多・annotate off → 該当箇所だけ報告し、必要なら人手調整後に続行
