# BOSS8飛行小惡魔試作來源

使用者2026-11-19提供BOSS8.glb（已綁骨、貼圖暫用），明確要求自行製作飛行移動、三攻擊及死亡，先交GIF。來源保存在sources/BOSS8.glb，SHA-256見exports/motion-qa.json。未額外引入第三方模型、材質、動作或音效，未另行宣稱來源授權條款。

所有五段動作由Codex使用Blender4.5.10 LTS自行製作於原70骨架，保留原模型與暫代貼圖。exports/boss8_preview.blend打包貼圖、五動作與預覽攝影／燈光／地面；exports/boss8_preview.glb僅含角色及五動作，地板與攝影器不進GLB。保留關鍵姿勢PNG作為QA參照。previews為真實Blender逐幀渲染編碼的GIF，原速15FPS，死亡末姿額外停留1秒。

狀態：僅供審查，尚未使用者核准，不接遊戲、不合併develop。codex/boss8-animation-preview已設codexSyncHold。素材庫保存來源與可編輯檔，遊戲專案docs/assets/previews/boss8僅保存審查用GLB及五份GIF。重製指令見README.md，工具保存在tools/。
