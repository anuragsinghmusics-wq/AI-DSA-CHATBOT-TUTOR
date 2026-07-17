FROM node:22-alpine
WORKDIR /app
COPY backend/ .
RUN npm install
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
