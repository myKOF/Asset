# BOSS7 岩石怪第一套材質

來源：使用者於 2026-11-19 提供的 BOSS7_Walk、Attack1、Attack2、Attack3、Die 五份 GLB，並明確要求接入 Idle-RPG。本任務依該指示匯入，沒有另外下載或引入第三方模型、貼圖或動作，也未對來源另行宣稱授權條款。原檔保存於 sources/，SHA-256、原始動作名及時長見 exports/model-qa.json。

Blender 4.5.10 LTS 合併五個同骨架動作，保留原材質及動作時長，命名為 Walk、Attack1～3、Die；站立取 Walk 首幀。exports/boss7.blend 是打包貼圖、五動作與頭像攝影／燈光的可編輯來源；exports/boss7.glb 與 boss7_rock.png 是正式遊戲輸出。頭像採完整面部及上半身特寫。製作腳本 prepare.py，重製命令見遊戲 docs/assets/BOSS7_SOURCE.md。
