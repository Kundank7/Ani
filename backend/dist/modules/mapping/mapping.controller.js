"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mappingController = void 0;
const api_response_1 = require("../../core/http/api-response");
const mapping_service_1 = require("./mapping.service");
exports.mappingController = {
    async getMapping(req, res) {
        const data = await mapping_service_1.mappingModuleService.getMapping(req.params.id);
        return (0, api_response_1.sendSuccess)(res, data);
    },
    async saveMapping(req, res) {
        const data = await mapping_service_1.mappingModuleService.saveMapping(req.body);
        return (0, api_response_1.sendSuccess)(res, data);
    },
    async deleteMapping(req, res) {
        const data = await mapping_service_1.mappingModuleService.deleteMapping(req.params.id);
        return (0, api_response_1.sendSuccess)(res, data);
    },
    async identify(req, res) {
        const data = await mapping_service_1.mappingModuleService.identify(req.body);
        return (0, api_response_1.sendSuccess)(res, data);
    },
};
