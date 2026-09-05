FROM node:24-alpine AS dependencies
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG LEGACY_MEDIA_URL
ENV LEGACY_MEDIA_URL=${LEGACY_MEDIA_URL}
RUN pnpm build && pnpm build:tools

FROM node:24-alpine AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 UPLOAD_DIR=/app/data/uploads
RUN addgroup -S -g 1001 nextjs && adduser -S -u 1001 -G nextjs nextjs && mkdir -p /app/data/uploads && chown -R nextjs:nextjs /app/data
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/dist-tools ./tools
COPY --chown=nextjs:nextjs scripts/docker-start.mjs ./tools/start.mjs
COPY --chown=nextjs:nextjs drizzle ./drizzle
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "tools/start.mjs"]
