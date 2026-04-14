/* ============================================
   MenuScene.js — 主菜单场景
   使用 HTML DOM 遮罩层（other/ 风格），Phaser 画布仅黑屏待命
   ============================================ */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';

const STORAGE_KEY = 'acm_journey_last_level';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this._domBound = false;
    }

    create() {
        // 纯黑背景（画布在 HTML 遮罩下方，基本不可见）
        this.cameras.main.setBackgroundColor(0x000000);

        // 隐藏游戏内 Home 按钮
        const gameHome = document.getElementById('game-home-container');
        if (gameHome) gameHome.style.display = 'none';

        // 显示 HTML 菜单遮罩
        const overlay = document.getElementById('menu-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            // 重置 CSS 动画（重新播放入场动画）
            overlay.style.display = 'none';
            void overlay.offsetHeight;   // 强制回流
            overlay.style.display = '';
        }

        // 仅绑定一次 DOM 事件（防止重复绑定）
        if (!this._domBound) {
            this._domBound = true;

            // Press Start 按钮
            const btnStart = document.getElementById('btn-start');
            if (btnStart) {
                btnStart.addEventListener('click', () => {
                    this._hideOverlayAndGo(0);
                });
            }

            // Continue 按钮
            const btnContinue = document.getElementById('btn-continue');
            if (btnContinue) {
                btnContinue.addEventListener('click', () => {
                    const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
                    this._hideOverlayAndGo(isNaN(saved) ? 0 : saved);
                });
            }

            // Home 按钮（菜单页的 Home：刷新页面 / 回到首页）
            const homeBtn = document.getElementById('menu-home-btn');
            if (homeBtn) {
                homeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 重新加载菜单（重播动画）
                    this.scene.start('MenuScene');
                });
            }

        }
    }

    // ── 隐藏遮罩 → 进入游戏 ───────────────────────
    _hideOverlayAndGo(lvIdx) {
        const overlay = document.getElementById('menu-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        // 短暂延迟让 CSS 过渡完成后再切场景
        this.time.delayedCall(400, () => {
            this.scene.start('LoadingScene', {
                nextScene: 'LevelScene',
                nextData: { lvIdx },
                minDuration: 900,
            });
        });
    }
}
