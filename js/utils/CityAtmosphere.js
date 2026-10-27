// 桂林 / 重庆的轻量氛围；纹理由程序绘制，沿用原图与人物物理。

function createMistTexture(scene) {
    const key = 'city:mist';
    if (scene.textures.exists(key)) return key;

    const texture = scene.textures.createCanvas(key, 128, 64);
    const context = texture.context;
    const gradient = context.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, 'rgba(190, 215, 225, 0)');
    gradient.addColorStop(0.45, 'rgba(190, 215, 225, 0.18)');
    gradient.addColorStop(1, 'rgba(190, 215, 225, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 64);
    texture.refresh();
    return key;
}

function createRainTexture(scene) {
    const key = 'city:rain';
    if (scene.textures.exists(key)) return key;

    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff);
    graphics.fillRect(0, 0, 1, 12);
    graphics.generateTexture(key, 1, 12);
    graphics.destroy();
    return key;
}

function createSunTexture(scene) {
    const key = 'city:sun-glow';
    if (scene.textures.exists(key)) return key;

    const texture = scene.textures.createCanvas(key, 128, 128);
    const context = texture.context;
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 210, 150, 0.5)');
    gradient.addColorStop(0.4, 'rgba(255, 210, 150, 0.18)');
    gradient.addColorStop(1, 'rgba(255, 210, 150, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    texture.refresh();
    return key;
}

function mixWithWhite(color, amount) {
    const channel = shift => Math.round(255 + (((color >> shift) & 255) - 255) * amount);
    return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

export function createCityAtmosphere(scene) {
    const city = scene.levelData.cityEn;
    if (!scene.bgImage || (city !== 'GUILIN' && city !== 'CHONGQING')) return null;

    const objects = [];
    const width = scene.cameras.main.width;
    let mist;
    let lightStep = -1;

    if (city === 'GUILIN') {
        mist = scene.add.image(width / 2, 160, createMistTexture(scene))
            .setDisplaySize(width + 80, 118)
            .setScrollFactor(0)
            .setAlpha(0.42)
            .setDepth(-90)
            .setName('city:mist');
        objects.push(mist);

        const rainKey = createRainTexture(scene);
        objects.push(scene.add.particles(0, 0, rainKey, {
            x: { min: -30, max: width + 30 }, y: -12,
            lifespan: 2400, speedY: { min: 220, max: 260 }, speedX: { min: -24, max: -16 },
            scaleX: 0.65, scaleY: { min: 0.45, max: 0.7 },
            alpha: { start: 0.13, end: 0.025 }, tint: 0xc6dce8,
            frequency: 110, quantity: 1, maxAliveParticles: 24,
        }).setScrollFactor(0).setDepth(-85).setName('city:rain-far'));
        objects.push(scene.add.particles(0, 0, rainKey, {
            x: { min: -30, max: width + 30 }, y: -12,
            lifespan: 1700, speedY: { min: 320, max: 370 }, speedX: { min: -34, max: -24 },
            scaleX: 1, scaleY: { min: 0.75, max: 1 },
            alpha: { start: 0.17, end: 0.035 }, tint: 0xd3e2e9,
            frequency: 180, quantity: 1, maxAliveParticles: 12,
        }).setScrollFactor(0).setDepth(2).setName('city:rain-near'));
        scene.player.setTint(0xf1f7ff, 0xf5f9ff, 0xe5eef7, 0xeaf2fa);
    } else {
        const bg = scene.bgImage;
        objects.push(scene.add.image(bg.x + 2720 * bg.scaleX, bg.y + 540 * bg.scaleY, createSunTexture(scene))
            .setDisplaySize(340, 300)
            .setScrollFactor(bg.scrollFactorX, bg.scrollFactorY)
            .setAlpha(0.13)
            .setDepth(-90)
            .setName('city:sun-glow'));
        objects.push(scene.add.particles(0, 0, 'particle_snow', {
            x: { min: 0, max: width }, y: { min: 230, max: 500 },
            lifespan: { min: 4500, max: 6500 }, speedX: { min: -5, max: 8 }, speedY: { min: -12, max: -5 },
            scale: { min: 0.25, max: 0.45 }, alpha: { start: 0.18, end: 0 }, tint: 0xffd7a3,
            frequency: 750, quantity: 1, maxAliveParticles: 10,
        }).setScrollFactor(0).setDepth(2).setName('city:dust'));
    }

    const update = () => {
        if (mist) {
            mist.y = 160 + Math.sin(scene.time.now / 15000) * 2;
            mist.alpha = 0.42 + Math.sin(scene.time.now / 23000) * 0.025;
        } else {
            // 将人物世界坐标投回底图：暖光随原图夕阳方向渐强，镜头移动后仍一致。
            const bg = scene.bgImage;
            const sourceX = (scene.player.x - scene.cameras.main.scrollX * (1 - bg.scrollFactorX) - bg.x) / bg.scaleX;
            const step = Math.round(Phaser.Math.SmoothStep(sourceX, 400, 2850) * 32);
            if (step === lightStep) return;
            lightStep = step;
            const warmth = 0.4 + step / 32 * 0.3;
            scene.player.setTint(
                mixWithWhite(0xeee2eb, 0.65), mixWithWhite(0xffedcf, warmth),
                mixWithWhite(0xe5dce8, 0.65), mixWithWhite(0xffe8d4, warmth),
            );
        }
    };
    scene.events.on('postupdate', update);
    scene.events.once('shutdown', () => {
        scene.events.off('postupdate', update);
        if (scene.player.scene) scene.player.clearTint();
        objects.forEach(object => { if (object.scene) object.destroy(); });
        scene.cityAtmosphere = null;
    });
    update();
    return { city, objects };
}
