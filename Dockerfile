# Use Node.js LTS version
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl libssl3 python3 make g++ sqlite3 --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application with typescript checks disabled
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_TYPE_CHECK=true
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Create volume for SQLite database
VOLUME ["/app/prisma"]

# Start the application
CMD ["npm", "start"]
