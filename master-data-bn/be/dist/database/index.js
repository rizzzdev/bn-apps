"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.sentriAuth = void 0;
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@/database/generated/client");
const express_1 = require("sentri/express");
const kysely_1 = require("kysely");
const pg_1 = __importDefault(require("pg"));
const env_1 = require("../configs/env");
const { Pool } = pg_1.default;
exports.sentriAuth = (0, express_1.createAuthExpress)({
    mode: "server",
    // -- Roles ------------------------------------------------------------------
    validRoles: [
        "super_admin",
        "exam_admin",
        "teacher",
        "student",
        "industry_mentor",
    ],
    // -- Identifiers ------------------------------------------------------------
    validIdentifiers: ["email", "nis", "nip", "phone", "nik", "nisn"],
    // -- Database ---------------------------------------------------------------
    dialect: new kysely_1.PostgresDialect({
        pool: new Pool({ connectionString: env_1.env.DATABASE_URL }),
    }),
    // -- Token ------------------------------------------------------------------
    secret: process.env.JWT_SECRET,
    accessExpiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN ?? "1d",
    // -- Security ---------------------------------------------------------------
    saltRounds: parseInt(env_1.env.SALT_ROUNDS ?? "12", 10),
    apiKey: process.env.API_KEY, // uncomment to restrict POST /register
    // -- Rate Limiting (optional) -----------------------------------------------
    rateLimit: { maxLoginAttempts: 100, maxRegisterAttempts: 100 },
    // -- Redis (optional) -------------------------------------------------------
    redisUrl: env_1.env.REDIS_URL,
    // -- Cookie (optional) ------------------------------------------------------
    cookie: {
        name: 'refresh_token',
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
    },
    accessCookie: {
        name: 'access_token',
        secure: process.env.NODE_ENV === "production",
    },
    // -- Hooks (optional) -------------------------------------------------------
    // hooks: {
    //   onLogin: (user) => console.log(`login: ${user.identifier}`),
    //   onFailedLogin: (identifier) => console.warn(`failed login: ${identifier}`),
    //   onLogout: (userId) => console.log(`logout: ${userId}`),
    // },
    // -- Token revocation (optional) --------------------------------------------
    // isTokenRevoked: async (_sessionId) => false,
    // -- Logger (optional) ------------------------------------------------------
    // logger: console,
    loggerService: "master-bn",
});
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: env_1.env.DATABASE_URL,
});
exports.prisma = new client_1.PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
});
