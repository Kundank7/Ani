"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    expose;
    constructor(message, statusCode = 500, options) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.expose = options?.expose ?? statusCode < 500;
    }
}
exports.AppError = AppError;
