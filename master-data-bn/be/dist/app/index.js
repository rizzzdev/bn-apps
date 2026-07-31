"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = require("../configs/cors");
const routes_1 = require("../app/routes");
const database_1 = require("../database");
const cache_1 = require("../utils/cache");
const webhook_1 = require("../modules/webhook");
const controller_1 = require("../modules/attachment/controller");
const createServer = () => {
    const app = (0, express_1.default)();
    app.use(cors_1.corsConfig);
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    const getToken = (req) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        return req.cookies?.['sentri-session'] || null;
    };
    // Intercept GET /auth/me for caching
    app.get('/api/v1/auth/me', (0, cache_1.cacheRouteMiddleware)((req) => {
        const token = getToken(req);
        return token ? `auth:me:${token}` : null;
    }, 600));
    // Intercept POST /auth/logout for immediate invalidation
    app.use('/api/v1/auth/logout', async (req, res, next) => {
        const token = getToken(req);
        if (token) {
            await (0, cache_1.clearCachePattern)(`auth:me:${token}`);
        }
        next();
    });
    app.use("/api/v1/webhook", webhook_1.webhookRoute);
    app.use("/api/v1/auth", database_1.sentriAuth.router());
    // Public file serving (no auth required)
    app.get('/api/v1/attachments/file/:url', (req, res, next) => controller_1.attachmentController.serveFile(req, res, next));
    app.use("/api/v1", routes_1.appRoutes);
    app.use(database_1.sentriAuth.errorHandler());
    return app;
};
exports.createServer = createServer;
