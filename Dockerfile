FROM node:20-bookworm

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --legacy-peer-deps

COPY backend .

RUN npx prisma generate

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
