FROM node:24-bookworm AS builder

WORKDIR /app

COPY precise/package.json precise/package-lock.json ./precise/
RUN cd precise && npm ci
COPY precise/ ./precise/
RUN cd precise && npm run build

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
COPY --from=builder /app/precise/dist ./public

EXPOSE 8081

CMD ["node", "dist/index.js"]
