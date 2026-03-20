#!/usr/bin/env node
// @ts-check

/**
 * Setup Add-Docker Script
 * Adds Docker configuration (Dockerfile, docker-compose.yml, nginx.conf) to the
 * project.
 */

import fs from 'fs';
import path from 'path';
import {
  getRootDir,
  exists,
  writeText,
  isDirectRun,
  logStep,
  logOk,
  logInfo,
  logWarn,
} from './_setup-utils.js';

// ---------------------------------------------------------------------------
// File templates
// ---------------------------------------------------------------------------

const DOCKERFILE = `# =====================================================
# Stage 1: Build (Node + Vite)
# =====================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn/berry/cache \\
    yarn install --immutable

COPY . .

RUN yarn build


# =====================================================
# Stage 2: Production (Nginx static server)
# =====================================================
FROM nginxinc/nginx-unprivileged:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
`;

const DOCKER_COMPOSE = `services:
  # Development environment with hot-reload
  app:
    image: node:22-alpine
    container_name: \${APP_NAME:-app}-fe-dev
    working_dir: /app
    volumes:
      - .:/app
      - /app/node_modules
      - yarn_cache:/root/.yarn/berry/cache
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - DOCKER=true
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    command: >-
      sh -c "yarn install
      && yarn dev"
    stdin_open: true
    tty: true
    security_opt:
      - no-new-privileges:true

  # Production preview (multi-stage build -> nginx)
  app-prod:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: \${APP_NAME:-app}-fe-prod
    ports:
      - '8080:8080'
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
    security_opt:
      - no-new-privileges:true

volumes:
  yarn_cache:
`;

const NGINX_CONF = `server {
    listen 8080;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    server_tokens off;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        application/json
        application/javascript
        application/xml+rss
        text/javascript
        image/svg+xml
        font/woff2
        application/manifest+json;

    location = /health {
        access_log off;
        add_header Content-Type text/plain always;
        return 200 "healthy\\n";
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        expires -1;
    }

    location = / {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        try_files $uri /index.html;
    }

    location ^~ /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
`;

const DOCKERIGNORE = `node_modules
dist
.git
.gitignore
.env
.env.*
*.env
.DS_Store
.vscode
*.log
coverage
.dockerignore
docker-compose*.yml
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if Docker configuration is already present.
 * @param {string} rootDir
 * @returns {boolean}
 */
function hasDocker(rootDir) {
  return (
    exists(path.join(rootDir, 'Dockerfile')) ||
    exists(path.join(rootDir, 'docker-compose.yml'))
  );
}

/**
 * Create all Docker files.
 * @param {string} rootDir
 * @returns {number} Number of files created
 */
function createDockerFiles(rootDir) {
  let created = 0;

  const files = [
    ['Dockerfile', DOCKERFILE],
    ['docker-compose.yml', DOCKER_COMPOSE],
    ['nginx.conf', NGINX_CONF],
    ['.dockerignore', DOCKERIGNORE],
  ];

  for (const [filename, content] of files) {
    const filePath = path.join(rootDir, filename);
    if (!exists(filePath)) {
      writeText(filePath, content);
      logInfo(`${filename}: ✓ created`);
      created++;
    } else {
      logInfo(`${filename}: - already exists, skipped`);
    }
  }

  return created;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Apply Docker additions.
 * @param {Object} [options]
 * @param {string} [options.rootDir]
 * @returns {Promise<{changed: boolean}>}
 */
export async function apply({ rootDir = getRootDir() } = {}) {
  if (hasDocker(rootDir)) {
    logWarn('Docker configuration already detected — no changes made.');
    return { changed: false };
  }

  logStep('Adding Docker configuration');

  const created = createDockerFiles(rootDir);
  if (created > 0) logOk(`Created ${created} Docker file(s)`);

  console.log('\nNext steps:');
  console.log('  1. Review Dockerfile and docker-compose.yml for your project name');
  console.log('  2. Build: docker compose build app-prod');
  console.log('  3. Run dev:  docker compose up app');
  console.log('  4. Run prod: docker compose up app-prod');

  return { changed: created > 0 };
}

/* ---------------- Direct Run ---------------- */

if (isDirectRun(import.meta.url)) {
  apply().catch(console.error);
}
