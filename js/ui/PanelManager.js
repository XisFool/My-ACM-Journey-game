/**
 * PanelManager.js — 通用面板开关抽象
 *
 * 统一处理 .hidden / .closing class 切换、animationend 回收、点击遮罩关闭、
 * 以及 onOpen/onClose 钩子。Profile / Project 等面板都通过它注册，避免各自实现。
 *
 * 用法：
 *   const panel = createPanel({
 *     overlayEl: document.getElementById('xxx-overlay'),
 *     openBtn: document.getElementById('open-btn'),
 *     closeBtn: document.getElementById('close-btn'),
 *     clickOverlayToClose: true,
 *     onOpen: (overlay) => { ... },
 *     onClose: (overlay) => { ... },
 *   });
 *   panel.open();  // 也可直接点 openBtn 触发
 *   panel.close();
 */
export function createPanel(options) {
    const {
        overlayEl,
        openBtn = null,
        closeBtn = null,
        clickOverlayToClose = true,
        onOpen = null,
        onClose = null,
    } = options || {};

    if (!overlayEl) {
        console.warn('[PanelManager] overlayEl is required');
        return { open() {}, close() {} };
    }

    let isOpen = !overlayEl.classList.contains('hidden');

    function open(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (isOpen) return;
        overlayEl.classList.remove('hidden', 'closing');
        isOpen = true;
        if (typeof onOpen === 'function') {
            try { onOpen(overlayEl); } catch (err) { console.error('[PanelManager] onOpen error', err); }
        }
    }

    function close() {
        if (!isOpen) return;
        // 先调用 onClose 钩子（用于 ProjectPage 这类需要清理动态 DOM 的场景）
        if (typeof onClose === 'function') {
            try { onClose(overlayEl); } catch (err) { console.error('[PanelManager] onClose error', err); }
        }
        overlayEl.classList.add('closing');
        const handler = function () {
            overlayEl.classList.add('hidden');
            overlayEl.classList.remove('closing');
            overlayEl.removeEventListener('animationend', handler);
            isOpen = false;
        };
        overlayEl.addEventListener('animationend', handler);
    }

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (clickOverlayToClose) {
        overlayEl.addEventListener('click', (e) => {
            if (e.target === overlayEl) close();
        });
    }

    return { open, close, get isOpen() { return isOpen; } };
}
