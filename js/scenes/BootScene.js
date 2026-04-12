/* ============================================
   BootScene.js — 预加载资源 & 生成全局纹理
   ============================================ */
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 彻底移除了所有外部图片的 this.load... 代码，杜绝 0% 卡死情况。
        // （之前用 base64 dataURI 循环 50 次阻塞了进度条）。
        // 加载角色精灵图表（左/右方向）
        this.load.spritesheet('player_r', 'js/Photo/Qiu/Qiu_R.png', {
            frameWidth: 230,
            frameHeight: 410,
        });
        this.load.spritesheet('player_l', 'js/Photo/Qiu/Qiu_L.png', {
            frameWidth: 230,
            frameHeight: 395,
        });
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

        // --- 3. 生成地面纹理（砖块纹理） ---
        if (!this.textures.exists('ground')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x8B4513); g.fillRect(0, 0, 64, 32);
            g.fillStyle(0x6B3410); g.fillRect(0, 0, 64, 3);
            g.fillStyle(0x6B3410); g.fillRect(0, 29, 64, 3);
            g.fillStyle(0x6B3410); g.fillRect(30, 0, 3, 32);
            
            g.generateTexture('ground', 64, 32);
            g.destroy();
        }

        // --- 4. 生成平台纹理 ---
        if (!this.textures.exists('platform')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x8b7355); g.fillRect(0, 0, 32, 16);
            g.fillStyle(0xaa9977); g.fillRect(0, 0, 32, 3);
            
            g.generateTexture('platform', 32, 16);
            g.destroy();
        }
        
        // --- 生成菜单粒子纹理（圆形，带柔边） ---
        if (!this.textures.exists('particle_glow')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1);
            g.fillCircle(8, 8, 8);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(8, 8, 6);
            g.generateTexture('particle_glow', 16, 16);
            g.destroy();
        }

        // --- 生成下雪粒子纹理（兼容之前 LevelScene.js 粒子） ---
        if (!this.textures.exists('particle_snow')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff);
            g.fillRect(0, 0, 4, 4);
            g.generateTexture('particle_snow', 4, 4);
            g.destroy();
        }

        // 纹理全部生成完毕后，进入主菜单
        this.scene.start('MenuScene');
    }
}
