"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsConfig = void 0;
const cors_1 = __importDefault(require("cors"));
const env_1 = require("../configs/env");
const clientOrigins = env_1.env.CLIENT_URL.split(",")
    .map((url) => url.trim())
    .filter(Boolean);
const webhookClientOrigins = env_1.env.WEBHOOK_CLIENT_URL?.split(",")
    ?.map((url) => url.trim())
    ?.filter(Boolean) || [];
exports.corsConfig = (0, cors_1.default)({
    origin: [...clientOrigins, ...webhookClientOrigins],
    credentials: true,
});
