import cors from "cors";
import { env } from "@/configs/env";

const clientOrigins = env.CLIENT_URL.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

export const corsConfig = cors({
  origin: clientOrigins,
  credentials: true,
});
