/**
 * ProfilePanel.js — Profile 面板数据 + 动态 DOM 渲染
 *
 * 替代原 index.html 内的静态 Profile DOM。所有内容通过 PROFILE_DATA 配置，
 * 改文案只需改本文件，不需要碰 HTML 模板。
 *
 * 用法（由 MenuController 调用）：
 *   import { mountProfile } from './ProfilePanel.js';
 *   mountProfile(document.getElementById('profile-overlay'));
 */

const PROFILE_DATA = {
    name: 'XisaFool',
    tag: 'ex-ACMer',
    qq: '2834264571',
    avatar: 'js/Photo/Qiu/Head.jpg',
    education: [
        { icon: 'fa-graduation-cap', name: '南昌理工学院 · 计算机科学与技术（本科）', year: '2022-2026' },
        { icon: 'fa-university',     name: '中国计量大学 · 人工智能（硕士）',         year: '2026-至今' },
        { icon: 'fa-laptop-code',    name: '南昌理工ACM集训队',                       year: ''         },
    ],
    hobbies: ['足球', 'Vibe Coding', 'XCPC', 'CS2'],
    awards: [
        { name: 'CCPC 重庆区域赛 铜奖',                year: '2024', image: 'js/Photo/Awards/2024_ccpc_chongqing.webp' },
        { name: 'CCPC福建邀请赛 铜奖',                  year: '2024', image: 'js/Photo/Awards/2024_ccpc_fuzhou.webp' },
        { name: 'ICPC 江西省赛 银奖',                  year: '2024', image: 'js/Photo/Awards/2024_icpc_jiangxi.webp' },
        { name: '睿抗机器人开发者大赛 全国一等奖',     year: '2024', image: 'js/Photo/Awards/2024_raicom_final.webp' },
        { name: '第十六届蓝桥杯 C/C++ B组 全国一等奖', year: '2025', image: 'js/Photo/Awards/2025_lanqiao_national.webp' },
        { name: '百度之星程序设计大赛 初赛银奖',        year: '2024', image: 'js/Photo/Awards/2024_baidu_star.webp' },
        { name: '程序设计天梯赛 国家二等奖',            year: '2026', image: 'js/Photo/Awards/2026_gplt_individual.webp' },
    ],
};

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderEducationItem(item) {
    const yearHtml = item.year
        ? `<span class="profile-award-year">${escapeHtml(item.year)}</span>`
        : '';
    return `
        <div class="profile-award-item">
            <i class="fa-solid ${escapeHtml(item.icon)}"></i>
            <span class="profile-award-name">${escapeHtml(item.name)}</span>
            ${yearHtml}
        </div>
    `;
}

function renderAwardItem(item, idx) {
    return `
        <div class="profile-award-item" data-award-idx="${idx}">
            <i class="fa-solid fa-trophy"></i>
            <span class="profile-award-name">${escapeHtml(item.name)}</span>
            <span class="profile-award-year">${escapeHtml(item.year)}</span>
        </div>
    `;
}

function renderHobbyTag(text) {
    return `<span class="profile-tag-item">${escapeHtml(text)}</span>`;
}

function buildPanelHTML(data) {
    return `
        <div class="profile-panel">
            <div class="profile-gradient-bar"></div>
            <button class="profile-close" id="profile-close-btn">&times;</button>
            <div class="profile-body">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <img src="${escapeHtml(data.avatar)}" alt="${escapeHtml(data.name)}">
                    </div>
                    <div class="profile-info">
                        <h2 class="profile-name">${escapeHtml(data.name)}</h2>
                        <p class="profile-tag">${escapeHtml(data.tag)}</p>
                        <p class="profile-contact">
                            QQ：${escapeHtml(data.qq)}
                            <button class="profile-copy-btn" id="profile-copy-qq">复制</button>
                        </p>
                    </div>
                </div>

                <div class="profile-divider"><span>Education Background</span></div>
                <div class="profile-awards">
                    ${data.education.map(renderEducationItem).join('')}
                </div>

                <div class="profile-divider" style="margin-top: 20px;"><span>Interests &amp; Hobbies</span></div>
                <div class="profile-tags-container">
                    ${data.hobbies.map(renderHobbyTag).join('')}
                </div>

                <div class="profile-divider" style="margin-top: 20px;"><span>Competitive Record</span></div>
                <div class="profile-awards profile-awards-competitive">
                    ${data.awards.map((item, idx) => renderAwardItem(item, idx)).join('')}
                </div>
            </div>
        </div>
        <div class="profile-award-preview" id="profile-award-preview" aria-hidden="true">
            <div class="profile-preview-badge">
                <div class="profile-preview-badge-left">
                    <i class="fa-solid fa-award"></i>
                    <span class="profile-preview-title" id="profile-preview-title"></span>
                </div>
                <span class="profile-preview-year" id="profile-preview-year"></span>
            </div>
            <div class="profile-preview-image-box">
                <img class="profile-preview-img" id="profile-preview-img-1" alt="获奖证书预览" />
                <img class="profile-preview-img" id="profile-preview-img-2" alt="获奖证书预览" />
            </div>
        </div>
    `;
}

/**
 * 把 Profile DOM 挂载到给定的 overlay 容器中，绑定 QQ 复制与证书悬浮联动预览。
 * @param {HTMLElement} overlayEl  #profile-overlay
 * @returns {{ closeBtn: HTMLElement|null }} 返回内部需要 PanelManager 绑定的 closeBtn 引用
 */
export function mountProfile(overlayEl) {
    if (!overlayEl) return { closeBtn: null };
    overlayEl.innerHTML = buildPanelHTML(PROFILE_DATA);

    // 预热 7 张 WebP 证书图片至浏览器缓存
    PROFILE_DATA.awards.forEach((item) => {
        if (item.image) {
            const preloadImg = new Image();
            preloadImg.src = item.image;
        }
    });

    const copyBtn = overlayEl.querySelector('#profile-copy-qq');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(PROFILE_DATA.qq).then(() => {
                copyBtn.textContent = '已复制 ✓';
                setTimeout(() => { copyBtn.textContent = '复制'; }, 1500);
            });
        });
    }

    // 联动预览控制器
    const panelEl = overlayEl.querySelector('.profile-panel');
    const previewEl = overlayEl.querySelector('#profile-award-preview');
    const titleEl = overlayEl.querySelector('#profile-preview-title');
    const yearEl = overlayEl.querySelector('#profile-preview-year');
    const imgEl1 = overlayEl.querySelector('#profile-preview-img-1');
    const imgEl2 = overlayEl.querySelector('#profile-preview-img-2');
    const awardItems = overlayEl.querySelectorAll('.profile-award-item[data-award-idx]');

    let hideTimer = null;
    let currentIdx = -1;
    let activeSlot = 0; // 0: imgEl1, 1: imgEl2

    function cancelHide() {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    }

    function hidePreview() {
        cancelHide();
        currentIdx = -1;
        if (panelEl) panelEl.classList.remove('preview-active');
        if (previewEl) {
            previewEl.classList.remove('active');
            previewEl.setAttribute('aria-hidden', 'true');
        }
        awardItems.forEach((item) => item.classList.remove('preview-selected'));
    }

    function scheduleHide() {
        cancelHide();
        hideTimer = setTimeout(() => {
            hidePreview();
        }, 120);
    }

    function showAward(idx) {
        cancelHide();
        if (idx === currentIdx) return;
        const award = PROFILE_DATA.awards[idx];
        if (!award || !award.image) return;

        currentIdx = idx;

        // 激活面板左移与预览卡片浮现
        if (panelEl) panelEl.classList.add('preview-active');
        if (previewEl) {
            previewEl.classList.add('active');
            previewEl.setAttribute('aria-hidden', 'false');
        }

        // 高亮当前选中的奖项条目
        awardItems.forEach((item) => {
            const itemIdx = parseInt(item.dataset.awardIdx, 10);
            item.classList.toggle('preview-selected', itemIdx === idx);
        });

        // 更新徽章铭牌文案
        if (titleEl) titleEl.textContent = award.name;
        if (yearEl) yearEl.textContent = award.year;

        // 双图平滑 Cross-fade 切换
        const activeImg = activeSlot === 0 ? imgEl1 : imgEl2;
        const nextImg = activeSlot === 0 ? imgEl2 : imgEl1;

        if (!activeImg.classList.contains('visible') && !nextImg.classList.contains('visible')) {
            // 首次展示
            imgEl1.src = award.image;
            imgEl1.classList.add('visible');
            activeSlot = 0;
        } else {
            // 交叉淡入淡出
            nextImg.src = award.image;
            nextImg.classList.add('visible');
            activeImg.classList.remove('visible');
            activeSlot = 1 - activeSlot;
        }
    }

    // 绑定奖项列表交互事件
    awardItems.forEach((item) => {
        const idx = parseInt(item.dataset.awardIdx, 10);
        item.addEventListener('mouseenter', () => {
            showAward(idx);
        });
        item.addEventListener('mouseleave', () => {
            scheduleHide();
        });
    });

    // 悬停在预览相框本体时保持显示，移出时触发防抖隐藏
    if (previewEl) {
        previewEl.addEventListener('mouseenter', () => {
            cancelHide();
        });
        previewEl.addEventListener('mouseleave', () => {
            scheduleHide();
        });
    }

    // 监听 overlay 关闭或遮罩点击，立即清理状态与定时器
    const closeBtn = overlayEl.querySelector('#profile-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hidePreview);
    }
    overlayEl.addEventListener('click', (e) => {
        if (e.target === overlayEl) hidePreview();
    });

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                if (overlayEl.classList.contains('closing') || overlayEl.classList.contains('hidden')) {
                    hidePreview();
                }
            }
        }
    });
    observer.observe(overlayEl, { attributes: true, attributeFilter: ['class'] });

    return {
        closeBtn,
    };
}

export { PROFILE_DATA };
