# Use Node.js base image
FROM node:23

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

# Expose port
EXPOSE 3000

# Create volume for SQLite database
VOLUME ["/app/prisma"]

# Create volume for snapshots
VOLUME ["/app/snapshots"]

# Start the application
CMD ["npm", "start"]
