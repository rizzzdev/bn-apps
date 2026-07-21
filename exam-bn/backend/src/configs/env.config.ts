import "dotenv/config";

const nodeEnv = process.env.NODE_ENV ?? "dev";

const devClientUrl = process.env.DEV_CLIENT_URL;
const prodClientUrl = process.env.PROD_CLIENT_URL;

const devPort = Number(process.env.DEV_PORT) || 3000;
const prodPort = Number(process.env.PROD_PORT) || 3000;

const devDbUrl = process.env.DEV_DB_URL;
const prodDbUrl = process.env.PROD_DB_URL;

const refreshTokenSecretKey = process.env.REFRESH_TOKEN_SECRET_KEY;
const accessTokenSecretKey = process.env.ACCESS_TOKEN_SECRET_KEY;

const superAdminUsername = process.env.SUPER_ADMIN_USERNAME;
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const isProd = nodeEnv === "production" || nodeEnv === "prod";

export const envConfig = {
  nodeEnv,
  port: isProd ? prodPort : devPort,
  clientUrl: isProd ? prodClientUrl : devClientUrl,
  dbUrl: isProd ? prodDbUrl : devDbUrl,
  refreshTokenSecretKey,
  accessTokenSecretKey,
  superAdminUsername,
  superAdminPassword,
  redisUrl,
};
