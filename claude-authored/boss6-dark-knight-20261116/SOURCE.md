# BOSS6 黑暗騎士 來源與交接

- 任務：BOSS6-DARK-KNIGHT-20261116，Claude。使用者提供第6隻BOSS的五個動作（各一個 GLB：同一個網格與骨架，每個檔案一個動畫），並要求修三個問題後接為第6隻封魔塔BOSS：頭望向左側要改成望向前方；劍黏在手上且沒有骨骼，要拆下重裝在右手、單手正握、劍身朝上；盾牌黏在右手上，要拆下重新拼好接到右前臂。使用者自製／提供素材，沒有引入其他外部素材。
- 重建：`blender -b -P tools/boss6/build_boss6.py -- <放五個 BOSS6_*.glb 的資料夾> <輸出.glb>`，再 `node tools/boss6/lock-root.cjs <輸出.glb> <遊戲用.glb>`。

## 檔案與 SHA-256

| 檔案 | SHA-256 |
| --- | --- |
| `BOSS6_Attack1_source_user.glb` | `24448601099f30bdb9046911904c3f9f4d035d00b8c65cb009135ec14885b4be` |
| `BOSS6_Attack2_source_user.glb` | `2b8be65d7a06e7a227afd09f4c28b247ea5b3b7ead3ae0e3b140a8422e10a5bf` |
| `BOSS6_Attack3_source_user.glb` | `b20abe169fa1b8ce82cb912385a9e046cd5e63a1abe69c97094f9c569bcae5bc` |
| `BOSS6_Die_source_user.glb` | `51b37a86b5197cda69d1f057e8cbb5b020e189bd85a706fcc853e17641076b08` |
| `BOSS6_Walk_source_user.glb` | `ab37aa91470a18146e555e13f1dd5b596c16f2285ac8bb8b8353200d49fd34be` |
| `boss6_abyss.png` | `b0da96ea2304442473c9ad187232e370942b754baadf1e6ab0fa592d71c01843` |
| `boss6_game.glb` | `0ac0af247663045ec7c4267936af332af97b79b5b6df36ebc2ca5691bf24ccc8` |
| `boss6_with_root_motion.glb` | `962cd57f20c8cd6126e99bf304841c987f658bb2d896efd2e7f6aaacd04fe7cc` |

- `boss6_game.glb`＝遊戲用（`images/models/npc3d/boss6.glb`）：攻擊1／2／3 的 Hips 水平位移固定（與BOSS3相同，位移由遊戲驅動），其餘同 `boss6_with_root_motion.glb`。`boss6_abyss.png`＝1080 透明頭像。

## 三個問題怎麼修

1. **頭朝向**：用頭盔頂點的鏡像對稱搜尋量出它向角色左側轉了約 30°，把權重在 Head／HeadTop_End／headfront 的頂點繞頭骨頭端的垂直軸轉 -30°（跟權重比例混合，頸部自然過渡）。
2. **劍**：原模型是單一焊死的網格（5,131 個焊接頂點、1 個連通塊），劍與盾沒有獨立網格也沒有骨骼。依幾何（沿劍軸的半徑剖面＋劍骨權重）選出 750 個面，拆成獨立零件；手握的那一段原本被手套包住，所以補一根圓柱握把（貼圖取自握把原有的皮革 UV）。劍尖與靴子黏在一起的殘片刪除並收成尖。整把劍繞劍面法線翻轉 180°，讓劍尖朝上（微前傾 6°），十字護手在拳頭上方 0.11 m；新骨 `Sword_R` 掛在 `mixamorig:RightHand`，劍的每個頂點 100% 綁它（剛體）。
3. **盾**：依左手／左前臂權重與位置選出 1,189 個面拆成獨立零件，新骨 `Shield_L` 掛在 `mixamorig:LeftForeArm`（使用者說「右前臂」；這隻BOSS的盾在角色左手，我接在持盾的那隻前臂上，見下方注意），100% 綁定。

## 骨架與動作

52 根關節：原 50 根（Mixamo 骨架＋披風等 Bone_xxx）＋ `Sword_R`、`Shield_L`。原本只用來帶劍盾的舊骨（Bone_027／028／045 等）的權重併回對應的手。動作（30 fps）：`Walk` 0.8 s（原名 Run_03，循環）、`Attack1` 3.167 s（Left_Slash）、`Attack2` 5.867 s（Basic_Jump，跳起重擊）、`Attack3` 2.2 s（Charged_Slash）、`Die` 2.967 s（Dead）。

## 注意／未完成

- 盾牌接的是**左**前臂（原模型的盾就在角色左手，右手拿劍）；使用者的描述是「右前臂」，疑似筆誤，若真要改到右前臂請告知。
- 劍的握把是補上的圓柱，不是原模型的幾何；近看手套與握把交界有細節落差。
- 披風與劍／盾沒有碰撞，動作大時可能穿插。
