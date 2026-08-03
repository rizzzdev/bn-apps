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
ENV PORT=5173

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

EXPOSE 5173

# Health check to ensure container is healthy on VPS
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Start the SvelteKit Node server
CMD ["node", "build"]
