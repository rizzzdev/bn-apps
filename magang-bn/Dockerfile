# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:24-alpine AS deps
WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for building)
RUN npm ci

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:24-alpine AS builder
WORKDIR /app

# Build-time public env vars (baked into the client bundle via $env/static/public)
ARG PUBLIC_API_URL=""
ARG PUBLIC_PORTAL_URL=""
ARG PUBLIC_COOKIE_DOMAIN=""
ENV PUBLIC_API_URL=$PUBLIC_API_URL \
    PUBLIC_PORTAL_URL=$PUBLIC_PORTAL_URL \
    PUBLIC_COOKIE_DOMAIN=$PUBLIC_COOKIE_DOMAIN

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Build the SvelteKit project using @sveltejs/adapter-node
RUN npm run build

# ==========================================
# Stage 3: Runner (Production)
# ==========================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3004

# Create unprivileged non-root user for security
RUN addgroup -S sveltekit && adduser -S sveltekit -G sveltekit

# Copy package files and install production-only dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled SvelteKit build output from builder stage
COPY --from=builder /app/build ./build

# Set ownership to unprivileged user
RUN chown -R sveltekit:sveltekit /app

# Switch to non-root user
USER sveltekit

EXPOSE 3004

# Health check to ensure container is healthy on VPS
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3004/health || exit 1

# Start the SvelteKit Node server
CMD ["node", "build"]
