"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        error,
    });
};
exports.sendError = sendError;
