# Stage 1: Builder
FROM node:lts-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for building)
COPY package*.json ./
RUN npm install

# Copy source code and build the SvelteKit app
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:lts-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/build ./build

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", "build"]
