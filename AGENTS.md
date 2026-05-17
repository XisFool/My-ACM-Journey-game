# AGENTS.md — My ACM Journey

> 面向 AI 编码 Agent 的项目上下文速查。最后更新：2026-05-17。

## 为什么有这个文件

- `README.md` 面向人类贡献者：项目简介、运行方式、加新面板的标准流程。
- `AGENTS.md` 面向 Agent：构建步骤、目录语义、约定、边界，一次给全，避免翻源码猜测。
- 两者分离，互不污染；新协作者请先读 `README.md`，深入修改前再读本文件。

---

## 1. 项目概述

像素风 2D 横版传记游戏，记录作者 XisaFool 的 ACM/XCPC 竞赛之路。
4 个城市关卡（南昌→深圳→桂林→重庆），玩家跳跃收集问号方块触发图文剧情弹窗，全部收集后进入下一关，最终展示通关画面。

- **GitHub**: `XisFool/My-ACM-Journey-game` (main)
- **技术栈**: Phaser 3.60 + 原生 HTML/CSS/JS (ES Modules)，无构建步骤
- **运行**: `python -m http.server`（纯静态托管）
- **画布**: 960×540，Arcade 物理，`Phaser.Scale.ENVELOP` 自适应

### Commands

| 操作 | 命令 |
|------|------|
| Dev | `python -m http.server 8080`，浏览器打开 `http://localhost:8080` |
| Build | 无（纯静态，无构建步骤） |
| Lint | 无 |
| Test | Playwright 手动走查（见 §12） |

---

## 2. 目录结构

```
my-acm-journey/
├── index.html                # DOM 骨架 + script 入口（86 行；不含业务 JS）
├── style.css                 # @import 聚合入口（仅 import 各模块）
├── styles/
│   ├── base.css              # 全局 reset + 主题 Token (--th-*)
│   ├── menu.css              # 主菜单 #menu-overlay 与按钮（home/profile/project/theme-toggle）
│   ├── profile.css           # Profile 面板 (--da-* + .profile-overlay)
│   ├── project.css           # Project 3D Intro 全屏页 (--pj-* + 全部 #project-overlay)
│   └── game.css              # 游戏内 Home / Phaser canvas / MemoryModal / EndScreen / 滚动条
├── README.md                 # 面向人类贡献者（运行 / 目录 / 加面板流程 / 约定）
├── js/
│   ├── main.js               # Phaser.Game 初始化，注册 4 场景
│   ├── config.js             # CANVAS_WIDTH=960, CANVAS_HEIGHT=540
│   ├── story.js              # STORY 数据：4 关卡 levels[].bgImage/bgMusic/npcs/memoryBlocks
│   ├── scenes/
│   │   ├── BootScene.js      # preload: player_r/l 精灵; create: 动画注册 + qblock/particle_snow 纹理生成
│   │   ├── MenuScene.js      # 控制 #menu-overlay 显隐; 暴露 window._menuSceneRef; 处理 _pendingStart
│   │   ├── LoadingScene.js   # AssetHelper 加载目标关资源; 进度条 + loaderror 记录 + 动态最小时长
│   │   └── LevelScene.js     # 核心：背景/地面/玩家/方块/NPC/碰撞/HUD/BGM/粒子/预热/通关
│   ├── ui/
│   │   ├── MenuController.js # 主菜单交互总入口（主题/面板/proximity/Press Start）— index.html 唯一业务脚本
│   │   ├── PanelManager.js   # 通用 createPanel 抽象（hidden/closing/animationend/onOpen/onClose）
│   │   ├── ProfilePanel.js   # Profile 面板数据 + 动态 DOM 渲染（替代原 index.html 静态 DOM）
│   │   ├── ProjectPage.js    # 3D Intro 全屏页（Hero 30层景深/clip-path 反色遮罩/卡片倾斜/点阵）
│   │   └── MemoryModal.js    # 纯 DOM 弹窗控制器; 图片+文字翻页; 复用 AssetHelper 缓存
│   ├── utils/
│   │   └── AssetHelper.js    # 资源收集/排队/NPC key 命名空间/预热状态/DOM 图片缓存
│   ├── libs/phaser.min.js    # Phaser 3.60 本地（CDN 备用）
│   ├── Audio/                # MC.mp3(关1-3), wuxian_jinbu.mp3(关4)
│   └── Photo/
│       ├── Background/       # 4 城背景 + GameOver.webp
│       ├── Qiu/              # 玩家精灵 Qiu_R/L.png + Head.jpg(Profile头像)
│       ├── Other_character/  # Kirby.png (NPC 精灵图)
│       ├── Projects/         # Project 面板 3D Intro 卡图 01-03.webp（用户提供）
│       └── *_memo/           # 各关剧情图 A/B/C 系列 .webp
├── Progress.md               # 本地开发进度笔记（.gitignore 排除，不随仓库提供）
└── AGENTS.md                 # 本文件（面向 AI Agent 的上下文速查）
```

---

## 3. 场景流程

```
BootScene  ──→  MenuScene  ──→  LoadingScene  ──→  LevelScene
  │                │                 │                  │
  │ 加载玩家精灵   │ 显示DOM菜单     │ 加载目标关资源    │ 游戏主循环
  │ 生成纹理       │ 等待点击        │ 进度条+动态最小时长│ 全收集→下一关或通关
  │                │                 │                  │ 1.5s后静默预热下一关
```

**首次进关**: 主菜单 Start/Continue → `LoadingScene` → `LevelScene`
**关卡间跳转**: `LevelScene.goNextLevel()` → `fadeOut` → `scene.restart({lvIdx: next})` 或 `showEndScreen()`；中途换关不会重新显示 `LoadingScene`，依赖上一关后台预热 + `LevelScene.preload()` 兜底
**返回菜单**: Home 按钮 → `fadeOut` → `scene.start('MenuScene')`

---

## 4. 关键子系统

### 4.1 资源加载 (AssetHelper.js)

| 函数 | 作用 |
|---|---|
| `collectLevelAssets(lvIdx)` | 收集指定关的 images/audios/spritesheets |
| `queueAssets(scene, assets)` | Phaser loader 排队，跳过已存在资源，返回排队数 |
| `getNpcAssetKey(lvIdx, npcKey)` | 生成 NPC 纹理 key：`npc:{lvIdx}:{npcKey}` |
| `getNpcAnimKey(lvIdx, npcKey)` | 生成 NPC 动画 key：`npc:{lvIdx}:{npcKey}:idle` |
| `preloadImage(src)` | DOM `new Image()` 异步预热，写入 `preloadedImageMap` |
| `getPreloadedImage(src)` | 从 Map 取缓存 Image 对象 |
| `clearPreloadedImages()` | 清空 DOM 剧情图预热缓存；回菜单/通关时调用 |
| `preloadMemoryImages(levelData)` | 批量预热某关所有 memoryBlock 图片 |
| `isLevelPreheated` / `markLevelPreheated` | `preheatedLevels` Set 状态管理 |

**加载时机**:
1. **LoadingScene.preload()** — 当前关主加载（Phaser 层 bg/bgm/npc），监听 `FILE_LOAD_ERROR` 记录失败资源，最小时长按排队资源数动态取 260/520/900ms
2. **LevelScene.preload()** — 轻量兜底（去重自动跳过）
3. **LevelScene._preloadBackgroundAssets()** — 延迟 1.5s 静默预热：DOM 层本关+下一关 memory 图；Phaser 层下一关 bg/bgm/npc（手动 `load.start()`）

**fallback 策略**:
- 背景图：创建前检查 `textures.exists(bgKey)`，缺失时显示 `bgColor` + 渐变占位
- BGM：播放前检查 `cache.audio.exists(musicKey)`，缺失时静默跳过并清 registry
- NPC：创建前检查命名空间纹理 key，缺失时跳过该 NPC

### 4.2 日夜主题

- 白天默认 `:root`，夜晚 `#menu-overlay[data-theme="night"]` + `.profile-overlay.night` + `#project-overlay.night`
- `localStorage('acm-theme')` 持久化
- 切换逻辑由 `js/ui/MenuController.js → initThemeToggle()` 处理（原 index.html inline IIFE 已迁出）
- 三套变量：`--th-*`（主菜单 / 通用 UI）、`--da-*`（Profile）、`--pj-*`（Project 3D 页）

### 4.3 剧情弹窗 (MemoryModal.js)

- `window.MemoryModal.open(city, slides, onCloseFn)` — LevelScene.hitBlock() 调用
- 翻页：点击图片/导航文字；最后一页点击关闭
- 图片优先 `getPreloadedImage()` 缓存命中直接淡入，未命中走 `onload`

### 4.4 玩家物理

- 重力 900，跳跃 -340，Coyote Time 90ms，Jump Buffer 110ms
- WASD + 方向键 + Space；左右各有独立精灵+碰撞体尺寸
- 方块碰撞条件：未收集 & 弹窗关 & 玩家向上 & 头部接近方块底部

### 4.5 NPC 系统

- 数据在 `story.js levels[].npcs[]`；目前仅关卡 1 有 Kirby
- Phaser 纹理 key 使用 `getNpcAssetKey(lvIdx, key)`；动画 key 使用 `getNpcAnimKey(lvIdx, key)`，避免跨关同名 NPC 冲突
- 靠近 80px 显示 "!"，停留 `triggerTime` ms 后弹气泡对话框
- 离开后重置，可重复触发

### 4.6 BGM

- key = `bgm:${path}`，`registry` 全局共享 `_bgmKey`/`_bgmObj`
- 同首歌跨关不重启；换歌 stop→play；Home/通关 stopAll+清 registry；音频缺失时静默 fallback

### 4.7 Project 3D Intro 页 (ProjectPage.js)

- 入口：主菜单 `#menu-project-btn` → MenuController `initProjectPanel()` → 动态 `import('./ProjectPage.js')` → `initProjectPage()`
- 关闭：通过自定义事件 `pj:request-close` 或 `#project-close-btn` 触发 `destroyProjectPage()`（cancelAnimationFrame + 清理 close/mouse/hero/nav/card/resize/wechat 监听）
- 三段滚动：`#pj-about` Hero / `#pj-projects` 三卡 / `#pj-contact` 三卡（内部 overflow-y:auto 滚动，非 window）
- 核心动效（常量与原 React 版一致）：
  - Hero：30 层 `translateZ(-i*2px)` 堆叠文字 × 2（base + mask），lerp 系数 0.15，鼠标透视 ±35°
  - 遮罩：`#project-mask-container` 用 `clip-path: circle(Rpx at Xpx Ypx)` 跟鼠标，Hero 段 R=77/100（hover），projects/contact 段 R=15
  - 卡片：mousemove → `rotateX/rotateY` ±8°，scale 1.02
  - Canvas 点阵：`--pj-grid-dot` 驱动颜色，resize 重绘
  - 自定义光标：`cursor:none` 仅作用于 `#project-overlay`，发光小圆点跟鼠标
- 主题：`--pj-*` 变量组跟随 `#project-overlay.night` 自动切换（白天橙 #fa520f / 夜晚青 #00f3ff）
- **注意**：全局 `* { color:var(--th-text-primary) }` 会覆盖 `<i>` 子元素字色，需要给 `.pj-contact-icon i` 显式设色

---

## 5. story.js 数据结构

```js
STORY.levels[i] = {
  id, city, cityEn, year, mission,
  bgImage,      // webp 路径
  bgMusic,      // mp3 路径
  bgColor,      // hex 占位色
  groundColor,  // hex（当前未使用）
  particle,     // "snow" | null
  npcs: [{ key, image, frameWidth, frameHeight, frameRate, afterBlock, dialog, triggerTime }],
  memoryBlocks: [{ memories: [{ text, image }] }]
}
```

关卡详情: 南昌(3方块,1NPC,snow) → 深圳(3方块) → 桂林(3方块) → 重庆(3方块,换BGM)

---

## 6. DOM z-index 层级

| z-index | 元素 |
|---|---|
| 1100 | `#end-screen` 通关画面 |
| 1000 | `#memory-modal` 剧情弹窗 |
| 800 | `.profile-overlay` Profile 面板 |
| 600 | `#project-overlay` Project 3D Intro 页 |
| 500 | `#menu-overlay` 主菜单遮罩 |
| 400 | `.game-home-container` 游戏内 Home |

---

## 7. 关键全局变量

| 变量 | 用途 |
|---|---|
| `window.gameInstance` | Phaser.Game 实例（调试用） |
| `window._menuSceneRef` | MenuScene 实例引用，供 inline script 调用 `_hideOverlayAndGo` |
| `window._pendingStart` | Phaser 未就绪时用户点击按钮的待执行关卡索引 |
| `window.MemoryModal` | MemoryModalController 单例 |

---

## 8. localStorage 键

| 键 | 值 |
|---|---|
| `acm-theme` | `"day"` / `"night"` |
| `acm_journey_last_level` | 最后进入的关卡索引（Continue 按钮读取） |

---

## 9. 加新按钮 / 面板的标准流程

详见 `README.md`「如何加新按钮 / 面板」。简版 4 步：

1. **DOM**：`index.html` 加按钮 + 空 overlay 容器 `<div id="xxx-overlay" class="hidden"></div>`
2. **样式**：`styles/xxx.css` 新文件，`style.css` 末尾追加 `@import url('styles/xxx.css');`
3. **内容模块**：`js/ui/XxxPanel.js` 导出 `mountXxx(overlayEl)`，参考 `ProfilePanel.js` 的「数据 + 模板字面量」模式
4. **接入**：在 `MenuController.js` 加 `initXxxPanel()`，调用 `createPanel({ overlayEl, openBtn, closeBtn, onOpen, onClose })`，并在文件底部 `init...()` 序列里调一次

---

## 10. 已知待办

- [ ] Phaser 纹理/音频缓存回收策略（DOM 剧情图缓存已在回菜单/通关时轻量清理）
- [ ] 可选：拆分 `LevelScene.js` 中 BGM / NPC / DOM Home 逻辑，降低单文件维护成本

---

## 11. Code Conventions

- **语言**: 原生 JavaScript ES Modules（`import`/`export`），无 TypeScript
- **命名**: 文件名 PascalCase（`LevelScene.js`），函数/变量 camelCase，CSS 变量 `--前缀-kebab`（`--th-*`、`--da-*`、`--pj-*`）
- **导入**: `import` 语句必须位于文件顶部；禁止文件中部静态 import（动态 `import()` 懒加载除外）
- **错误处理**: Phaser 资源加载失败走静默 fallback（不阻塞），不吞错误但允许降级
- **风格**: 匹配现有代码风格，不擅自统一格式；不主动增删注释

---

## 12. Testing

- **自动化框架**: 无（项目体量小，未引入）
- **验证方式**: Playwright 手动端到端走查
- **覆盖路径**: 菜单 → 主题切换 → Profile 开关 → Project 开关 → Press Start 进 LevelScene → 方块收集 → 弹窗翻页 → 通关 → 回菜单
- **规则**: 涉及场景流程或 DOM 交互的改动，须走一遍完整走查路径

---

## 13. Boundaries

**Always Do**
- 新资源经 `AssetHelper` 收集排队，背景图创建前 `textures.exists()` 检查
- NPC 资源通过 `getNpcAssetKey` / `getNpcAnimKey` 命名空间隔离
- 新样式按职责放 `styles/*.css`，`style.css` 仅放 `@import`
- 交互逻辑进 `js/ui/MenuController.js` 或独立 ui 模块，不写 inline `<script>`
- `create()` 后手动 `load.start()` 启动 Phaser loader

**Ask First**
- 重命名/移动 `js/Photo`、`js/Audio` 目录（多处硬编码路径引用）
- 修改主菜单布局（字号 / 间距 / 按钮尺寸已冻结）
- 拆分 `LevelScene.js` 或其他大规模重构

**Never Do**
- 往 `style.css` 入口塞样式规则
- 往 `index.html` 加 inline `<script>` 业务逻辑
- 重新引入按钮 hover 标签的 JS opacity 逻辑
- 加载失败时阻塞进关（应走已有 fallback）
