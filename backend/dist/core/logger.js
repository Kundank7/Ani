"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const levelOrder = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const activeLevel = levelOrder[configuredLevel] ?? levelOrder.info;
const canLog = (level) => levelOrder[level] >= activeLevel;
const write = (level, message, meta) => {
    if (!canLog(level))
        return;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (meta === undefined) {
        console[level](prefix);
        return;
    }
    console[level](prefix, meta);
};
exports.logger = {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
};
