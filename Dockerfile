ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
ENV DATABASE_URL="file:/data/pawday.db"
ARG NPM_REGISTRY=https://registry.npmmirror.com
COPY package.json pnpm-lock.yaml* ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm config set registry "${NPM_REGISTRY}" \
  && pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-factor 2 \
  && pnpm config set fetch-retry-mintimeout 20000 \
  && pnpm config set fetch-retry-maxtimeout 120000 \
  && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/data/pawday.db"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV PUID=1001
ENV PGID=1001
ENV DATABASE_URL="file:/data/pawday.db"
ENV UPLOAD_DIR="/uploads"
ENV TMPDIR="/tmp"
RUN apk add --no-cache su-exec && addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs && mkdir -p /data /uploads /tmp && chmod 1777 /tmp && chown -R nextjs:nodejs /data /uploads
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts/generate-image-variants.mjs ./scripts/generate-image-variants.mjs
COPY scripts/docker-entrypoint.sh /usr/local/bin/pawday-entrypoint
RUN chmod +x /usr/local/bin/pawday-entrypoint
EXPOSE 3000
ENTRYPOINT ["pawday-entrypoint"]
CMD ["node", "server.js"]
