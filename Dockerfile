FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production

COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3000

CMD sh -c "\
until mariadb -h mariadb -u mariadb -p $DATABASE_PASSWORD -e 'select 1' >/dev/null 2>&1; do \
  echo '⏳ waiting for database...'; \
  sleep 5; \
done && \
npm run prisma:migrate && \
npm start"
