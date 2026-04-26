"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../../core/http/async-handler");
const avatar_controller_1 = require("./avatar.controller");
const router = (0, express_1.Router)();
router.get('/random', (0, async_handler_1.asyncHandler)(avatar_controller_1.avatarController.getRandomAvatar));
exports.default = router;
