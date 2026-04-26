"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const mapper_1 = require("../mapping/mapper");
// Redis Key for User Data
// Since we don't have auth yet, we'll use a single global user key for now
// In the future, this would be `user:${userId}`
const USER_KEY = 'user:global';
exports.userService = {
    getUserAvatar: async () => {
        try {
            const avatar = await mapper_1.redis.hget(USER_KEY, 'avatar');
            return avatar || null;
        }
        catch (error) {
            console.error('Error getting user avatar from Redis:', error);
            return null;
        }
    },
    saveUserAvatar: async (avatarUrl) => {
        try {
            await mapper_1.redis.hset(USER_KEY, { avatar: avatarUrl });
            return true;
        }
        catch (error) {
            console.error('Error saving user avatar to Redis:', error);
            return false;
        }
    }
};
