"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mappingRepository = void 0;
const mapping_service_1 = require("../../api/mapping/mapping.service");
exports.mappingRepository = {
    getByAniListId: (anilistId) => mapping_service_1.mappingService.getMapping(anilistId),
    save: (anilistId, scraperId, title) => mapping_service_1.mappingService.saveMapping(anilistId, scraperId, title),
    remove: (anilistId) => mapping_service_1.mappingService.deleteMapping(anilistId),
};
