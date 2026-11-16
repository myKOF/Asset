# 深淵領主第三款貼圖 BOSS6_3

使用者提供深紅色 `BOSS6_3.glb`。比對兩份使用者原檔，第一款和第三款逐面的 UV 完全相同。第三款使用原檔的底色、法線、金屬粗糙度貼圖，套在第一款已修好的模型上，沿用正面朝向、右手劍、左前臂盾、披風姿勢及五段動作。

- `BOSS6_3_source_user.glb` 保存使用者原檔。第一款的修整模型取自素材庫提交 `f7753ec7` 的 `codex-authored/boss6-dark-knight-approved-20261116/boss6_approved.glb`。
- `boss6_lv3_approved.glb` 保存第三款五段動作。可編輯的 `boss6_lv3.blend` 已封裝貼圖。
- `boss6_lv3.glb` 為遊戲匯出，可用 Idle-RPG 的 `node tools/boss6/build-game-glb.cjs <boss6_lv3_approved.glb> <boss6_lv3.glb>` 重製。三款遊戲模型的骨架、網格及關鍵影格資料一致。
- `boss6_abyss_lv3.png` 為以第三款模型渲染的封魔塔頭像及 2D 備援圖。

| 檔案 | SHA-256 |
| --- | --- |
| BOSS6_3_source_user.glb | `695225b050fffb2f68bc1d9229c61f13e1b045065b188ec30c8ffb31ee28b2be` |
| boss6_abyss_lv3.png | `ff1ecd05cd2a252d2882fa5db3b1d68cf9f5c74799459d93597a6678c2fa740f` |
| boss6_lv3_approved.glb | `9381ec922f2da5f6029af334c19ff8b4099d3f337bd65b3ae2d9d95565f6c77e` |
| boss6_lv3.blend | `d43036ced3d2558e693ef45fd3ff84a6ec9617c79773c93822b33aca176595b7` |
| boss6_lv3.glb | `073f9d8abe28ab88d8e1cfb0f60c060aa6b0bc07ba6475561195b4674e0570ae` |

## 攻擊 3 刀面角度

2026-11-16，將攻擊 3 約 1.14 秒處的刀面轉至與地面平行。平順調整前後的右前臂、手腕及獨立劍骨關鍵影格，三款共用同一套修正。
