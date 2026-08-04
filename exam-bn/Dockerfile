# syntax=docker/dockerfile:1
# =============================================================================
# Dockerfile MULTI-STAGE — exam-bn (SvelteKit / @sveltejs/adapter-node)
# =============================================================================

# ---------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# PUBLIC_* dipakai oleh $env/static/public -> dibake ke bundle saat build.
ARG PUBLIC_API_URL
ARG PUBLIC_PORTAL_URL
ARG PUBLIC_COOKIE_DOMAIN
ARG PUBLIC_ALLOWED_ROLES
ENV PUBLIC_API_URL=${PUBLIC_API_URL} \
    PUBLIC_PORTAL_URL=${PUBLIC_PORTAL_URL} \
    PUBLIC_COOKIE_DOMAIN=${PUBLIC_COOKIE_DOMAIN} \
    PUBLIC_ALLOWED_ROLES=${PUBLIC_ALLOWED_ROLES}

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
    PORT=3007

# User non-root untuk keamanan
RUN addgroup -S app && adduser -S app -G app

# Install dependency PRODUKSI saja
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Salin hasil build dari stage builder
COPY --from=builder /app/build ./build

RUN chown -R app:app /app

USER app

EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3007/health || exit 1

CMD ["node", "build"]
