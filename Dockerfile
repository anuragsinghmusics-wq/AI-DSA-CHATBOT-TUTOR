FROM node:22-alpine
WORKDIR /app
COPY backend/ .
RUN npm install --legacy-peer-deps
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
