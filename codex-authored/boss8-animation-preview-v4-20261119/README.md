# BOSS8 飛行小惡魔五動作試作（第四版：攻擊加速）

2026-11-19使用者提供已綁骨的 `BOSS8.glb`，要求自行製作五個動作，並先交GIF確認。貼圖維持使用者的暫代版本；沒有接入NPC或正式遊戲。試作分支 `codex/boss8-animation-preview` 設為 `codexSyncHold=true`，未核准前不參與develop同步。

| 動作 | 內容 | 原始時長 |
| --- | --- | --- |
| Walk | 拍翼懸浮飛行，身體上下浮動，屈腿與尾巴跟隨；原地循環供日後遊戲控制位移 | 1.6秒 |
| Attack1 | 高舉下揮與全身向右約180度跟轉，蓄力、出手、收招整段按第三版1.5倍速播放 | 1.7333秒 |
| Attack2 | 雙臂抬高45度劈向前下方，保留全身動作，整段按第三版1.25倍速播放 | 2.08秒 |
| Attack3 | 拉升預備、收翼俯衝撲擊，再展翼回復 | 2.4秒 |
| Die | 雙臂大開，短促掙扎的抖動幅度減半、速度增加50%、時間減半；接續保留原速墜落與側躺末姿 | 3.7667秒 |

動作全部以Blender4.5.10 LTS在使用者原70骨架上自行製作，網格、蒙皮及暫代材質沿用；沒有採用外部動作。第四版只調整兩攻擊的整段時序，保留所有動作路線及姿勢。blend使用150FPS時間軸，讓兩種指定倍率的結束時間皆對應整數幀；各曲線連同切線等比例縮放，GLB只新增獨立時間軌以保留原姿勢樣本和共享資料。Walk／Attack3／死亡的秒數保持。

第四版素材庫 `codex-authored/boss8-animation-preview-v4-20261119/` 保存來源GLB、打包貼圖的 `exports/boss8_preview.blend`、五動作GLB、GIF、製作／驗證工具、來源與雜湊清單，並記錄第三版來源的SHA-256。前面三版素材庫包與GIF保留供比較。專案只在 `docs/assets/previews/boss8/` 保存審查用GLB與GIF，新GIF為 `Attack1_v4.gif`、`Attack2_v4.gif`；死亡繼續使用 `Die_v3.gif`，沒有放進runtime模型目錄或修改玩家配置。

兩攻擊GIF沿用第三版實際Blender渲染的39張影格，只修改每幀播放時間，像素資料不變；與本次加速後的動畫時間一致。GIF使用10毫秒單位，攻擊1總長1.73秒（與動畫差約3.3毫秒）、攻擊2為2.08秒。其餘三GIF保留原檔，死亡末姿仍額外停留1秒。

死亡前段由62幀（2.0667秒）縮成31幀（1.0333秒）；抖動頻率獨立提高1.5倍，不跟隨整段時間壓縮成2倍。根骨、軀幹、雙臂和翼的掙扎振幅乘0.5，雙臂展開的基礎姿勢保留。最後4幀平滑銜接第二版墜落起點；原第62～144幀完整平移到第31～113幀，保留墜落和側躺速度、姿勢與接地。

Walk／Attack3仍沿用第一版，死亡沿用第三版；逐軌比對GLB樣本確認未變。尚未接入遊戲，也沒有新增模擬位移。角色面向-Y，左手為+X側 `Bone_036→Bone_035→Bone_034`。

重製與核對：

1. 第三版來源及原始製作流程見素材庫 `boss8-animation-preview-v3-20261119/README.md`，以下從已保存的第三版成品調時。
2. `blender -b --python-exit-code 1 -P tools/boss8/retime.py -- <v3.blend> <v3.glb> <v4-exports>`。
3. `blender -b --python-exit-code 1 -P tools/boss8/verify_retime.py -- <v4.blend> <v3.blend> <validation.json>`。
4. `node tools/boss8/verify_glb.cjs <v4.glb> <glb-qa.json> <v3.glb>` 核對全部五動作的姿勢樣本、時間和倍率。
5. `node tools/boss8/retime_gifs.cjs <v3-previews> <v4-previews>`，其餘三GIF複製原檔。
6. `node tools/boss8/export.cjs --apply` 同步審查檔；預設模式核對素材庫及專案雜湊。

數值QA包含全部動畫變形有限值、飛行離地、循環與攻擊回復銜接、死亡接地及末姿停止、預覽不裁切；另核對輸出GLB動作、時長、嵌入貼圖、四元數及緩衝區。GIF仍須使用者審查美術表現，通過數值檢查不代表動作已獲核准。
