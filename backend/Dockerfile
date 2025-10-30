# Dockerfile for Strapi Backend on Zeabur

# Use Node.js LTS version
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Build Strapi
RUN pnpm build

# Production image, copy all the files and run Strapi
FROM base AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 strapi

# Copy built application
COPY --from=builder --chown=strapi:nodejs /app ./

# Switch to strapi user
USER strapi

# Expose port
EXPOSE 1337

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:1337/_health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Strapi
CMD ["pnpm", "start"]
