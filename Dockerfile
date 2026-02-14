FROM node:20-alpine

WORKDIR /app

# Instalar dependências necessárias para Prisma no Alpine
RUN apk add --no-cache openssl postgresql-client

RUN npm install -g pnpm

COPY package.json ./
# Não copiamos o pnpm-lock.yaml para evitar conflito de binários Windows/Linux no Alpine
COPY .env ./
COPY prisma ./prisma

# Configure pnpm to be more tolerant on flaky networks and retry if first install fails
RUN pnpm config set fetch-retries 5 || true
RUN pnpm config set fetch-retry-factor 2 || true
RUN pnpm config set fetch-timeout 600000 || true
RUN pnpm install

# Garante que o binário do Prisma seja baixado e gerado para Alpine Linux (musl)
RUN npx prisma generate

COPY src ./src
COPY tsconfig.json ./

# Criar script de entrypoint
RUN mkdir -p /app && \
    printf '#!/bin/sh\nset -e\necho "Aguardando banco de dados..."\nsleep 5\necho "Aplicando migrations..."\npnpm exec prisma migrate deploy || echo "Migrations já aplicadas"\necho "Iniciando aplicação..."\nexec npm run start\n' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
