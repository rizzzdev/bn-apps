# =============================================================================
# Stage 1: base - dependency manifests + full install + prisma generate
# =============================================================================
FROM node:24-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
RUN npm run db:generate

# =============================================================================
# Stage 2: migrate - one-shot job that runs prisma migrate deploy for every
# module schema. Used by docker-compose before the API starts.
# =============================================================================
FROM base AS migrate

CMD ["npm", "run", "db:migrate:deploy"]

# =============================================================================
# Stage 3: runner - minimal production image
# =============================================================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app/src ./src
COPY --from=base /app/node_modules ./node_modules
COPY package.json ./

RUN mkdir -p /app/public/attachments && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000;fetch('http://127.0.0.1:'+p+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "src/index.ts"]
