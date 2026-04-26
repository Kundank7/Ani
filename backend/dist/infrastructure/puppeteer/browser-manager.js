"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagedBrowser = void 0;
const logger_1 = require("../../core/logger");
let browserInstance = null;
let browserLaunchPromise = null;
const launchBrowser = async () => {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    if (isProduction) {
        logger_1.logger.info('Launching shared serverless Chromium instance');
        const chromiumModule = await import('@sparticuz/chromium');
        const puppeteerModule = await import('puppeteer-core');
        const chromium = (chromiumModule.default || chromiumModule);
        const puppeteer = (puppeteerModule.default || puppeteerModule);
        return puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
    }
    logger_1.logger.info('Launching shared local Puppeteer instance');
    const localPuppeteerPackage = 'puppeteer-extra';
    const stealthPluginPackage = 'puppeteer-extra-plugin-stealth';
    const localPuppeteerModule = await import(localPuppeteerPackage);
    const stealthPluginModule = await import(stealthPluginPackage);
    const localPuppeteer = (localPuppeteerModule.default || localPuppeteerModule);
    const StealthPlugin = (stealthPluginModule.default || stealthPluginModule);
    localPuppeteer.use(StealthPlugin());
    return localPuppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
        ],
    });
};
const attachLifecycleHandlers = (browser) => {
    browser.on('disconnected', () => {
        browserInstance = null;
        browserLaunchPromise = null;
        logger_1.logger.warn('Shared browser instance disconnected');
    });
};
const getManagedBrowser = async () => {
    if (browserInstance?.isConnected()) {
        return browserInstance;
    }
    if (!browserLaunchPromise) {
        browserLaunchPromise = launchBrowser()
            .then((browser) => {
            browserInstance = browser;
            attachLifecycleHandlers(browser);
            return browser;
        })
            .finally(() => {
            browserLaunchPromise = null;
        });
    }
    return browserLaunchPromise;
};
exports.getManagedBrowser = getManagedBrowser;
