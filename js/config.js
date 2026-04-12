/* ============================================
   config.js — 游戏全局常量配置
   ============================================ */

// 画布尺寸（像素风经典 16:9）
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// 物理 & 运动
export const GRAVITY = 600;
export const PLAYER_SPEED = 160;
export const PLAYER_JUMP = -330;
export const PLAYER_SIZE = 32;          // 角色精灵尺寸

// 像素缩放倍率（放大以保持像素清晰感）
export const PIXEL_SCALE = 2;

// 全局配色系统 (游戏内的常量，特定关卡颜色在 story.js 中)
export const COLORS = {
    bgDark:      0x0f0e17,
    accentBlue:  0x4fc3f7,
    accentPurple:0xbb86fc,
    accentPink:  0xf48fb1,
    accentGold:  0xffd54f,
    textWhite:   0xfffffe,
    textGray:    0xa7a9be,
};

// 每关的关卡宽度（像素），用于地图生成
export const LEVEL_WIDTH = 2400;

// 触发点（记忆碑）外观
export const TRIGGER_SIZE = 28;
export const TRIGGER_GLOW_COLOR = 0xffd54f;

// UI 文字样式
export const TEXT_STYLE = {
    title: {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        color: '#ffd54f',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, fill: true },
    },
    subtitle: {
        fontFamily: '"Noto Sans SC", sans-serif',
        fontSize: '14px',
        color: '#a7a9be',
    },
    hud: {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#ffffff',
    },
    prompt: {
        fontFamily: '"Noto Sans SC", sans-serif',
        fontSize: '13px',
        color: '#4fc3f7',
    },
};
