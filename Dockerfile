# syntax=docker/dockerfile:1

# ---- deps -------------------------------------------------------------------
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# better-sqlite3 and sharp ship prebuilds for this platform; python3/make/g++ are
# only here so a missing prebuild falls back to compiling rather than failing.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ---- build ------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# A dummy secret satisfies module-load checks; the real one comes from the host.
ENV SESSION_SECRET=build-time-placeholder-not-used-at-runtime
RUN npm run build

# ---- run --------------------------------------------------------------------
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Mount a persistent volume here. It holds portfolio.db and uploads/.
ENV DATA_DIR=/data

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs \
 && mkdir -p /data/uploads && chown -R nextjs:nodejs /data

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# Migrations are applied at boot by instrumentation.ts and are read from here.
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "server.js"]
