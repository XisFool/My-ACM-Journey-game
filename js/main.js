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

// 启动函数
const initGame = () => {
    const launch = () => {
        if (window.gameInstance) return;
        console.log("Phaser Game Initializing...");
        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            pixelArt: true,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [
                BootScene,
                MenuScene,
                LoadingScene,
                LevelScene
            ],
            scale: {
                mode: Phaser.Scale.ENVELOP,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        try {
            const game = new Phaser.Game(config);
            window.gameInstance = game; // 暴露到全局方便调试
        } catch (err) {
            console.error("Game Launch Failed:", err);
        }
    };

    if (document.fonts) {
        // 优先显式加载像素字体，同时增加 3.5s 超时兜底，防止网络异常阻塞游戏启动
        const fontPromise = Promise.all([
            document.fonts.load('14px "Press Start 2P"'),
            document.fonts.ready
        ]);
        const fontTimeout = new Promise(resolve => setTimeout(resolve, 3500));
        Promise.race([fontPromise, fontTimeout]).then(launch).catch(launch);
    } else {
        launch();
    }
};

// 立即尝试初始化（模块脚本默认已 DOMContentLoaded）
if (document.readyState !== 'loading') {
    initGame();
} else {
    document.addEventListener('DOMContentLoaded', initGame);
}
