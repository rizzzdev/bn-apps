import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/database/generated/client";
import { createAuthExpress } from "sentri/express";
import { PostgresDialect } from "kysely";
import pg from "pg";
import { env } from "@/configs/env";

const { Pool } = pg;

type Role =
  | "super_admin"
  | "exam_admin"
  | "teacher"
  | "student"
  | "industry_mentor";

export const sentriAuth = createAuthExpress<Role>({
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
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: env.DATABASE_URL! }),
  }),

  // -- Token ------------------------------------------------------------------
  secret: process.env.JWT_SECRET!,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN ?? "1d",

  // -- Security ---------------------------------------------------------------
  saltRounds: parseInt(env.SALT_ROUNDS ?? "12", 10),
  apiKey: process.env.API_KEY, // uncomment to restrict POST /register

  // -- Rate Limiting (optional) -----------------------------------------------
  rateLimit: { maxLoginAttempts: 100, maxRegisterAttempts: 100 },

  // -- Redis (optional) -------------------------------------------------------
  redisUrl: env.REDIS_URL,

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

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});
export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});
