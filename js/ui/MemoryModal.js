/* ============================================
   MemoryModal.js — 纯 DOM 弹窗控制器
   动态创建挂载到 body，不依赖 Phaser。
   支持图片 + 文字混合展示，点击图片/导航翻页
   ============================================ */
import { preloadImage, retryPreloadedImage } from '../utils/AssetHelper.js';

class MemoryModalController {
    constructor() {
        this.createDOM();

        // 内部状态
        this.city = '';
        this.slides = [];
        this.index = 0;
        this.onCloseFn = null;
        this.renderGeneration = 0;
        this.fadeFrame = null;
    }

    createDOM() {
        // 遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'memory-modal';
        this.overlay.style.display = 'none';

        // 弹窗主体
        this.box = document.createElement('div');
        this.box.className = 'modal-box';

        // 图片（点击翻页）
        this.imageEl = document.createElement('img');
        this.imageEl.className = 'modal-image';
        this.imageEl.addEventListener('click', () => this.next());

        this.imageStage = document.createElement('div');
        this.imageStage.className = 'modal-image-stage';
        this.imageStage.appendChild(this.imageEl);

        this.imageStateEl = document.createElement('div');
        this.imageStateEl.className = 'modal-image-state';
        this.imageMessageEl = document.createElement('p');
        this.imageMessageEl.className = 'modal-image-message';
        this.retryBtn = document.createElement('button');
        this.retryBtn.className = 'modal-retry';
        this.retryBtn.textContent = 'RETRY';
        this.retryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.retryCurrentImage();
        });
        this.imageStateEl.appendChild(this.imageMessageEl);
        this.imageStateEl.appendChild(this.retryBtn);
        this.imageStage.appendChild(this.imageStateEl);

        // 文字
        this.textEl = document.createElement('p');
        this.textEl.className = 'modal-text';

        // 翻页导航 "1 / 4 — CLICK TO NEXT"（点击也翻页）
        this.navEl = document.createElement('p');
        this.navEl.className = 'modal-nav';
        this.navEl.addEventListener('click', () => this.next());

        // 底部栏（左: Close 按钮）
        this.bottomBar = document.createElement('div');
        this.bottomBar.className = 'modal-bottom';

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'modal-close';
        this.closeBtn.textContent = 'CLICK TO CLOSE';
        this.closeBtn.addEventListener('click', () => this.close());

        this.bottomBar.appendChild(this.closeBtn);

        // 组装 DOM
        this.box.appendChild(this.imageStage);
        this.box.appendChild(this.textEl);
        this.box.appendChild(this.navEl);
        this.box.appendChild(this.bottomBar);

        this.overlay.appendChild(this.box);
        document.body.appendChild(this.overlay);

        // 点击遮罩层（弹窗外部）关闭
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    /**
     * @param {string} city - 当前城市名
     * @param {Array} slides - [{text: "", image: ""}, ...] 数组
     * @param {Function} onCloseFn - 弹窗关闭后的回调函数
     */
    open(city, slides, onCloseFn) {
        if (!slides || slides.length === 0) {
            if (onCloseFn) onCloseFn();
            return false;
        }

        this.invalidateRender();
        this.city = city;
        this.slides = slides;
        this.onCloseFn = onCloseFn;
        this.index = 0;

        this.overlay.style.display = 'flex';
        this.render();
        return true;
    }

    render() {
        const slide = this.slides[this.index];
        const total = this.slides.length;
        const generation = ++this.renderGeneration;

        if (slide.image) {
            this.imageStage.style.display = 'block';
            this.imageEl.removeAttribute('src');
            this.imageEl.style.display = 'none';
            this.imageEl.style.opacity = '0';
            this.imageEl.style.cursor = (this.index < total - 1) ? 'pointer' : 'default';
            this.showImageState('LOADING IMAGE...', false);
            this.loadCurrentImage(slide.image, generation, false);
        } else {
            this.imageStage.style.display = 'none';
        }

        // 文字
        if (slide.text) {
            this.textEl.textContent = slide.text;
            this.textEl.style.display = 'block';
        } else {
            this.textEl.style.display = 'none';
        }

        // 导航
        this.navEl.style.display = 'block';
        if (this.index < total - 1) {
            this.navEl.textContent = `${this.index + 1} / ${total} — CLICK TO NEXT`;
        } else if (total > 1) {
            this.navEl.textContent = `${this.index + 1} / ${total}`;
        } else {
            this.navEl.style.display = 'none';
        }
    }

    loadCurrentImage(src, generation, retry) {
        const request = retry ? retryPreloadedImage(src) : preloadImage(src);
        request.then((image) => {
            if (!this.isCurrentRender(generation)) return;
            this.imageEl.src = image.src;
            this.imageEl.style.display = 'block';
            this.hideImageState();
            this.fadeFrame = requestAnimationFrame(() => {
                if (this.isCurrentRender(generation)) this.imageEl.style.opacity = '1';
            });
        }).catch(() => {
            if (!this.isCurrentRender(generation)) return;
            this.imageEl.removeAttribute('src');
            this.imageEl.style.display = 'none';
            this.showImageState('IMAGE FAILED TO LOAD.', true);
        });
    }

    retryCurrentImage() {
        const slide = this.slides[this.index];
        if (!slide || !slide.image) return;

        const generation = ++this.renderGeneration;
        this.imageEl.removeAttribute('src');
        this.imageEl.style.display = 'none';
        this.imageEl.style.opacity = '0';
        this.showImageState('RETRYING IMAGE...', false);
        this.loadCurrentImage(slide.image, generation, true);
    }

    showImageState(message, canRetry) {
        this.imageMessageEl.textContent = message;
        this.retryBtn.style.display = canRetry ? 'inline-block' : 'none';
        this.imageStateEl.style.display = 'flex';
    }

    hideImageState() {
        this.imageStateEl.style.display = 'none';
    }

    isCurrentRender(generation) {
        return generation === this.renderGeneration && this.overlay.style.display === 'flex';
    }

    invalidateRender() {
        this.renderGeneration += 1;
        if (this.fadeFrame) {
            cancelAnimationFrame(this.fadeFrame);
            this.fadeFrame = null;
        }
    }

    next() {
        if (this.slides.length === 0) return;
        if (this.index < this.slides.length - 1) {
            this.index++;
            this.render();
        } else {
            this.close();
        }
    }

    close() {
        this.invalidateRender();
        this.overlay.style.display = 'none';
        this.imageEl.removeAttribute('src');
        this.imageEl.style.opacity = '0';
        this.slides = [];
        this.index = 0;
        if (this.onCloseFn) {
            this.onCloseFn();
            this.onCloseFn = null;
        }
    }
}

// 自动实例化并挂载到 window，保证 LevelScene 能直接调用 window.MemoryModal.open()
window.MemoryModal = new MemoryModalController();
export default window.MemoryModal;
