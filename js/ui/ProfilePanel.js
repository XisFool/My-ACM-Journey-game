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
        { name: 'CCPC 重庆区域赛 铜奖',                year: '2024' },
        { name: 'CCPC福建邀请赛 铜奖',                  year: '2024' },
        { name: 'ICPC 江西省赛 银奖',                  year: '2024' },
        { name: '睿抗机器人开发者大赛 全国一等奖',     year: '2024' },
        { name: '第十五届蓝桥杯 C/C++ B组 全国一等奖', year: '2025' },
        { name: '百度之星程序设计大赛 初赛银奖',        year: '2024' },
        { name: '程序设计天梯赛 国家二等奖',            year: '2026' },
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

function renderAwardItem(item) {
    return `
        <div class="profile-award-item">
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
                <div class="profile-awards">
                    ${data.awards.map(renderAwardItem).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * 把 Profile DOM 挂载到给定的 overlay 容器中，绑定 QQ 复制按钮。
 * @param {HTMLElement} overlayEl  #profile-overlay
 * @returns {{ closeBtn: HTMLElement|null }} 返回内部需要 PanelManager 绑定的 closeBtn 引用
 */
export function mountProfile(overlayEl) {
    if (!overlayEl) return { closeBtn: null };
    overlayEl.innerHTML = buildPanelHTML(PROFILE_DATA);

    const copyBtn = overlayEl.querySelector('#profile-copy-qq');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(PROFILE_DATA.qq).then(() => {
                copyBtn.textContent = '已复制 ✓';
                setTimeout(() => { copyBtn.textContent = '复制'; }, 1500);
            });
        });
    }

    return {
        closeBtn: overlayEl.querySelector('#profile-close-btn'),
    };
}

export { PROFILE_DATA };
