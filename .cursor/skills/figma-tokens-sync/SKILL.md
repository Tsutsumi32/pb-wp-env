---
name: figma-tokens-sync
description: >-
  Figma Variables/Styles と SCSS トークンの双方向部分同期。差分は最新 .cursor/figma-tokens JSON と Code の突合、
  pull は JSON→SCSS、push は Code→Figma（MCP）。トークン差分、Code→Figma、JSON 突合、流動同期の依頼時に使用する。
disable-model-invocation: true
---

# figma-tokens-sync

流動制作向けの **部分同期** スキル。対象は `@figma-tokens-setup` が突き合わせる Variables / Styles のみ。

| 比較 | 本スキル | `@figma-tokens-setup` |
|------|----------|------------------------|
| 用途 | 継続的な差分同期（pull / push） | 案件キックオフ・基盤の全面入れ替え |
| リセット | **しない**（差分のみ） | **必須** |
| 差分の正 | **Code ↔ `.cursor/figma-tokens/*.json`** | JSON 同期 → 丸ごと差し替え（またはリセットのみ） |

詳細手順・カテゴリ別の戻し方は [reference.md](reference.md)。キー変換は `figma/style.mdc` §2〜6。JSON フィールド仕様は `@figma-tokens-setup` の `reference-json.md`（長文コピーしない）。

## 三者の役割

| 層 | 役割 |
|----|------|
| Figma（ライブ） | デザイン上の Variables / Styles |
| `.cursor/figma-tokens/*.json` | **最後に合意した Figma スナップショット**（差分の比較面） |
| `_variables.scss` 等 | 実装トークン |

## 実行順（必須）

### Step 1: JSON 鮮度ゲート

**AskQuestion 優先**（`project-page-info` の「進め方」に準拠）。

| 確認 | 選択肢の例 |
|------|------------|
| Figma の Variables / Styles を直した（または直した可能性）？ | `直した → Export 済み（続行）` / `直したが未 Export（中断）` / `触っていない（現行 JSON で続行）` / その他 |

- **未 Export** → **中断**。ユーザーにプラグイン Export → `.cursor/figma-tokens/` 上書きを**手順付きで依頼**し、完了報告を待って再開
- JSON が無い／明らかに古い → 同様に**依頼して中断**（エージェントはプラグインを実行できない）
- 両方いじって分岐が不明 → 先にユーザーへ Export を依頼し、JSON＝Figma に固定してから Step 2

Export は **常にユーザー作業**（Figma デスクトップのプラグイン）。エージェントは指示のみ。手順: `.cursor/figma-tokens/README.md`

### Step 2: 方向の選択

**AskQuestion** で次のいずれかを選ばせる。

| 方向 | 意味 | 適用 |
|------|------|------|
| **diff のみ** | Code ↔ JSON の表を出すだけ | 書込しない |
| **pull** | JSON → Code（差分キーのみ） | `_variables.scss` 等 |
| **push** | Code → Figma（差分キーのみ、MCP） | `use_figma` → **再 Export をユーザーに依頼** |

全面リセットが必要なら本スキルをやめ `@figma-tokens-setup` を案内する。

対象カテゴリが指定されていればそれに限定。無ければ diff 全カテゴリを出し、適用範囲を AskQuestion で絞る。

### Step 3: 差分（Code ↔ JSON）

1. `.cursor/figma-tokens/` と `_variables.scss`（必要なら `_effects.scss`）を読む
2. 対象カテゴリだけ突合（命名は `style.mdc` §2、マップ対応は tokens-setup `reference-json`）
3. 表を出す（承認前に **pull / push しない**）

```text
category | key | mode | Code | JSON | 操作候補
```

操作候補: `追加` / `変更` / `削除` / `スキップ（一致）`

### Step 4: 承認 → 適用

- **diff のみ**: 表を報告して終了
- **pull**: 承認された差分だけ JSON → Code。丸ごと差し替え・サンプル全消しが必要なら tokens-setup へ
- **push**: 承認された差分だけ MCP で Figma 更新（[reference.md](reference.md)「push」）。**PC/SP など変えていないモードは触らない**

push の TextStyles / EffectStyles が重い・失敗しやすい場合はプラグイン Import を案内してよい。

### Step 5: クローズ

| 方向 | 必須 |
|------|------|
| pull | 更新したキー一覧を報告 |
| push | **再 Export を手順付きで依頼**（プラグイン自動実行は不可）。ユーザー完了まで JSON は古いと明記し、「同期完了」にしない |
| 両方いじっていた | キー単位の採用結果を報告 |

## やらないこと

- 同期対象外（`$breakpoints` / `$style-settings` / `$transitions` 等）を同期しない
- modeId（例: `20:1`）のハードコード（モードは名前で解決）
- 承認前の `_variables` 編集・Figma 書込
- push 後に JSON 未更新のまま「同期完了」としない（再 Export 待ちと明示）
- 画面実装フェーズでの黙った既存キー上書き（本スキル呼び出し＝トークン調整として扱う）

## 関連

- 基盤の初回／全面: `@figma-tokens-setup`
- スナップショット配置: `.cursor/figma-tokens/README.md`
- 突合せ規則: `figma/style.mdc` §2〜6・§8
