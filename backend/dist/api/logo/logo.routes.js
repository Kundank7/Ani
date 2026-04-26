"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fanart_service_1 = require("./fanart.service");
const anilist_service_1 = require("../anilist/anilist.service");
const router = (0, express_1.Router)();
/**
 * GET /api/logo/resolve?title=...&year=...&episodes=...&format=...
 * Resolve an anime title to AniList, then fetch the Fanart.tv logo.
 */
router.get('/resolve', async (req, res) => {
    try {
        const title = String(req.query.title || '').replace(/\s+/g, ' ').trim();
        if (!title) {
            return res.status(400).json({
                error: 'Query parameter title is required',
                logo: null,
                source: 'fallback',
                cached: false
            });
        }
        const year = Number(req.query.year || 0) || undefined;
        const episodes = Number(req.query.episodes || 0) || undefined;
        const format = String(req.query.format || '').trim() || undefined;
        const match = await anilist_service_1.anilistService.findBestAnimeMatch({
            titles: [title],
            year,
            episodes,
            format,
            perPage: 5
        });
        const anilistId = Number(match?.id || 0);
        if (!anilistId) {
            return res.json({
                anilistId: null,
                logo: null,
                source: 'fallback',
                cached: false
            });
        }
        const result = await (0, fanart_service_1.getAnimeLogo)(anilistId);
        res.json({ ...result, anilistId });
    }
    catch (error) {
        console.error('[Logo API] Resolve error:', error);
        res.status(500).json({
            error: 'Failed to resolve logo',
            logo: null,
            source: 'fallback',
            cached: false
        });
    }
});
/**
 * GET /api/logo/:anilistId
 * Fetch anime logo by AniList ID
 */
router.get('/:anilistId', async (req, res) => {
    try {
        const anilistId = parseInt(req.params.anilistId);
        if (isNaN(anilistId)) {
            return res.status(400).json({
                error: 'Invalid AniList ID',
                logo: null,
                source: 'fallback'
            });
        }
        const result = await (0, fanart_service_1.getAnimeLogo)(anilistId);
        res.json(result);
    }
    catch (error) {
        console.error('[Logo API] Error:', error);
        res.status(500).json({
            error: 'Failed to fetch logo',
            logo: null,
            source: 'fallback',
            cached: false
        });
    }
});
/**
 * POST /api/logo/batch
 * Fetch multiple anime logos in one request
 * Body: { anilistIds: number[] }
 */
router.post('/batch', async (req, res) => {
    try {
        const { anilistIds } = req.body;
        if (!Array.isArray(anilistIds) || anilistIds.length === 0) {
            return res.status(400).json({
                error: 'Invalid request: anilistIds must be a non-empty array'
            });
        }
        // Limit to 20 IDs per request to prevent abuse
        const ids = anilistIds.slice(0, 20).map(id => parseInt(id)).filter(id => !isNaN(id));
        const results = await (0, fanart_service_1.batchGetAnimeLogos)(ids);
        // Convert Map to object for JSON response
        const response = {};
        results.forEach((value, key) => {
            response[key] = value;
        });
        res.json(response);
    }
    catch (error) {
        console.error('[Logo API] Batch error:', error);
        res.status(500).json({
            error: 'Failed to fetch logos'
        });
    }
});
exports.default = router;
