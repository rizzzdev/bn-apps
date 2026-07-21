# ── Builder ───────────────────────────────────────────────────────────────────
FROM node:lts-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# generate → build → salin generated client ke dist agar import runtime resolve
RUN npx prisma generate \
    && npm run build \
    && cp -r src/app/database/generated dist/app/database/generated

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:lts-alpine AS runner
WORKDIR /app

# node_modules (dibutuhkan untuk prisma CLI dan bcrypt native)
COPY --from=builder /app/node_modules       ./node_modules

# Compiled application (termasuk generated client yang sudah di-copy ke dist)
COPY --from=builder /app/dist               ./dist

# Prisma: schema + migrations + config + seed script (untuk migrate deploy & db:seed)
COPY --from=builder /app/prisma             ./prisma
COPY --from=builder /app/prisma.config.ts   ./prisma.config.ts

# src/configs dibutuhkan oleh prisma.config.ts & seed.ts saat migrate/seed
COPY --from=builder /app/src/configs        ./src/configs

# Generated Prisma client (ts source) dibutuhkan oleh prisma/seed.ts yang dijalankan via tsx
COPY --from=builder /app/src/app/database/generated ./src/app/database/generated

COPY --from=builder /app/package.json       ./package.json

ENV NODE_ENV=production

EXPOSE 3000

# Kita mem-bypass PgBouncer khusus untuk 'migrate deploy' karena advisory lock
# tidak didukung di PgBouncer Transaction Mode. Retry loop menghindari error lock timeout saat replicas menyala serentak.
CMD ["sh", "-c", "PROD_DB_URL='postgresql://exam_user:exam_password@postgres:5432/exam_db?schema=public' sh -c 'until npx prisma migrate deploy; do echo \"Retrying migration...\"; sleep 3; done' && PROD_DB_URL='postgresql://exam_user:exam_password@postgres:5432/exam_db?schema=public' npm run db:seed && node dist/index.js"]
