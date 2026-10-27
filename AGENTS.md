# AGENTS.md — My ACM Journey

> 面向 AI 编码 Agent 的架构决策、子系统防腐契约与技术边界指南。  
> 人类贡献者指引、开发启动与加新面板流程详见 [README.md](README.md)。

---

## 1. 核心架构与技术栈

- **定位**: 像素风 2D 横版传记游戏，记录作者 ACM/XCPC 竞赛历程。4 座城市关卡（南昌→深圳→桂林→重庆）。
- **技术栈**: Phaser 3.60 + 原生 HTML5/CSS3/JavaScript (ES Modules)，无打包构建步骤。
- **画布规格**: 960×540，Arcade 物理，`Phaser.Scale.ENVELOP` 智能居中自适应。
- **路径不可变契约**: `fonts/`、`js/Photo/`（含 `Awards/`）与 `js/Audio/` 路径在多处代码硬编码，严禁重命名或移动目录。特别注意背景图历史拼写：深圳为 `ShenZheng.webp`（带 g），重庆为 `ChongQin.webp`（少 g），切勿擅自修改防 404。

### 场景生命周期流转
```
BootScene (纹理/动画生成) ──→ MenuScene (DOM主菜单) ──→ LoadingScene (关卡资源加载) ──→ LevelScene (游戏核心循环)
```
- **进关流程**: 菜单 Start/Continue → `LoadingScene`（带进度条与动态时长）→ `LevelScene`。
- **换关机制**: `LevelScene.goNextLevel()` → 渐隐 → `scene.restart({lvIdx: next})` 或 `showEndScreen()`。关卡间不重进 LoadingScene，依赖预热与 preload 兜底。
- **返回菜单**: Home 按钮或通关屏点击 → 渐隐 → `scene.start('MenuScene')`，同时清空 BGM 注册表与预热图缓存。

---

## 2. 关键子系统与防腐契约

### 2.1 资源加载与预热 (AssetHelper.js)
1. **当前关初始 (LevelScene.create)**: 零延迟触发当前关 DOM 剧情图后台异步预热 (`preloadMemoryImages`)。
2. **主加载 (LoadingScene.preload)**: Phaser 层加载当前关 bg/foreground/bgm/npc，按排队数动态展示 260/520/900ms 最小时长，监听 `FILE_LOAD_ERROR` 记录异常。
3. **后台预热 (LevelScene._preloadBackgroundAssets)**: 进关 1.5s 后静默预热下一关 DOM 剧情图与 Phaser 资源（包括前景；末关预热 GameOver 图）。
4. **Fallback 降级**: 背景图缺失回退纯色占位与渐变；前景图缺失时跳过前景叠加并保留可玩场景；BGM 缺失跳过播放并清理 registry；NPC 缺失直接跳过该精灵生成。加载失败严禁阻塞进关。
5. **重试机制**: 图片预热超时 12s，支持 2 次重试（延迟 350ms）。

当前四关的前景路径由 `story.js` 的 `foregroundImage` 配置，经 `AssetHelper` 排队为 `foreground_${lvIdx}`。有背景纹理且关卡声明前景时，前景沿用背景的位置、原点、缩放与滚动系数；前景文件本身加载失败不会阻止游戏，也不会抑制阴影。

### 2.2 玩家物理与方块交互 (LevelScene.js)
- **参数矩阵**: 重力 900，跳跃初速度 -340 (固定高度)，Coyote Time 90ms，Jump Buffer 110ms，最大速度 207，水平加速度 ACCEL 1800，阻尼 DRAG 1500。速度 `< 30` 切回 idle。
- **下落净加速度（2.8g 等效）**: 基础重力 `gravityY = 900`；角色滞空下落（`velocity.y > 0`）时额外施加 `accelerationY = 900 * 1.8 = 1620`，下落段向下总有效加速度为 `2520 px/s²`（约 2.8 倍重力感）。非下落段 `accelerationY` 严格清零，避免对冲起跳。
- **碰撞盒每帧贴合**: `qblock` 属于 `staticGroup`，上下浮动动画必须在 `onUpdate` 触发 `block.body.updateFromGameObject()` 确保每帧 0 错位；顶中方块时必须先调用 `this.tweens.killTweensOf(block)` 杀死浮动 tween，避免反馈动画双重冲突。
- **方块顶击门禁 (canHitBlock)**: 触发顶块必须同时满足：未收集、弹窗未开、`player.body.velocity.y < 0`（处于上升阶段）且 `player.body.top < block.body.bottom + 12`（12px 容差门禁，防止贴侧面跳跃误触）。
- **顶块反馈与弹窗冻结**:
  - 方块弹跳 8px（120ms）后变暗（`tint: 0x444444`, `alpha: 0.45`），玩家施加向下微冲量 `setVelocityY(50)`，爆开 `particle_star`。
  - 触发方块弹窗（`hitBlock`）时必须显式调用 `player.setAccelerationX(0)`，防止弹窗期间持续滑行穿模。
- **边界与虚空保护**:
  - 虚空掉落（`y > CFG.H + 200`）与左边界越界：传送回起点 `(100, CFG.H - CFG.GROUND_H - 41)` 并重置速度与镜头。
  - 右边界越界：仅在 `collected < totalBlocks`（未全收集）时重置回起点；方块全收集后右边界放行，允许玩家右行等待 1s 延迟换关。
- **镜头跟随**: `startFollow(player, true, 0.12, 0.05)`，死区 `setDeadzone(120, 60)`。
- **前景遮挡与双层地面阴影**: 背景深度 `-100`、外层与接触阴影 `-1`、玩家 `0`、前景 `1`、HUD `20`。前景复用背景变换和 `BG_SCROLL`，不增加碰撞；两层椭圆阴影固定在地面，唯一 `postupdate` 监听根据玩家碰撞盒底部更新水平位置、缩放与透明度，场景 `shutdown` 时解除监听并清空引用。阴影要求背景已创建且该关配置了 `foregroundImage`；前景文件缺失时仍保留阴影。
- **前景方案边界**: 四站前景 PNG 与原背景使用相同画布坐标（当前为 3200×1344 RGBA），只包含需要压到玩家上方的透明图层。现有方案沿用 `BG_SCROLL = 0.2`，没有为前景单独设置视差，也没有重建底图道路或地面透视。
- **城市受光与氛围 (CityAtmosphere.js)**: `LevelScene.create()` 调用 `createCityAtmosphere()`，当前按 `cityEn` 仅对桂林和重庆启用。桂林为低强度双层雨丝、远山薄雾和人物冷色染色；重庆为与底图同滚动系数的夕阳柔光、稀疏微尘和人物暖色染色，暖光强度按人物投回底图的横向位置渐变。纹理由程序生成并通过纹理 key 去重，不增加外部素材请求；背景缺失时直接跳过。
- **氛围生命周期与层级**: 雾 / 柔光深度 `-90`，远雨 `-85`，近雨 / 微尘 `2`，HUD 保持 `20`。桂林雨粒子存活上限为 24 + 12，重庆微尘上限为 10。每个启用关卡仅注册一个氛围 `postupdate` 监听；`shutdown` 时解除监听、销毁氛围对象并清空 `cityAtmosphere` 引用，仍存活的人物清除染色。不得修改物理或移动已与底图配准的前景。

### 2.3 NPC 系统
- 数据配置于 `story.js levels[].npcs[]`（关卡 1 配置 Kirby）。
- Phaser 纹理与动画必须经由 `getNpcAssetKey(lvIdx, key)` 与 `getNpcAnimKey(lvIdx, key)` 命名空间隔离。
- 靠近 80px 显示 `!` 提示，停留满 `triggerTime` 展开气泡对话框（`Back.easeOut` 弹性缩放 + 42ms 打字机渐进吐字 + 完成后 `Sine.easeInOut` 呼吸浮动）。场景 `shutdown` 时安全清理全部 tween。

### 2.4 BGM 音频
- key 格式为 `bgm:${path}`，通过 Phaser 全局 `registry` 共享 `_bgmKey` 和 `_bgmObj`。
- 跨关同曲不重启；切关换曲 stop 旧播新；回菜单或通关 screen 点击时 stopAll + 清空 registry；缺失时静默降级。

### 2.5 字体系统与渲染门禁
- **字体资产与本地化**: 核心艺术字体（HUD 像素字 `'Press Start 2P'`、科技主标题 `'Orbitron'`、通用无衬线 `'Outfit'`）已全部本地化为 WOFF2 存于 `fonts/` 目录，由 `styles/fonts.css` 声明，首要保证主界面与游戏内零延迟；中文使用 `'Noto Sans SC'`（国内镜像按需加载）；剧情弹窗与通关页统一采用复古等宽字体 `'Courier New', Courier, monospace`。
- **两级字体门禁**:
  1. **DOM 级门禁 (`index.html`)**: `<link rel="preload">` 预加载核心字体，配合 Promise + 300ms 快速超时（切换 `fonts-loading` / `fonts-ready` class 并隐形预度量），防止主界面 FOUT 文本闪烁。
  2. **Canvas 级门禁 (`main.js`)**: 启动 Phaser 前通过 `document.fonts.load('14px "Press Start 2P"')` 预热像素字体，配合 `Promise.race` + 3.5s 超时兜底与 `.catch(launch)` 容灾。
- **两步切换重绘**: Phaser `TextStyle.setFontFamily(t)` 传相同值为空操作。弱网下字体延迟就绪后触发重绘，必须先设为临时族（如 `'monospace'`）再设回 `'"Press Start 2P"'` 才能强制重新度量文本宽度（涵盖 4 个 HUD 文本 + NPC 提示）。

---

## 3. DOM 与 UI 交互契约

### 3.1 z-index 层级红线
所有全屏覆盖层均为 `position: fixed`，层级从高到低严格排布：
| z-index | 容器 ID / 类名 | 职责 |
|---|---|---|
| **1100** | `#end-screen` | 终章通关画面（动态 DOM，带重试与图片防竞态） |
| **1000** | `#memory-modal` | 剧情图文弹窗（Promise 加载状态机与防竞态） |
| **800** | `.profile-overlay` | 个人 Profile 面板（动态挂载；内部含 820/850 局部证书预览卡片） |
| **600** | `#project-overlay` | 3D Intro 全屏项目页（动态构建） |
| **500** | `#menu-overlay` | 主菜单界面 |
| **400** | `.game-home-container` | 游戏内 Home 悬浮按钮 |

> **挂载规范**: 所有 Overlay 容器必须直接作为 `<body>` 根节点的子元素，严禁相互嵌套，避免触发 CSS 局部层叠上下文导致层级受限。

### 3.2 样式与主题 Token 体系
- **三套 Token 隔离**:
  - `--th-*`: 主菜单与全局通用变量（`base.css`、`menu.css`）。
  - `--da-*`: Profile 面板专用（`profile.css`）。
  - `--pj-*`: Project 3D 面板专用（`project.css`）。
- **主题持久化**: 存储于 `localStorage('acm-theme')`（`day` / `night`）。
- **样式入口纯度**: `style.css` 仅保留 `@import url('styles/*.css')` 聚合（`fonts.css` 严格置顶）；禁止在入口书写样式规则；外部中文字体与图标在 `index.html` 引入。
- **事件交互收敛**: 菜单与面板交互逻辑一律进 `js/ui/MenuController.js` 或对应 UI 模块，严禁在 `index.html` 插入业务脚本。按钮 Hover 标签纯由 CSS 驱动。

### 3.3 Project 3D Intro 契约 (ProjectPage.js)
- 动态由 `MenuController.js` 执行 `import('./ProjectPage.js')` 懒加载。
- 关闭通道统一通过自定义事件 `pj:request-close` 通信（每次打开会重构内部 DOM）。
- 退出时调用 `destroyProjectPage()` 彻底销毁全部动画帧与监听器（resize / scroll / mousemove 等）。

### 3.4 关键共享状态与 Storage
| 变量 / Storage 键 | 用途 |
|---|---|
| `window.gameInstance` | Phaser.Game 实例（全局挂载，调试与状态访问） |
| `window._menuSceneRef` | MenuScene 实例引用，供 `MenuController` 调度进关过渡 |
| `window._pendingStart` | Phaser 未就绪时用户预先点击的待进关卡索引 |
| `window.MemoryModal` | 剧情弹窗全局单例控制器 |
| `acm_journey_last_level` | 本地存储最后游玩的关卡索引（用于 Continue 按钮） |

---

## 4. 架构防腐边界 (Guardrails)

**必须遵守 (Always)**
- 扩展新面板严格遵守 [README.md](README.md)「如何加新按钮 / 面板」的 4 步规范，并严格对齐 §3.1 z-index 层级。
- 动态加载 Phaser 资源必须经由 `AssetHelper` 收集排队，背景与前景创建前执行 `textures.exists()` 检查，并在 `create()` 后手动调用 `load.start()`。新关卡接入前景时，在 `story.js` 声明 `foregroundImage`，添加与原背景同尺寸、同坐标系的透明 PNG；前景仅承载遮挡像素，缺图必须允许背景与场景继续运行。
- NPC 纹理与动画必须通过 `getNpcAssetKey` / `getNpcAnimKey` 命名空间隔离。
- 碰撞与物理判定遵照 12px 顶块容差、下落 2.8g 加速度与弹窗冻结加速度契约。

**预警与确认 (Ask First)**
- 修改主菜单基础排版与布局间距（字号、间距、按钮尺寸已冻结）。
- 重构/拆分 `LevelScene.js`（当单场景文件规模突破 800 行警戒线时，优先考虑拆离 NPC / HUD / BGM 子系统）。

**已知待办**
- [ ] UX 修复：Project 3D Intro 页面补齐跟随鼠标的发光小圆点光标（目前仅有 `cursor: none` 导致指针隐形）。
