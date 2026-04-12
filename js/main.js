/* ============================================
   main.js — 游戏入口与初始化
   ============================================ */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import './ui/MemoryModal.js';

// 引入场景
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import LevelScene from './scenes/LevelScene.js';
import LoadingScene from './scenes/LoadingScene.js';

// 确保 DOM 加载完成后启动 Phaser
window.onload = () => {
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        pixelArt: true,          // 开启像素风渲染，关闭抗锯齿
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 }, // 重力在具体场景或实体中设置
                debug: false
            }
        },
        scene: [
            BootScene,
            MenuScene,
            LoadingScene,
            LevelScene
        ],
        // 自动缩放适应屏幕，保持比例
        scale: {
            mode: Phaser.Scale.ENVELOP,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    const game = new Phaser.Game(config);
};
