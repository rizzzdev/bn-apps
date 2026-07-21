import "dotenv/config";
import { defineConfig } from "prisma/config";
import { envConfig } from "./src/configs/env.config.js";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: envConfig.dbUrl,
  },
});
