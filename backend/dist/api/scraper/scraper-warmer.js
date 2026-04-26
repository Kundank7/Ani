"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScraperWarmer = startScraperWarmer;
const scraper_service_1 = require("./scraper.service");
const redis_cache_1 = require("../../utils/redis-cache");
const WARMER_LOCK_KEY = 'yorumi:scraper-warmer:lock';
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_LOCK_SECONDS = 8 * 60;
async function runWarmCycle() {
    const lockAcquired = await (0, redis_cache_1.acquireLock)(WARMER_LOCK_KEY, DEFAULT_LOCK_SECONDS);
    if (!lockAcquired) {
        return;
    }
    try {
        const targets = scraper_service_1.scraperService.getHotStreamCandidates(15);
        if (targets.length === 0)
            return;
        console.log(`[Warmer] Warming ${targets.length} hot stream keys...`);
        await Promise.allSettled(targets.map((target) => scraper_service_1.scraperService.getStreams(target.animeSession, target.epSession)));
        console.log('[Warmer] Hot stream warm cycle completed');
    }
    catch (error) {
        console.error('[Warmer] Warm cycle failed:', error);
    }
    finally {
        await (0, redis_cache_1.releaseLock)(WARMER_LOCK_KEY);
    }
}
function startScraperWarmer() {
    const disabled = String(process.env.DISABLE_SCRAPER_WARMER || '').toLowerCase() === 'true';
    if (disabled) {
        console.log('[Warmer] Disabled via DISABLE_SCRAPER_WARMER=true');
        return;
    }
    runWarmCycle().catch((error) => {
        console.error('[Warmer] Initial warm cycle failed:', error);
    });
    setInterval(() => {
        runWarmCycle().catch((error) => {
            console.error('[Warmer] Scheduled warm cycle failed:', error);
        });
    }, DEFAULT_INTERVAL_MS);
}
