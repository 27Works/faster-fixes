# syntax=docker/dockerfile:1
# FasterFixes web app — built in CI, run as a prebuilt image on Coolify.
# Add this at the REPO ROOT of your fork. Pure addition (no upstream edits).
#
# CONFIRM before first build:
#  - the web package NAME (from apps/web/package.json "name") — placeholder: "web"
#  - the pnpm version (root package.json "packageManager") — placeholder: 10.4.1
#  - Node major (Prisma 7 needs 18+) — using 22 LTS

# ---- Base ----
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl   # openssl: Prisma engine on alpine
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# ---- Prune: minimal monorepo subset for the web app (fast, cache-friendly) ----
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune web --docker

# ---- Install + build ----
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

# NEXT_PUBLIC_* are inlined by Next at BUILD time, so they must be present here.
# They are NOT secret (public URLs); passed as build args from the CI workflow.
ARG NEXT_PUBLIC_FF_API_ORIGIN
ARG NEXT_PUBLIC_IS_CLOUD=false
ARG NEXT_PUBLIC_STORAGE_BASE_URL
ENV NEXT_PUBLIC_FF_API_ORIGIN=$NEXT_PUBLIC_FF_API_ORIGIN \
    NEXT_PUBLIC_IS_CLOUD=$NEXT_PUBLIC_IS_CLOUD \
    NEXT_PUBLIC_STORAGE_BASE_URL=$NEXT_PUBLIC_STORAGE_BASE_URL

# "web..." builds @workspace/db first (its build script IS `prisma generate`),
# then next build — dependency order handled by pnpm/turbo.
RUN pnpm --filter "web..." build

# ---- Runner ----
# Non-standalone runner: simplest, and needs NO next.config change (keeps the fork
# to pure additions). Larger image, but the server only runs it. To shrink later,
# set `output: 'standalone'` in apps/web/next.config and copy .next/standalone.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
USER node
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["pnpm", "--filter", "web", "start"]
