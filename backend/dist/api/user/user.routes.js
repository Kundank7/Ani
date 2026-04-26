"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = require("./user.service");
const router = (0, express_1.Router)();
router.get('/avatar', async (req, res) => {
    const avatar = await user_service_1.userService.getUserAvatar();
    // Return empty string if no avatar is set, frontend will handle default
    res.json({ avatar: avatar || '' });
});
router.post('/avatar', async (req, res) => {
    const { avatarUrl } = req.body;
    if (!avatarUrl) {
        return res.status(400).json({ message: 'Missing avatarUrl' });
    }
    const success = await user_service_1.userService.saveUserAvatar(avatarUrl);
    if (success) {
        res.json({ success: true });
    }
    else {
        res.status(500).json({ message: 'Failed to save avatar' });
    }
});
exports.default = router;
