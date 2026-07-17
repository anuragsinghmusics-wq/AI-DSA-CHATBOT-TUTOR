FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies based on backend's lockfile
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

# Copy the rest of the backend source
COPY backend/ ./

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "start"]
