FROM node:22-alpine

WORKDIR /app

# Copy only the backend directory
COPY backend/ .

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start the app
CMD ["npm", "start"]

