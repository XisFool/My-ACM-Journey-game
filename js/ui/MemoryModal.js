/* ============================================
   MemoryModal.js — 纯 DOM 弹窗控制器
   动态创建挂载到 body，不依赖 Phaser。
   支持图片 + 文字混合展示，点击图片/导航翻页
   ============================================ */

class MemoryModalController {
    constructor() {
        this.createDOM();

        // 内部状态
        this.city = '';
        this.slides = [];
        this.index = 0;
        this.onCloseFn = null;
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
        this.box.appendChild(this.imageEl);
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
        if (!slides || slides.length === 0) return;

        this.city = city;
        this.slides = slides;
        this.onCloseFn = onCloseFn;
        this.index = 0;

        // 预加载所有图片，消除切换时的卡顿
        slides.forEach(s => { if (s.image) { new Image().src = s.image; } });

        this.overlay.style.display = 'flex';
        this.render();
    }

    render() {
        const slide = this.slides[this.index];
        const total = this.slides.length;

        // 图片
        if (slide.image) {
            this.imageEl.src = slide.image;
            this.imageEl.style.display = 'block';
            this.imageEl.style.cursor = (this.index < total - 1) ? 'pointer' : 'default';
        } else {
            this.imageEl.style.display = 'none';
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

    next() {
        if (this.index < this.slides.length - 1) {
            this.index++;
            this.render();
        } else {
            this.close();
        }
    }

    close() {
        this.overlay.style.display = 'none';
        if (this.onCloseFn) {
            this.onCloseFn();
            this.onCloseFn = null;
        }
    }
}

// 自动实例化并挂载到 window，保证 LevelScene 能直接调用 window.MemoryModal.open()
window.MemoryModal = new MemoryModalController();
export default window.MemoryModal;
