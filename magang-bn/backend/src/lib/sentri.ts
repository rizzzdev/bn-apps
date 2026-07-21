import 'dotenv/config';
import { createAuthExpress } from 'sentri/express';

type Role = 'admin' | 'user';

export const sentriAuth = createAuthExpress<Role>({
  mode: 'client',

  // -- Auth server ------------------------------------------------------------
  // URL of the auth server's GET /auth/keys endpoint (JWKS).
  // The server must use RS256 to expose this endpoint.
  keyUri: `${process.env.MASTER_API_URL}/auth/keys`,

  // -- Roles (optional) -------------------------------------------------------
  // Only used for TypeScript type safety on authorize() — not validated at runtime.
  validRoles: ['admin', 'user'],

  // -- Logger (optional) ------------------------------------------------------
  // logger: console,
  // loggerService: 'auth-service',
});
