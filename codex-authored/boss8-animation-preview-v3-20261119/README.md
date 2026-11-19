# BOSS8 飛行小惡魔五動作試作（第三版）

2026-11-19使用者提供已綁骨的 `BOSS8.glb`，要求自行製作五個動作，並先交GIF確認。貼圖維持使用者的暫代版本；沒有接入NPC或正式遊戲。試作分支 `codex/boss8-animation-preview` 設為 `codexSyncHold=true`，未核准前不參與develop同步。

| 動作 | 內容 | 原始時長 |
| --- | --- | --- |
| Walk | 拍翼懸浮飛行，身體上下浮動，屈腿與尾巴跟隨；原地循環供日後遊戲控制位移 | 1.6秒 |
| Attack1 | 保留全身向右約180度跟轉，角色左手高舉過頭後沿垂直弧線用力下揮，再收回飛行姿勢 | 2.6秒 |
| Attack2 | 保留全身收身、拉升後仰與前折，雙臂出手方向比第二版提高45度，雙爪劈向前下方 | 2.6秒 |
| Attack3 | 拉升預備、收翼俯衝撲擊，再展翼回復 | 2.4秒 |
| Die | 雙臂大開，短促掙扎的抖動幅度減半、速度增加50%、時間減半；接續保留原速墜落與側躺末姿 | 3.7667秒 |

動作全部以Blender4.5.10 LTS在使用者原70骨架上自行製作，網格、蒙皮及暫代材質沿用；沒有採用外部動作。GIF由實際可編輯成品渲染，30FPS動作每隔一幀渲染、15FPS原速播放，死亡額外停留1秒便於查看。

第三版素材庫 `codex-authored/boss8-animation-preview-v3-20261119/` 保存來源GLB、打包貼圖的 `exports/boss8_preview.blend`、五動作GLB、GIF、製作／驗證工具、來源與雜湊清單。第一、二版素材庫包與GIF保留供比較。專案只在 `docs/assets/previews/boss8/` 保存審查用GLB與GIF，新GIF為 `Attack1_v3.gif`、`Attack2_v3.gif`、`Die_v3.gif`；沒有放進runtime模型目錄或修改任何玩家配置。

死亡前段由62幀（2.0667秒）縮成31幀（1.0333秒）；抖動頻率獨立提高1.5倍，不跟隨整段時間壓縮成2倍。根骨、軀幹、雙臂和翼的掙扎振幅乘0.5，雙臂展開的基礎姿勢保留。最後4幀平滑銜接第二版墜落起點；原第62～144幀完整平移到第31～113幀，保留墜落和側躺速度、姿勢與接地。

使用者本輪認為攻擊3配合位移可保留，因此Walk／Attack3動作沿用第一版，另逐軌比對GLB樣本確認；尚未接入遊戲，也沒有新增模擬位移。角色面向-Y，左手為+X側 `Bone_036→Bone_035→Bone_034`，本版特別固定解剖側與左爪路線。動作速度以較長的蓄力、出手、慣性與回復分段呈現，不以GIF慢放取代重製。

重製與核對：

1. `blender -b --python-exit-code 1 -P tools/boss8/animate.py -- <BOSS8.glb> <exports>`。
2. `blender -b --python-exit-code 1 -P tools/boss8/verify.py -- <exports/boss8_preview.blend> <validation.json> <v2.blend>`（最後參數可選，用第二版比對雙臂抬角和保留的墜落段）。
3. `node tools/boss8/verify_glb.cjs <exports/boss8_preview.glb> <glb-qa.json> <v2.glb>`（第三參數可選，核對Walk及Attack3保持）。
4. `blender -b --python-exit-code 1 -P tools/boss8/preview.py -- <exports/boss8_preview.blend> <frame-dir>`。
5. `python tools/boss8/make_gifs.py <frame-dir> <previews> Attack1 Attack2 Die`（省略動作列表則編碼五個動作）。
6. `node tools/boss8/export.cjs --apply` 同步審查檔；預設模式核對素材庫及專案雜湊。

數值QA包含全部動畫變形有限值、飛行離地、循環與攻擊回復銜接、死亡接地及末姿停止、預覽不裁切；另核對輸出GLB動作、時長、嵌入貼圖、四元數及緩衝區。GIF仍須使用者審查美術表現，通過數值檢查不代表動作已獲核准。
