# 深淵領主第二款貼圖 BOSS6_2

使用者提供青紫色 `BOSS6_2.glb`，並確認移動、三段攻擊、死亡五段 GIF。原始兩款模型逐面的貼圖座標完全一致。第二款把使用者提供的底色、法線、金屬粗糙度貼圖套進第一款驗收模型，沿用已分離的右手劍、左前臂盾、披風、骨架及五段關鍵影格。

- `BOSS6_2_source_user.glb` 是使用者提供的原檔。第一款骨架與網格取自素材庫提交 `f7753ec7` 的 `codex-authored/boss6-dark-knight-approved-20261116/boss6_approved.glb`。
- `boss6_lv2_approved.glb` 是五段 GIF 對應的模型，`boss6_lv2.blend` 為可編輯版本，貼圖已封裝。
- `boss6_lv2.glb` 是遊戲使用的模型。執行 Idle-RPG 的 `node tools/boss6/build-game-glb.cjs <boss6_lv2_approved.glb> <boss6_lv2.glb>` 可重建。模型使用與第一款相同的遊戲攻擊根位移處理。
- `boss6_abyss_lv2.png` 取自第二款模型，作為封魔塔頭像與 2D 備援。

| 檔案 | SHA-256 |
| --- | --- |
| BOSS6_2_source_user.glb | `413bb8f1c67007fd705752c0b772bce989257c360db9187c05ec5f592187d0a2` |
| boss6_abyss_lv2.png | `4a7a9b62f74f22c7148dc215bc32e8ef2fea4252f639dfaf837776e41aa57ccf` |
| boss6_lv2_approved.glb | `4891a4e94e0a6e3aa9dfabfa4c7642292982f62ae64081223c6e3d026d726711` |
| boss6_lv2.blend | `390d2f360472d4c8a0a2eafa144b0f7500dbf5b6882ebc836bf04bb8a03cf836` |
| boss6_lv2.glb | `c467d30c26ac56839c4f05bb82695e80f0fd320d2583f79b3cb79d8c9a79a060` |

## 攻擊 3 刀面角度

2026-11-16，將攻擊 3 約 1.14 秒處的刀面轉至與地面平行。平順調整前後的右前臂、手腕及獨立劍骨關鍵影格，三款共用同一套修正。
