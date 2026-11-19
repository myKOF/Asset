# BOSS8 飛行小惡魔五動作試作（第二版）

2026-11-19使用者提供已綁骨的 `BOSS8.glb`，要求自行製作五個動作，並先交GIF確認。貼圖維持使用者的暫代版本；沒有接入NPC或正式遊戲。試作分支 `codex/boss8-animation-preview` 設為 `codexSyncHold=true`，未核准前不參與develop同步。

| 動作 | 內容 | 原始時長 |
| --- | --- | --- |
| Walk | 拍翼懸浮飛行，身體上下浮動，屈腿與尾巴跟隨；原地循環供日後遊戲控制位移 | 1.6秒 |
| Attack1 | 全身側身，角色左手向後蓄力，沿前方200度圓弧掃出；身體跟轉約180度至右側，延續慣性後收回 | 2.6秒 |
| Attack2 | 收身屈腿、拉升後仰、雙爪大幅下劈；軀幹前折、腿翼尾協調，反彈後回復飛行 | 2.6秒 |
| Attack3 | 拉升預備、收翼俯衝撲擊，再展翼回復 | 2.4秒 |
| Die | 雙臂大開、交錯揮舞與全身失衡掙扎；其後失速墜地，身體側躺、收翼並保持末姿 | 4.8秒 |

動作全部以Blender4.5.10 LTS在使用者原70骨架上自行製作，網格、蒙皮及暫代材質沿用；沒有採用外部動作。GIF由實際可編輯成品渲染，30FPS動作每隔一幀渲染、15FPS原速播放，死亡額外停留1秒便於查看。

第二版素材庫 `codex-authored/boss8-animation-preview-v2-20261119/` 保存來源GLB、打包貼圖的 `exports/boss8_preview.blend`、五動作GLB、GIF、製作／驗證工具、來源與雜湊清單。第一版素材庫包與GIF保留供比較。專案只在 `docs/assets/previews/boss8/` 保存審查用GLB與GIF，第二版三份新GIF使用 `Attack1_v2.gif`、`Attack2_v2.gif`、`Die_v2.gif` 避免和第一版混淆；沒有放進runtime模型目錄或修改任何玩家配置。

使用者本輪認為攻擊3配合位移可保留，因此Walk／Attack3動作沿用第一版，另逐軌比對GLB樣本確認；尚未接入遊戲，也沒有新增模擬位移。角色面向-Y，左手為+X側 `Bone_036→Bone_035→Bone_034`，本版特別固定解剖側與左爪路線。動作速度以較長的蓄力、出手、慣性與回復分段呈現，不以GIF慢放取代重製。

重製與核對：

1. `blender -b --python-exit-code 1 -P tools/boss8/animate.py -- <BOSS8.glb> <exports>`。
2. `blender -b --python-exit-code 1 -P tools/boss8/verify.py -- <exports/boss8_preview.blend> <validation.json>`。
3. `node tools/boss8/verify_glb.cjs <exports/boss8_preview.glb> <glb-qa.json> <v1.glb>`（第三參數可選，核對Walk及Attack3保持）。
4. `blender -b --python-exit-code 1 -P tools/boss8/preview.py -- <exports/boss8_preview.blend> <frame-dir>`。
5. `python tools/boss8/make_gifs.py <frame-dir> <previews> Attack1 Attack2 Die`（省略動作列表則編碼五個動作）。
6. `node tools/boss8/export.cjs --apply` 同步審查檔；預設模式核對素材庫及專案雜湊。

數值QA包含全部動畫變形有限值、飛行離地、循環與攻擊回復銜接、死亡接地及末姿停止、預覽不裁切；另核對輸出GLB動作、時長、嵌入貼圖、四元數及緩衝區。GIF仍須使用者審查美術表現，通過數值檢查不代表動作已獲核准。
