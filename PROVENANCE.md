# 素材庫來源與授權

素材庫本身不進版控（機器本地），所以這份清單是唯一集中記錄來源的地方。
**新增 package 時請一併更新這裡。**

## 為什麼需要這份檔案

2026-09-08 之前，庫裡的 package 全部是 CC0——不必署名、不必列出用了哪些，
所以授權從來不必想。`sci-fi-effects` 是第一個 **CC-BY** 素材：
用了就**必須署名**，而且那是跟著產品走的義務。

判斷點在**匯出**而不是收進庫裡：`tools/vfx/export-assets.cjs` 只匯出
preset 實際引用到的素材。所以

> 只要有任何一份 preset 引用了 CC-BY 的素材，遊戲就必須附上署名。

`vfx/shipped-assets.json` 是那份「實際出貨了什麼」的清單，
要確認目前有沒有這個義務，查它就知道。

## 各 package

### codex-authored/boss9-lizard-death-20261126

- 使用者2026-11-26授權自行設計四足野獸死亡，沒有提供死亡GIF；動作編排、姿勢、尾部餘勢與落地控制由Codex自行製作，沒有匯入外部圖片像素、音效或VFX。
- 來源為使用者模型與已核准第三招包內GLB／Blend，沿用73骨、原材質蒙皮與Walk／Idle／Attack1／Attack2／Attack3，僅附加4秒不循環的BOSS9_Death。核准來源GLB SHA256為c485d8e0a54221d11483cff639739bcb4552656bc9b26a56bd9ce95311e8498e；來源相對路徑與原生檔SHA見source/inputs.json。
- v2依使用者追加要求，胸頸及頭部明顯仰天張口約1秒後才接撐地失力、跪倒側翻，落地餘勢沉落後保持側躺；保存可編輯Blend／GLB、姿勢規格、製作與驗證工具、正常／慢放／側面GIF與必要QA。使用者後續要求完成並驗證後直接commit，保留GIF供檢查；尚未導入實戰，已核准第三招包保持。

### codex-authored/boss9-lizard-attack3-ref-20261125

- 2026-11-26定稿：使用者核准v6作為第三招並授權commit，GLB SHA256為c485d8e0a54221d11483cff639739bcb4552656bc9b26a56bd9ce95311e8498e；approval.json及manifest保存核准紀錄。提交前移除v3／v4／v5共18個候選預覽與本機比較暫存，只保留v6核准GIF／PNG、可編輯來源與必要驗證資料。核准範圍為動作資產，尚未接入實戰。
- 2026-11-26 v6：使用者認可v5節奏，另指出收招肩膀先回正、前臂與手掌分段轉向造成腕部扭折。新製作改為前臂配合手掌的軸向轉動，後甩之後整條手臂共用局部FK回位進度；保持已接受的半程接手、兩擊軌跡與1.5秒。v6預覽與製作工具歸檔，仍待視覺核准，不commit或導入實戰。
- 2026-11-26 v5：依使用者紅箭頭調整後甩的肩肘與手掌，使手肘向外下、前臂與指尖延續斜下方向。第二手在第一擊半程0.45秒已抬起，第二擊改0.64–0.81秒；總長1.5秒。加速抬手暫向外避開頭部，最高點接回核准Attack1下揮。v5正常／慢放／側面／路徑GIF與製作工具歸檔；v3／v4保留比較，仍待視覺核准，不commit或接入遊戲。
- 2026-11-26 v4：承接使用者對v3的回饋，兩擊下揮仍取核准Attack1；另自製收爪後甩曲線、提前另一手準備時間，並加入順揮擊小幅軀幹傾斜。第一擊2/3處另一掌已離開原位；收回至後甩前不落回接地掌位，總長仍1.5秒。v4正常／慢放／側面／路徑GIF與recovery.json歸檔，v3預覽保留比較，待視覺核准、不commit或接入遊戲。
- 2026-11-25 v3：使用者退回前版，要求刪除舊第三招並直接沿用核准Attack1的手臂／手掌方向與軌跡，另一隻手接續同樣揮法；依GIF先畫面左側再右側，完整1.5秒。舊動作由乾淨四動畫來源取代後重建，motion.json及六份舊預覽刪除；僅以GIF作節奏參考，沒有匯入其像素或刀光。
- 模型、材質、73骨與原四動作沿用已確認第二招包，輸入的素材庫相對路徑及SHA見source/inputs.json；新可編輯Blend包含模型及五個Action。前四動作及GLB原資料逐位保留。
- 新版以實際蒙皮掌面校正姿態，指節反向補償保持來源指向；compare_attack1.py直接重播核准GLB逐製作幀核對手部表面、掌面及指節，另驗骨長、足面、腕部軸向轉動與穿插。保存來源採樣、製作／獨立檢核／三視角擷取／編碼工具與必要QA，定稿保留v6預覽；本包不是VFX Preset。

### third-party/user-supplied/zone-music-20261125

- 2026-11-25：使用者明確要求提交自己的工作區修改，保存月影沼澤與亡靈山脈四首新增MP3，以及既有專案提交b3c84c35的熔岩山兩首。原檔逐位保留；第二首熔岩山音樂僅移除檔名中的意外空格，對齊原表格引用。
- Codex沒有下載、生成、選曲或轉碼，不推定未提供的第三方授權條款。manifest.json記錄各檔來源、專案路徑、位元組數及SHA256；遊戲與素材庫一致。
- 同輪保存使用者將升級特效vortexCount由170改為20的設定，沿用codex-authored/level-up的既有歸檔工具與來源雜湊，不新增美術來源。

### codex-authored/tower-boss3-lv3-20261108

- 2026-11-08：使用者提供同系列自製／自行生成的BOSS1_LV3.glb，要求沿用前版流程；套用第3關「骷髏王Ⅲ」，沿用已確認的遊戲使用與修改授權。新材質／UV全部來自該原檔，Running動作不採用，五動作沿用已認可版。
- 新融合網格重新拆出劍，重建右手下獨立Sword_R並100%剛性綁定；保留已認可MakeHuman MPFB CC0手套／握柄及60fps披風避碰骨。原始CC0檔、版本、參數與可編輯手部另保存。
- 套件包含新原檔、動作參考GLB、可編輯Blend、正式GLB／透明頭像、製作／匯出工具、來源SHA及Excel／格式／全骨蒙皮／幾何／GIF／遊戲QA。只換獨立NPC第3列，其他49列與數值保持。聊天預覽不進Git；前兩個BOSS套件保持。非VFX Preset，不加入VFX專用索引。

### codex-authored/tower-boss2-lv2-20261108

- 2026-11-08：使用者提供同一自製／自行生成 BOSS 的 BOSS1_LV2.glb 材質版，要求五動作沿用前版、劍重新拆分另綁骨，指定為第二個 BOSS「骷髏王Ⅱ」。沿用本聊天已確認的本遊戲使用及修改授權。
- 使用新原檔的 PBR／UV，對齊已認可模型，從新融合網格重新拆出劍並重建獨立右手劍骨。保留已認可 MakeHuman CC0 手套／握柄及60fps披風避碰、五動作；MakeHuman版本、原始CC0檔、參數及可編輯手部另保存。
- 本套件包含新原檔、已認可動作GLB、可編輯Blend、正式GLB／透明頭像、製作及匯出工具、來源SHA、原生Excel／蒙皮／幾何／GIF／遊戲接入QA。聊天GIF及中間影格不進Git；前一個BOSS與套件保持。非VFX Preset，不加入VFX專用索引。

### codex-authored/tower-boss1-3d-20261108-v3

- 2026-11-08：使用者已認可 v2 握劍手部，追加披風穿模修正，並指定封魔塔第一種 BOSS 命名「骷髏王」、接入遊戲。
- 原五個 GLB 與角色／貼圖／動作為使用者自製／自行生成，聊天已授權使用及修改；手部沿用官方 MakeHuman MPFB CC0 資產及 v2 的已認可成果。來源、版本、授權與參數完整保留，沒有新增外部美術來源。
- 在已認可 GLB 上以 Blender 增加 15×9 披風骨格，60 fps 烘焙實際身體／衣甲避碰；原手部、前臂、劍骨姿勢與時間逐樣比對。透明頭像由同一 GLB 實際渲染。
- 保存可編輯來源、已認可輸入、製作工具、GLB、正式頭像、來源／輸出 SHA、幾何／GIF／遊戲接入驗證。聊天預覽不納入 Git。詳見套件 manifest 與 project/docs/assets/TOWER_BOSS1_3D_SOURCE.md。非 VFX Preset，不加入 VFX 專用索引；前兩版保留。

### codex-authored/tower-boss1-3d-20261108-v2

- 2026-11-08：封魔塔 BOSS1 披風／握劍修訂，保留第一版套件。五個原始 GLB 為使用者自製／自行生成，已於聊天明確授權本遊戲使用及修改；沿用角色、貼圖、劍裝飾及五動作。
- 新手部採官方 MakeHuman MPFB 的 CC0 人體拓樸，版本 b1a2dc98776da9d1eea751b159d42cf61778fe2e，經 Blender 指骨握拳、擬合與權重修整。套件保存 base.obj、rig／weights.mixamo.json、LICENSE.ASSETS.md、MakeHuman 完整參數／來源 SHA、人體及手部可編輯 Blend，並隨遊戲匯出 CC0 授權原文。
- 使用者的兩張握劍參考圖僅作姿勢判讀，未匯入套件。披風／手臂動畫及握柄由 Codex 編修；五動作保持原時長。第三招正面 0.2 倍速只供聊天 GIF 檢視。
- manifest.json 記錄來源、工具、可編輯檔、GLB 及 QA；project/docs/assets/TOWER_BOSS1_3D_SOURCE.md 記錄重建與限制。PNG／GIF 不納入 Git；保留渲染與 GIF 驗證結果。此 3D 模型不是 VFX Preset，不加入 VFX 專用索引。

### codex-authored/equipment-icons-20261031

- 2026-11-01：依使用者實際裝備欄截圖要求，使用內建 imagegen 對全部28張做黑底移除；新增 alpha-sources，保留原始黑底來源，遊戲匯出改為帶實際alpha的透明RGBA PNG。source.json保留原生圖與去背來源雜湊及提示，alpha-validation.json記錄逐圖透明像素與角落驗證。

- 使用者委託 Codex 使用 OpenAI 內建 imagegen 原創生成，已確認布衣與皮靴風格，並追加授權八張硬甲及全部換上。
- 20 張名稱專屬裝備與 8 張通用硬甲；只參考本專案既有裝備圖及本批已核准生成圖，未匯入外部第三方素材。
- 原生生成 PNG、去背來源、實際提示詞、1024 RGBA PNG 匯出、SHA256 及可重現的尺寸／alpha保留正規化和逐檔複製工具保存在該 package。詳見 source.json；export.cjs 接受遊戲根目錄與 --apply／--check。
- 這些為靜態裝備圖示，沿既有 images/equip 與 images/icon 路徑引用，不是 VFX Preset，不加入 VFX 專屬匯出索引。

| package | 來源 | 授權 | 署名義務 |
|---|---|---|---|
| `codex-authored/start-menu-title-20261106` | Codex 依使用者參考圖委託內建 ImageGen 製作，保留兩張來源及透明 WebP，詳見套件 SOURCE.md | 專案自製 | 無 |
| `third-party/google-fonts/start-menu-20261106` | Google Fonts 的 Cinzel 與 Noto Serif TC，兩份 700 字重 WOFF2 | SIL OFL 1.1 | 隨字型保留著作權及授權原文 |
| `particle-pack` | Kenney (kenney.nl) | CC0 | 無 |
| `light-masks-1.0` | Kenney (kenney.nl) | CC0 | 無 |
| `smoke-particles` | Kenney (kenney.nl) | CC0 | 無 |
| `splat-pack` | Kenney (kenney.nl) | CC0 | 無 |
| `foliage-sprites` | Kenney (kenney.nl) | CC0 | 無 |
| `new_materials` | 匯整自多個 CC0 來源 | CC0 | 無 |
| `shape-alpha` | 紋章／裝飾剪影包 | `PDAlpha_017.png`：使用者2026-10-22確認已授權可用於本專案；其餘未提供授權資訊 | 僅確認本次指定檔案，不推定整包為CC0 |
| `spritemancer-vfx` | CodeManu「VFX Free Pack」(OpenGameArt) | CC0 | 無 |
| `spritemancer-vfx-256` | 上者的衍生（shrink-sheets.cjs 降解析） | CC0 | 無 |
| `sci-fi-effects` | **Skorpio** (OpenGameArt) | **CC-BY 4.0** | **要署名** |
| `sci-fi-effects-sheets` | 上者的衍生（pack-sequence.cjs 拼成圖集） | **CC-BY 4.0** | **要署名** |
| `spell-sheets` | 使用者提供，來源不明 | **未附授權檔** | **待確認** |
| `claude-authored` | Claude 以程式產生（各子目錄附 SOURCE.md 與產生器，可重現），不含第三方素材 | 專案自製 | 無 |
| `characters/knight-hd` | 使用者提供的「2D HD Character Knight」素材包（2026-09-22，只收用到的 6 個動作，說明見套件內 README） | **未附授權檔** | **待確認**（遊戲主角已經在用，不走 export-assets 匯出，由 `tools/build_character_sprites.cjs` 產生遊戲版） |
| `GandalfHardcore Hell Asset Pack 32x32`（The Damned Enemies and NPCs） | GandalfHardcore（itch.io），使用者購入 | 套件 READ ME：可用於商業／非商業遊戲並可修改；禁止轉售、重新包裝散布、AI 訓練、NFT、納入遊戲開發工具 | 無署名義務；**不得單獨散布素材檔**。有「covered」（遮蔽）版的角色一律用 covered 版，未遮蔽版未使用。2026-10-31 起以 `tools/npc-sprites/build_npc_sprites.py` 切成 `images/sprites/npc/` 給 NPC 使用 |
| `Monsters Creatures Fantasy 2` | 使用者購入 | **套件內未附授權檔**（使用者 2026-10-31 明確指示使用於遊戲 NPC，並表示為付費取得） | **待補授權文件**；同上，經 `build_npc_sprites.py` 切成 `images/sprites/npc/`（Bat／Mimic／Rat／Slime） |

## sci-fi-effects — 署名怎麼寫

作者自己在 Readme.txt 裡寫的要求：

> Just add my nickname "Skorpio" to the credits and list which assets you use
> with the corresponding license. You can also add a link to the specific page
> on opengameart.org if you want.

也就是要：**署名 Skorpio ＋ 列出用到哪些素材與其授權**。
衍生的 `sci-fi-effects-sheets` 只是把同一批圖拼成圖集，義務完全相同。

## 兩個待確認的

`shape-alpha/PDAlpha_017.png`：2026-10-22，使用者在提交確認中直接回覆「已授權」，確認可用於本專案；本次由 en-wall-warn 引用。此紀錄不自行推定CC0或擴及同套件其他圖片。

其餘 `shape-alpha` 與 `spell-sheets` 尚未在本紀錄提供來源與授權；新增使用前仍須逐項確認。

## tower-treant-20261109（Codex，2026-11-09）

`codex-authored/tower-treant-20261109`：使用者本聊天提供BOSS2_Walk、Attack1／2／3及Die五檔，自製／自行生成並已授權遊戲與修改。以走路原始網格／材質／骨架合併五動作，攻擊水平根位移固定，保留跳躍與死亡。透明頭像為模型渲染，沒有武器或第三方美術。保存五原檔、正式匯出、可編輯Blend、製作工具與SHA／QA；manifest列出精確雜湊。第2關樹人，原骷髏王套件保持。
