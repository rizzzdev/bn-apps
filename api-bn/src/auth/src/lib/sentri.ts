import 'dotenv/config';
import { createAuthExpress } from 'sentri/express';
import { PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from "../../../app/configs/env";

const { Pool } = pg;

export type Role = "super_admin" | "teacher" | "student" | "industry_mentor";

export const sentriAuth = createAuthExpress<Role>({
  mode: 'server',

  // -- Roles ------------------------------------------------------------------
  validRoles: ["industry_mentor", 'student', 'super_admin', 'teacher'],

  // -- Identifiers ------------------------------------------------------------
  validIdentifiers: ['email'],

  // -- Database ---------------------------------------------------------------
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: env.DB_URL! + "/auth_bn" })
  }),

  // -- Token ------------------------------------------------------------------
  accessExpiresIn: env.ACCESS_TOKEN_EXPIRES,
  refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES,

  // -- Security ---------------------------------------------------------------
  saltRounds: env.SALT_ROUNDS,
  apiKey: env.API_KEY,  // uncomment to restrict POST /register

  // -- Rate Limiting (optional) -----------------------------------------------
  rateLimit: env.NODE_ENV === "production" && { maxLoginAttempts: 5, maxRegisterAttempts: 5, durationSeconds: 1200 },

  // -- Redis (optional) -------------------------------------------------------
  redisUrl: env.REDIS_URL,

  // -- Cookie (optional) ------------------------------------------------------
  cookie: { secure: env.NODE_ENV === "production", sameSite: 'lax', httpOnly: true },
  accessCookie: { secure: env.NODE_ENV === "production", sameSite: 'lax' },

  // -- Hooks (optional) -------------------------------------------------------
  // hooks: {
  //   onLogin: (user) => console.log(`login: ${user.identifier}`),
  //   onFailedLogin: (identifier) => console.warn(`failed login: ${identifier}`),
  //   onLogout: (userId) => console.log(`logout: ${userId}`),
  // },

  // -- Token revocation (optional) --------------------------------------------
  // isTokenRevoked: async (sessionId) => false,

  // -- Logger (optional) ------------------------------------------------------
  // logger: console,
  // loggerService: 'sentri',
});
