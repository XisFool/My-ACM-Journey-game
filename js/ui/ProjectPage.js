// ProjectPage.js — vanilla port of personal-3d-intro React app
// Scoped inside #project-overlay. All constants (depthLayers, lerp, tilts, radii)
// kept identical to the original for 1:1 motion fidelity.

const PROJECTS_DATA = [
    {
        num: '01',
        title: '智能客服Agent平台',
        tags: ['LLM', 'RAG', 'Agent', 'Spring Boot'],
        desc: '基于大语言模型的多轮对话系统，支持工具调用、知识库实时检索与上下文记忆，日均处理对话10万+',
        year: '2025',
        image: 'js/Photo/Projects/01.webp',
    },
    {
        num: '02',
        title: '自动化流程引擎',
        tags: ['Workflow', 'Java', 'Microservices'],
        desc: '可视化AI工作流编排系统，支持拖拽式流程设计、自动化任务调度与执行监控，提升业务效率60%',
        year: '2025',
        image: 'js/Photo/Projects/02.webp',
    },
    {
        num: '03',
        title: '个人3D简历空间',
        tags: ['React', 'CSS 3D', 'Canvas'],
        desc: '沉浸式个人交互主页，借助原生纯CSS3D属性和鼠标透视追踪实现新一代Web端视觉体验。',
        year: '2026',
        image: 'js/Photo/Projects/03.webp',
    },
];

const HERO_TEXT_BASE = "Hello, I'm Xie";
const HERO_TEXT_MASK = '你好，我是谢文灿';
const HERO_SUB = 'AI Agent Engineer | 22 | 江西赣州';
const DEPTH_LAYERS = 30;
const Z_OFFSET_STEP = 2;

let state = null; // singleton live state

function buildLayeredText(content, layerClass) {
    // Creates 30 stacked spans with translateZ for landscape/mask variants.
    const wrap = document.createElement('div');
    wrap.className = 'pj-3d-text';
    for (let i = 0; i < DEPTH_LAYERS; i++) {
        const span = document.createElement('span');
        span.textContent = content;
        span.className = 'pj-3d-text-layer' + (i === 0 ? ' pj-3d-text-front' : '');
        span.style.transform = `translateZ(${-i * Z_OFFSET_STEP}px)`;
        span.dataset.layerIdx = i;
        wrap.appendChild(span);
    }
    if (layerClass) wrap.classList.add(layerClass);
    return wrap;
}

function buildSubText(text, colorVar) {
    const p = document.createElement('p');
    p.className = 'pj-hero-sub';
    p.textContent = text;
    p.style.color = colorVar;
    p.style.transform = 'translateZ(20px)';
    return p;
}

function buildScene(textContent, variant) {
    // variant: 'base' | 'mask'
    const scene = document.createElement('div');
    scene.className = `pj-scene pj-scene--${variant}`;
    scene.style.transformStyle = 'preserve-3d';
    scene.style.transform = 'translate(-50%, -50%)';
    scene.appendChild(buildLayeredText(textContent, `pj-3d-text--${variant}`));
    const subColor = variant === 'mask' ? 'var(--pj-mask-text)' : 'var(--pj-text-strong)';
    scene.appendChild(buildSubText(HERO_SUB, subColor));
    return scene;
}

function buildProjectCard(p, idx) {
    const card = document.createElement('div');
    card.className = 'pj-card' + (idx % 2 === 0 ? ' pj-card--even' : ' pj-card--odd');
    card.dataset.idx = idx;

    const content = document.createElement('div');
    content.className = 'pj-card-content';
    content.style.transform = 'translateZ(30px)';
    content.style.transformStyle = 'preserve-3d';

    const num = document.createElement('div');
    num.className = 'pj-card-num';
    num.textContent = p.num;
    content.appendChild(num);

    const h3 = document.createElement('h3');
    h3.className = 'pj-card-title';
    h3.textContent = p.title;
    content.appendChild(h3);

    const tags = document.createElement('div');
    tags.className = 'pj-card-tags';
    p.tags.forEach((t) => {
        const s = document.createElement('span');
        s.className = 'pj-card-tag';
        s.textContent = t;
        tags.appendChild(s);
    });
    content.appendChild(tags);

    const desc = document.createElement('p');
    desc.className = 'pj-card-desc';
    desc.textContent = p.desc;
    content.appendChild(desc);

    const year = document.createElement('div');
    year.className = 'pj-card-year';
    year.textContent = p.year;
    content.appendChild(year);

    const imgWrap = document.createElement('div');
    imgWrap.className = 'pj-card-img';
    imgWrap.style.transform = 'translateZ(20px)';
    const img = document.createElement('img');
    img.src = p.image;
    img.alt = p.title;
    img.loading = 'lazy';
    imgWrap.appendChild(img);

    card.appendChild(content);
    card.appendChild(imgWrap);
    return card;
}

function buildBody(overlay) {
    // Remove old placeholder contents (except close button)
    const closeBtn = overlay.querySelector('#project-close-btn');
    overlay.innerHTML = '';
    if (closeBtn) overlay.appendChild(closeBtn);
    else {
        const btn = document.createElement('button');
        btn.className = 'project-close';
        btn.id = 'project-close-btn';
        btn.innerHTML = '&times;';
        overlay.appendChild(btn);
    }

    // Canvas background
    const canvas = document.createElement('canvas');
    canvas.className = 'pj-bg-grid';
    overlay.appendChild(canvas);

    // Mask container (covers viewport, clip-path circle follows mouse)
    const maskContainer = document.createElement('div');
    maskContainer.className = 'pj-mask-container';
    const maskScroll = document.createElement('div');
    maskScroll.className = 'pj-mask-scroll';
    const maskHeroWrap = document.createElement('div');
    maskHeroWrap.className = 'pj-hero-wrap pj-hero-wrap--mask';
    const maskScene = buildScene(HERO_TEXT_MASK, 'mask');
    maskHeroWrap.appendChild(maskScene);
    maskScroll.appendChild(maskHeroWrap);
    maskContainer.appendChild(maskScroll);
    overlay.appendChild(maskContainer);

    // Top nav
    const nav = document.createElement('header');
    nav.className = 'pj-nav';
    nav.innerHTML = `
        <div class="pj-nav-pill">
            <button class="pj-nav-btn" data-target="about">关于</button>
            <button class="pj-nav-btn" data-target="projects">项目</button>
            <button class="pj-nav-btn" data-target="contact">联系</button>
        </div>
    `;
    overlay.appendChild(nav);

    // Custom cursor dot
    const cursor = document.createElement('div');
    cursor.className = 'pj-cursor';
    overlay.appendChild(cursor);

    // Sections wrapper (scrollable)
    const content = document.createElement('div');
    content.className = 'pj-content';

    // Hero
    const hero = document.createElement('section');
    hero.id = 'pj-about';
    hero.className = 'pj-section pj-section--hero';
    const baseHeroWrap = document.createElement('div');
    baseHeroWrap.className = 'pj-hero-wrap pj-hero-wrap--base';
    const baseScene = buildScene(HERO_TEXT_BASE, 'base');
    baseHeroWrap.appendChild(baseScene);
    hero.appendChild(baseHeroWrap);
    const heroHover = document.createElement('div');
    heroHover.className = 'pj-hero-hover';
    hero.appendChild(heroHover);
    const guide = document.createElement('p');
    guide.className = 'pj-hero-guide';
    guide.textContent = '移动鼠标开始探索吧，向下滑动查看更多';
    hero.appendChild(guide);
    content.appendChild(hero);

    // Projects
    const projects = document.createElement('section');
    projects.id = 'pj-projects';
    projects.className = 'pj-section pj-section--projects';
    projects.innerHTML = `
        <div class="pj-sec-header">
            <h2>项目经历</h2>
            <div class="pj-sec-underline"></div>
        </div>
        <div class="pj-card-stack"></div>
    `;
    const stack = projects.querySelector('.pj-card-stack');
    PROJECTS_DATA.forEach((p, i) => stack.appendChild(buildProjectCard(p, i)));
    content.appendChild(projects);

    // Contact
    const contact = document.createElement('section');
    contact.id = 'pj-contact';
    contact.className = 'pj-section pj-section--contact';
    contact.innerHTML = `
        <div class="pj-sec-header">
            <h2>联系方式</h2>
            <div class="pj-sec-underline"></div>
        </div>
        <div class="pj-contact-grid">
            <a href="mailto:xisafoolcn@gmail.com" class="pj-contact-card">
                <div class="pj-contact-icon"><i class="fa-solid fa-envelope"></i></div>
                <h3>邮箱联系</h3>
                <p class="pj-contact-val">xisafoolcn@gmail.com</p>
                <p class="pj-contact-hint">点击发送邮件</p>
            </a>
            <a href="https://github.com/Asenlyf" target="_blank" rel="noopener noreferrer" class="pj-contact-card">
                <div class="pj-contact-icon"><i class="fa-brands fa-github"></i></div>
                <h3>GitHub</h3>
                <p class="pj-contact-val">Asenlyf</p>
                <p class="pj-contact-hint">点击访问主页</p>
            </a>
            <button class="pj-contact-card pj-contact-card--wechat" id="pj-wechat-btn">
                <div class="pj-contact-icon"><i class="fa-brands fa-weixin"></i></div>
                <h3>微信 / WeChat</h3>
                <p class="pj-contact-val">SoberLeo2002</p>
                <div class="pj-wechat-hint-wrap">
                    <p class="pj-wechat-hint pj-wechat-hint--idle">点击复制微信号</p>
                    <p class="pj-wechat-hint pj-wechat-hint--done">已复制 !</p>
                </div>
            </button>
        </div>
    `;
    content.appendChild(contact);

    overlay.appendChild(content);

    return {
        canvas,
        maskContainer,
        maskScroll,
        baseScene,
        maskScene,
        content,
        hero,
        projects,
        contact,
        cursor,
        navButtons: nav.querySelectorAll('.pj-nav-btn'),
        cards: stack.querySelectorAll('.pj-card'),
        heroHover,
        wechatBtn: contact.querySelector('#pj-wechat-btn'),
    };
}

function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    function draw() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dotColor = getComputedStyle(canvas).getPropertyValue('--pj-grid-dot').trim() || '#000';
        ctx.fillStyle = dotColor;
        const gap = 30;
        const radius = 2;
        for (let x = 0; x < w; x += gap) {
            for (let y = 0; y < h; y += gap) {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }
    return { resize, draw };
}

function setupCardTilt(card) {
    const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const xPos = e.clientX - rect.left;
        const yPos = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const x = (xPos - cx) / cx;
        const y = (yPos - cy) / cy;
        const tiltX = y * 8;
        const tiltY = -x * 8;
        card.style.transition = 'transform 0.1s ease-out';
        card.style.transform =
            `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1)`;
        card.classList.add('is-hovered');
    };
    const onLeave = () => {
        card.style.transition = 'transform 0.5s ease-out';
        card.style.transform =
            'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.classList.remove('is-hovered');
    };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    return () => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
    };
}

export function initProjectPage() {
    if (state) return; // already inited
    const overlay = document.getElementById('project-overlay');
    if (!overlay) return;

    const els = buildBody(overlay);

    // Re-wire close button (it was recreated)
    const closeBtn = overlay.querySelector('#project-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            // Delegate to existing global close flow defined in index.html script.
            // Dispatch a custom event so inline script can react.
            overlay.dispatchEvent(new CustomEvent('pj:request-close'));
        });
    }

    // Canvas
    const canvasCtx = setupCanvas(els.canvas);
    canvasCtx.resize();
    window.addEventListener('resize', canvasCtx.resize);

    // Mask + mouse lerp animation state
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const lerped = { x: window.innerWidth / 2, y: window.innerHeight / 2, radius: 77, scale: 1 };
    let isHoveredHero = false;
    let firstMove = true;
    let activeSection = 'about';

    const onMouseMove = (e) => {
        if (firstMove) {
            lerped.x = e.clientX;
            lerped.y = e.clientY;
            firstMove = false;
        }
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        els.cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    overlay.addEventListener('mousemove', onMouseMove);
    // Hero hover zone
    els.heroHover.addEventListener('mouseenter', () => { isHoveredHero = true; });
    els.heroHover.addEventListener('mouseleave', () => { isHoveredHero = false; });

    // Scroll sync for mask (overlay is the scroll container)
    const onScroll = () => {
        els.maskScroll.style.transform = `translateY(${-overlay.scrollTop}px)`;
        // Compute active section based on scroll position
        const pos = overlay.scrollTop + window.innerHeight * 0.4;
        const projTop = els.projects.offsetTop;
        const contactTop = els.contact.offsetTop;
        let next = 'about';
        if (pos > contactTop) next = 'contact';
        else if (pos > projTop) next = 'projects';
        if (next !== activeSection) {
            activeSection = next;
            els.navButtons.forEach((b) => {
                b.classList.toggle('is-active', b.dataset.target === next);
            });
        }
    };
    overlay.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Nav clicks
    els.navButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const map = { about: els.hero, projects: els.projects, contact: els.contact };
            const el = map[target];
            if (el) overlay.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
        });
    });

    // Card tilt
    const cardCleanups = [];
    els.cards.forEach((card) => cardCleanups.push(setupCardTilt(card)));

    // Wechat copy (with fallback for restricted environments)
    const wechatBtn = els.wechatBtn;
    const showCopied = () => {
        wechatBtn.classList.add('is-copied');
        setTimeout(() => wechatBtn.classList.remove('is-copied'), 2000);
    };
    const fallbackCopy = (text) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
    };
    const onWechat = () => {
        const text = 'SoberLeo2002';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(showCopied, () => {
                fallbackCopy(text);
                showCopied();
            });
        } else {
            fallbackCopy(text);
            showCopied();
        }
    };
    wechatBtn.addEventListener('click', onWechat);

    // RAF lerp render loop — identical formulae to the React original
    let frameId = 0;
    const render = () => {
        lerped.x += (mouse.x - lerped.x) * 0.15;
        lerped.y += (mouse.y - lerped.y) * 0.15;

        let targetRadius = 77;
        let targetScale = 1;
        if (activeSection === 'projects' || activeSection === 'contact') {
            targetRadius = 15;
            targetScale = 1;
        } else {
            targetRadius = isHoveredHero ? 100 : 77;
            targetScale = isHoveredHero ? 1.05 : 1;
        }
        lerped.radius += (targetRadius - lerped.radius) * 0.1;
        lerped.scale += (targetScale - lerped.scale) * 0.1;

        els.maskContainer.style.clipPath =
            `circle(${lerped.radius}px at ${lerped.x}px ${lerped.y}px)`;

        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const x = (lerped.x - cx) / cx;
        const y = (lerped.y - cy) / cy;
        const tiltX = -y * 35;
        const tiltY = x * 35;
        const tfm =
            `translate(-50%, -50%) rotateX(${tiltX}deg) rotateY(${tiltY}deg) ` +
            `scale3d(${lerped.scale}, ${lerped.scale}, ${lerped.scale})`;
        els.baseScene.style.transform = tfm;
        els.maskScene.style.transform = tfm;

        frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);

    state = {
        overlay,
        els,
        frameId,
        cardCleanups,
        handlers: {
            onMouseMove,
            onScroll,
            resize: canvasCtx.resize,
            onWechat,
        },
    };
}

export function destroyProjectPage() {
    if (!state) return;
    const { overlay, els, frameId, cardCleanups, handlers } = state;
    cancelAnimationFrame(frameId);
    overlay.removeEventListener('mousemove', handlers.onMouseMove);
    overlay.removeEventListener('scroll', handlers.onScroll);
    window.removeEventListener('resize', handlers.resize);
    cardCleanups.forEach((fn) => fn());
    els.wechatBtn.removeEventListener('click', handlers.onWechat);
    state = null;
}
