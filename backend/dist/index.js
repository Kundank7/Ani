"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const anilist_routes_1 = require("./api/anilist/anilist.routes");
// 🚫 DISABLED FOR CPANEL BUILD (uses scraper + puppeteer)
// import { warmSpotlightCache } from './api/scraper/manga.service';
// import { startScraperWarmer } from './api/scraper/scraper-warmer';
const fanart_service_1 = require("./api/logo/fanart.service");
const logger_1 = require("./core/logger");
const port = process.env.PORT || 3001;
const shouldRunStandaloneServer = !process.env.VERCEL;
if (shouldRunStandaloneServer) {
    const startServer = async () => {
        logger_1.logger.info('Starting Yorumi backend server');
        try {
            logger_1.logger.info('Warming anime homepage caches');
            await Promise.race([
                (0, anilist_routes_1.warmHomeFastCache)(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Cache warming timeout')), 10000))
            ]);
            logger_1.logger.info('Homepage caches warmed successfully');
        }
        catch (error) {
            logger_1.logger.warn('Homepage cache warming failed or timed out', error);
        }
        // 🚫 DISABLED (depends on scraper)
        /*
        try {
            await warmSpotlightCache();
            await warmupAnimeDatabase();
        } catch (error) {
            logger.warn('Secondary cache warming failed', error);
        }
        */
        // ✅ Keep this (safe)
        try {
            await (0, fanart_service_1.warmupAnimeDatabase)();
        }
        catch (error) {
            logger_1.logger.warn('Fanart cache warming failed', error);
        }
        app_1.default.listen(port, () => {
            logger_1.logger.info(`Server is running on http://localhost:${port}`);
        });
        // 🚫 DISABLED (uses scraper loop)
        // startScraperWarmer();
        // Optional: keep scheduler safe
        setInterval(() => {
            logger_1.logger.info('Running scheduled homepage cache refresh');
            (0, anilist_routes_1.warmHomeFastCache)()
                .catch((error) => logger_1.logger.error('Scheduled homepage cache refresh failed', error));
        }, 10 * 60 * 1000);
    };
    startServer();
}
exports.default = app_1.default;
