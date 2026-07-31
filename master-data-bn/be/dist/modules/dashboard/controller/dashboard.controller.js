"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const service_1 = require("../../../modules/dashboard/service");
const response_1 = require("../../../utils/response");
class DashboardController {
    service;
    constructor(service) {
        this.service = service;
    }
    getSummary = async (req, res, next) => {
        try {
            const data = await this.service.getSummary();
            (0, response_1.sendResponse)(res, 200, "Success fetch summary", data);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController(service_1.dashboardService);
