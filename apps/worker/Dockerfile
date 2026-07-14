FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy monorepo config
COPY package.json package-lock.json ./
COPY turbo.json ./

# Copy packages and apps
COPY apps/worker ./apps/worker
COPY packages ./packages

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npm run generate --workspace=@repo/db

# Build the project
RUN npm run build --workspace=worker

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/node_modules ./apps/worker/node_modules

CMD ["npm", "run", "start", "--workspace=worker"]
