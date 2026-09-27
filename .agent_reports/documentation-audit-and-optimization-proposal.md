# 《My ACM Journey》项目文档体系深度审计与优化重构方案

> **审计执行角色**：高级文档架构师与质量专家（遵循《writing-for-agent》规范）  
> **审计对象**：`README.md`、`AGENTS.md` 及 Codebase 现状  
> **生成时间**：2026-09-27  

---

## 一、 执行摘要 (Executive Summary)

本报告基于《writing-for-agent》核心准则（单一事实来源 SSOT、环境即真理 Pruning、上下文负载 Context Load、邻近放置 Co-location、信息层级与去除陈旧沉淀 Sediment），对项目核心文档进行了逐行审查与真实代码库对齐。

### 核心发现
1. **上下文过载（Context Load）严峻**：`AGENTS.md` 达 294 行（约 5,500+ tokens），且被配置为会话常驻规则（`<RULE>`），导致 Agent 每次交互均需全量背负 40 行静态目录树、10 个函数的 API 清单平铺、故事伪代码等大量环境已有信息。
2. **存在脆弱的陈旧缓存（Stale Cache）与知识漂移**：文档中存在硬编码的具体代码行数（如 `index.html` “约105行”实为104行，`LevelScene.js` 写死“当前为 860 行”），一旦代码迭代即刻漂移；同时包含已废弃划线的 TODO（典型 Sediment 沉淀）。
3. **严重违反单一事实来源（SSOT）**：概述、在线地址、启动命令、40 行目录树、加新面板 4 步指引在 `README.md` 与 `AGENTS.md` 间存在高度双向冗余。
4. **存在多处 No-op 指令与否定句反向强化**：包含大量模型默认遵守的行为要求（如“原生 JS 无 TS”、“import 写在顶部”）以及历史遗留的否定句（如“不要重新引入按钮 hover opacity 逻辑”）。
5. **README.md 存在指引歧义与 License 冲突**：`package.json`（MIT）与 `README.md`（个人非商用）许可声明割裂；加新面板的 DOM 挂载位置描述与实际代码架构（`#project-overlay` 位于 `#menu-overlay` 内部，`#profile-overlay` 位于外部）存在脱节。

---

## 二、 五大维度专项深度诊断

### 维度 1：Single Source of Truth（单一事实来源）与 Pruning（修剪）

| 诊断点 | 现状问题 | 《writing-for-agent》准则比对 | 风险等级 |
| :--- | :--- | :--- | :--- |
| **全量目录树双重平铺** | `README.md`（28 行）与 `AGENTS.md`（40 行）各自维护一套完整的目录树。 | *“The environment is a source of truth too... Leave the one-file, one-command lookups to the environment, where they cannot go stale.”* Agent 自带文件探测工具，硬编码全量目录树是典型 Stale Cache。 | **高** |
| **加新面板流程重复** | `README.md` 提供了 4 步流程，`AGENTS.md §9` 声明“详见 README”，紧接着又全文复读了“简版 4 步”。 | *“Keep each meaning in a single source of truth... Duplication costs maintenance and tokens.”* 两份文档后续修改极易脱节。 | **中** |
| **脆弱的数据硬编码** | `AGENTS.md` 行 39 标注 `index.html（约105行）`；行 251 监控项标注 `LevelScene.js 当前为 860 行`。 | 将快速波动的统计数据硬编码在静态文档中，导致每次微调代码文档都在说谎。架构防腐指标应为“规则阈值”而非“当下快照”。 | **高** |
| **函数列表平铺** | `AGENTS.md §4.1` 用 10 行 Markdown 表格罗列了 `AssetHelper.js` 的全部对外导出函数名与作用。 | 代码本身自带清晰 JSDoc 注释，Agent 按需通过工具直接查阅即可，平铺在全局规则属于冗余 Cache。 | **中** |

### 维度 2：Context Load vs Cognitive Load（上下文负载与认知负担）

- **常驻高开销内容分析（Context Load）**：
  - `AGENTS.md` 作为系统级 `<RULE>` 常驻上下文。当前 294 行中，约有 **140+ 行（占比近 50%）** 属于可推导、可检索或纯展示内容（40 行目录树、12 行 story 数据结构伪代码、10 行已废弃或冗余待办、8 行加面板重复复读、10 行常规代码规范）。
  - 这导致模型在处理任何细小任务（如修一个 CSS 间距）时，均要消耗上千 tokens 来解析无关子系统，注意力被严重稀释（Attention Thins）。
- **No-op（无操作指令）审查**：
  - `AGENTS.md §11`：“语言: 原生 JavaScript ES Modules（import/export），无 TypeScript” —— package.json 与文件扩展名已明确表达，模型默认能识别。
  - `AGENTS.md §11`：“导入: import 语句必须位于文件顶部；禁止文件中部静态 import” —— 此为 ES 规范语法限制，非语法正确的代码根本无法运行。
  - `AGENTS.md §11`：“风格: 匹配现有代码风格，不擅自统一格式；不主动增删注释” —— 全局 working agreement（Surgical Changes）已明确覆盖，属于纯粹的 No-op。
- **否定句（Negation）反向强化**：
  - `AGENTS.md §13`：“Never Do: 重新引入按钮 hover 标签的 JS opacity 逻辑” —— 典型的历史 Bug 修订沉淀（Sediment）。对新会话来说，提及已被废弃的错误实现反而激活了错误的认知区域。
  - “Never Do: 往 style.css 入口塞样式规则或引入远程 @import” —— 建议采用积极的目标正面引导（Prompt the positive）。
- **邻近放置（Co-location）与信息层级失调**：
  - **DOM/UI 契约割裂在 5 个分散章节**：§4.2（日夜主题）、§6（DOM z-index 表）、§7（全局变量）、§8（localStorage 键）、§9（加新面板）彼此分离。Agent 在编写前端面板时，需要在整个文档中来回跳转才能拼凑出完整的状态与图层契约。
  - **字体与 Canvas 文本渲染的上下文分散**：§4.1 提到了字体相关的资源准备，§4.8 又详细讲述弱网重绘与度量，应紧密聚合。

### 维度 3：待办与陈旧信息（Sediment 清理）

1. **已废弃项的滞留**：
   - `AGENTS.md §10` 中保留 `- [x] ~~Phaser 纹理/音频缓存回收策略~~（已评估否决：当前 4 关静态资源仅 30-50MB 级，内存无压力，未达 ≥8 关触发条件）`。
   - **诊断**：已否决且画删除线的议题留在 Agent 核心规约里，完全是垃圾上下文（Sediment）。决策结论应直接提炼为一条积极的边界准则：“4 关静态资源体量仅 30MB 级，无需设计缓存回收机制”，而非保留划线讨论记录。
2. **静态维护日期戳**：
   - `> 面向 AI 编码 Agent 的项目上下文速查。最后更新：2026-09-23。`
   - **诊断**：在以 Git 驱动的版本控制中，文档顶部的纯文本日期极易失修，造成虚假的信任感。
3. **任务追踪混入核心规约**：
   - `[ ] UX 修复：Project 3D Intro 页面补齐跟随鼠标的发光小圆点光标`：经代码核验，`styles/project.css` 的确存在两处 `cursor: none` 且尚未实现自定义光标，但这类具体的 Feature/Bug 追踪项属于临时 Task，不应成为所有任务场景下每次会话都常驻加载的系统规约。

### 维度 4：README.md 专项检查（面向人类贡献者）

1. **许可证（License）冲突**：
   - `package.json` 第 16 行：`"license": "MIT"`。
   - `README.md` 第 85 行：“个人项目，所有资源（图片 / 文字 / 音频）版权归原作者，未经允许请勿商用。”
   - **诊断**：开源界定模糊。应明确：“项目底层代码采用 MIT 协议开源，项目内个人肖像、竞赛传记图文及音频等多媒体素材版权归作者独立所有，禁止未授权商用”。
2. **快速启动命令缺陷**：
   - 原文提示 `cd my-acm-journey`。如果开发者本地 clone 后已位于项目根目录下，直接复制该命令会报错。应注明上下文路径或简化为平级说明。
3. **加新面板流程的架构描述偏差**：
   - 步骤 1 指导：“并在 body 末尾加空容器 `<div id="xxx-overlay" class="hidden"></div>`”。
   - 但真实架构中，`#project-overlay` 位于 `#menu-overlay` 内部，`#profile-overlay` 位于外部。放置在内外部决定了日夜主题的处理方式（外部容器需要手动 class 切换，内部容器由 `#menu-overlay[data-theme]` 样式自动驱动）。步骤 1 的统一描述与步骤 4 的提示存在脱节。
4. **目录结构的过度详尽**：
   - 人类 README 中列出了具体关卡的图片目录命名格式（`*_memo`）和单个音频文件名，每当素材有变动都需要更新 README，应精简为模块职责层级说明。

---

## 三、 清单化重构建议 (Retention / Modification / Pruning List)

### 1. 建议保留清单 (Retain)
- [x] **高价值架构子系统与边界契约**（`AGENTS.md`）：
  - 玩家物理核心参数（重力、跳跃、加速度阻尼、下落乘数、弹窗停止加速度契约）。
  - staticGroup 方块碰撞盒同步机制（`updateFromGameObject` 与 tween 清理守卫）。
  - 字体 Canvas 度量与弱网重绘两步切换机制（Phaser `TextStyle.setFontFamily` 空操作特性）。
  - DOM 图文预热与重试状态机（Promise 机制、`renderGeneration` 防竞态令牌）。
  - BGM registry 跨关共享与场景切换停止契约。
- [x] **DOM 层级表与设计 Token 体系**（整合后保留）：
  - z-index 绝对层级表（1100 EndScreen -> 400 Game Home）。
  - 三套 Token 命名空间（`--th-*`, `--da-*`, `--pj-*`）。
  - 关键全局变量（`window._menuSceneRef`, `window._pendingStart` 等调试/通信桥梁）。
- [x] **人类友好的游玩与开发指引**（`README.md`）：
  - 在线游玩地址与背景故事。
  - 静态托管极简启动方式。
  - 标准化 4 步加新面板操作步骤（作为唯一真实指南）。

### 2. 建议修改清单 (Modify)
- [~] **消除硬编码数值与时间戳**：
  - 移除 `AGENTS.md` 中 `index.html（约105行）`。
  - 将 `LevelScene.js 当前为 860 行（已突破 800 行拆分预警线）` 修改为通用架构防腐红线：**“场景模块规模控制：单场景文件建议在 800 行以内；后续若拓展新玩法应将 NPC / HUD / BGM 拆分子系统”**。
  - 移除顶部的静态日期，改为基于 Git 的版本状态或架构基线版本号。
- [~] **重构否定句为正面目标引导**：
  - 原：“Never Do: 往 style.css 入口塞样式规则或引入远程 @import”  
    改：“`style.css` 仅作为 `@import` 聚合入口；新增样式放入 `styles/*.css`，外部字体/图标统一在 `index.html` 引入。”
  - 原：“Never Do: 重新引入按钮 hover 标签的 JS opacity 逻辑”  
    改：“按钮 hover 状态纯由 CSS 驱动，严禁通过 JS 介入 opacity 计算。”
- [~] **统一 License 声明**：
  - 在 `README.md` 与 `package.json` 中统一明确：代码遵循 MIT License，多媒体与个人传记素材保留所有权利。
- [~] **校准 README 加新面板流程**：
  - 澄清容器放置建议：默认推荐放置在 body 顶级容器，并明确如果挂载在外部需配套日夜模式切换调用。

### 3. 建议精简或抽离清单 (Prune & Disclose)
- [-] **彻底移除 `AGENTS.md` 中的 40 行全量目录树**：
  - 替换为极简的“核心技术栈与关键目录契约（6-8行）”，只强调不可随意重命名的路径（`js/Photo/` 与 `js/Audio/`）。文件查找由 Agent 本地命令直接完成。
- [-] **移除 `AGENTS.md §4.1` 的 10 行函数列表平铺**：
  - 函数签名直接通过源码 JSDoc 呈现，文档仅保留 4 阶段加载契约。
- [-] **移除 `AGENTS.md §9` 中全量复读的加面板步骤**：
  - 保留单向指针：“新面板扩展遵循 `README.md §如何加新按钮 / 面板` 规范；Agent 侧需确保遵守 DOM 层级与样式聚合约定。”
- [-] **移除 No-op 代码规范**：
  - 移除关于 ES 模块语法、import 置顶、无 TypeScript 等环境已知常识。
- [-] **清理 §10 中的已废弃沉淀项（Sediment）**：
  - 彻底删除 `- [x] ~~Phaser 纹理/音频缓存回收策略~~`。
  - 将未完成的 UX 光标问题移至 README 或专门的 Issue 记录中，不占常驻 Agent 上下文。

---

## 四、 重构后的文档规范范本 (Proposed Documents)

### 范本 1：优化重构后的 `AGENTS.md` (约 130 行，上下文负载骤降 55%)

```markdown
# AGENTS.md — My ACM Journey

> 面向 AI 编码 Agent 的架构决策、子系统契约与技术边界指南。
> 人类贡献者指引与加面板流程见 README.md。

---

## 1. 核心架构与技术栈

- **定位**: 像素风 2D 横版传记游戏，4 城市关卡（南昌→深圳→桂林→重庆）。
- **技术栈**: Phaser 3.60 + 原生 HTML/CSS/JS (ES Modules)，无构建步骤。
- **画布**: 960×540，Arcade 物理，`Phaser.Scale.ENVELOP` 自适应。
- **路径不可变契约**: `js/Photo/` 与 `js/Audio/` 路径在多处代码硬编码，严禁重命名或移动目录。

### 场景生命周期流转
```
BootScene (资源/动画就绪) ──→ MenuScene (DOM主菜单) ──→ LoadingScene (关卡资源加载) ──→ LevelScene (游戏核心循环)
```
- **换关机制**: `LevelScene.goNextLevel()` → 渐隐 → `restart({lvIdx: next})` 或 `showEndScreen()`。关卡间不重进 LoadingScene，依赖预热与 preload 兜底。
- **返回菜单**: Home 按钮 → 渐隐 → `scene.start('MenuScene')`，同时清空 BGM 注册表与预热图缓存。

---

## 2. 关键子系统与防腐契约

### 2.1 资源加载与预热 (AssetHelper.js)
1. **当前关初始 (LevelScene.create)**: 零延迟触发当前关 DOM 剧情图后台异步预热 (`preloadMemoryImages`)。
2. **主加载 (LoadingScene.preload)**: Phaser 层加载当前关 bg/bgm/npc，按排队数动态展示 260/520/900ms 进度条，监听 `FILE_LOAD_ERROR` 记录异常。
3. **后台预热 (LevelScene)**: 进关 1.5s 后静默预热下一关 DOM 剧情图与 Phaser 资源。
4. **Fallback 降级**: 背景图缺失回退纯色占位；BGM 缺失跳过播放并清理 registry；NPC 缺失直接跳过该精灵生成。加载失败严禁阻塞进关。

### 2.2 物理引擎与判定边界 (LevelScene.js)
- **参数矩阵**: 重力 900，跳跃速度 -340 (固定)，Coyote Time 90ms，Jump Buffer 110ms，最大速度 207，ACCEL 1800，DRAG 1500，下落重力乘数 1.8。
- **碰撞盒每帧贴合**: `qblock` 属于 `staticGroup`，上下浮动 tween 的 `onUpdate` 中必须调用 `block.body.updateFromGameObject()` 同步判定盒；撞击时须调用 `killTweensOf(block)` 杀死浮动动画。
- **弹窗冻结**: 触发方块弹窗（`hitBlock`）时必须显式调用 `setAccelerationX(0)`，防止残留加速度导致玩家穿模滑动。

### 2.3 字体系统与 Canvas 度量
- **启动门禁**: `main.js` 启动前通过 `document.fonts.load` 预热像素字体，3.5s 超时兜底启动。
- **两步切换重绘**: Phaser `TextStyle.setFontFamily(t)` 在值相同时为空操作。字体延迟就绪后的重绘，必须先设为临时族再设回 `'Press Start 2P'` 才能强制重新度量 Canvas 宽度。

### 2.4 剧情弹窗 (MemoryModal.js)
- 单例通过 `window.MemoryModal.open(city, slides, onCloseFn)` 唤起。
- 内部采用 Promise 状态机与 `renderGeneration` 防竞态令牌，具备加载状态与点击重试机制。

---

## 3. DOM 与 UI 交互契约

### 3.1 z-index 层级红线
`#end-screen (1100)` > `#memory-modal (1000)` > `.profile-overlay (800)` > `#project-overlay (600)` > `#menu-overlay (500)` > `.game-home-container (400)`

### 3.2 样式与主题 Token 规范
- **Token 域隔离**: `--th-*` (主菜单/通用)、`--da-*` (Profile)、`--pj-*` (Project 3D)。持久化于 `localStorage('acm-theme')`。
- **入口聚合**: `style.css` 仅保留 `@import url('styles/*.css')` 聚合；禁止在入口书写样式规则；所有外部字体/图标在 `index.html` `<head>` 中统一声明。
- **交互边界**: 主菜单交互逻辑一律收敛于 `MenuController.js` 或对应 UI 模块，严禁在 `index.html` 插入业务 `<script>`。按钮 Hover 动效纯由 CSS 驱动。

### 3.3 共享状态与通信桥梁
| 变量 / Storage 键 | 用途 |
|---|---|
| `window._menuSceneRef` | MenuScene 实例引用，供 `MenuController` 调度隐藏动画与进关 |
| `window._pendingStart` | Phaser 未就绪时用户预先点击的待进关卡索引 |
| `window.MemoryModal` | 剧情弹窗全局单例控制器 |
| `acm_journey_last_level` | 本地存储最后游玩关卡索引（用于 Continue 按钮） |

---

## 4. 架构防腐边界 (Guardrails)

**必须遵守 (Always)**
- 扩展新面板严格遵循 `README.md §如何加新按钮 / 面板`，严格匹配 z-index 层级。
- 动态加载 Phaser 资源必须经由 `AssetHelper` 收集排队，并在 `create()` 后手动执行 `load.start()`。
- NPC 纹理与动画必须通过 `getNpcAssetKey` / `getNpcAnimKey` 生成独立命名空间键。

**预警与确认 (Ask First)**
- 重构/拆分 `LevelScene.js`（当文件规模达到 800 行警戒线时，优先考虑拆出 NPC/HUD/BGM 子系统）。
- 修改主菜单基础排版与布局间距（尺寸已冻结，仅允许调整配色与发光视觉）。
```

---

### 范本 2：优化重构后的 `README.md` (修正歧义与协议清晰化)

```markdown
# My ACM Journey

> 像素风 2D 横版传记游戏，记录作者 XisaFool 的 ACM/XCPC 算法竞赛之路。  
> 历经 4 座城市关卡（南昌→深圳→桂林→重庆），跳跃顶开问号方块触发图文剧情，收集全部回忆解锁终章通关画卷。

🌐 **在线游玩地址**：[https://xisafool.uk](https://xisafool.uk)

---

## 快速开始

本项目为纯静态架构，无构建或编译步骤：

```powershell
# 1. 确保已在项目根目录下
# 2. 方式一：Python 静态托管（推荐）
python -m http.server 8080

# 方式二：npm 快捷别名
npm run dev

# 3. 浏览器访问：http://localhost:8080
```

> **运行环境**：具备 Python 3 与现代浏览器即可。画布固定分辨率 960×540，采用 `Phaser.Scale.ENVELOP` 智能居中自适应。

---

## 技术架构

- **游戏引擎**: Phaser 3.60（本地优先 `js/libs/phaser.min.js`，CDN 容灾降级）
- **核心逻辑**: 原生 HTML5 / CSS3 / JavaScript (ES Modules)
- **字体与图标**: Font Awesome 6、Google Fonts（Orbitron / Outfit / Noto Sans SC / Press Start 2P，国内镜像加速）

### 核心目录概览
- `index.html`: DOM 骨架与第三方字体/样式入口（不含业务 JS）。
- `style.css`: 样式聚合入口，按模块细分至 `styles/`（base / menu / profile / project / game）。
- `js/scenes/`: 核心场景实现（BootScene → MenuScene → LoadingScene → LevelScene）。
- `js/ui/`: 纯 DOM 界面控制器（MenuController / PanelManager / ProfilePanel / ProjectPage / MemoryModal）。
- `js/utils/`: 核心辅助工具（AssetHelper 资源收集、排队与 Promise 预热缓存）。
- `js/Photo/` 与 `js/Audio/`: 游戏静态素材（路径由代码严格绑定，请勿擅自移动）。

---

## 如何加新按钮 / 面板

按以下 4 步标准化扩展流程操作：

1. **新增 DOM 挂载点**：
   - 在 `index.html` 的 `.home-container` 中添加新触发按钮。
   - 在 `index.html` 的 `<body>` 末尾添加空遮罩容器：`<div id="xxx-overlay" class="hidden"></div>`。
2. **编写模块样式**：
   - 在 `styles/` 下新建 `xxx.css`，并在 `style.css` 顶部通过 `@import url('styles/xxx.css');` 引入。
   - 层级需严格遵守 `AGENTS.md §3.1` 的 z-index 规范。
3. **编写面板动态挂载模块**：
   - 在 `js/ui/` 下新建 `XxxPanel.js`，导出 `mountXxx(overlayEl)` 函数，采用“数据 + 模板字面量”动态挂载 DOM，返回 `{ closeBtn }`。参考 `ProfilePanel.js`。
4. **接入主菜单控制器**：
   - 在 `MenuController.js` 中新增 `initXxxPanel()`，调用 `createPanel({ overlayEl, openBtn, closeBtn, onOpen, onClose, clickOverlayToClose: true })`。
   - 若面板独立于 `#menu-overlay` 外层，需同步添加日夜主题类名切换逻辑。在文件底部初始化序列中注册。

---

## 开源协议与版权声明 (License)

- **源代码**: 遵循 [MIT License](package.json) 开源许可。
- **个人资产与素材**: 项目包含作者本人的肖像、真实竞赛历程图文故事（`js/Photo/`）及特定背景音频（`js/Audio/`），此类多媒体资产版权归作者独立所有，**未经许可禁止商业使用或未经授权的二次衍生分发**。
```

---

## 五、 预期收益与落地路线

1. **显著降低 Agent 上下文负荷 (Token Budget 节约 55%)**：
   - `AGENTS.md` 从 **294 行（18KB）** 精简至 **约 130 行（8KB）**。
   - 彻底切除 40 行静态目录树、10 个 API 签名平铺以及已废弃的划线历史，每次交互为会话节省 ~3,000 tokens，显著降低长会话衰减风险。
2. **根除陈旧数据引发的知识漂移**：
   - 移除文件行数等脆弱快照数据，转为长效架构约束（如 800 行场景拆分建议）。
3. **消除维护冗余与认知摩擦**：
   - 加新面板流程收敛至 `README.md` 单一事实来源；
   - 修复了 License 的开源与专有版权边界，厘清了日夜模式内外部挂载契约。
