FROM node:20-alpine

WORKDIR /usr/src/app

# Install openssl for Prisma runtime
RUN apk add --no-cache openssl libc6-compat

# Copy dependency declarations
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy application source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to dist
RUN npm run build

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# On container startup, sync database schema, seed initial records, and start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx ts-node prisma/seed.ts && node dist/index.js"]
