import "dotenv/config";
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const client = createClient({ url: redisUrl });

client.on("error", (err) => console.error("Redis error:", err));

async function main() {
  await client.connect();
  await client.flushAll();
  console.log("Redis: semua data berhasil dihapus (FLUSHALL).");
  await client.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
