# Agent.md — My ACM Journey

> 供 AI Agent 快速理解项目全貌的严谨参考。最后更新：2026-05-04。

---

## 1. 项目概述

像素风 2D 横版传记游戏，记录作者 XisaFool 的 ACM/XCPC 竞赛之路。
4 个城市关卡（南昌→深圳→桂林→重庆），玩家跳跃收集问号方块触发图文剧情弹窗，全部收集后进入下一关，最终展示通关画面。

- **GitHub**: `XisFool/My-ACM-Journey-game` (main)
- **技术栈**: Phaser 3.60 + 原生 HTML/CSS/JS (ES Modules)，无构建步骤
- **运行**: `python -m http.server`（纯静态托管）
- **画布**: 960×540，Arcade 物理，`Phaser.Scale.ENVELOP` 自适应

---

## 2. 目录结构

```
my-acm-journey/
├── index.html                # 入口；DOM 主菜单遮罩、Profile 面板、主题切换、按钮绑定
├── style.css                 # 全局样式；日夜双套 CSS 变量 --th-*(主UI) / --da-*(Profile)
├── js/
│   ├── main.js               # Phaser.Game 初始化，注册 4 场景
│   ├── config.js             # CANVAS_WIDTH=960, CANVAS_HEIGHT=540
│   ├── story.js              # STORY 数据：4 关卡 levels[].bgImage/bgMusic/npcs/memoryBlocks
│   ├── scenes/
│   │   ├── BootScene.js      # preload: player_r/l 精灵; create: 动画注册 + qblock/particle_snow 纹理生成
│   │   ├── MenuScene.js      # 控制 #menu-overlay 显隐; 暴露 window._menuSceneRef; 处理 _pendingStart
│   │   ├── LoadingScene.js   # AssetHelper 加载目标关资源; 进度条 + minDuration(900ms) 缓冲
│   │   └── LevelScene.js     # 核心：背景/地面/玩家/方块/NPC/碰撞/HUD/BGM/粒子/预热/通关
│   ├── ui/
│   │   ├── MemoryModal.js    # 纯 DOM 弹窗控制器; 图片+文字翻页; 复用 AssetHelper 缓存
│   │   └── ProjectPage.js    # 3D Intro 全屏页（Hero 30层景深/clip-path 反色遮罩/卡片倾斜/点阵）
│   ├── utils/
│   │   └── AssetHelper.js    # 资源收集/排队/预热状态/DOM 图片去重缓存
│   ├── libs/phaser.min.js    # Phaser 3.60 本地（CDN 备用）
│   ├── Audio/                # MC.mp3(关1-3), wuxian_jinbu.mp3(关4)
│   └── Photo/
│       ├── Background/       # 4 城背景 + GameOver.webp
│       ├── Qiu/              # 玩家精灵 Qiu_R/L.png + Head.jpg(Profile头像)
│       ├── Other_character/  # Kirby.png (NPC 精灵图)
│       └── *_memo/           # 各关剧情图 A/B/C 系列 .webp
├── Planning.md               # Profile 面板设计文档
├── Progress.md               # 开发进度笔记（.gitignore 排除）
└── Agent.md                  # 本文件
```

---

## 3. 场景流程

```
BootScene  ──→  MenuScene  ──→  LoadingScene  ──→  LevelScene
  │                │                 │                  │
  │ 加载玩家精灵   │ 显示DOM菜单     │ 加载目标关资源    │ 游戏主循环
  │ 生成纹理       │ 等待点击        │ 进度条+最小时长   │ 全收集→下一关或通关
  │                │                 │                  │ 1.5s后静默预热下一关
```

**关卡间跳转**: `LevelScene.goNextLevel()` → `fadeOut` → `scene.restart({lvIdx: next})` 或 `showEndScreen()`
**返回菜单**: Home 按钮 → `fadeOut` → `scene.start('MenuScene')`

---

## 4. 关键子系统

### 4.1 资源加载 (AssetHelper.js)

| 函数 | 作用 |
|---|---|
| `collectLevelAssets(lvIdx)` | 收集指定关的 images/audios/spritesheets |
| `queueAssets(scene, assets)` | Phaser loader 排队，跳过已存在资源，返回排队数 |
| `preloadImage(src)` | DOM `new Image()` 异步预热，写入 `preloadedImageMap` |
| `getPreloadedImage(src)` | 从 Map 取缓存 Image 对象 |
| `preloadMemoryImages(levelData)` | 批量预热某关所有 memoryBlock 图片 |
| `isLevelPreheated` / `markLevelPreheated` | `preheatedLevels` Set 状态管理 |

**加载时机**:
1. **LoadingScene.preload()** — 当前关主加载（Phaser 层 bg/bgm/npc）
2. **LevelScene.preload()** — 轻量兜底（去重自动跳过）
3. **LevelScene._preloadBackgroundAssets()** — 延迟 1.5s 静默预热：DOM 层本关+下一关 memory 图；Phaser 层下一关 bg/bgm/npc（手动 `load.start()`）

### 4.2 日夜主题

- 白天默认 `:root`，夜晚 `#menu-overlay[data-theme="night"]` + `.profile-overlay.night`
- `localStorage('acm-theme')` 持久化
- `index.html` 内联 IIFE 处理切换逻辑

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
- 靠近 80px 显示 "!"，停留 `triggerTime` ms 后弹气泡对话框
- 离开后重置，可重复触发

### 4.6 BGM

- key = `bgm:${path}`，`registry` 全局共享 `_bgmKey`/`_bgmObj`
- 同首歌跨关不重启；换歌 stop→play；Home/通关 stopAll+清 registry

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

## 9. 已知待办

- [ ] `loaderror` 错误处理与 fallback
- [ ] NPC key 命名空间重构（避免跨关卡冲突）
- [ ] 资源卸载/缓存回收策略
- [ ] LoadingScene 最小时长动态化

---

## 10. 修改注意事项

- 新资源必须经 `AssetHelper` 收集排队，背景图创建前调用 `textures.exists()` 安全检查
- 按钮 hover 标签纯 CSS，禁止重新引入 JS opacity 逻辑
- `LoadingScene` 是关卡资源主入口，`LevelScene.preload` 仅兜底
- 主菜单布局冻结（详见 Planning.md），仅允许改色/发光/字体
- Phaser loader 在 `create()` 后需手动 `load.start()`
