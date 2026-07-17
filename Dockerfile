FROM node:20-bookworm

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --legacy-peer-deps

COPY backend .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
