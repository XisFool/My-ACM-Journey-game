/**
 * MenuController.js — 主菜单交互总入口
 *
 * 接管原 index.html 中 4 段 inline IIFE：
 *   1) 日夜主题切换（#theme-toggle, localStorage('acm-theme')）
 *   2) Profile / Project 面板的开/关（通过 PanelManager 抽象）
 *   3) 主菜单 home-container 鼠标 proximity 缩放
 *   4) Press Start / Continue 按钮（保留 _menuSceneRef / _pendingStart 协议）
 *
 * 由 index.html 用 <script type="module" src="js/ui/MenuController.js"></script> 加载。
 * ES Module 默认 defer，DOM 已 ready，可直接查询元素。
 */
import { createPanel } from './PanelManager.js';
import { mountProfile } from './ProfilePanel.js';

/* ---------------- 日夜主题切换 ---------------- */
function initThemeToggle() {
    const overlay = document.getElementById('menu-overlay');
    const toggleBtn = document.getElementById('theme-toggle');
    if (!overlay) return;
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

    const profileOverlay = document.getElementById('profile-overlay');
    const projectOverlay = document.getElementById('project-overlay');

    function applyTheme(theme) {
        overlay.dataset.theme = theme;
        if (icon) {
            icon.className = theme === 'night' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
        document.body.style.background = theme === 'night' ? '#000000' : '#ffffff';
        if (profileOverlay) profileOverlay.classList.toggle('night', theme === 'night');
        if (projectOverlay) projectOverlay.classList.toggle('night', theme === 'night');
    }

    const saved = localStorage.getItem('acm-theme') || 'day';
    applyTheme(saved);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const current = overlay.dataset.theme || 'day';
            const next = current === 'night' ? 'day' : 'night';
            applyTheme(next);
            localStorage.setItem('acm-theme', next);
        });
    }
}

/* ---------------- 入场动画重放 ---------------- */
function replayEntrance() {
    const els = document.querySelectorAll(
        '.main-text, .sub-text, .hero-cta, .explore-container, .home-wrapper'
    );
    els.forEach((el) => {
        el.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        el.offsetHeight; // force reflow
        el.style.animation = '';
    });
}

/* ---------------- Profile 面板 ---------------- */
function initProfilePanel() {
    const profileOverlay = document.getElementById('profile-overlay');
    const profileOpenBtn = document.getElementById('menu-profile-btn');
    if (!profileOverlay) return;

    // 动态挂载 Profile DOM
    const { closeBtn } = mountProfile(profileOverlay);

    // 同步当前主题（initThemeToggle 已 toggle 一次，但若 mountProfile 后才挂载，需要补一次）
    const overlay = document.getElementById('menu-overlay');
    if (overlay) {
        profileOverlay.classList.toggle('night', overlay.dataset.theme === 'night');
    }

    createPanel({
        overlayEl: profileOverlay,
        openBtn: profileOpenBtn,
        closeBtn,
        clickOverlayToClose: true,
    });
}

/* ---------------- Project 面板（动态加载 ProjectPage 模块） ---------------- */
function initProjectPanel() {
    const projectOverlay = document.getElementById('project-overlay');
    const projectOpenBtn = document.getElementById('menu-project-btn');
    const projectCloseBtn = document.getElementById('project-close-btn');
    const homeContainer = document.querySelector('.home-container');
    if (!projectOverlay) return;

    let projectPageMod = null;
    async function ensureProjectMod() {
        if (!projectPageMod) {
            projectPageMod = await import('./ProjectPage.js');
        }
        return projectPageMod;
    }

    const projectPanel = createPanel({
        overlayEl: projectOverlay,
        openBtn: null,           // 自定义 open（需 await import）
        closeBtn: null,          // 自定义 close（需 await destroy）
        clickOverlayToClose: false, // 自定义遮罩点击行为
        onOpen: () => {
            if (homeContainer) homeContainer.style.display = 'none';
        },
        onClose: () => {
            if (homeContainer) homeContainer.style.display = '';
            replayEntrance();
        },
    });

    async function openProject(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        projectPanel.open();
        const mod = await ensureProjectMod();
        mod.initProjectPage();
    }

    async function closeProject() {
        const mod = await ensureProjectMod();
        mod.destroyProjectPage();
        projectPanel.close();
    }

    if (projectOpenBtn) projectOpenBtn.addEventListener('click', openProject);
    if (projectCloseBtn) projectCloseBtn.addEventListener('click', closeProject);

    // ProjectPage 内部动态生成的 close 按钮通过自定义事件请求关闭
    projectOverlay.addEventListener('pj:request-close', closeProject);
    // 点击外层遮罩区域关闭（保留旧逻辑）
    projectOverlay.addEventListener('click', (e) => {
        if (e.target === projectOverlay) closeProject();
    });
}

/* ---------------- 鼠标 Proximity 按钮缩放 ---------------- */
function initButtonProximity() {
    const overlay = document.getElementById('menu-overlay');
    if (!overlay) return;
    const RANGE = 150;
    const MAX_SCALE = 1.18;

    function getWrappers() {
        return overlay.querySelectorAll('.home-container .home-wrapper');
    }

    overlay.addEventListener('mousemove', (e) => {
        getWrappers().forEach((w) => {
            const btn = w.querySelector('.home-btn, .profile-btn, .project-btn');
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
            if (dist < RANGE) {
                const t = 1 - dist / RANGE;
                btn.style.setProperty('--prox', (1 + t * (MAX_SCALE - 1)).toFixed(3));
            } else {
                btn.style.setProperty('--prox', '1');
            }
        });
    });

    overlay.addEventListener('mouseleave', () => {
        getWrappers().forEach((w) => {
            const btn = w.querySelector('.home-btn, .profile-btn, .project-btn');
            if (btn) btn.style.setProperty('--prox', '1');
        });
    });
}

/* ---------------- Press Start / Continue 立即绑定 ---------------- */
function initStartButtons() {
    const STORAGE_KEY = 'acm_journey_last_level';
    const btnStart = document.getElementById('btn-start');
    const btnContinue = document.getElementById('btn-continue');

    function startGame(lvIdx) {
        if (window._menuSceneRef) {
            window._menuSceneRef._hideOverlayAndGo(lvIdx);
            return;
        }
        // Phaser 还在加载 → 显示反馈 + 排队
        if (btnStart) btnStart.textContent = 'LOADING...';
        if (btnContinue) btnContinue.textContent = 'LOADING...';
        window._pendingStart = lvIdx;
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => startGame(0));
    }
    if (btnContinue) {
        btnContinue.addEventListener('click', () => {
            const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
            startGame(isNaN(saved) ? 0 : saved);
        });
    }
}

/* ---------------- 启动 ---------------- */
initThemeToggle();
initProfilePanel();
initProjectPanel();
initButtonProximity();
initStartButtons();
