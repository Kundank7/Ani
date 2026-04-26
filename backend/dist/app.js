"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const avatar_service_1 = require("./modules/avatar/avatar.service");
const error_handler_1 = require("./core/middleware/error-handler");
const not_found_1 = require("./core/middleware/not-found");
const api_response_1 = require("./core/http/api-response");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', routes_1.default);
app.use('/avatars', express_1.default.static(avatar_service_1.avatarService.directory));
app.get('/', (_req, res) => {
    return (0, api_response_1.sendSuccess)(res, { message: 'Yorumi Backend is running' });
});
app.use(not_found_1.notFoundHandler);
app.use(error_handler_1.errorHandler);
exports.default = app;
