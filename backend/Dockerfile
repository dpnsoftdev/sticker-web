# syntax=docker/dockerfile:1.6

########################
# 1) Dependencies stage
########################
FROM node:20-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

###################
# 2) Build stage
###################
FROM node:20-slim AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm exec prisma generate
RUN pnpm build

###################
# 3) Runtime stage
###################
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Non-root user (Debian)
RUN groupadd -r nodejs && useradd -r -g nodejs nodeuser

# Copy from build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health-check', r => { r.resume(); process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "dist/index.js"]