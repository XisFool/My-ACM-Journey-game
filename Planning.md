# Profile Panel — 设计中和规划 v2
> 基于 Design.md（Mistral 暖系风格）× 游戏主界面（赛博朋克冷色系）
> 更新：2026-04-13 | 主界面布局冻结，只新增 Profile 面板

---

## 一、主界面约束（严格执行）

**以下全部冻结，一律不改：**
- 所有字体的位置、间距、大小（`font-size`、`margin`、`padding`、`gap`）
- 按钮的尺寸、间距、圆角
- 整体布局结构（`flex`、`position`、`top/bottom/left/right`）

**允许在主界面修改的范围（仅限）：**
- 颜色（`color`、`background-color`、`border-color`）
- 发光/阴影效果（`box-shadow`、`text-shadow`）
- 字体家族（`font-family`）

**结论：主界面本次不做任何修改。** Profile 面板是全新独立组件，不影响现有布局。

---

## 二、风格对照与中和策略

### 核心矛盾

| 维度 | 游戏主界面 | Mistral Design.md | 中和方案 |
|---|---|---|---|
| 背景 | 纯黑 `#000000` | 暖米白 `#fffaeb` | 极深暖黑 `#141210` |
| 主色 | 青色 `#00f3ff` | 燃橙 `#fa520f` | 橙色（Profile按钮已定锚） |
| 圆角 | 大圆角 30px | 近零圆角 | 折中 6px |
| 阴影 | 青色 glow | 五层暖琥珀阴影 | 三层暗版琥珀阴影 |
| 字体 | Orbitron 900 | Arial 400 单一字重 | 标题 Orbitron 400，正文 Noto Sans SC |
| 边框 | 青色描边 | 无边框 | 单像素橙色低透明度描边 |

### 中和理念：「暗金维度」

Profile 面板 = 从冷色游戏世界进入暖色个人空间的入口。
Profile 按钮已是 `#fa520f` 橙色，天然成为两个世界的过渡锚点。

### CSS Token 系统

```css
--da-bg:           #141210;
--da-border:       rgba(250, 82, 15, 0.25);
--da-border-hover: rgba(250, 161, 16, 0.55);
--da-orange:       #fa520f;
--da-amber:        #ffa110;
--da-gold:         #ffd900;
--da-text:         #f0ece4;
--da-text-muted:   rgba(240, 236, 228, 0.5);
--da-radius:       6px;
--da-shadow:
    0 8px 40px  rgba(127, 99, 21, 0.20),
    0 24px 80px rgba(127, 99, 21, 0.12),
    0 48px 120px rgba(127, 99, 21, 0.06);
```

---

## 三、Profile 面板内容规划

### 已确认内容

| 项目 | 内容 |
|---|---|
| 昵称 | XisaFool |
| 个人标签 | Acmer |
| 联系方式 | QQ 2834264571 |
| 面板宽度 | 600px |
| 头像 | 字母头像圆形，显示 "X" |

### 竞赛获奖（5条，来自简历）

1. 2024 CCPC 重庆区域赛 铜奖
2. 2024 ICPC 江西省赛 银奖
3. 2024 睿抗机器人开发者大赛 编程赛区 全国一等奖
4. 2024 第十五届蓝桥杯 C/C++ B组 全国一等奖
5. 2024 百度之星程序设计大赛 初赛银奖

---

## 四、面板结构与视觉设计

### 线框图

```
┌────────────────────────────────────────────────────┐
│  ████████ 顶部渐变装饰条 orange→amber→gold ████████ │  ← 5px 高
│                                             [ × ] │  ← 关闭按钮（橙色）
│                                                    │
│   ┌──────┐   XisaFool                             │
│   │  X   │   Acmer                                │
│   │      │   QQ：2834264571                       │
│   └──────┘                                         │
│                                                    │
│   ── COMPETITIVE RECORD ──────────────────────    │  ← 分隔线（橙色）
│                                                    │
│   [ CCPC 铜  重庆 2024 ]                           │
│   [ ICPC 银  江西 2024 ]                           │
│   [ 睿抗  全国一等  2024 ]                          │
│   [ 蓝桥杯  全国一等  2024 ]                        │
│   [ 百度之星  银奖  2024 ]                          │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 各区块设计细节

**顶部渐变装饰条**
- 高度：5px
- 渐变：`linear-gradient(90deg, #fa520f, #ffa110, #ffd900)`
- Mistral Block Identity 概念直接引入

**字母头像**
- 尺寸：72×72px 圆形
- 背景：`linear-gradient(135deg, #fa520f, #ffa110)`
- 文字：`X`，Orbitron 700，白色，32px
- 边框：无，用阴影替代（暖琥珀 glow）

**昵称区**
- `XisaFool`：Orbitron 400，22px，`--da-text` 暖白
- `Acmer`：Noto Sans SC，13px，`--da-amber`，大写字间距
- `QQ：2834264571`：Noto Sans SC，13px，`--da-text-muted`

**竞赛获奖 Tag**
- 每条一行，左侧橙色竖线（3px）作为列表标记
- 奖项名称：Noto Sans SC 400，14px，`--da-text`
- 年份：`--da-text-muted`，右对齐
- 无圆角（Mistral 锐角原则）

**关闭按钮**
- `×` 符号，Orbitron，右上角绝对定位
- 颜色：`--da-text-muted`，hover 变 `--da-orange`

---

## 五、交互与动画

### 打开动画（从右侧滑入）
```css
@keyframes profileSlideIn {
  from { opacity: 0; transform: translateX(40px) scale(0.97); }
  to   { opacity: 1; transform: translateX(0)    scale(1);    }
}
```

### 关闭动画（向右淡出）
通过 JS 添加 `.closing` class，动画结束后 `display:none`。

### 遮罩层
- 黑色半透明 `rgba(0,0,0,0.65)`
- 点击遮罩关闭面板
- z-index: 800（高于游戏 500，低于弹窗 1000）

---

## 六、实施顺序

```
Step 1. style.css — 添加 Profile 面板所有 CSS（Token变量 + 面板样式）
Step 2. index.html — 在 game-home-container 之前插入面板 HTML 结构
Step 3. index.html <script> — 添加 open/close 逻辑，绑定 #menu-profile-btn
```

主界面 HTML/CSS **零改动**。

---

## 七、已确认决策（最终）

- 头像字母：`X`
- 竞赛条目：每条前加 `fa-trophy` 图标（Font Awesome，已加载）
- QQ 号：点击触发 `navigator.clipboard.writeText()`，复制成功后按钮文字短暂变为 "已复制 ✓"
