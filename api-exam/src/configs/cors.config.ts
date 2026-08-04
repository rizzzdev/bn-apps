import { type CorsOptions } from "cors";
// import { envConfig } from "./env.config.js";

// Support comma-separated origins in env var
// const allowedOrigins = (envConfig.clientUrl ?? "")
//   .split(",")
//   .map((o) => o.trim())
//   .filter(Boolean);

export const corsConfig: CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    callback(null, true);
    // if (!origin) return callback(null, true);

    // // Server-to-server requests have no origin
    // if (!origin) return callback(null, true);
    // // In dev, allow all origins (Vite --host, mobile browsers on local network, etc.)
    // if (envConfig.nodeEnv === "dev") return callback(null, true);
    // // In prod, match against configured list
    // if (allowedOrigins.includes(origin)) return callback(null, true);
    // callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
};
