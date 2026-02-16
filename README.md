# Desafio Fullstack – Plataforma de Tarefas (Backend)

## Documentação do Projeto

Para manter a organização e clareza, a documentação técnica detalhada deste projeto foi separada em arquivos específicos dentro da pasta [`documentation/`](documentation/). O objetivo é permitir que este README foque nas instruções de execução e visão geral, enquanto os detalhes de engenharia estão documentados à parte para complementar o entendimento:

*   **Requisitos.md:** Especificação completa dos requisitos funcionais, não funcionais e regras de segurança que guiaram o desenvolvimento.
*   **Arquitetura.md:** Detalhes sobre a arquitetura em camadas, decisões de design, padrões adotados e estrutura do código.
*   **ModelagemDeDados.md:** Explicação da convenção de trigramação utilizada no banco de dados, dicionário de dados e relacionamentos.

## Descrição Geral

### Objetivo do Projeto
Este projeto consiste em uma API RESTful robusta desenvolvida como parte de um desafio técnico. O objetivo é fornecer o backend para uma plataforma de gerenciamento de tarefas (To-Do List), permitindo que usuários se cadastrem, autentiquem-se e gerenciem suas tarefas de forma segura e isolada.

A aplicação foi construída seguindo princípios de **Clean Code**, **Arquitetura em Camadas** e **HATEOAS**, garantindo escalabilidade, manutenibilidade e segurança.

### Tecnologias Utilizadas

- **Runtime:** Node.js (v20)
- **Linguagem:** TypeScript 5.x (Strict Mode)
- **Framework:** Express 5.x
- **Banco de Dados:** PostgreSQL 16
- **ORM:** Prisma (com Trigramação de colunas)
- **Autenticação:** JWT (JSON Web Token) via Cookies HTTP-only
- **Segurança:** Bcrypt (Hash de senha), Helmet, CORS, Rate Limiting, Prevenção de XSS
- **Validação:** Zod
- **Documentação:** Swagger / OpenAPI 3.0
- **Testes:** Jest + Supertest
- **Logs:** Pino (Estruturados e persistidos no banco)
- **Telemetria:** OpenTelemetry + Uptrace
- **Infraestrutura:** Docker & Docker Compose

---

## Instalação e Execução

### 1. Pré-requisitos

Antes de começar, você precisa ter o ambiente preparado.

#### Docker e Docker Compose (Recomendado)
A maneira mais fácil de rodar o projeto é usando Docker, pois ele sobe o banco de dados e a aplicação automaticamente sem necessidade de configuração manual de ambiente.

*   **Windows/Mac:** Baixe e instale o Docker Desktop (https://www.docker.com/products/docker-desktop/). O Docker Compose já vem incluído.
*   **Linux:** Siga as instruções oficiais para instalar o Docker Engine e o Docker Compose Plugin.

Para verificar se instalou corretamente, rode no terminal:
```bash
docker --version
docker-compose --version
```

#### Node.js (Apenas para rodar sem Docker)
Se preferir rodar localmente:
*   Node.js v20+
*   pnpm (Gerenciador de pacotes utilizado)

---

### 2. Passo a Passo: Rodando com Docker

Este método configura automaticamente o PostgreSQL e a API.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/RafaelAlmeida00/desafio-uff-backend.git
    cd <pasta gerada do clone>
    ```

2.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do backend copiando o exemplo.
   ```bash
   cp .env.example .env
   ```
    *Nota: O arquivo `.env.example` já contém valores padrão que funcionam com o Docker Compose.*

3.  **Suba os containers:**
    Execute o comando abaixo para construir a imagem e iniciar os serviços.
   ```bash
   docker-compose up --build
   ```
    *   O terminal mostrará os logs de construção e inicialização.
    *   Aguarde até ver a mensagem: `Servidor rodando na porta 3000`.

4.  **Acesse a aplicação:**
    *   **API:** `http://localhost:3000`
    *   **Documentação Swagger:** `http://localhost:3000/api-docs`
    *   **Health Check:** `http://localhost:3000/health`

5.  **Parar a aplicação:**
    Pressione `Ctrl+C` no terminal ou rode `docker-compose down` em outra aba.

---

### 3. Passo a Passo: Rodando Localmente (Sem Docker)

Se você já tem um PostgreSQL rodando na sua máquina:

1.  **Instale as dependências:**
   ```bash
   pnpm install
   ```

2.  **Configure o Banco de Dados:**
    Edite o arquivo `.env` e ajuste a `DATABASE_URL` para apontar para o seu PostgreSQL local.
    Exemplo: `DATABASE_URL="postgresql://user:senha@localhost:5432/meubanco"`

3.  **Execute as Migrations:**
    Isso cria as tabelas no seu banco de dados.
   ```bash
   pnpm db:migrate
   ```

4.  **Inicie o Servidor:**
   ```bash
   pnpm start
   ```

---

## Scripts Disponíveis (package.json)

O projeto possui diversos comandos utilitários configurados no `package.json`. Você pode executá-los com `pnpm <comando>` ou `npm run <comando>`.

| Comando | Descrição |
| :--- | :--- |
| `start` | Inicia o servidor em modo de desenvolvimento (watch), reiniciando a cada alteração. |
| `build` | Compila o código TypeScript para JavaScript na pasta `dist`. |
| `lint` | Executa o ESLint para encontrar problemas no código. |
| `lint:fix` | Tenta corrigir automaticamente problemas de linting. |
| `test` | Roda a suíte de testes unitários e de integração com Jest e gera relatório de cobertura. |
| `db:migrate` | Aplica as migrações pendentes no banco de dados. |
| `db:migrate:dev` | Cria uma nova migração baseada em alterações no `schema.prisma` (desenvolvimento). |
| `db:studio` | Abre uma interface visual no navegador para explorar e editar os dados do banco. |
| `db:seed` | Popula o banco de dados com dados iniciais (se configurado). |
| `db:reset` | Apaga o banco de dados e recria do zero. |

---

## Segurança Aplicada: Detalhes e Exemplos

A segurança faz parte da arquitetura. Abaixo detalhei como as principais proteções foram implementadas no código.

### 1. Hash de Senhas (Bcrypt)
Nunca armazenamos senhas em texto plano. Utilizamos o **Bcrypt**, que é um algoritmo adaptativo (lento propositalmente) e adiciona um "salt" aleatório para proteger contra Rainbow Tables.

**Como funciona:**
Quando o usuário se cadastra, a senha é transformada em um hash irreversível. No login, a senha enviada é hasheada novamente e comparada com o banco.

**Exemplo no Código (`src/services/auth.service.ts`):**
```typescript
// Cadastro: Gerando o hash
const hashedPassword = await bcrypt.hash(data.senha, 10); // Custo 10

// Login: Comparando (Tempo constante para evitar Timing Attacks)
const validPassword = await bcrypt.compare(data.senha, user.senha);
if (!validPassword) {
  throw new AppError('Credenciais inválidas', 401);
}
```

### 2. Autenticação Segura com Cookies (JWT)
Em vez de `localStorage`, a autenticação é baseada em **cookies HTTP-only**.

**Como funciona:**
1.  Após o login, o servidor envia o token JWT para o cliente dentro de um cookie com as flags `HttpOnly`, `Secure` (em produção) e `SameSite=Lax`.
2.  **`HttpOnly`:** Impede que o cookie seja acessado por JavaScript no frontend, mitigando o roubo de token por ataques XSS.
3.  **`Secure`:** Garante que o cookie só seja enviado em requisições HTTPS.
4.  **`SameSite=Lax`:** Reduz risco de CSRF sem quebrar o fluxo de navegação normal.
5.  O navegador se encarrega de enviar o cookie automaticamente em cada requisição subsequente à API.

### 3. Prevenção contra XSS (Cross-Site Scripting)
A principal defesa contra XSS é feita em duas camadas:

*   **Headers de Segurança com Helmet:** Utilizamos a biblioteca `helmet` para configurar headers HTTP que instruem o navegador a ativar proteções. Isso inclui `X-Content-Type-Options: nosniff` e `X-XSS-Protection`.
*   **Validação de Input com Zod:** Esta é a camada mais importante. Nenhum dado entra na lógica de negócio ou é salvo no banco de dados sem passar por uma validação rigorosa. Ao definir esquemas estritos, garantimos que apenas dados no formato esperado sejam processados, descartando qualquer tentativa de injetar scripts ou HTML malicioso.

### 4. Validação Estrita de Dados (Zod)
Nenhum dado entra no controller sem passar por um schema de validação. Isso previne injeção de dados maliciosos e garante a integridade dos tipos.

**Como funciona:**
Um middleware intercepta a requisição, valida o corpo contra um schema Zod e, se falhar, retorna erro 400 imediatamente. Se passar, ele "limpa" o corpo, removendo campos desconhecidos.

**Exemplo no Código (`src/utils/schemas/auth.schema.ts`):**
```typescript
// Definição do Schema
export const signupSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase()),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
})
```

### 5. Proteção contra Força Bruta (Rate Limiting)
Para evitar que atacantes tentem adivinhar senhas testando milhares de combinações, limitamos o número de requisições nas rotas de autenticação.

**Implementação:**
Utilizamos o `express-rate-limit` configurado para permitir, por exemplo, apenas 5 tentativas de login a cada 15 minutos por IP.

### 6. Idempotência
Implementamos um middleware de idempotência para garantir que, se o cliente enviar a mesma requisição de criação (POST) múltiplas vezes (por falha de rede, por exemplo), a operação não seja duplicada indevidamente, garantindo consistência nos dados.


---

## Observabilidade: Logs e Telemetria

Para garantir monitoramento eficaz e facilidade de debug em produção, implementamos uma estratégia completa de observabilidade.

### 1. Logs Estruturados (Pino + Prisma)
Utilizamos a biblioteca **Pino** para geração de logs JSON de alta performance.
*   **Transporte Customizado:** Desenvolvemos um transporte assíncrono que intercepta os logs e os salva na tabela `logs` do PostgreSQL via Prisma.
*   **Níveis de Log:** Registramos eventos de negócio (`info`), erros operacionais (`warn`) e falhas críticas (`error`).

### 2. Telemetria Distribuída (OpenTelemetry + Uptrace)
A aplicação é instrumentada com **OpenTelemetry** para capturar traces de requisições HTTP e queries de banco de dados.
*   **Uptrace:** Utilizamos o Uptrace como backend de visualização para analisar latência, taxas de erro e o caminho completo das requisições (waterfall).
*   **Correlação:** Injetamos automaticamente o `traceId` e `spanId` do OpenTelemetry nos logs do Pino. Isso permite cruzar um registro de log no banco de dados com a visualização gráfica do trace no Uptrace.

---

## Estrutura de Pastas e Arquivos

O projeto segue uma **Arquitetura em Camadas** (Controller → Service → Repository), separando claramente as responsabilidades.

```
backend/
├── prisma/                 # Schema do banco de dados e migrations
├── src/
│   ├── controllers/        # Interface HTTP: Recebe requisições, chama services, retorna HATEOAS
│   ├── services/           # Regras de Negócio: Validações lógicas, orquestração
│   ├── repositories/       # Acesso a Dados: Interação direta com o Prisma/DB
│   ├── middlewares/        # Interceptadores: Auth, Validação (Zod), Erros, Rate Limit
│   ├── routes/             # Definição dos endpoints e aplicação de middlewares
│   ├── utils/              # Utilitários compartilhados
│   │   ├── config/         # Configurações de ambiente (env) e Swagger
│   │   ├── errors/         # Classes de erro padronizadas (AppError)
│   │   ├── helpers/        # Geradores de links HATEOAS
│   │   ├── schemas/        # Schemas de validação Zod
│   │   └── lib/            # Instâncias singleton (Prisma Client)
│   └── index.ts            # Bootstrap da aplicação
├── docker-compose.yml      # Orquestração dos containers
└── Dockerfile              # Definição da imagem Docker
```

---

## Modelagem do Banco de Dados

O schema do banco de dados é gerenciado pelo Prisma e pode ser encontrado em [`prisma/schema.prisma`](./prisma/schema.prisma).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement()) @map("USR_ID")
  nome      String   @db.VarChar(100)              @map("USR_NOME")
  email     String   @unique @db.VarChar(255)      @map("USR_EMAIL")
  senha     String   @db.VarChar(255)              @map("USR_SENHA")
  createdAt DateTime @default(now())               @map("USR_CREATED_AT")
  updatedAt DateTime @updatedAt                    @map("USR_UPDATED_AT")
  tasks     Task[]

  @@map("users")
}

model Task {
  id        Int      @id @default(autoincrement()) @map("TSK_ID")
  titulo    String   @db.VarChar(200)              @map("TSK_TITULO")
  descricao String?  @db.Text                      @map("TSK_DESCRICAO")
  status    String   @default("pendente") @db.VarChar(20) @map("TSK_STATUS")
  userId    Int                                    @map("TSK_USR_ID")
  createdAt DateTime @default(now())               @map("TSK_CREATED_AT")
  updatedAt DateTime @updatedAt                    @map("TSK_UPDATED_AT")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, status])
  @@map("tasks")
}

model Log {
  id        Int      @id @default(autoincrement())
  level     String
  message   String
  metadata  Json?
  timestamp DateTime @default(now())
}
```

---

## Funções Principais e Rotas

A API segue o padrão REST e implementa HATEOAS, retornando links de navegação (`_links`) nas respostas de sucesso.

### Autenticação (`/api/auth`)

*   **POST `/signup`**
    *   **Função:** Cadastra um novo usuário.
    *   **Validação:** Nome (min 2 chars), Email (formato válido), Senha (min 8 chars).
    *   **Regra:** Verifica duplicidade de e-mail antes de criar.

*   **POST `/login`**
    *   **Função:** Autentica o usuário e define o cookie HTTP-only com JWT na resposta.
    *   **Segurança:** Proteção contra timing attacks (sempre executa comparação de hash).

### Tarefas (`/api/tasks`) - **Rotas Protegidas**

Todas as rotas abaixo exigem o cookie HTTP-only `token` enviado automaticamente pelo navegador.

*   **POST `/`**
    *   **Função:** Cria uma nova tarefa.
    *   **Validação:** Título obrigatório. Status padrão inicia como "pendente".
    *   **Idempotência:** Middleware garante que requisições duplicadas não criem recursos duplicados.

*   **GET `/`**
    *   **Função:** Lista tarefas do usuário logado.
    *   **Filtros:** Aceita query param `?status=pendente` ou `?status=concluida`.
    *   **Isolamento:** O usuário só vê suas próprias tarefas (filtro forçado pelo `userId` do token).

*   **PUT `/:id`**
    *   **Função:** Atualiza título, descrição ou status de uma tarefa.
    *   **Regra:** Verifica se a tarefa pertence ao usuário antes de atualizar. Retorna 404 se tentar alterar tarefa de outro.

*   **DELETE `/:id`**
    *   **Função:** Remove uma tarefa permanentemente.
    *   **Regra:** Verifica propriedade da tarefa antes da exclusão.

---

## Segurança Aplicada

A segurança foi um pilar central no desenvolvimento deste backend:

### 1. Autenticação e Senhas
*   **Hash Seguro:** Senhas são armazenadas utilizando **Bcrypt** com salt automático (custo 10). Nenhuma senha é salva em texto plano.
*   **JWT:** Tokens assinados com algoritmo HS256 e tempo de expiração configurável.
*   **Timing Attack Protection:** O login sempre executa uma comparação de hash, mesmo se o usuário não existir, para evitar enumeração de usuários por tempo de resposta.

### 2. Proteção de Rotas e Dados
*   **Isolamento de Dados:** Todas as queries ao banco de dados utilizam o `userId` extraído do token JWT validado. É impossível um usuário acessar ou manipular tarefas de outro ID, mesmo que tente forçar o ID na URL.
*   **Validação de Input:** Todos os dados de entrada são sanitizados e validados estritamente com **Zod** antes de chegarem ao controller. Campos desconhecidos são descartados.

### 3. Infraestrutura e HTTP
*   **Rate Limiting:** Proteção contra força bruta nas rotas de autenticação (`authLimiter`).
*   **Idempotência:** Middleware para garantir segurança em operações de escrita repetidas.
*   **Helmet:** Configuração de headers HTTP seguros (X-Content-Type-Options, X-Frame-Options, etc.).
*   **CORS:** Configurado para permitir acesso do frontend.
*   **Tratamento de Erros:** Middleware global que captura exceções e retorna mensagens padronizadas, ocultando stack traces e detalhes sensíveis do banco de dados em produção.

---

## Arquitetura e Fluxos

### Fluxo de Requisição Típico

1.  **Request** chega ao Express.
2.  **Middlewares Globais** (Helmet, CORS, JSON Parser).
3.  **Rate Limiter & Idempotency** (se aplicável).
4.  **Auth Middleware:** Verifica JWT e injeta `req.userId`.
5.  **Validate Middleware:** Zod valida o corpo da requisição.
6.  **Controller:** Recebe dados limpos, chama o Service.
7.  **Service:** Aplica regras de negócio (ex: verifica se tarefa existe e pertence ao usuário).
8.  **Repository:** Executa a query no PostgreSQL via Prisma.
9.  **Controller:** Monta a resposta com links **HATEOAS**.
10. **Response** enviada ao cliente.

### Testes

O projeto conta com um sistema de testes automatizado com conexão a um banco de testes no docker:
1.  Instalação de dependências (pnpm).
2.  Linting (ESLint).
3.  Testes Unitários e de Integração (Jest).

---

## Documentação da API

A documentação interativa completa dos endpoints, schemas e exemplos de requisição está disponível via Swagger UI.

Após rodar a aplicação, acesse:
> **http://localhost:3000/api-docs**

---

## Ideias Futuras

Esta seção descreve possíveis melhorias e novas funcionalidades que podem ser implementadas para evoluir a plataforma.

### Funcionalidades
- **Sistema de Notificação Avançado:** Criar um serviço de notificações que suporte múltiplos canais, como e-mail, push notifications ou integrações.
- **Cache com Redis:** Integrar o Redis para armazenar em cache dados frequentemente acessados, como sessões de usuário ou tarefas populares, reduzindo a carga no banco de dados e melhorando a latência.

### Segurança
- **Autenticação via OAuth 2.0:** Permitir que os usuários se autentiquem usando provedores de identidade de terceiros, como Google, GitHub ou Facebook, simplificando o processo de login.
- **Sistema de Detecção de Intrusão (IDS):** Integrar ferramentas que monitorem o tráfego de rede e os logs em busca de padrões de ataque conhecidos ou atividades suspeitas.
- **Controle de Acesso Baseado em Papéis (RBAC):** Evoluir o sistema de permissões para um modelo RBAC mais granular, permitindo a criação de diferentes papéis (ex: admin, membro, visualizador) com níveis de acesso distintos.
- **Soft Delete:** Implementar a exclusão lógica (soft delete) para tarefas e outros recursos, permitindo que os dados sejam recuperados em caso de exclusão acidental e mantendo um histórico de auditoria.
