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

# Copy dependency files first (improves layer caching).
# Root manifests and lockfile are copied first so `yarn install` is only
# re-run when dependencies change, not on every source file change.
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
# Uses BuildKit cache for faster rebuilds.
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    yarn install --immutable

# Copy project files
COPY . .

# Build the Vite app (outputs to /app/dist)
RUN yarn build

# =====================================================
# Stage 2: Production (Nginx static server)
# =====================================================
# Pinned to SHA-256 digest for supply-chain security.
# Corresponds to nginxinc/nginx-unprivileged:alpine (pulled 2026-02-28).
# To update: docker pull nginxinc/nginx-unprivileged:alpine && docker inspect nginxinc/nginx-unprivileged:alpine --format='{{index .RepoDigests 0}}'
FROM nginxinc/nginx-unprivileged:alpine@sha256:07ac04b4a727a38e7360f3bd8bbe49a7433a8e2a3259dd403d2c982e5f4c7a1c

# Copy custom nginx configuration (as a template — envsubst replaces ${CSP_CONNECT_SRC})
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy shared security headers include (as a template for CSP domain injection)
COPY nginx/security_headers.conf /etc/nginx/templates/security_headers.conf.template

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