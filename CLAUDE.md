# GameBox

カードゲームを「頭の中からこの世に引っ張り出す」ための制作ツール。
初心者が迷わず楽しく最後まで作りきれる体験を最優先する。

## 技術構成

- Vite + React 19 / react-router-dom v7 / Zustand / Tailwind CSS v4
- jsPDF v4（カードPDF・ルールブックPDF）、dnd-kit、react-image-crop、@uiw/react-md-editor
- 永続化: localStorage（`gamebox_projects`）+ `useAutoSave`（2秒デバウンス）

## 画面フロー

`/`（LP・ジャンル選択）→ `/rules`（テンプレ選択→ルール設計+AIチェック）→ `/cards`（カード構成・仕様）→ `/cards/edit`（カードデザイン）→ `/order`（見積もり）→ `/export`（JSON / カードPDF / ルールブックPDF出力）
別導線: `/projects`（マイゲーム一覧。右クリックで複製/削除）

## 主要モジュール

- `src/store/gameStore.js` — 全状態。`rules.customSections[id]` は `{text}` または `{items:[]}`
- `src/hooks/useAutoSave.js` — 内容が書かれた時点でプロジェクト自動作成して保存。status は渡さない（完成状態を上書きしないため）
- `src/lib/projectStorage.js` — `save()` は既存とマージ（createdAt / status を保持）。新規時 status は draft
- `src/lib/generateRulebook.js` — A4横・両面・巻き折り16面。pt正確変換 + SCALE=5（約480dpi）。ブロック計測→greedy詰め込み（`packItems`）→縮小（FIT_SCALES）→末尾「…」。余り面はメモページ
- `src/lib/generatePdf.js` — カード単票PDF（表+裏）
- `src/lib/exportJson.js` — 発注JSON（rules全文 + custom_sections 含む）
- `src/lib/ruleChecker.js` — Claude APIを直接呼ぶAIルールチェック（`VITE_ANTHROPIC_API_KEY`、開発用）

## 検証

- `npx eslint src/ scripts/` / `npm run build`
- `node scripts/verify-rulebook-layout.mjs` — canvas/jsPDFをモックし、描画ブロックが面境界をまたがないか数値検証（重content・空contentの2ケース、期待値 overflows: 0）

## 進捗ログ

- `5481cc4` ルールブックPDFエンジン全面書き直し（印刷品質・自動レイアウト）+ 検証ハーネス
- `a3ea47d` 通し検証で見つけたデータフローバグ修正（自動保存がHome導線で動かない / customSectionsが`[object Object]` / 発注JSONにルール本文欠落 / 8面表記残り / lint 5件）
- `9070186` UX改善: JSON出力で「完成」化+完了バナー、見積もり画面でルールブックPDF実プレビュー、保存マージでcreatedAt/status保持、やり直し確認ダイアログ、coopテンプレでジャンル整合

## 次にやること（候補）

1. StepBar のステップ1「ジャンル」が LP（`/`）に戻る違和感の解消（マイゲーム導線との整理）
2. テンプレ選択後に選び直す導線がない（`/rules` はphase固定。テンプレ変更時のカード再提案も未対応）
3. CardEditor の体験改善（未読のまま: 大きいファイル。画像クロップ・レイアウト切替まわりの検証）
4. ルールブックPDFの実機印刷確認（折り順ガイドの向き・余白）
5. バンドル500kB警告 → jsPDF / md-editor の dynamic import 分割
