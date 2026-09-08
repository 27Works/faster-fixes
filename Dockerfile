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

# The env validator requires Stripe vars in production even though self-hosted
# never runs billing (the docs say leave them unset, but `next build` validates
# eagerly). A placeholder satisfies the check; the value is never used. If more
# Stripe vars error in sequence, add them here the same way. Check the env schema
# (grep STRIPE_WEBHOOK_SIGNING_SECRET) to see the full required-in-prod set.
ARG STRIPE_WEBHOOK_SIGNING_SECRET=whsec_placeholder
ENV STRIPE_WEBHOOK_SIGNING_SECRET=$STRIPE_WEBHOOK_SIGNING_SECRET

# /api/github/setup imports a lib that runs
# `process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g,"\n")` at MODULE SCOPE, so
# page-data collection throws when the var is undefined at build. A bare string is
# enough — the Octokit/PEM parsing is lazy (inside the exported functions), so
# nothing validates the key at build. The real key comes from Coolify at runtime.
# NB: the var is GITHUB_PRIVATE_KEY (not GITHUB_APP_PRIVATE_KEY).
ARG GITHUB_PRIVATE_KEY=placeholder
ENV GITHUB_PRIVATE_KEY=$GITHUB_PRIVATE_KEY

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
