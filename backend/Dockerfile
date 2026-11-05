# Build from the repo root, the lockfile covers both workspaces:
#   docker build -f backend/Dockerfile .
FROM node:24-bookworm-slim AS build
# Compilers for argon2 and better-sqlite3, in case no prebuilt binary is available
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace=backend
COPY backend backend
RUN npm run build --workspace=backend
RUN npm prune --omit=dev --workspace=backend

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/backend/node_modules /app/backend/node_modules
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=build /app/backend/package.json /app/backend/package.json
# Named volumes take their ownership from these folders on first use
RUN mkdir -p /data /backups && chown node:node /data /backups
USER node
EXPOSE 4000
CMD ["node", "dist/main"]
