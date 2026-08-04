import express, { type Request, type Response, type NextFunction, type CookieOptions } from "express";
import cors from "cors";
import { env } from "./configs/env.js";
import { appRouter } from "./routes/index.js"

interface AppError {
  statusCode?: number;
  code?: string;
  message: string;
  errors?: unknown;
}

const createApp = () => {
    const app = express()
    app.set("trust proxy", 1)
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const cleanOrigin = origin.replace(/\/+$/, "");
            const isAllowed = env.CLIENT_URLS.some(
                (clientUrl) => clientUrl.replace(/\/+$/, "") === cleanOrigin
            );
            const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin);

            if (isAllowed || (env.NODE_ENV === "development" && isLocalhost)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cookie"],
        optionsSuccessStatus: 200,
    }))
    // Limit dinaikkan agar muat payload commit jadwal generator (ratusan slot)
    // dan unggah data massal. Default express.json hanya 100kb.
    app.use(express.json({ limit: '10mb' }))

    if (env.COOKIE_DOMAIN) {
        const cookieDomain = env.COOKIE_DOMAIN.trim().replace(/^\.+/, '');
        // sentri tidak mendukung opsi `domain`, jadi disuntikkan lewat override
        // res.cookie per-request. res.clearCookie juga memanggil this.cookie,
        // sehingga pembersihan cookie ikut mendapat Domain yang sama.
        app.use((_req: Request, res: Response, next: NextFunction) => {
            const originalCookie = res.cookie.bind(res);
            res.cookie = function (name: string, val: any, options: CookieOptions = {}) {
                return originalCookie(name, val, { ...options, domain: cookieDomain });
            };
            next();
        });
    }

    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() })
    })

    app.use(appRouter)

    app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
        res.status(err.statusCode || 500).json({
            error: true,
            statusCode: err.statusCode || 500,
            code: err.code || "INTERNAL_SERVER_ERROR",
            message: err.message,
            data: err.errors || null
        })
    })

    return app
}

export { createApp }
export * from "./configs/env.js"
export * from "./errors/index.js"
export * from "./utils/response.js"
export * from "./utils/excel.js"
export * from "./utils/excel-controller-helpers.js"
export * from "./utils/batch-schemas.js"
export * from "./utils/cache.js"
export * from "./utils/storage.js"
export * from "./utils/zod-error-map.js"
export * from "./utils/put-update.js"