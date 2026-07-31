# =============================================================================
# Stage 1: base - dependency manifests + full install (dev + prod)
# =============================================================================
FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# =============================================================================
# Stage 2: builder - generate Prisma clients + bundle the app with esbuild
# =============================================================================
FROM base AS builder

COPY src ./src
COPY scripts ./scripts
COPY tsconfig.json ./

ENV DB_URL=postgresql://postgres:postgres@localhost:5432/bn
ENV API_KEY=build-time-placeholder

RUN npx prisma generate --config=src/auth/prisma.config.ts
RUN npx prisma generate --config=src/master/prisma.config.ts
RUN npx prisma generate --config=src/academic/prisma.config.ts
RUN npx prisma generate --config=src/internship/prisma.config.ts
RUN npx prisma generate --config=src/learn/prisma.config.ts

RUN node scripts/build.mjs

RUN npm prune --omit=dev

# =============================================================================
# Stage 3: migrate - one-shot job that runs prisma migrate deploy for every
# module schema. Used by docker-compose before the API starts.
# =============================================================================
FROM base AS migrate

COPY src ./src

CMD ["sh", "-c", "for cfg in auth master academic internship learn; do echo \"==> migrate deploy: $cfg\"; npx prisma migrate deploy --config=src/$cfg/prisma.config.ts || exit 1; done"]

# =============================================================================
# Stage 4: runner - minimal production image
# =============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/public/attachments && chown -R node:node /app/public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/bundle.js"]
