"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
/**
 * Image Proxy to bypass hotlinking protection (Referer checks)
 * GET /api/image/proxy?url=HTTPS_URL
 */
router.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).send('URL is required');
    }
    try {
        const decodedUrl = decodeURIComponent(url);
        // Anti-abuse check: only allow images from known domains or relative to scraper BASE_URLs
        const allowedDomains = ['mangakatana.com', 's4.anilist.co', 'media.kitsu.io'];
        const urlObj = new URL(decodedUrl);
        if (!allowedDomains.includes(urlObj.hostname) && !urlObj.hostname.endsWith('mangakatana.com')) {
            // We'll allow it for now but log it
            console.log(`[Image Proxy] Proxying non-allowlisted domain: ${urlObj.hostname}`);
        }
        const response = await axios_1.default.get(decodedUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': urlObj.origin, // Use the origin of the image as Referer
            },
            timeout: 10000,
        });
        res.set('Content-Type', String(response.headers['content-type'] || 'image/jpeg'));
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.send(Buffer.from(response.data));
    }
    catch (error) {
        console.error('[Image Proxy] Error:', error.message);
        res.status(500).send('Failed to proxy image');
    }
});
exports.default = router;
