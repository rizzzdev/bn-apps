import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.js";
import { envConfig } from "../../configs/env.config.js";

if (!envConfig.dbUrl) {
  throw new Error("Database URL is not configured — check DEV_DB_URL or PROD_DB_URL in .env");
}

const adapter = new PrismaPg({ connectionString: envConfig.dbUrl });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (envConfig.nodeEnv !== "prod") {
  globalForPrisma.prisma = prisma;
}
