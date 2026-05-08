/* ============================================
   LoadingScene.js — 进入关卡前加载界面
   ============================================ */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';
import { collectLevelAssets, queueAssets } from '../utils/AssetHelper.js';

export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    init(data = {}) {
        this.nextScene = data.nextScene || 'LevelScene';
        this.nextData = data.nextData || { lvIdx: 0 };
        this.requestedMinDuration = Number.isFinite(data.minDuration) ? data.minDuration : null;
        this.isLoaded = false;
        this.isTimeUp = false;
        this.failedFiles = [];
        this._loadHandlers = null;
    }

    preload() {
        this.cameras.main.setBackgroundColor(0x000000);

        const cx = CANVAS_WIDTH / 2;
        const cy = CANVAS_HEIGHT / 2;

        const title = this.add.text(cx, cy - 60, 'LOADING', {
            fontFamily: 'Orbitron',
            fontSize: '48px',
            fontStyle: '900',
            color: '#00f3ff',
            shadow: { offsetX: 0, offsetY: 0, color: 'rgba(0, 243, 255, 0.7)', blur: 15, fill: true },
        }).setOrigin(0.5);

        const tip = this.add.text(cx, cy - 2, 'start your adventure', {
            fontFamily: 'Orbitron',
            fontSize: '16px',
            fontStyle: '400',
            color: 'rgba(0, 243, 255, 0.8)',
            shadow: { offsetX: 0, offsetY: 0, color: 'rgba(0, 243, 255, 0.7)', blur: 15, fill: true },
        }).setOrigin(0.5);

        this.tweens.add({ targets: tip, alpha: { from: 1, to: 0.2 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const barWidth = 360;
        const barHeight = 3;
        const barX = cx - barWidth / 2;
        const barY = cy + 44;

        this.add.rectangle(cx, barY, barWidth, barHeight, 0x001e32, 1);
        const progress = this.add.rectangle(barX, barY, 0, barHeight, 0x00f3ff, 1).setOrigin(0, 0.5);

        // --- 真实加载进度事件 ---
        const handleProgress = (value) => {
            progress.width = barWidth * value;
        };

        const handleLoadError = (file) => {
            const fileId = file && (file.key || file.src || file.url || file.type);
            this.failedFiles.push(fileId || 'unknown');
            tip.setText('fallback mode enabled');
            console.warn('Asset load failed:', fileId || file);
        };
        this._loadHandlers = { handleProgress, handleLoadError };
        
        this.load.on('progress', handleProgress);
        this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, handleLoadError);
        this.load.once('complete', () => {
            this._clearLoadHandlers();
            progress.width = barWidth; // 确保填满
            this.isLoaded = true;
            this.checkAndGo();
        });

        // --- 按需加载目标关卡资源 ---
        const assets = collectLevelAssets(this.nextData.lvIdx);
        const queued = queueAssets(this, assets);

        // --- 最小时间缓冲，防止一闪而过 ---
        this.time.delayedCall(this._resolveMinDuration(queued), () => {
            this.isTimeUp = true;
            this.checkAndGo();
        });
    }

    create() {
        // 如果资源非常少瞬间加载完，可能 load 甚至没触发 progress 和 complete，主动标记
        if (this.load.totalToLoad === 0) {
            this._clearLoadHandlers();
            this.isLoaded = true;
            this.checkAndGo();
        }
    }

    checkAndGo() {
        if (this.isLoaded && this.isTimeUp) {
            // 跳转到真正关卡
            this.scene.start(this.nextScene, this.nextData);
        }
    }

    _resolveMinDuration(queued) {
        if (Number.isFinite(this.requestedMinDuration)) {
            return this.requestedMinDuration;
        }
        if (queued <= 0) return 260;
        if (queued <= 2) return 520;
        return 900;
    }

    _clearLoadHandlers() {
        if (!this._loadHandlers) return;
        this.load.off('progress', this._loadHandlers.handleProgress);
        this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this._loadHandlers.handleLoadError);
        this._loadHandlers = null;
    }
}
