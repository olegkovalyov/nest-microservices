FROM node:20-alpine

WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose default NestJS port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "start:dev"] 