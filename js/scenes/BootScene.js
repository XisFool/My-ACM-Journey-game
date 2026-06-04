/* ============================================
   BootScene.js — 预加载资源 & 生成全局纹理
   ============================================ */

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // --- 只加载 MenuScene 和骨骼必需的极少量资源 ---
        this.load.spritesheet('player_r', 'js/Photo/Qiu/Qiu_R.png', {
            frameWidth: 230,
            frameHeight: 410,
        });
        this.load.spritesheet('player_l', 'js/Photo/Qiu/Qiu_L.png', {
            frameWidth: 230,
            frameHeight: 395,
        });
        // 不在这里一次性加载所有的背景大图和BGM，将它们延迟到 LoadingScene!
    }

    create() {
        // --- 1. 角色动画注册 ---
        // 右方向：帧 0 = 站立，帧 1-4 = 走动
        this.anims.create({
            key: 'idle_r',
            frames: this.anims.generateFrameNumbers('player_r', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1,
        });
        this.anims.create({
            key: 'walk_r',
            frames: this.anims.generateFrameNumbers('player_r', { start: 1, end: 4 }),
            frameRate: 8,
            repeat: -1,
        });
        // 左方向：帧 0 = 站立，帧 1-4 = 走动
        this.anims.create({
            key: 'idle_l',
            frames: this.anims.generateFrameNumbers('player_l', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1,
        });
        this.anims.create({
            key: 'walk_l',
            frames: this.anims.generateFrameNumbers('player_l', { start: 1, end: 4 }),
            frameRate: 8,
            repeat: -1,
        });

        // --- 2. 生成问号方块纹理 ---
        if (!this.textures.exists('qblock')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            const s = 40;
            g.fillStyle(0xdd8822); g.fillRect(0, 0, s, s);
            g.fillStyle(0xffaa44); g.fillRect(0, 0, s, 4);
            g.fillStyle(0xffaa44); g.fillRect(0, 0, 4, s);
            g.fillStyle(0x996611); g.fillRect(0, s-4, s, 4);
            g.fillStyle(0x996611); g.fillRect(s-4, 0, 4, s);
            // ? 号
            g.fillStyle(0xffffff);
            g.fillRect(13,  6, 14,  4);
            g.fillRect(23, 10,  4,  8);
            g.fillRect(13, 16,  8,  4);
            g.fillRect(13, 22,  8,  4);
            
            g.generateTexture('qblock', s, s);
            g.destroy();
        }

        // --- 3. 生成下雪粒子纹理（兼容之前 LevelScene.js 粒子） ---
        if (!this.textures.exists('particle_snow')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff);
            g.fillRect(0, 0, 4, 4);
            g.generateTexture('particle_snow', 4, 4);
            g.destroy();
        }

        // --- 4. 金色星点纹理（给方块撞击粒子用）---
        if (!this.textures.exists('particle_star')) {
            const starGfx = this.make.graphics({ x: 0, y: 0, add: false });
            starGfx.fillStyle(0xffd700, 1);
            starGfx.fillRect(0, 0, 5, 5);
            starGfx.generateTexture('particle_star', 5, 5);
            starGfx.destroy();
        }

        // --- 5. 尘土纹理（给跳跃/落地用）---
        if (!this.textures.exists('particle_dust')) {
            const dustGfx = this.make.graphics({ x: 0, y: 0, add: false });
            dustGfx.fillStyle(0xddddcc, 1);
            dustGfx.fillCircle(3, 3, 3);
            dustGfx.generateTexture('particle_dust', 6, 6);
            dustGfx.destroy();
        }

        // 纹理全部生成完毕后，进入主菜单
        this.scene.start('MenuScene');
    }
}
