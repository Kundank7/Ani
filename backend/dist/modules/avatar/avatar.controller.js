"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarController = void 0;
const api_response_1 = require("../../core/http/api-response");
const avatar_service_1 = require("./avatar.service");
exports.avatarController = {
    getRandomAvatar(_req, res) {
        return (0, api_response_1.sendSuccess)(res, avatar_service_1.avatarService.getRandomAvatar());
    },
};
