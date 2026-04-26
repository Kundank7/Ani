"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.getAniListId = getAniListId;
const redis_1 = require("@upstash/redis");
const graphql_request_1 = require("graphql-request");
const fuse_js_1 = __importDefault(require("fuse.js"));
const hasRedisConfig = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedisConfig
    ? new redis_1.Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : {
        async get() {
            return null;
        },
        async set() {
            return null;
        },
        async del() {
            return null;
        },
        async hget() {
            return null;
        },
        async hset() {
            return null;
        },
    };
exports.redis = redis;
const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
/**
 * The Main Function
 * @param mkSlug The unique MangaKatana slug (e.g., 'one-piece.2040')
 * @param mkTitle The title string from MangaKatana (e.g., 'One Piece')
 */
async function getAniListId(mkSlug, mkTitle) {
    const CACHE_KEY = `map:mk:${mkSlug}`;
    // STEP 1: Check Redis (The "mapping.json" in the cloud)
    const cachedId = await redis.get(CACHE_KEY);
    if (cachedId) {
        console.log(`⚡ Cache Hit: ${mkSlug} -> ${cachedId}`);
        return cachedId;
    }
    console.log(`🐢 Cache Miss: Fetching AniList for "${mkTitle}"...`);
    // STEP 2: Fetch from AniList API
    // We search for the top 5 results to perform a fuzzy check locally
    const query = (0, graphql_request_1.gql) `
    query ($search: String) {
      Page(perPage: 5) {
        media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
          id
          title {
            romaji
            english
            native
          }
          synonyms
        }
      }
    }
  `;
    try {
        // Sanitize title (Remove 'Hot', 'New', or Volume numbers common on MK)
        const cleanQuery = mkTitle.replace(/\(Vol\.\d+\)/i, '').trim();
        const data = await (0, graphql_request_1.request)(ANILIST_ENDPOINT, query, { search: cleanQuery });
        const candidates = data.Page.media;
        if (!candidates || candidates.length === 0)
            return null;
        // STEP 3: Verify the Match (Fuzzy Check)
        // We double-check because AniList search can be weird.
        const fuse = new fuse_js_1.default(candidates, {
            keys: ['title.romaji', 'title.english', 'synonyms'],
            includeScore: true,
            threshold: 0.4, // 0.0 is exact, 0.4 allows small differences
        });
        const result = fuse.search(mkTitle);
        if (result.length > 0) {
            const bestMatch = result[0].item;
            const anilistId = bestMatch.id;
            // STEP 4: Learn (Save to Redis)
            // This persists the mapping forever (or until you delete it)
            await redis.set(CACHE_KEY, anilistId);
            return anilistId;
        }
    }
    catch (error) {
        console.error("AniList API Error:", error);
    }
    return null;
}
