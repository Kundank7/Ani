"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mangaService = __importStar(require("./manga.service"));
const router = (0, express_1.Router)();
/**
 * Search for manga (Unified)
 * GET /api/manga/search?q=query
 */
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return;
        }
        const results = await mangaService.searchManga(query);
        res.json({ data: results });
    }
    catch (error) {
        console.error('Manga search error:', error);
        res.status(500).json({ error: 'Failed to search manga' });
    }
});
/**
 * Get manga details (Unified)
 * GET /api/manga/details/:mangaId
 */
router.get('/details/:mangaId', async (req, res) => {
    try {
        const { mangaId } = req.params;
        if (!mangaId) {
            res.status(400).json({ error: 'mangaId is required' });
            return;
        }
        const details = await mangaService.getMangaDetails(mangaId);
        res.json({ data: details });
    }
    catch (error) {
        console.error('Manga details error:', error);
        res.status(500).json({ error: 'Failed to fetch manga details' });
    }
});
/**
 * Get chapter list for a manga (Unified)
 * GET /api/manga/chapters/:mangaId
 */
router.get('/chapters/:mangaId', async (req, res) => {
    try {
        const { mangaId } = req.params;
        if (!mangaId) {
            res.status(400).json({ error: 'mangaId is required' });
            return;
        }
        const chapters = await mangaService.getChapterList(mangaId);
        res.json({ chapters: chapters });
    }
    catch (error) {
        console.error('Chapters list error:', error);
        res.status(500).json({ error: 'Failed to fetch chapter list' });
    }
});
/**
 * Get pages for a chapter (Unified)
 * GET /api/manga/pages?url=chapterUrl
 */
router.get('/pages', async (req, res) => {
    try {
        const chapterUrl = req.query.url;
        if (!chapterUrl) {
            res.status(400).json({ error: 'Query parameter "url" is required' });
            return;
        }
        const pages = await mangaService.getChapterPages(chapterUrl);
        res.json({ pages: pages });
    }
    catch (error) {
        console.error('Chapter pages error:', error);
        res.status(500).json({ error: 'Failed to fetch chapter pages' });
    }
});
/**
 * Prefetch chapters (Cache Warming)
 * POST /api/manga/prefetch
 * Body: { urls: string[] }
 */
router.post('/prefetch', async (req, res) => {
    try {
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'Invalid URLs array' });
        }
        const result = await mangaService.prefetchChapters(urls);
        res.json(result);
    }
    catch (error) {
        console.error('Prefetch error:', error);
        res.status(500).json({ error: 'Failed to prefetch chapters' });
    }
});
/**
 * Get hot updates (MangaKatana)
 * GET /api/manga/hot-updates
 */
router.get('/hot-updates', async (req, res) => {
    try {
        const updates = await mangaService.getHotUpdates();
        res.json({ data: updates });
    }
    catch (error) {
        console.error('Hot updates error:', error);
        res.status(500).json({ error: 'Failed to fetch hot updates' });
    }
});
/**
 * Get Enriched Spotlight (AniList + MangaKatana Chapters)
 * GET /api/manga/spotlight
 */
router.get('/spotlight', async (req, res) => {
    try {
        const spotlight = await mangaService.getEnrichedSpotlight();
        res.json({ data: spotlight });
    }
    catch (error) {
        console.error('Spotlight error:', error);
        res.status(500).json({ error: 'Failed to fetch spotlight' });
    }
});
/**
 * Get latest manga (MangaKatana /latest)
 */
router.get('/latest', async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const results = await mangaService.getLatestManga(page);
        res.json({ data: results.data, pagination: { total_pages: results.totalPages } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch latest manga' });
    }
});
/**
 * Get new manga (MangaKatana /new-manga)
 */
router.get('/new-manga', async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const results = await mangaService.getNewManga(page);
        res.json({ data: results.data, pagination: { total_pages: results.totalPages } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch new manga' });
    }
});
/**
 * Get manga directory (MangaKatana /manga)
 */
router.get('/directory', async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const results = await mangaService.getMangaDirectory(page);
        res.json({ data: results.data, pagination: { total_pages: results.totalPages } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch manga directory' });
    }
});
exports.default = router;
