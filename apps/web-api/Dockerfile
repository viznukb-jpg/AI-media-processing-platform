FROM node:20-alpine AS builder
# Set working directory
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy monorepo config
COPY package.json package-lock.json ./
COPY turbo.json ./

# Copy packages and apps
COPY apps/web-api ./apps/web-api
COPY packages ./packages

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npm run generate --workspace=@repo/db

# Build the project
RUN npm run build --workspace=web-api

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web-api/package.json ./apps/web-api/
COPY --from=builder /app/apps/web-api/.next ./apps/web-api/.next
COPY --from=builder /app/apps/web-api/public ./apps/web-api/public
COPY --from=builder /app/apps/web-api/node_modules ./apps/web-api/node_modules

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=web-api"]
