import { STORY } from '../story.js';

const preheatedLevels = new Set();
const preloadedImageMap = new Map();

export function collectLevelAssets(lvIdx) {
    const levelData = STORY.levels[lvIdx];
    const assets = {
        images: [],
        audios: [],
        spritesheets: [],
    };

    if (!levelData) {
        return assets;
    }

    if (levelData.bgImage) {
        assets.images.push({
            key: `bg_${lvIdx}`,
            path: levelData.bgImage,
        });
    }

    if (levelData.bgMusic) {
        assets.audios.push({
            key: `bgm:${levelData.bgMusic}`,
            path: levelData.bgMusic,
        });
    }

    (levelData.npcs || []).forEach((npc) => {
        if (npc.frameWidth && npc.frameHeight) {
            assets.spritesheets.push({
                key: npc.key,
                path: npc.image,
                frameWidth: npc.frameWidth,
                frameHeight: npc.frameHeight,
            });
            return;
        }

        assets.images.push({
            key: npc.key,
            path: npc.image,
        });
    });

    return assets;
}

export function queueAssets(scene, assets) {
    let queued = 0;

    assets.images.forEach(({ key, path }) => {
        if (!scene.textures.exists(key)) {
            scene.load.image(key, path);
            queued += 1;
        }
    });

    assets.audios.forEach(({ key, path }) => {
        if (!scene.cache.audio.exists(key)) {
            scene.load.audio(key, path);
            queued += 1;
        }
    });

    assets.spritesheets.forEach(({ key, path, frameWidth, frameHeight }) => {
        if (!scene.textures.exists(key)) {
            scene.load.spritesheet(key, path, {
                frameWidth,
                frameHeight,
            });
            queued += 1;
        }
    });

    return queued;
}

export function preloadImage(src) {
    if (!src || preloadedImageMap.has(src)) {
        return;
    }

    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    preloadedImageMap.set(src, img);
}

export function preloadMemoryImages(levelData) {
    (levelData.memoryBlocks || []).forEach((block) => {
        (block.memories || []).forEach((memory) => {
            preloadImage(memory.image);
        });
    });
}

export function isLevelPreheated(lvIdx) {
    return preheatedLevels.has(lvIdx);
}

export function markLevelPreheated(lvIdx) {
    preheatedLevels.add(lvIdx);
}
