# ---- builder ----
FROM node:lts-alpine AS builder
WORKDIR /app

# PUBLIC_* vars are baked into the client bundle at build time, so they must be
# provided as a build arg (not read from a committed .env, which is excluded
# via .dockerignore).
ARG PUBLIC_BACKEND_URL=http://localhost:3000
ENV PUBLIC_BACKEND_URL=$PUBLIC_BACKEND_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────
FROM node:lts-alpine AS runner
WORKDIR /app

# Salin build output dari builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install hanya production dependencies (lebih ringan dari copy seluruh node_modules)
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

EXPOSE 5173

CMD ["node", "build"]
