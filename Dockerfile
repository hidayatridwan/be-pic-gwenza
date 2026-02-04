FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
