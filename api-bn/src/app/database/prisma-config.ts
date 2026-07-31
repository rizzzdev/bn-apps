import { env } from "../configs/env.js";
import "dotenv/config";
import { defineConfig } from "prisma/config";

export const createPrismaConfig = (dbName: string, schemaPath: string = "prisma/schema.prisma") => {
  return defineConfig({
    schema: schemaPath,
    migrations: {
      path: "prisma/migrations",
    },
    datasource: {
      url: `${env.DB_URL}/${dbName}`,
    },
  });
};
