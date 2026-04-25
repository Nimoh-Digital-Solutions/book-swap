# =====================================================
# Stage 1: Build (Node + Vite)
# =====================================================
# Pinned to SHA-256 digest for supply-chain security.
# Corresponds to node:22-alpine (pulled 2026-02-28).
# To update: docker pull node:22-alpine && docker inspect node:22-alpine --format='{{index .RepoDigests 0}}'
FROM node:22-alpine@sha256:e4bf2a82ad0a4037d28035ae71529873c069b13eb0455466ae0bc13363826e34 AS builder

# Set working directory
WORKDIR /app

# Enable Corepack so Yarn 4 (Berry) is available
RUN corepack enable

# NOTE: Build context is the repo root (so `packages/shared/` is reachable for
# the @shared/* TS path alias used since AUD-X-001). Compose / CI must build
# with `context: ..` and `dockerfile: frontend/Dockerfile`.

# Copy dependency files first (improves layer caching). Frontend manifest +
# lockfile + Yarn config drive `yarn install`; the shared package is plain
# npm so its lockfile + manifest are copied separately.
COPY frontend/package.json frontend/yarn.lock frontend/.yarnrc.yml ./
COPY packages/shared/package.json packages/shared/package-lock.json /packages/shared/

# Install frontend dependencies (Yarn 4) and shared package deps (npm). The
# shared package has no runtime deps shipped to the frontend bundle — the
# install is only needed so its tsconfig / type-checker is happy.
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    yarn install --immutable
RUN cd /packages/shared && npm ci --no-audit --no-fund

# Copy the rest of the source — frontend/ becomes /app/, and packages/shared/
# stays at /packages/shared/ to match the @shared TS path alias
# (resolves to ../../packages/shared/src from /app/tsconfig.json).
COPY frontend/ ./
COPY packages/shared/ /packages/shared/

# Build-time args — Vite inlines these into the bundle via import.meta.env.
# Override with --build-arg VITE_API_URL=... or docker-compose build.args.
ARG VITE_API_URL
ARG VITE_APP_TITLE=BookSwap
ARG VITE_SENTRY_ENVIRONMENT=staging
ARG VITE_SENTRY_DSN=
ARG VITE_SITE_URL=https://book-swaps.com
ARG VITE_GOOGLE_MAPS_API_KEY=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_TITLE=$VITE_APP_TITLE \
    VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

# Build the Vite app (outputs to /app/dist)
RUN yarn build

# =====================================================
# Stage 2: Production (Nginx static server)
# =====================================================
# Pinned to SHA-256 digest for supply-chain security.
# Corresponds to nginxinc/nginx-unprivileged:alpine (pulled 2026-02-28).
# To update: docker pull nginxinc/nginx-unprivileged:alpine && docker inspect nginxinc/nginx-unprivileged:alpine --format='{{index .RepoDigests 0}}'
FROM nginxinc/nginx-unprivileged:alpine@sha256:07ac04b4a727a38e7360f3bd8bbe49a7433a8e2a3259dd403d2c982e5f4c7a1c

# Pull latest security patches (fixes CVE-2026-31789 in libcrypto3/libssl3)
USER root
RUN apk upgrade --no-cache
USER nginx

# Copy custom nginx configuration (as a template — envsubst replaces ${CSP_CONNECT_SRC})
# Paths are relative to the repo-root build context.
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template

# Copy shared security headers include (as a template for CSP domain injection)
COPY frontend/nginx/security_headers.conf /etc/nginx/templates/security_headers.conf.template

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Default runtime env vars (override at container start-up via -e or docker-compose environment:)
ENV CSP_CONNECT_SRC="'self'"
ENV BACKEND_URL="http://backend:8000"

# Tell nginx-unprivileged's entrypoint which env vars to substitute.
# Both CSP_CONNECT_SRC and BACKEND_URL are replaced; other ${...} tokens are left untouched.
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
ENV NGINX_ENVSUBST_FILTER="CSP_CONNECT_SRC|BACKEND_URL"

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port 8080 (nginx-unprivileged runs on 8080; avoids running as root to bind <1024)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]