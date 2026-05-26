FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/package.json
COPY packages/client/package.json packages/client/package.json

RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate --schema=packages/server/prisma/schema.prisma
RUN npm run build -w @go-out-planner/client
RUN npm run build -w @go-out-planner/server
RUN npm prune --production

FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/server/prisma ./packages/server/prisma
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY --from=build /app/packages/client/dist ./packages/client/dist
COPY --from=build /app/package.json ./package.json

COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER appuser
EXPOSE 3001
ENV NODE_ENV=production
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "packages/server/dist/index.js"]
