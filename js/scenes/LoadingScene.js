/* ============================================
   LoadingScene.js — 进入关卡前加载界面
   ============================================ */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';

export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    init(data) {
        this.nextScene = data.nextScene || 'LevelScene';
        this.nextData = data.nextData || { lvIdx: 0 };
        this.minDuration = data.minDuration || 900;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);

        const cx = CANVAS_WIDTH / 2;
        const cy = CANVAS_HEIGHT / 2;

        // 标题：与前端 .main-text 完全一致（Orbitron 900, #00f3ff, text-shadow 辉光）
        const title = this.add.text(cx, cy - 60, 'LOADING', {
            fontFamily: 'Orbitron',
            fontSize: '48px',
            fontStyle: '900',
            color: '#00f3ff',
            shadow: { offsetX: 0, offsetY: 0, color: 'rgba(0, 243, 255, 0.7)', blur: 15, fill: true },
        }).setOrigin(0.5);

        // 副标题：与前端 .sub-text 完全一致（Orbitron 400, rgba(0,243,255,0.8), letter-spacing）
        const tip = this.add.text(cx, cy - 2, 'start your adventure', {
            fontFamily: 'Orbitron',
            fontSize: '16px',
            fontStyle: '400',
            color: 'rgba(0, 243, 255, 0.8)',
            shadow: { offsetX: 0, offsetY: 0, color: 'rgba(0, 243, 255, 0.7)', blur: 15, fill: true },
        }).setOrigin(0.5);

        // 呼吸闪烁（与前端 breathe 动画一致：opacity 0.2↔1）
        this.tweens.add({
            targets: tip,
            alpha: { from: 1, to: 0.2 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // 进度条：与前端 .btn-left 配色一致（#00f3ff），无边框极简
        const barWidth = 360;
        const barHeight = 3;
        const barX = cx - barWidth / 2;
        const barY = cy + 44;

        // 轨道背景（几乎不可见的暗色）
        this.add.rectangle(cx, barY, barWidth, barHeight, 0x001e32, 1);

        // 进度填充（#00f3ff 青色）
        const progress = this.add.rectangle(barX, barY, 0, barHeight, 0x00f3ff, 1).setOrigin(0, 0.5);

        const p = { value: 0 };
        this.tweens.add({
            targets: p,
            value: 1,
            duration: this.minDuration,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                progress.width = barWidth * p.value;
            },
            onComplete: () => {
                this.scene.start(this.nextScene, this.nextData);
            },
        });
    }
}
