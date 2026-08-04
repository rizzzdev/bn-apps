# syntax=docker/dockerfile:1
# =============================================================================
# Dockerfile MULTI-STAGE — master-bn (SvelteKit / @sveltejs/adapter-node)
#
# Stage 1 (builder):  install dev+prod deps, compile app ke /app/build
# Stage 2 (runner):   image final ramping - hanya build output + prod deps
# =============================================================================

# ---------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# PUBLIC_* dipakai oleh $env/static/public -> dibake ke bundle saat build.
# Wajib dilewatkan sebagai build-arg (dari docker-compose / --build-arg).
ARG PUBLIC_API_URL
ARG PUBLIC_PORTAL_URL
ENV PUBLIC_API_URL=${PUBLIC_API_URL} \
    PUBLIC_PORTAL_URL=${PUBLIC_PORTAL_URL}

# Install dependency deterministik (lockfile)
COPY package.json package-lock.json ./
RUN npm ci

# Salin source lalu build
COPY . .
RUN npm run build

# ---------------------------------------------------------------
# Stage 2: Runner (Production)
# ---------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3002

# User non-root untuk keamanan
RUN addgroup -S app && adduser -S app -G app

# Install dependency PRODUKSI saja (tanpa devDependencies)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Salin hasil build dari stage builder
COPY --from=builder /app/build ./build

RUN chown -R app:app /app

USER app

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3002/health || exit 1

CMD ["node", "build"]
