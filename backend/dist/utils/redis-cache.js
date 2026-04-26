"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.acquireLock = acquireLock;
exports.releaseLock = releaseLock;
const redis_1 = require("@upstash/redis");
const hasRedisConfig = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedisConfig
    ? new redis_1.Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;
const memoryFallback = new Map();
function cleanupMemoryFallback() {
    if (memoryFallback.size < 500)
        return;
    const now = Date.now();
    for (const [key, entry] of memoryFallback.entries()) {
        if (entry.expiresAt <= now)
            memoryFallback.delete(key);
    }
}
async function cacheGet(key) {
    if (redis) {
        try {
            const value = await redis.get(key);
            return value ?? null;
        }
        catch (error) {
            console.warn(`[cacheGet] Redis read failed for "${key}"`, error);
        }
    }
    const local = memoryFallback.get(key);
    if (!local)
        return null;
    if (local.expiresAt <= Date.now()) {
        memoryFallback.delete(key);
        return null;
    }
    return local.value;
}
async function cacheSet(key, value, ttlSeconds) {
    if (redis) {
        try {
            await redis.set(key, value, { ex: ttlSeconds });
            return;
        }
        catch (error) {
            console.warn(`[cacheSet] Redis write failed for "${key}"`, error);
        }
    }
    memoryFallback.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
    cleanupMemoryFallback();
}
async function acquireLock(key, ttlSeconds) {
    if (redis) {
        try {
            const result = await redis.set(key, Date.now().toString(), { nx: true, ex: ttlSeconds });
            return result === 'OK';
        }
        catch (error) {
            console.warn(`[acquireLock] Redis lock failed for "${key}"`, error);
            return false;
        }
    }
    const existing = memoryFallback.get(key);
    if (existing && existing.expiresAt > Date.now())
        return false;
    memoryFallback.set(key, {
        value: '1',
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
}
async function releaseLock(key) {
    if (redis) {
        try {
            await redis.del(key);
            return;
        }
        catch (error) {
            console.warn(`[releaseLock] Redis unlock failed for "${key}"`, error);
        }
    }
    memoryFallback.delete(key);
}
