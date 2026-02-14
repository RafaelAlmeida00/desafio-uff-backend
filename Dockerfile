FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY prisma ./prisma

COPY src ./src
COPY tsconfig.json ./

RUN pnpm prisma generate

RUN echo '#!/bin/sh\n\
set -e\n\
echo "Aguardando banco de dados..."\n\
npx prisma migrate deploy || echo "Migrations já aplicadas"\n\
echo "Iniciando aplicação..."\n\
exec npm run start\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
