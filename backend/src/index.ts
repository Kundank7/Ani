import 'dotenv/config';
import app from './app';
import { warmHomeFastCache } from './api/anilist/anilist.routes';
import { warmupAnimeDatabase } from './api/logo/fanart.service';
import { logger } from './core/logger';

const port = Number(process.env.PORT) || 3001;
const shouldRunStandaloneServer = !process.env.VERCEL;

if (shouldRunStandaloneServer) {
    const startServer = async () => {
        logger.info('Starting Yorumi backend server');

        // ✅ START SERVER IMMEDIATELY (IMPORTANT FOR RENDER)
        app.listen(port, '0.0.0.0', () => {
            logger.info(`Server running on port ${port}`);
        });

        // 🚀 Run warmups in background (NON-BLOCKING)
        setTimeout(async () => {
            try {
                logger.info('Warming homepage cache');
                await warmHomeFastCache();
            } catch (error) {
                logger.warn('Homepage cache warming failed', error);
            }

            try {
                logger.info('Warming fanart database');
                await warmupAnimeDatabase();
            } catch (error) {
                logger.warn('Fanart warmup failed', error);
            }
        }, 2000);

        // 🔁 Optional scheduler
        setInterval(() => {
            warmHomeFastCache().catch(() => {});
        }, 10 * 60 * 1000);
    };

    startServer();
}

export default app;
