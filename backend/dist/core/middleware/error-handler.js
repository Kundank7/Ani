"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const app_error_1 = require("../errors/app-error");
const logger_1 = require("../logger");
const api_response_1 = require("../http/api-response");
const errorHandler = (error, req, res, _next) => {
    const appError = error instanceof app_error_1.AppError
        ? error
        : new app_error_1.AppError('Internal server error', 500, { expose: false });
    logger_1.logger.error(`Unhandled request failure: ${req.method} ${req.originalUrl}`, error);
    return (0, api_response_1.sendError)(res, appError.expose ? appError.message : 'Internal server error', appError.statusCode);
};
exports.errorHandler = errorHandler;
