# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all deps (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN pnpm exec prisma generate

# Compile TypeScript
RUN pnpm run build

# Prune to production-only deps
RUN pnpm prune --prod


# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 5000

# dumb-init handles signals properly (PID 1)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
