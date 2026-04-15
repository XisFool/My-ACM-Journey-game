/* ============================================
   LevelScene.js — 核心游戏场景
   ============================================ */
import { STORY } from '../story.js';
import { collectLevelAssets, isLevelPreheated, markLevelPreheated, preloadImage, preloadMemoryImages, queueAssets } from '../utils/AssetHelper.js';

const CFG = {
    W: 960, H: 540,
    WORLD_W: 2300,
    BG_SCROLL: 0.2,           // ← 背景跟随速度，0=不动 1=同步，自行微调
    GRAVITY: 900,
    JUMP_VELOCITY: -340,
    COYOTE_TIME_MS: 90,
    JUMP_BUFFER_MS: 110,
    PLAYER_SPEED: 230,
    GROUND_H: 58,              // ← 地面高度（约1格砖块）
    BLOCK_SIZE: 40,
};

export default class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
    }

    // ── 初始化 ──────────────────────────────────
    init(data) {
        this.lvIdx = data.lvIdx || 0;
        this.levelData = STORY.levels[this.lvIdx];
        this.isPaused = false;
        this.modalOpen = false;
        this.collected = 0;
    }

    // ── preload() ────────────────────────────────
    preload() {
        const assets = collectLevelAssets(this.lvIdx);
        queueAssets(this, assets);
    }

    // ── create() ─────────────────────────────────
    create() {
        // 持久化当前关卡索引，供主菜单 CONTINUE 读取
        try { localStorage.setItem('acm_journey_last_level', String(this.lvIdx)); } catch (_) { /* 无痕模式 */ }

        const bgNum = parseInt(this.levelData.bgColor.replace('#', ''), 16) || 0x000000;
        this.cameras.main.setBackgroundColor(bgNum);

        // 0. 背景音乐（同一首跨关卡共享进度，播完才循环）
        if (this.levelData.bgMusic) {
            const musicKey = `bgm:${this.levelData.bgMusic}`;
            const curKey = this.registry.get('_bgmKey');
            const curBgm = this.registry.get('_bgmObj');

            if (curKey === musicKey && curBgm && curBgm.isPlaying) {
                // 同一首歌仍在播放，不重启
                this.bgm = curBgm;
            } else {
                // 停掉旧的，播放新的
                if (curBgm) { try { curBgm.stop(); } catch (_) {} }
                this.bgm = this.sound.add(musicKey, { loop: true, volume: 0.5 });
                this.bgm.play();
                this.registry.set('_bgmKey', musicKey);
                this.registry.set('_bgmObj', this.bgm);
            }
        }

        // 1. 背景（视差滚动：背景比玩家慢）
        const bgKey = `bg_${this.lvIdx}`;
        if (this.levelData.bgImage && this.textures.exists(bgKey)) {
            this.bgImage = this.add.image(0, 0, bgKey)
                .setOrigin(0, 0)
                .setScrollFactor(CFG.BG_SCROLL, 0)
                .setDepth(-100);
            // 自动适配：先算出让图片高度=视口高度的基准缩放
            // BG_SCALE_MULT ← 在此微调（1.0=刚好填满高度，<1缩小，>1放大）
            const BG_SCALE_MULT = 0.96;
            const autoScale = CFG.H / this.bgImage.height;
            this.bgImage.setScale(autoScale * BG_SCALE_MULT);
        } else {
            // 背景渐变修饰（无图时）
            for (let i = 0; i < 5; i++) {
                this.add.rectangle(0, CFG.H - i * 60, CFG.WORLD_W, 60, 0xffffff, i * 0.05)
                    .setOrigin(0, 1)
                    .setScrollFactor(CFG.BG_SCROLL, 0)
                    .setDepth(-100);
            }
        }

        // 2. 地面（无可见砖块，仅保留隐形碰撞体）
        this.groundGroup = this.physics.add.staticGroup();
        const groundCol = this.add.rectangle(CFG.WORLD_W / 2, CFG.H - CFG.GROUND_H + CFG.GROUND_H / 2, CFG.WORLD_W, CFG.GROUND_H, 0x000000, 0);
        this.groundGroup.add(groundCol);
        groundCol.body.updateFromGameObject();

        // 3. 玩家（使用精灵图表动画）
        this.player = this.physics.add.sprite(100, CFG.H - CFG.GROUND_H - 51, 'player_r');
        this.player.setScale(0.21, 0.18);
        this.player.setCollideWorldBounds(false);
        this.player.setGravityY(CFG.GRAVITY);
        // 精灵图帧 230×410，角色占中间区域，设置碰撞体覆盖主体
        this.player.body.setSize(120, 370);
        this.player.body.setOffset(55, 30);
        this.facingRight = true;
        this.player.play('idle_r');

        // 5. 方块
        this.blocks = this.physics.add.staticGroup();
        const blocksData = this.levelData.memoryBlocks || [];
        this.totalBlocks = blocksData.length;

        blocksData.forEach((blockData, idx) => {
            const bx = 400 + (idx + 0.5) * ((CFG.WORLD_W - 800) / this.totalBlocks);
            const by = CFG.H - CFG.GROUND_H - 100 - Phaser.Math.Between(0, 21);

            const block = this.blocks.create(bx, by, 'qblock');
            block.setData('memories', blockData.memories);
            block.setData('collected', false);

            // 上下浮动 tween
            this.tweens.add({
                targets: block,
                y: block.y - 10,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 5b. NPC 生成
        this.npcs = [];
        const npcList = this.levelData.npcs || [];
        npcList.forEach(npcData => {
            // 计算 NPC X 坐标：放在 afterBlock 和 afterBlock+1 之间
            const idx1 = npcData.afterBlock;
            const idx2 = idx1 + 1;
            const spacing = (CFG.WORLD_W - 800) / this.totalBlocks;
            const bx1 = 400 + (idx1 + 0.5) * spacing;
            const bx2 = 400 + (idx2 + 0.5) * spacing;
            const npcX = (bx1 + bx2) / 2;
            const npcY = CFG.H - CFG.GROUND_H + 5;

            // 如果是精灵图，创建动画并播放
            let sprite;
            if (npcData.frameWidth) {
                const animKey = `npc_${npcData.key}_idle`;
                if (!this.anims.exists(animKey)) {
                    const totalFrames = Math.floor(
                        this.textures.get(npcData.key).getSourceImage().width / npcData.frameWidth
                    );
                    this.anims.create({
                        key: animKey,
                        frames: this.anims.generateFrameNumbers(npcData.key, { start: 0, end: totalFrames - 1 }),
                        frameRate: npcData.frameRate || 10,
                        repeat: -1,
                    });
                }
                sprite = this.add.sprite(npcX, npcY, npcData.key)
                    .setOrigin(0.5, 1)
                    .setDepth(5);
                sprite.play(`npc_${npcData.key}_idle`);
            } else {
                sprite = this.add.image(npcX, npcY, npcData.key)
                    .setOrigin(0.5, 1)
                    .setDepth(5);
            }
            // 自动缩放：让 NPC 高度约 30px
            const targetH = 31.5;
            sprite.setScale(targetH / sprite.height);

            // "!" 提示（靠近时显示）
            const exclaim = this.add.text(npcX, npcY - targetH - 16, '!', {
                fontFamily: '"Press Start 2P"',
                fontSize: '18px',
                color: '#ffd54f',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0.5).setDepth(10).setAlpha(0);

            // 气泡对话框（触发后显示）
            const bubble = this._createBubble(npcX, npcY - targetH - 30, npcData.dialog);
            bubble.setAlpha(0).setDepth(15);

            this.npcs.push({
                sprite,
                data: npcData,
                exclaim,
                bubble,
                nearTimer: 0,
                triggered: false,
                proximityRange: 80,
            });
        });

        // 6. 碰撞
        this.physics.add.collider(this.player, this.groundGroup);
        this.physics.add.collider(this.player, this.blocks, this.hitBlock, this.canHitBlock, this);

        // 加上防止掉出地图的保护（尽管collideWorldBounds=false）
        this.events.on('update', () => {
            if (this.player.y > CFG.H + 200) {
                this.player.setPosition(100, CFG.H - CFG.GROUND_H - 51);
                this.player.setVelocity(0, 0);
            }
        });

        // 7. 相机
        this.cameras.main.setBounds(0, 0, CFG.WORLD_W, CFG.H);
        this.physics.world.setBounds(0, 0, CFG.WORLD_W, CFG.H);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // 8. 输入
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keys = this.input.keyboard.addKeys({
            up: 'W', left: 'A', down: 'S', right: 'D'
        });
        this.lastGroundedAt = this.time.now;
        this.jumpPressedAt = -Infinity;
        this.jumpStarted = false;

        // 9. HUD — 左上角关卡信息（3行：LEVEL N / CITY / YEAR）
        this.add.text(20, 34, `LEVEL  ${this.levelData.id}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#ffffff',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true },
        }).setScrollFactor(0).setDepth(20);

        this.add.text(20, 56, this.levelData.cityEn || this.levelData.city, {
            fontFamily: '"Press Start 2P"',
            fontSize: '26px',
            color: '#000000',
            shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 0, fill: false },
        }).setScrollFactor(0).setDepth(20).setStroke('#ffffff', 4);

        this.add.text(20, 92, this.levelData.year, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#ffffff',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true },
        }).setScrollFactor(0).setDepth(20);

        this.hudCountText  = this.add.text(CFG.W - 20, 40, `Collected: ${this.collected}/${this.totalBlocks}`, { fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ffffff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);
        // Home 按钮（使用 DOM 层，与菜单 Home 统一设计）
        const gameHomeContainer = document.getElementById('game-home-container');
        const gameHomeBtn = document.getElementById('game-home-btn');
        if (gameHomeContainer) gameHomeContainer.style.display = 'flex';

        // 移除旧监听器（防止重复绑定）
        const newGameHomeBtn = gameHomeBtn.cloneNode(true);
        gameHomeBtn.parentNode.replaceChild(newGameHomeBtn, gameHomeBtn);

        newGameHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.sound.stopAll();
            this.registry.set('_bgmKey', null);
            this.registry.set('_bgmObj', null);
            if (gameHomeContainer) gameHomeContainer.style.display = 'none';
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                const overlay = document.getElementById('menu-overlay');
                if (overlay) overlay.classList.remove('hidden');
                this.scene.start('MenuScene');
            });
        });

        // 粒子系统
        if (this.levelData.particle) {
            this._createParticles();
        }

        // 淡入
        this.cameras.main.fadeIn(500, parseInt(this.levelData.bgColor.replace("#", ""), 16));

        // 延迟 1.5 秒后，在后台静默预加载本关剧情图片与下一关资源
        // 不会阻塞主线程和玩家操作
        this.time.delayedCall(1500, () => {
            this._preloadBackgroundAssets();
        });
    }

    // ── 后台预加载 ────────────────────────────────
    _preloadBackgroundAssets() {
        // 1. DOM层预加载本关所有的记忆图片（去重）
        preloadMemoryImages(this.levelData);

        // 2. Phaser 层预加载下一关核心资源 (减少过场时间)
        const nextIdx = this.lvIdx + 1;
        if (nextIdx < STORY.levels.length) {
            if (isLevelPreheated(nextIdx)) {
                return;
            }

            const assets = collectLevelAssets(nextIdx);
            const queued = queueAssets(this, assets);

            if (queued > 0) {
                this.load.once(Phaser.Loader.Events.COMPLETE, () => {
                    markLevelPreheated(nextIdx);
                });
                this.load.start(); // 对于非 preload 阶段调用 load，需要手动 start
            } else {
                markLevelPreheated(nextIdx);
            }
        } else {
            // 如果是最后一关，则预加载通关图
            preloadImage('js/Photo/Background/GameOver.webp');
        }
    }

    // ── canHitBlock(player, block) ────────────────
    canHitBlock(player, block) {
        // 返回 true 的条件（必须同时满足）：
        // 1. !block.getData('collected')
        // 2. !this.modalOpen
        // 3. player.body.velocity.y < 0（玩家向上运动）
        // 4. player.body.top < block.body.bottom + 12
        return (
            !block.getData('collected') &&
            !this.modalOpen &&
            player.body.velocity.y < 0 &&
            player.body.top < block.body.bottom + 12
        );
    }

    // ── hitBlock(player, block) ───────────────────
    hitBlock(player, block) {
        // 1. 标记收集
        block.setData('collected', true);
        
        // 2. UI 更新
        this.collected++;
        this.hudCountText.setText(`Collected: ${this.collected}/${this.totalBlocks}`);

        // 3. 方块变暗表示已触碰（不销毁）
        this.tweens.add({
            targets: block,
            y: block.y - 8,
            duration: 120,
            yoyo: true,
            ease: 'Power1',
            onComplete: () => {
                block.setTint(0x444444);
                block.setAlpha(0.45);
            }
        });

        // 4. 暂停玩家并在顶部反弹
        this.modalOpen = true;
        player.setVelocityX(0);
        player.setVelocityY(50); // 给个向下反弹效果

        // 5. 取数据
        const memories = block.getData('memories');

        // 6. 调用纯 DOM 弹窗
        window.MemoryModal.open(this.levelData.city, memories, () => {
            this.modalOpen = false;
            
            // 是否全部收集
            if (this.collected >= this.totalBlocks) {
                // 1秒后去下一关
                this.time.delayedCall(1000, () => {
                    this.goNextLevel();
                });
            }
        });
    }

    // ── goNextLevel() ─────────────────────────────
    goNextLevel() {
        const nextIdx = this.lvIdx + 1;
        const nextLevel = STORY.levels[nextIdx];

        // 如果下一关音乐不同，停掉当前音乐（最终结束画面保持音乐继续）
        if (nextLevel && nextLevel.bgMusic !== this.levelData.bgMusic) {
            this.sound.stopAll();
            this.registry.set('_bgmKey', null);
            this.registry.set('_bgmObj', null);
        }

        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (nextIdx < STORY.levels.length) {
                this.scene.restart({ lvIdx: nextIdx });
            } else {
                this.showEndScreen();
            }
        });
    }

    // ── showEndScreen() ─────────────────────────────
    showEndScreen() {
        const screen = document.createElement('div');
        screen.id = 'end-screen';

        const img = document.createElement('img');
        img.src = 'js/Photo/Background/GameOver.webp';
        screen.appendChild(img);

        screen.addEventListener('click', () => {
            screen.remove();
            this.sound.stopAll();
            this.registry.set('_bgmKey', null);
            this.registry.set('_bgmObj', null);
            const overlay = document.getElementById('menu-overlay');
            if (overlay) overlay.classList.remove('hidden');
            const gameHomeContainer = document.getElementById('game-home-container');
            if (gameHomeContainer) gameHomeContainer.style.display = 'none';
            this.scene.start('MenuScene');
        });

        document.body.appendChild(screen);
    }

    // ── update() ─────────────────────────────────
    update(time, delta) {
        // 开头检查
        if (this.modalOpen) {
            // 在弹窗期间，不响应输入，但物理引擎依旧运行
            return;
        }

        const left = this.cursors.left.isDown || this.keys.left.isDown;
        const right = this.cursors.right.isDown || this.keys.right.isDown;
        const wantJump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                         Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
                         Phaser.Input.Keyboard.JustDown(this.keys.up);
        const body = this.player.body;
        const onGround = body.blocked.down || body.touching.down;

        if (onGround) {
            this.lastGroundedAt = this.time.now;
        }

        if (wantJump) {
            this.jumpPressedAt = this.time.now;
        }

        // 左右移动 + 动画切换
        if (left) {
            this.player.setVelocityX(-CFG.PLAYER_SPEED);
            if (this.facingRight) {
                this.facingRight = false;
                this.player.body.setSize(120, 355);
                this.player.body.setOffset(55, 30);
            }
            this.player.play('walk_l', true);
        } else if (right) {
            this.player.setVelocityX(CFG.PLAYER_SPEED);
            if (!this.facingRight) {
                this.facingRight = true;
                this.player.body.setSize(120, 370);
                this.player.body.setOffset(55, 30);
            }
            this.player.play('walk_r', true);
        } else {
            this.player.setVelocityX(0);
            this.player.play(this.facingRight ? 'idle_r' : 'idle_l', true);
        }

        // 跳跃（一段跳，固定高度）
        const canUseCoyote = (this.time.now - this.lastGroundedAt) <= CFG.COYOTE_TIME_MS;
        const hasJumpBuffer = (this.time.now - this.jumpPressedAt) <= CFG.JUMP_BUFFER_MS;

        if (hasJumpBuffer && (onGround || canUseCoyote) && !this.jumpStarted) {
            this.player.setVelocityY(CFG.JUMP_VELOCITY);
            this.jumpPressedAt = -Infinity;
            this.jumpStarted = true;
        }

        if (onGround && body.velocity.y >= 0) {
            this.jumpStarted = false;
        }

        // NPC 近距离检测
        this._updateNPCs(delta);
    }

    // ── 气泡对话框 ─────────────────────────────────
    _createBubble(x, y, text) {
        const container = this.add.container(x, y);
        const padding = 6;
        const maxWidth = 105;

        // 先创建文字测量尺寸
        const txt = this.add.text(0, 0, text, {
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: '8.5px',
            color: '#ffffff',
            wordWrap: { width: maxWidth },
            lineSpacing: 2,
        }).setOrigin(0.5);

        const bw = txt.width + padding * 2;
        const bh = txt.height + padding * 2;

        // 圆角矩形背景（浅色，无边框）
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.75);
        bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 5);

        // 底部小三角
        bg.fillStyle(0x000000, 0.75);
        bg.fillTriangle(-4, bh / 2, 4, bh / 2, 0, bh / 2 + 6);

        container.add([bg, txt]);
        return container;
    }

    // ── NPC 近距离检测 ───────────────────────────
    _updateNPCs(delta) {
        if (!this.npcs) return;
        this.npcs.forEach(npc => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                npc.sprite.x, npc.sprite.y
            );
            const isNear = dist < npc.proximityRange;

            if (isNear && !npc.triggered) {
                // 显示 "!" 提示
                npc.exclaim.setAlpha(1);
                npc.nearTimer += delta;

                if (npc.nearTimer >= npc.data.triggerTime) {
                    // 触发对话
                    npc.triggered = true;
                    npc.exclaim.setAlpha(0);
                    npc.bubble.setAlpha(1);

                    // 气泡淡入动画
                    this.tweens.add({
                        targets: npc.bubble,
                        alpha: { from: 0, to: 1 },
                        y: npc.bubble.y - 8,
                        duration: 300,
                        ease: 'Power2',
                    });
                }
            } else if (!isNear) {
                npc.nearTimer = 0;
                npc.exclaim.setAlpha(0);
                // 离开后气泡消失，下次还能再触发
                if (npc.triggered) {
                    npc.triggered = false;
                    npc.bubble.setAlpha(0);
                    npc.bubble.y += 8; // 复位
                }
            }
        });
    }

    // ── 粒子特效 (简易实现) ──────────────────────
    _createParticles() {
        if (this.levelData.particle === 'snow') {
            this.add.particles(0, 0, 'particle_snow', {
                x: { min: 0, max: CFG.WORLD_W },
                y: -50,
                lifespan: 8000,
                speedY: { min: 40, max: 100 },
                speedX: { min: -20, max: 20 },
                scale: { min: 0.5, max: 1.5 },
                alpha: { start: 0.8, end: 0 },
                tint: 0xffffff,
                quantity: 2
            });
        }
    }
}
