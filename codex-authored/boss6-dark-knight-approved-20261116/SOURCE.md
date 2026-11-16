# 深淵領主 BOSS6 素材來源

遊戲採用使用者驗收的右手持劍、左前臂佩盾版本，並依其後續指示加入站姿、跑步及三段攻擊的披風下垂。布料由背部三條骨鏈控制，落地時由腰腿與地面間距約束旋轉。死亡與落劍沿用驗收時的動畫軌跡。工作項目為 `BOSS6-APPROVED-INTEGRATION-20261116`。

- `boss6.blend` 為可編輯的 Blender 檔，含五段動作與貼圖。
- `boss6_approved.glb` 為披風更新後的五段動作合成模型。披風更新前的驗收檔 `BOSS6_UprightRun_SharpTip.glb` 的 SHA-256 為 `a01c79592b41cb3dfa56d0899145f118c709d0fe9581e8ea449925ad44f44afd`。
- `boss6.glb` 為遊戲匯出。可用 Idle-RPG 的 `node tools/boss6/build-game-glb.cjs <boss6_approved.glb> <boss6.glb>` 重製。匯出同步移除三段攻擊的骨盆與獨立劍骨水平根位移，保留跳躍高度及握劍相對位置。
- `boss6_abyss.png` 以此角色的頭部與裝甲渲染，供封魔塔頭像及 2D 備援使用。

| 檔案 | SHA-256 |
| --- | --- |
| boss6.blend | `b193c2e94be436ed372ea7672b732beb2a040cb90a789d68a435728abfb71468` |
| boss6_approved.glb | `192d23f35e1f329f6eb0717b879647dc25a2167396e4862eff9111b96d1649a6` |
| boss6.glb | `5036268ce33b0f053826196f952f838e0fcb384adfcfe1c8d85c5391ab14d002` |
| boss6_abyss.png | `5038ccd8b871677e45a8d38e81e0bf82164b41351d18e2a758a9ad61504449e7` |

原始五份使用者提供的 GLB 已收在素材庫 `claude-authored/boss6-dark-knight-20261116/`。以下五個原始檔逐一與使用者提交的檔案核對雜湊。角色、武器及動畫的後續調整以此資料夾的 Blender 檔為準。

| 使用者原始檔的素材庫副本 | SHA-256 |
| --- | --- |
| BOSS6_Walk_source_user.glb | `ab37aa91470a18146e555e13f1dd5b596c16f2285ac8bb8b8353200d49fd34be` |
| BOSS6_Attack1_source_user.glb | `24448601099f30bdb9046911904c3f9f4d035d00b8c65cb009135ec14885b4be` |
| BOSS6_Attack2_source_user.glb | `2b8be65d7a06e7a227afd09f4c28b247ea5b3b7ead3ae0e3b140a8422e10a5bf` |
| BOSS6_Attack3_source_user.glb | `b20abe169fa1b8ce82cb912385a9e046cd5e63a1abe69c97094f9c569bcae5bc` |
| BOSS6_Die_source_user.glb | `51b37a86b5197cda69d1f057e8cbb5b020e189bd85a706fcc853e17641076b08` |
