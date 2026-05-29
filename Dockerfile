FROM node:24-bookworm AS builder

WORKDIR /app

COPY precise/package.json precise/package-lock.json ./precise/
RUN cd precise && npm ci
COPY precise/ ./precise/
RUN cd precise && npm run build
RUN test -f /app/precise/dist/index.html

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
RUN cd server && npm run build

FROM node:24-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/config ./config
COPY --from=builder /app/server/migrations ./migrations
COPY --from=builder /app/precise/dist ./public

# Drop root privileges. node:24-bookworm-slim ships a `node` user (UID 1000).
USER node

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:8081/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
