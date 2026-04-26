"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mappingService = void 0;
const mapper_1 = require("./mapper");
// Redis Key Prefix for AniList -> Scraper mapping
const KEY_PREFIX = 'map:anilist:';
exports.mappingService = {
    getMapping: async (anilistId) => {
        try {
            const data = await mapper_1.redis.get(KEY_PREFIX + anilistId);
            return data || null;
        }
        catch (error) {
            console.error('Error reading mapping from Redis:', error);
            return null;
        }
    },
    saveMapping: async (anilistId, scraperId, title) => {
        try {
            const mappingData = {
                id: scraperId,
                title: title || '',
                timestamp: Date.now()
            };
            await mapper_1.redis.set(KEY_PREFIX + anilistId, mappingData);
            return true;
        }
        catch (error) {
            console.error('Error saving mapping to Redis:', error);
            return false;
        }
    },
    deleteMapping: async (anilistId) => {
        try {
            await mapper_1.redis.del(KEY_PREFIX + anilistId);
            console.log(`Deleted mapping for AniList ID: ${anilistId}`);
            return true;
        }
        catch (error) {
            console.error('Error deleting mapping from Redis:', error);
            return false;
        }
    }
};
