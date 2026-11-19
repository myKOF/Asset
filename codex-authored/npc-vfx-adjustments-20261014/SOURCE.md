# NPC 特效調整來源

保存使用者於 2026-10-14 提交 aa81f68f「調整npc特效」的兩份 Preset 原樣副本：en-vortex.json、en-gold-dome.json。本次合併沒有重畫、改色或另改 Preset 數值，未引入外部素材；沿用既有已匯出貼圖。

遊戲漩渦配置同時保留 Claude 的 pullR／minPull 修正，依使用者原提交清空持續場域欄位。Preset 保留供後續使用，不因目前欄位清空而刪除。

2026-10-18 NPC-SHIELD-THIN：en-gold-dome 更新為遊戲目前正式版本，保留遊戲已有的loop、y=-30、glow縮放／alpha及shell／rim混色修訂，避免素材庫舊副本覆蓋遊戲設定。本次僅再換入 codex-authored/npc-shield 的兩張原創SVG細邊（亮邊半高寬各減半），並將glints黑底星芒改為add；位置、尺寸、動畫及其他數值保持遊戲原樣。來源與尺寸量測見該資料夾 SOURCE.md。

2026-11-20 NPC-SHIELD-EXACT-FIT：依使用者要求，金色護盾外殼實際寬高等於生成時模型可見輪廓的1倍，生成後固定尺寸並跟隨腳點；重新生成才重測。同步既有 fitBody 設定並指定 fitPadding=1，沒有變更共用預設倍率。以既有自製 thin-shell.svg 圓的幾何直徑乘上原圖層縮放，校正 sizing.authored.width／height；所有圖層中心改為 authored.height 的負一半，讓既有貼合公式對齊真正外殼中心。維持原圖層縮放、色彩、透明度、混色、粒子與動畫；SVG及其他貼圖未改，沒有引入外部素材。遊戲與素材庫Preset逐位相同。正式SVG經Runtime／Core的回歸驗證1倍寬高、中心、三種場景倍率、姿勢／半徑更新不重測及再次生成重測；以正式第6層BOSS模型與Pixi／Three隔離渲染核對。QA與完整測試紀錄存本次聊天visualizations，不作為正式素材匯入。
