"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app_error_1 = require("../../core/errors/app-error");
const avatarsDir = path_1.default.join(__dirname, '../../../avatars');
const getFilesRecursively = (dir) => {
    let results = [];
    const list = fs_1.default.readdirSync(dir);
    for (const file of list) {
        const filePath = path_1.default.join(dir, file);
        const stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(getFilesRecursively(filePath));
            continue;
        }
        if (/\.(png|jpg|jpeg|gif|webp)$/i.test(file)) {
            results.push(path_1.default.relative(avatarsDir, filePath).replace(/\\/g, '/'));
        }
    }
    return results;
};
exports.avatarService = {
    directory: avatarsDir,
    getRandomAvatar() {
        const files = getFilesRecursively(avatarsDir);
        if (files.length === 0) {
            throw new app_error_1.AppError('No avatars found', 404);
        }
        const randomFile = files[Math.floor(Math.random() * files.length)];
        return { url: `/avatars/${randomFile}` };
    },
};
