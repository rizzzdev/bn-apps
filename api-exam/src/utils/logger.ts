import pino from "pino";
import { envConfig } from "../configs/env.config.js";

/**
 * Application-wide Pino logger singleton.
 * Dev: pretty-printed output via pino-pretty.
 * Prod: structured JSON for log aggregation systems.
 * Sensitive fields are globally redacted.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: ["*.password", "*.token", "*.accessToken", "*.refreshToken", "*.apiKey", "*.secret"],
    censor: "[REDACTED]",
  },
  ...(envConfig.nodeEnv === "dev" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard" },
    },
  }),
});
