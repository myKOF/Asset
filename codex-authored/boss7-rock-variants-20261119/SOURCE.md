# 岩石怪第二與第三套材質

使用者於2026-11-19提供BOSS7_2.glb、BOSS7_3.glb並要求沿用第一套五動作接入Idle-RPG。原檔保存於sources，未另外引入第三方素材，未另行宣稱來源授權條款。

兩份網格與核准第一套13739頂點／9998三角面及UV一致，最大位置差低於0.000002米；因來源骨長略異且第三套多8根食指骨，採相同表面的材質移植，保留第一套骨架、蒙皮、幾何與五個動作，避免重定向漂移。Blender4.5.10完成材質替換、GLB匯出及1080透明上半身頭像。可編輯來源、QA與正式輸出在exports。

依賴：素材庫codex-authored/boss7-rock-20261119/exports/boss7.blend（提交06600ae）。製作命令：blender -b --python-exit-code 1 -P prepare_variant.py -- <approved.blend> <sources/BOSS7_2.glb或BOSS7_3.glb> <exports> <2或3>。動作Walk／Attack1～3／Die與首套一致。
