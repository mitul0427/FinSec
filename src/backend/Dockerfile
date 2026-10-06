FROM node:20-alpine

# Install openssl and libc6-compat for Prisma query engines on Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package manifests AND Prisma schema before npm install so postinstall succeeds
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]
