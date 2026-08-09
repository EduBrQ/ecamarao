# Production image for the Express backend
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js start.js ./

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "start.js"]
