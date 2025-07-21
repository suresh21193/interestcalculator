# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat build-base python3

WORKDIR /app

# Copy package manager files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

# Install dependencies based on available lock file
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile --ignore-scripts --production; \
  elif [ -f package-lock.json ]; then npm ci --ignore-scripts --production; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile --ignore-scripts --production; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/package.json /app/yarn.lock* /app/package-lock.json* /app/pnpm-lock.yaml* ./

# Copy application source
COPY . .

# Rebuild `better-sqlite3` if required
RUN npm rebuild better-sqlite3 && npm install

# Build the Next.js application
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image
FROM alpine:latest AS runner
WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

RUN apk add --no-cache libc6-compat nodejs npm
RUN npm rebuild better-sqlite3

# Create a non-root user and group BEFORE chown
RUN addgroup -S -g 1001 nodejs
RUN adduser -S -u 1001 nextjs

RUN chown -R nextjs:nodejs /app/.next

ENV NODE_ENV=production

# Switch to non-root user
USER nextjs

EXPOSE 4000
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

VOLUME /app/data

# Start the Next.js server
CMD ["node", "server.js"]