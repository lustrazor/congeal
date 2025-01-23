# Use Node.js base image
FROM node:20-bookworm-slim

# Install Postfix and required packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postfix \
    mailutils \
    libsasl2-modules \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3000
EXPOSE 25

# Create startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Create volume for SQLite database
VOLUME ["/app/prisma"]

# Start the application
CMD ["npm", "start"]
