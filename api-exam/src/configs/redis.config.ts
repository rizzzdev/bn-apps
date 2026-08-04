import { createClient } from "redis";
import { envConfig } from "./env.config.js";

export const redisClient = createClient({
  url: envConfig.redisUrl,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};
