import { env } from "../app/configs/env.js";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: `${env.DB_URL}/${env.NODE_ENV === "test" ? "master_bn_test" : "master_bn"}`,
  },
});
