# 神祕商人自然斷面木牌

2026-11-19，由 Codex 內建 imagegen 原創生成，第二版依使用者要求去除整圈裝飾框與角釘，改為自然斷裂木紋邊緣與兩根樸素木柄。使用者明確核准「OK，就這個，接上吧」。

- 來源 `source.png`：核准第二版原始1501×1047 RGBA，未裁切或重畫。
- 匯出 `mystery-merchant-sign.webp`：等比768×536、Lanczos縮小、lossless WebP，保留alpha0～255。`export.py`保留製作參數；遊戲由既有 `tools/assets/export-mystery-merchant.cjs --apply` 同步，`--check`核對雜湊。
- `PROMPTS.json` 保存初稿及第二版完整提示詞；初稿為淘汰候選，不作正式素材。沒有使用外部圖像或第三方素材，現有店景僅作色調／用途參考。
- RPG Mote Studio 經web工具嘗試無法存取，改用內建imagegen製作此手繪質感素材。
- 文字、等級及升級按鈕由遊戲String表與DOM疊加，圖內不烘焙玩家文字。
