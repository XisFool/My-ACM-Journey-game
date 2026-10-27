# My ACM Journey

> 像素风 2D 横版传记游戏，记录作者 XisaFool 的 ACM/XCPC 竞赛之路。
> 4 个城市关卡（南昌→深圳→桂林→重庆），跳跃收集问号方块触发图文剧情，全部收集后进入下一关，最终展示通关画面。
>
> 🌐 **在线游玩地址**：[xisafool.uk](https://xisafool.uk)

## 运行

无构建步骤，纯静态托管：

```powershell
cd my-acm-journey
# 方式一：Python 静态托管（推荐）
python -m http.server 8080

# 方式二：npm（快捷别名，系统需具备 Python 3）
npm run dev

# 浏览器打开 http://localhost:8080
```

依赖 Python 3 与现代浏览器即可（npm 脚本为快捷别名）。游戏画布固定 960×540，自适应缩放 (`Phaser.Scale.ENVELOP`)。

## 技术栈

- Phaser 3.60（本地 `js/libs/phaser.min.js`，CDN 备用）
- 原生 HTML / CSS / JS（ES Modules）
- 本地艺术字体（Orbitron / Press Start 2P / Outfit WOFF2）+ 中文字体镜像（Noto Sans SC）+ Font Awesome 图标

## 目录结构

```
my-acm-journey/
├── index.html                 # DOM 骨架 + script 入口（不含业务 JS）
├── package.json               # 项目元信息与快捷启动脚本（npm run dev）
├── fonts/                     # 本地核心艺术字体（WOFF2）
│   ├── orbitron-variable.woff2
│   ├── outfit-latin.woff2
│   └── press-start-2p-latin.woff2
├── style.css                  # @import 聚合入口（仅聚合本地模块）
├── styles/                    # 按职责拆分的样式
│   ├── fonts.css              #   本地核心字体定义 (@font-face)
│   ├── base.css               #   全局 reset + 主题 Token (--th-*)
│   ├── menu.css               #   主菜单 #menu-overlay 与按钮
│   ├── profile.css            #   Profile 面板 (--da-* + .profile-overlay)
│   ├── project.css            #   Project 3D Intro 全屏页 (--pj-*)
│   └── game.css               #   游戏内 Home / Phaser canvas / MemoryModal / EndScreen
├── js/
│   ├── main.js                # Phaser.Game 初始化与字体就绪门禁
│   ├── config.js              # 画布尺寸常量
│   ├── story.js               # 4 关卡故事数据
│   ├── scenes/                # BootScene / MenuScene / LoadingScene / LevelScene
│   ├── ui/
│   │   ├── MenuController.js  # 主菜单交互总入口（主题/面板/proximity/Press Start）
│   │   ├── PanelManager.js    # 通用 createPanel 抽象（hidden/closing/animationend）
│   │   ├── ProfilePanel.js    # Profile 面板数据 + 动态 DOM 渲染
│   │   ├── ProjectPage.js     # Project 3D Intro 动态构建
│   │   └── MemoryModal.js     # 剧情图文弹窗（Promise 异步与重试状态）
│   ├── utils/
│   │   ├── AssetHelper.js     # 资源收集 / 排队 / NPC 命名空间 / DOM 图重试缓存
│   │   └── CityAtmosphere.js  # 桂林轻雨薄雾 / 重庆夕阳微尘与人物受光
│   ├── libs/phaser.min.js
│   ├── Audio/                 # MC.mp3 / wuxian_jinbu.mp3
│   └── Photo/                 # Background / Qiu / Other_character / Projects / Awards / *_memo
└── AGENTS.md                  # 面向 AI Agent 的上下文速查
```

## 如何加新按钮 / 面板

按下面 4 步走，避免破坏现有面板：

1. **加 DOM 容器**：在 `index.html` 的 `.home-container` 中新增按钮（参考 `#menu-profile-btn` / `#menu-project-btn`），并在 `<body>` 末尾添加空遮罩容器 `<div id="xxx-overlay" class="hidden"></div>`。
2. **加样式**：在 `styles/` 下新建 `xxx.css`，并在 `style.css` 末尾追加 `@import url('styles/xxx.css');`。z-index 须遵守 `AGENTS.md §3.1` 的层级表。
3. **加内容模块**（动态 DOM）：在 `js/ui/` 下新建 `XxxPanel.js`，导出 `mountXxx(overlayEl)`；面板内容写成数据 + 模板字面量，参考 `ProfilePanel.js`。
4. **接入 MenuController**：在 `MenuController.js` 中新增 `initXxxPanel()`，先调用 `const { closeBtn } = mountXxx(overlayEl)` 挂载 DOM 并捕获返回的关闭按钮，再调用 `createPanel({ overlayEl, openBtn, closeBtn, onOpen, onClose, clickOverlayToClose: true })`，并在文件底部 `init...()` 序列里调用一次。独立于 `#menu-overlay` 的面板需同步添加日夜主题类名切换逻辑。

## 开发约定

- **资源路径**：所有 `js/Photo/...`、`js/Audio/...` 路径被 `story.js`、`BootScene`、`ProjectPage` 多处直接引用，**不要随意重命名或移动**。
- **资源加载**：新资源必须经 `AssetHelper` 收集排队；背景与前景创建前调用 `textures.exists()` 安全检查；NPC 资源用 `getNpcAssetKey` / `getNpcAnimKey` 命名空间。前景在 `story.js` 对应关卡的 `foregroundImage` 中配置，缺图时跳过前景层并继续使用背景和可玩场景。
- **场景前景**：前景 PNG 应与背景使用相同画布尺寸和坐标系，只提取需要遮挡玩家的近景像素并保留透明区域。运行时复用背景的位置、缩放与 `BG_SCROLL`，绘制深度为 1（玩家为 0、HUD 为 20），不添加物理碰撞；双层地面阴影深度为 -1，通过场景唯一的 `postupdate` 监听更新，并在 `shutdown` 解除监听。
- **城市氛围**：`CityAtmosphere.js` 目前仅为桂林添加轻雨、远山薄雾和人物冷色受光，为重庆添加夕阳柔光、稀疏微尘和人物暖色受光。纹理由程序生成并复用缓存；效果保持低强度，受光不改变物理。背景缺失时跳过氛围；场景退出时清理对象、监听和人物染色。
- **交互方块层级**：四关方块深度统一为 30，顶击星点为 29，始终显示在前景、雨丝、微尘与 NPC 上方；收集后仍保留层级。DOM 剧情弹窗继续覆盖画布。
- **当前方案边界**：四站前景使用与原图配准的透明图层和背景相同的滚动系数；仅近景遮挡人物，重庆中远处的灯杆、旗帜与气球留在底图。没有独立前景视差，也没有重建原图道路或地面的透视关系。调整前景范围时保留原底图与游戏物理。
- **主菜单布局**：字号、间距、按钮尺寸均冻结，允许改色/发光/字体。
- **主题切换**：支持日夜两种模式，三套 Token 变量域 (`--th-*` 主菜单/通用、`--da-*` Profile、`--pj-*` Project 3D)，`localStorage('acm-theme')` 持久化。
- **z-index 层级**：见 `AGENTS.md §3.1`。

## 文档

- `AGENTS.md` —— 面向 AI Agent 的上下文速查（架构 / 子系统 / 边界），改动前先读

## 开源协议与版权声明 (License)

- **源代码**: 遵循 [MIT License](package.json) 开源许可，欢迎学习与架构参考。
- **个人素材与传记内容**: 项目中包含作者本人的肖像、真实竞赛历程回忆图文（`js/Photo/*_memo/`、`js/Photo/Awards/` 及头像）与个人文字记录，版权归原作者独立所有，**严禁未经授权用于任何商业用途或二次打包发布**。
- **第三方同人/素材声明**: 游戏中引用的特定同人角色与背景音频（如星之卡比素材、Minecraft 背景音效等）版权归原版权方所有，仅作为非盈利个人传记游戏的氛围呈现，遵循合理使用原则。
