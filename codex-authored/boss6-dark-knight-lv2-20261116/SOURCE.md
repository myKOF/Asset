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
| boss6_lv2_approved.glb | `3badb5e2f014ddd8be6e1d432747a67675e0ee7dbd4cc103400ecdfccf0aa6df` |
| boss6_lv2.blend | `1b4badd9da3e6acfe199710eb0e3783d738257993f767271e3544340d237626f` |
| boss6_lv2.glb | `9dfbb0b814ea292c2e34254a5d6b7ce77d743161e60a4df4be592d8f59800a0b` |
