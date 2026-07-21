# Stage 1: Builder
FROM node:lts-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for generation and building)
COPY package*.json ./
RUN npm install

# Copy source code, generate Prisma client, and build TypeScript
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:lts-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled application
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/index.js"]
