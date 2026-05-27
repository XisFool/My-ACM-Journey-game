# My ACM Journey

> 像素风 2D 横版传记游戏，记录作者 XisaFool 的 ACM/XCPC 竞赛之路。
> 4 个城市关卡（南昌→深圳→桂林→重庆），跳跃收集问号方块触发图文剧情，全部收集后进入下一关，最终展示通关画面。
>
> 🌐 **在线游玩地址**：[xisafool.uk](https://xisafool.uk)

## 运行

无构建步骤，纯静态托管：

```powershell
cd my-acm-journey
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

依赖 Python 3 与浏览器即可。游戏画布固定 960×540，自适应缩放 (`Phaser.Scale.ENVELOP`)。

## 技术栈

- Phaser 3.60（本地 `js/libs/phaser.min.js`，CDN 备用）
- 原生 HTML / CSS / JS（ES Modules）
- Font Awesome + Google Fonts (Orbitron / Outfit / Noto Sans SC)

## 目录结构

```
my-acm-journey/
├── index.html                 # DOM 骨架 + script 入口（不含业务 JS）
├── style.css                  # @import 聚合入口
├── styles/                    # 按职责拆分的样式
│   ├── base.css               #   全局 reset + 主题 Token (--th-*)
│   ├── menu.css               #   主菜单 #menu-overlay 与按钮
│   ├── profile.css            #   Profile 面板 (--da-* + .profile-overlay)
│   ├── project.css            #   Project 3D Intro 全屏页 (--pj-*)
│   └── game.css               #   游戏内 Home / Phaser canvas / MemoryModal / EndScreen
├── js/
│   ├── main.js                # Phaser.Game 初始化
│   ├── config.js              # 画布尺寸常量
│   ├── story.js               # 4 关卡故事数据
│   ├── scenes/                # BootScene / MenuScene / LoadingScene / LevelScene
│   ├── ui/
│   │   ├── MenuController.js  # 主菜单交互总入口（主题/面板/proximity/Press Start）
│   │   ├── PanelManager.js    # 通用 createPanel 抽象（hidden/closing/animationend）
│   │   ├── ProfilePanel.js    # Profile 面板数据 + 动态 DOM 渲染
│   │   ├── ProjectPage.js     # Project 3D Intro 动态构建
│   │   └── MemoryModal.js     # 剧情图文弹窗
│   ├── utils/AssetHelper.js   # 资源收集 / 排队 / NPC 命名空间 / DOM 图缓存
│   ├── libs/phaser.min.js
│   ├── Audio/                 # MC.mp3 / wuxian_jinbu.mp3
│   └── Photo/                 # Background / Qiu / Other_character / Projects / *_memo
├── AGENTS.md                  # 面向 AI Agent 的上下文速查
└── Progress.md                # 长跨度开发进度笔记
```

## 如何加新按钮 / 面板

按下面 4 步走，避免破坏现有面板：

1. **加 DOM 容器**：在 `index.html` 的 `.home-container` 中新增按钮（参考 `#menu-profile-btn` / `#menu-project-btn`），并在 body 末尾加空容器 `<div id="xxx-overlay" class="hidden"></div>`。
2. **加样式**：在 `styles/` 下新建 `xxx.css`，并在 `style.css` 末尾追加 `@import url('styles/xxx.css');`。z-index 须遵守 `AGENTS.md §6` 的层级表。
3. **加内容模块**（动态 DOM）：在 `js/ui/` 下新建 `XxxPanel.js`，导出 `mountXxx(overlayEl)`；面板内容写成数据 + 模板字面量，参考 `ProfilePanel.js`。
4. **接入 MenuController**：在 `MenuController.js` 中新增 `initXxxPanel()`，调用 `createPanel({ overlayEl, openBtn, closeBtn, onOpen, onClose })`，并在文件底部 `init...()` 序列里调用一次。

## 开发约定

- **资源路径**：所有 `js/Photo/...`、`js/Audio/...` 路径被 `story.js`、`BootScene`、`ProjectPage` 多处直接引用，**不要随意重命名或移动**。
- **资源加载**：新资源必须经 `AssetHelper` 收集排队；背景图创建前调用 `textures.exists()` 安全检查；NPC 资源用 `getNpcAssetKey` / `getNpcAnimKey` 命名空间。
- **主菜单布局**：字号、间距、按钮尺寸均冻结，允许改色/发光/字体。
- **主题切换**：日夜共两套 CSS 变量 (`--th-*`、`--da-*`、`--pj-*`)，`localStorage('acm-theme')` 持久化。
- **z-index 层级**：见 `AGENTS.md §6`。

## 文档

- `AGENTS.md` —— 面向 AI Agent 的上下文速查（架构 / 子系统 / 边界），改动前先读

## License

个人项目，所有资源（图片 / 文字 / 音频）版权归原作者，未经允许请勿商用。
