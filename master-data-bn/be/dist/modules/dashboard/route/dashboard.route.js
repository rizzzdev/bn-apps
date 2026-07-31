"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoute = void 0;
const express_1 = require("express");
const controller_1 = require("../../../modules/dashboard/controller");
exports.dashboardRoute = (0, express_1.Router)();
exports.dashboardRoute.get('/summary', controller_1.dashboardController.getSummary);
