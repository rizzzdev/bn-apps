import cors from "cors";
import { env } from "@/configs/env";

const clientOrigins = env.CLIENT_URL.split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const webhookClientOrigins =
  env.WEBHOOK_CLIENT_URL?.split(",")
    ?.map((url) => url.trim())
    ?.filter(Boolean) || [];

export const corsConfig = cors({
  origin: [...clientOrigins, ...webhookClientOrigins],
  credentials: true,
});
