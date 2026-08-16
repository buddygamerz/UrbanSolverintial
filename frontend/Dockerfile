FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Run development server
CMD ["npm", "run", "dev"]