import { STORY } from '../story.js';

const preheatedLevels = new Set();
const preloadedImageMap = new Map();
const IMAGE_TIMEOUT_MS = 12000;
const IMAGE_RETRY_COUNT = 2;
const IMAGE_RETRY_DELAY_MS = 350;

export function getNpcAssetKey(lvIdx, npcKey) {
    return `npc:${lvIdx}:${npcKey}`;
}

export function getNpcAnimKey(lvIdx, npcKey) {
    return `npc:${lvIdx}:${npcKey}:idle`;
}

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
        const key = getNpcAssetKey(lvIdx, npc.key);

        if (npc.frameWidth && npc.frameHeight) {
            assets.spritesheets.push({
                key,
                path: npc.image,
                frameWidth: npc.frameWidth,
                frameHeight: npc.frameHeight,
            });
            return;
        }

        assets.images.push({
            key,
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

function createImageRecord(src) {
    const record = {
        src,
        image: null,
        state: 'pending',
        error: null,
        attempt: 0,
        active: true,
        timer: null,
        retryTimer: null,
        resolve: null,
        reject: null,
        promise: null,
    };

    record.promise = new Promise((resolve, reject) => {
        record.resolve = resolve;
        record.reject = reject;
    });
    record.promise.catch(() => {});
    preloadedImageMap.set(src, record);
    loadImageRecord(record);
    return record;
}

function loadImageRecord(record) {
    if (!record.active) return;

    record.attempt += 1;
    const attempt = record.attempt;
    const img = new Image();
    img.decoding = 'async';
    record.image = img;
    let attemptSettled = false;

    const isCurrentAttempt = () => (
        record.active &&
        record.attempt === attempt &&
        !attemptSettled
    );
    const clearAttempt = () => {
        if (record.timer) {
            clearTimeout(record.timer);
            record.timer = null;
        }
        img.onload = null;
        img.onerror = null;
    };

    const failAttempt = (error) => {
        if (!isCurrentAttempt()) return;
        attemptSettled = true;
        clearAttempt();

        if (attempt <= IMAGE_RETRY_COUNT) {
            record.retryTimer = setTimeout(() => {
                record.retryTimer = null;
                loadImageRecord(record);
            }, IMAGE_RETRY_DELAY_MS);
            return;
        }

        record.state = 'failed';
        record.error = error instanceof Error ? error : new Error(`Unable to load image: ${record.src}`);
        record.reject(record.error);
    };

    img.onload = () => {
        if (!isCurrentAttempt()) return;
        const decodePromise = typeof img.decode === 'function' ? img.decode() : Promise.resolve();
        decodePromise.then(() => {
            if (!isCurrentAttempt()) return;
            attemptSettled = true;
            clearAttempt();
            record.state = 'loaded';
            record.error = null;
            record.resolve(img);
        }).catch((error) => {
            failAttempt(error);
        });
    };

    img.onerror = () => {
        failAttempt(new Error(`Unable to load image: ${record.src}`));
    };

    record.timer = setTimeout(() => {
        failAttempt(new Error(`Image load timed out: ${record.src}`));
    }, IMAGE_TIMEOUT_MS);
    img.src = record.src;
}

function invalidateImageRecord(record) {
    if (!record || !record.active) return;
    record.active = false;
    if (record.timer) clearTimeout(record.timer);
    if (record.retryTimer) clearTimeout(record.retryTimer);
    if (record.image) {
        record.image.onload = null;
        record.image.onerror = null;
        record.image.src = '';
    }
    if (record.state === 'pending') {
        record.state = 'failed';
        record.error = new Error(`Image request cleared: ${record.src}`);
        record.reject(record.error);
    }
}

export function preloadImage(src) {
    if (!src) return Promise.reject(new Error('Image source is required'));

    const record = preloadedImageMap.get(src);
    if (record) return record.promise;
    return createImageRecord(src).promise;
}

export function retryPreloadedImage(src) {
    if (!src) return Promise.reject(new Error('Image source is required'));

    const record = preloadedImageMap.get(src);
    if (record && record.state !== 'failed') return record.promise;
    if (record) invalidateImageRecord(record);
    return createImageRecord(src).promise;
}

export function getPreloadedImage(src) {
    if (!src) return null;
    const record = preloadedImageMap.get(src);
    return record && record.state === 'loaded' ? record.image : null;
}

export function getPreloadedImageState(src) {
    const record = src ? preloadedImageMap.get(src) : null;
    return record ? record.state : 'idle';
}

export function clearPreloadedImages() {
    preloadedImageMap.forEach((record) => invalidateImageRecord(record));
    preloadedImageMap.clear();
}

export function preloadMemoryImages(levelData) {
    const requests = [];
    (levelData.memoryBlocks || []).forEach((block) => {
        (block.memories || []).forEach((memory) => {
            if (memory.image) requests.push(preloadImage(memory.image));
        });
    });
    return Promise.allSettled(requests);
}

export function isLevelPreheated(lvIdx) {
    return preheatedLevels.has(lvIdx);
}

export function markLevelPreheated(lvIdx) {
    preheatedLevels.add(lvIdx);
}
