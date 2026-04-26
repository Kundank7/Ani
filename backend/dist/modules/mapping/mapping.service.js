"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mappingModuleService = void 0;
const mapper_1 = require("../../api/mapping/mapper");
const app_error_1 = require("../../core/errors/app-error");
const mapping_repository_1 = require("./mapping.repository");
exports.mappingModuleService = {
    async getMapping(anilistId) {
        const mapping = await mapping_repository_1.mappingRepository.getByAniListId(anilistId);
        if (!mapping) {
            throw new app_error_1.AppError('Mapping not found', 404);
        }
        return mapping;
    },
    async saveMapping(input) {
        if (!input.anilistId || !input.scraperId) {
            throw new app_error_1.AppError('Missing anilistId or scraperId', 400);
        }
        const success = await mapping_repository_1.mappingRepository.save(input.anilistId, input.scraperId, input.title);
        if (!success) {
            throw new app_error_1.AppError('Failed to save mapping', 500);
        }
        return { saved: true };
    },
    async deleteMapping(anilistId) {
        const success = await mapping_repository_1.mappingRepository.remove(anilistId);
        if (!success) {
            throw new app_error_1.AppError('Failed to delete mapping', 500);
        }
        return { deleted: anilistId };
    },
    async identify(body) {
        if (!body.slug || !body.title) {
            throw new app_error_1.AppError('Missing slug or title', 400);
        }
        const anilistId = await (0, mapper_1.getAniListId)(body.slug, body.title);
        if (!anilistId) {
            throw new app_error_1.AppError('AniList ID not found', 404);
        }
        return { anilistId };
    },
};
