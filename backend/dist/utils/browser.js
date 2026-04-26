"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowserInstance = void 0;
var browser_manager_1 = require("../infrastructure/puppeteer/browser-manager");
Object.defineProperty(exports, "getBrowserInstance", { enumerable: true, get: function () { return browser_manager_1.getManagedBrowser; } });
