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

# Start the server immediately so Render detects the open port
CMD ["node", "dist/index.js"]
