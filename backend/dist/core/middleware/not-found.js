"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const api_response_1 = require("../http/api-response");
const notFoundHandler = (_req, res) => {
    return (0, api_response_1.sendError)(res, 'Route not found', 404);
};
exports.notFoundHandler = notFoundHandler;
