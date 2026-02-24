FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies with aggressive pruning
RUN npm install --omit=dev --no-optional && \
    npm cache clean --force

COPY . .

# Ensure /data directory exists for SQLite
RUN mkdir -p /data

# Ensure public/images directory exists for product images
RUN mkdir -p public/images

# Start the application
CMD ["npm", "start"]
