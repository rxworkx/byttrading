# Build from the repo root, the lockfile covers both workspaces:
#   docker build -f frontend/Dockerfile .
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace=frontend
COPY frontend frontend
# NEXT_PUBLIC_API_URL stays unset: the browser then calls /api on the site's own
# domain, which Caddy passes to the backend.
RUN npm run build --workspace=frontend

FROM caddy:2-alpine
COPY frontend/Caddyfile frontend/Caddyfile.behind-proxy frontend/site.caddy /etc/caddy/
COPY --from=build /app/frontend/out /srv
