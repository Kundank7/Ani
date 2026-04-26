"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStore = void 0;
const redis_cache_1 = require("../../utils/redis-cache");
exports.cacheStore = {
    get: redis_cache_1.cacheGet,
    set: redis_cache_1.cacheSet,
    acquireLock: redis_cache_1.acquireLock,
    releaseLock: redis_cache_1.releaseLock,
};
