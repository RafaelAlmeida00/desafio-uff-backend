# Documento de Arquitetura — Backend da Plataforma de Tarefas

## 1. Visão Geral

### 1.1 Estilo Arquitetural

O backend adota uma **arquitetura em camadas** (Layered Architecture) com três camadas de negócio:

```
Request → [Middlewares] → Controller → Service → Repository → Database
Response ← [Middlewares] ← Controller ← Service ← Repository ← Database
```

Cada camada possui uma responsabilidade única e conhece apenas a camada imediatamente abaixo.

### 1.2 Stack Tecnológica

| Componente          | Tecnologia               | Justificativa                                             |
| ------------------- | ------------------------ | --------------------------------------------------------- |
| **Runtime**         | Node.js                  | Ecossistema amplo, performante para I/O                   |
| **Linguagem**       | TypeScript 5.x (strict)  | Tipagem estática, segurança em tempo de compilação        |
| **Framework HTTP**  | Express 5.x              | Maduro, minimalista, vasto ecossistema de middlewares      |
| **Banco de Dados**  | PostgreSQL               | Relacional, robusto, suporte a índices e constraints      |
| **ORM**             | Prisma                   | Type-safe, migrations automáticas, queries parametrizadas |
| **Autenticação**    | jsonwebtoken (JWT)       | Stateless, padrão da indústria para APIs REST             |
| **Hash de Senha**   | bcrypt                   | Algoritmo adaptativo com salt automático                  |
| **Validação**       | Zod                      | Schema validation type-safe, integração nativa com TS     |
| **Variáveis Amb.**  | dotenv                   | Carregamento de `.env` para configuração local            |
| **Linter**          | ESLint + typescript-eslint | Padronização de código                                  |
| **Testes**          | Jest                     | Framework de testes consolidado                           |
| **Gerenciador**     | pnpm                     | Rápido, eficiente em espaço de disco                      |
| **Documentação**    | Swagger/OpenAPI          | Interface interativa e padronizada                        |
| **Containerização** | Docker + Compose         | Ambiente isolado e reprodutível                           |
| **CI/CD**           | GitHub Actions           | Pipeline automatizado de testes e lint                    |

---

## 2. Estrutura de Diretórios

```
backend/
├── documentation/              # Documentos do projeto
│   ├── Requisitos.md
│   └── Arquitetura.md
├── prisma/
│   └── schema.prisma           # Schema do banco de dados
├── src/
│   ├── controllers/            # Camada de entrada (HTTP)
│   │   ├── auth.controller.ts
│   │   └── task.controller.ts
│   ├── services/               # Camada de lógica de negócio
│   │   ├── auth.service.ts
│   │   └── task.service.ts
│   ├── repositories/           # Camada de acesso a dados
│   │   ├── user.repository.ts
│   │   └── task.repository.ts
│   ├── middlewares/             # Middlewares Express
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── error.middleware.ts
│   ├── schemas/                # Schemas de validação (Zod)
│   │   ├── auth.schema.ts
│   │   └── task.schema.ts
│   ├── routes/                 # Definição de rotas
│   │   ├── auth.routes.ts
│   │   ├── task.routes.ts
│   │   └── index.ts
│   ├── config/                 # Configurações centralizadas
│   │   └── env.ts
│   ├── errors/                 # Classes de erro customizadas
│   │   └── app-error.ts
│   ├── helpers/                # Funções utilitárias
│   │   └── hateoas.ts          # Gerador de _links por recurso
│   ├── types/                  # Tipos e interfaces TypeScript
│   │   └── index.ts
│   ├── lib/                    # Instâncias compartilhadas
│   │   └── prisma.ts
│   └── index.ts                # Bootstrap da aplicação
├── .env.example                # Template de variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
└── eslint.config.mts
```

### 2.1 Propósito de Cada Diretório

| Diretório       | Propósito                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------- |
| `controllers/`  | Recebe requisições HTTP, delega para services, formata respostas. Não contém lógica de negócio. |
| `services/`     | Contém toda a lógica de negócio. Orquestra repositórios, aplica regras e lança erros de domínio. |
| `repositories/` | Encapsula toda interação com o banco de dados via Prisma. Retorna entidades brutas.            |
| `middlewares/`  | Funções que interceptam requisições: autenticação, validação, tratamento de erros.             |
| `schemas/`      | Schemas Zod que definem a forma esperada dos dados de entrada para cada endpoint.              |
| `routes/`       | Declaração de rotas Express com seus métodos, middlewares e controllers associados.            |
| `config/`       | Carregamento e validação de variáveis de ambiente. Ponto único de configuração.                |
| `errors/`       | Classes de erro customizadas com status HTTP e mensagens padronizadas.                         |
| `helpers/`      | Funções utilitárias puras. Inclui gerador de `_links` HATEOAS por tipo de recurso.             |
| `types/`        | Interfaces e tipos TypeScript compartilhados entre camadas.                                    |
| `lib/`          | Instâncias singleton (ex: Prisma Client) reutilizadas em toda a aplicação.                    |

---

## 3. Arquitetura em Camadas

### 3.1 Controller

**Responsabilidade:** Interface HTTP. Recebe a requisição, extrai dados, chama o service e retorna a resposta.

**Regras:**
- Não contém lógica de negócio.
- Não acessa o banco de dados diretamente.
- Extrai dados de `req.body`, `req.params`, `req.query` e do `userId` injetado pelo middleware de autenticação.
- Define o status HTTP e o corpo da resposta.

**Exemplo conceitual:**

```typescript
// controllers/task.controller.ts

class TaskController {
  constructor(private taskService: TaskService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId        // Injetado pelo auth middleware
      const data = req.body             // Já validado pelo validate middleware
      const task = await this.taskService.create(userId, data)

      res.status(201).json({
        data: task,
        _links: {                       // HATEOAS — montado no controller
          self:   { href: `/api/tasks/${task.id}`, method: 'PUT' },
          delete: { href: `/api/tasks/${task.id}`, method: 'DELETE' },
          list:   { href: '/api/tasks',            method: 'GET' },
        },
      })
    } catch (error) {
      next(error)                       // Delega ao error middleware
    }
  }
}
```

### 3.2 Service

**Responsabilidade:** Lógica de negócio. Aplica regras, valida condições de domínio, orquestra repositórios.

**Regras:**
- Não tem conhecimento de HTTP (sem `req`, `res`, status codes).
- Não acessa o banco diretamente — sempre via repository.
- Lança erros de domínio (ex: `AppError`) que serão traduzidos para HTTP pelo controller/middleware.
- Recebe dados já validados (a validação de schema ocorre no middleware).

**Exemplo conceitual:**

```typescript
// services/auth.service.ts

class AuthService {
  constructor(
    private userRepository: UserRepository
  ) {}

  async signup(data: SignupInput) {
    const existing = await this.userRepository.findByEmail(data.email)
    if (existing) {
      throw new AppError('E-mail já cadastrado', 409)
    }

    const hashedPassword = await bcrypt.hash(data.senha, 10)
    const user = await this.userRepository.create({
      ...data,
      senha: hashedPassword,
    })

    const { senha, ...userWithoutPassword } = user
    return userWithoutPassword
  }
}
```

### 3.3 Repository

**Responsabilidade:** Acesso a dados. Encapsula queries Prisma, retorna entidades.

**Regras:**
- Único ponto de contato com o banco de dados.
- Não contém lógica de negócio.
- Métodos refletem operações de persistência: `create`, `findById`, `findByEmail`, `update`, `delete`, `findAllByUserId`.
- Retorna objetos do Prisma diretamente (sem transformação de domínio).

**Exemplo conceitual:**

```typescript
// repositories/task.repository.ts

class TaskRepository {
  constructor(private prisma: PrismaClient) {}

  async findAllByUserId(userId: number, status?: string) {
    return this.prisma.task.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
```

---

## 4. Pipeline de Middlewares

A ordem dos middlewares no pipeline Express determina o fluxo de processamento de cada requisição.

### 4.1 Middlewares Globais (aplicados a todas as rotas)

```
Request
  │
  ├─ 1. express.json()             → Parse do corpo JSON
  ├─ 2. cors()                     → Headers CORS
  ├─ 3. helmet()                   → Headers de segurança
  ├─ 4. Remoção do X-Powered-By    → Ocultar framework
  │
  └─ [Roteador]
       │
       └─ ... (middlewares de rota)
```

### 4.2 Middlewares de Rota (aplicados por endpoint)

```
[Rota Pública: POST /api/auth/signup]
  │
  ├─ validate(signupSchema)         → Valida body com Zod
  └─ authController.signup          → Processa cadastro


[Rota Protegida: POST /api/tasks]
  │
  ├─ authMiddleware                 → Verifica JWT, injeta userId
  ├─ validate(createTaskSchema)     → Valida body com Zod
  └─ taskController.create          → Processa criação
```

### 4.3 Middleware de Erro (último da cadeia)

```
  Qualquer throw/next(error)
  │
  └─ errorMiddleware                → Captura erros, retorna resposta padronizada
       ├─ AppError → status e mensagem do erro
       └─ Error desconhecido → 500 + mensagem genérica
```

---

## 5. Fluxo de Dados por Operação

### 5.1 Cadastro de Usuário (RF-USR-001)

```
POST /api/auth/signup
  │
  ├─ validate(signupSchema)                  Valida nome, email, senha
  ├─ authController.signup()
  │    └─ authService.signup(data)
  │         ├─ userRepository.findByEmail()  Verifica duplicidade
  │         ├─ bcrypt.hash(senha, 10)        Gera hash da senha
  │         └─ userRepository.create()       Persiste no banco
  │
  └─ Response 201 { data: { id, nome, email, createdAt }, _links: { login } }
```

### 5.2 Login (RF-USR-002)

```
POST /api/auth/login
  │
  ├─ validate(loginSchema)                   Valida email, senha
  ├─ authController.login()
  │    └─ authService.login(data)
  │         ├─ userRepository.findByEmail()  Busca usuário
  │         ├─ bcrypt.compare(senha, hash)   Compara senha
  │         └─ jwt.sign({ sub: userId })     Gera token JWT
  │
  └─ Response 200 { data: { token }, _links: { tasks, createTask } }
```

### 5.3 Criar Tarefa (RF-TASK-001)

```
POST /api/tasks
  │
  ├─ authMiddleware                          Extrai userId do JWT
  ├─ validate(createTaskSchema)              Valida titulo, descricao
  ├─ taskController.create()
  │    └─ taskService.create(userId, data)
  │         └─ taskRepository.create()       Persiste com userId e status="pendente"
  │
  └─ Response 201 { data: { id, titulo, ... }, _links: { self, delete, list } }
```

### 5.4 Listar Tarefas (RF-TASK-002)

```
GET /api/tasks?status=pendente
  │
  ├─ authMiddleware                          Extrai userId do JWT
  ├─ taskController.list()
  │    └─ taskService.listByUser(userId, status?)
  │         └─ taskRepository.findAllByUserId(userId, status?)
  │
  └─ Response 200 { data: [ { ..., _links } ], _links: { self, create, filters } }
```

### 5.5 Atualizar Tarefa (RF-TASK-003)

```
PUT /api/tasks/:id
  │
  ├─ authMiddleware                          Extrai userId do JWT
  ├─ validate(updateTaskSchema)              Valida campos opcionais
  ├─ taskController.update()
  │    └─ taskService.update(userId, taskId, data)
  │         ├─ taskRepository.findByIdAndUser(taskId, userId)   Verifica propriedade
  │         └─ taskRepository.update(taskId, data)              Atualiza campos
  │
  └─ Response 200 { data: { id, titulo, ... }, _links: { self, delete, list } }
```

### 5.6 Deletar Tarefa (RF-TASK-004)

```
DELETE /api/tasks/:id
  │
  ├─ authMiddleware                          Extrai userId do JWT
  ├─ taskController.delete()
  │    └─ taskService.delete(userId, taskId)
  │         ├─ taskRepository.findByIdAndUser(taskId, userId)   Verifica propriedade
  │         └─ taskRepository.delete(taskId)                    Remove do banco
  │
  └─ Response 204 (No Content — sem _links)
```

---

## 6. Modelo de Dados (Prisma Schema)

```prisma
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
```

> Convenção de trigramação detalhada em `ModelagemDeDados.md`.

**Decisões:**
- `autoincrement()` em vez de UUID — simplicidade para o escopo do projeto.
- `@map` para manter camelCase no TypeScript e trigramação no banco (`USR_`, `TSK_`).
- `onDelete: Cascade` — deletar usuário remove todas as suas tarefas.
- Índice composto `(userId, status)` — otimiza o filtro de tarefas por status.

---

## 7. Tratamento de Erros

### 7.1 Classe AppError

```typescript
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errors?: string[]
  ) {
    super(message)
  }
}
```

### 7.2 Fluxo de Propagação

```
Repository  → lança PrismaClientKnownRequestError (ex: unique constraint)
Service     → captura e lança AppError(409, "E-mail já cadastrado")
Controller  → chama next(error) no catch
Middleware  → error.middleware captura, formata e responde
```

### 7.3 Formato Padronizado de Respostas de Erro

```json
{
  "message": "Dados inválidos",
  "errors": [
    "O campo 'email' deve ser um endereço de e-mail válido",
    "O campo 'senha' deve ter no mínimo 8 caracteres"
  ]
}
```

Para erros internos (500):

```json
{
  "message": "Erro interno do servidor"
}
```

---

## 8. Padrão de Resposta — HATEOAS

### 8.1 Conceito

A API adota o princípio **HATEOAS** (Hypermedia as the Engine of Application State), nível 3 do modelo de maturidade de Richardson. Cada resposta inclui um objeto `_links` que informa ao cliente quais ações estão disponíveis a partir do recurso retornado, eliminando a necessidade de o frontend construir URLs manualmente.

### 8.2 Estrutura do Link

Cada entrada em `_links` segue o formato:

```typescript
interface HateoasLink {
  href: string    // Caminho do recurso (relativo à base da API)
  method: string  // Método HTTP da ação
}

interface HateoasResponse<T> {
  data: T
  _links: Record<string, HateoasLink>
}
```

**Convenções:**
- `self` — link para o próprio recurso retornado.
- Nomes de ações em camelCase descritivo (`update`, `delete`, `createTask`, `filterPendentes`).
- URLs relativas ao host (sem domínio), para funcionar em qualquer ambiente.
- Respostas 204 (No Content) não contêm `_links`.

### 8.3 Responsabilidade na Arquitetura

A montagem dos links é responsabilidade exclusiva da **camada Controller**, pois é a única camada com conhecimento das rotas HTTP. O Service retorna dados puros; o Controller envolve os dados com `_links` antes de enviar a resposta.

```
Service  → retorna { id, titulo, status, ... }
Controller → responde { data: { ... }, _links: { self, update, delete, list } }
```

### 8.4 Respostas por Endpoint

#### POST /api/auth/signup — Cadastro

```json
{
  "data": {
    "id": 1,
    "nome": "Rafael",
    "email": "rafael@email.com",
    "createdAt": "2026-02-13T10:00:00.000Z"
  },
  "_links": {
    "login": { "href": "/api/auth/login", "method": "POST" }
  }
}
```

#### POST /api/auth/login — Login

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "_links": {
    "tasks": { "href": "/api/tasks", "method": "GET" },
    "createTask": { "href": "/api/tasks", "method": "POST" }
  }
}
```

#### POST /api/tasks — Criar Tarefa

```json
{
  "data": {
    "id": 5,
    "titulo": "Estudar HATEOAS",
    "descricao": "Ler RFC 5988",
    "status": "pendente",
    "createdAt": "2026-02-13T12:00:00.000Z"
  },
  "_links": {
    "self": { "href": "/api/tasks/5", "method": "PUT" },
    "delete": { "href": "/api/tasks/5", "method": "DELETE" },
    "list": { "href": "/api/tasks", "method": "GET" }
  }
}
```

#### GET /api/tasks — Listar Tarefas

```json
{
  "data": [
    {
      "id": 5,
      "titulo": "Estudar HATEOAS",
      "descricao": "Ler RFC 5988",
      "status": "pendente",
      "createdAt": "2026-02-13T12:00:00.000Z",
      "_links": {
        "self": { "href": "/api/tasks/5", "method": "PUT" },
        "delete": { "href": "/api/tasks/5", "method": "DELETE" }
      }
    }
  ],
  "_links": {
    "self": { "href": "/api/tasks", "method": "GET" },
    "create": { "href": "/api/tasks", "method": "POST" },
    "filterPendentes": { "href": "/api/tasks?status=pendente", "method": "GET" },
    "filterConcluidas": { "href": "/api/tasks?status=concluida", "method": "GET" }
  }
}
```

#### PUT /api/tasks/:id — Atualizar Tarefa

```json
{
  "data": {
    "id": 5,
    "titulo": "Estudar HATEOAS",
    "descricao": "Ler RFC 5988 e implementar",
    "status": "concluida",
    "updatedAt": "2026-02-13T14:00:00.000Z"
  },
  "_links": {
    "self": { "href": "/api/tasks/5", "method": "PUT" },
    "delete": { "href": "/api/tasks/5", "method": "DELETE" },
    "list": { "href": "/api/tasks", "method": "GET" }
  }
}
```

#### DELETE /api/tasks/:id — Deletar Tarefa

```
HTTP 204 No Content
(sem corpo, sem _links)
```

### 8.5 Respostas de Erro

Respostas de erro **não** incluem `_links` — o formato de erro permanece conforme definido na seção 7.3.

---

## 9. Autenticação (JWT)

### 9.1 Fluxo

```
[Login] → Credenciais válidas → jwt.sign({ sub: userId }, SECRET, { expiresIn }) → Token

[Rota protegida] → Header: Authorization: Bearer <token>
                 → jwt.verify(token, SECRET, { algorithms: ['HS256'] })
                 → Extrai sub → Injeta como req.userId
```

### 9.2 Payload do Token

```json
{
  "sub": 42,
  "iat": 1707840000,
  "exp": 1707926400
}
```

### 9.3 Decisões de Segurança

| Decisão                                  | Referência       |
| ---------------------------------------- | ---------------- |
| Algoritmo fixo `HS256` na verificação    | RS-AUTH-002      |
| Expiração configurável via env           | RNF-PORT-001     |
| Fail fast se `JWT_SECRET` ausente        | RS-DATA-002      |
| Token apenas no header `Authorization`   | RS-SESS-001      |

---

## 10. Validação (Zod)

### 10.1 Middleware de Validação

O middleware `validate` recebe um schema Zod e valida `req.body` antes do controller:

```typescript
function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message)
      throw new AppError('Dados inválidos', 400, errors)
    }
    req.body = result.data  // Dados parseados e tipados
    next()
  }
}
```

### 10.2 Schemas por Endpoint

| Endpoint              | Schema             | Campos Validados                                      |
| --------------------- | ------------------ | ----------------------------------------------------- |
| `POST /auth/signup`   | `signupSchema`     | nome (2-100 chars), email (formato), senha (min 8)    |
| `POST /auth/login`    | `loginSchema`      | email (formato), senha (não vazia)                    |
| `POST /tasks`         | `createTaskSchema` | titulo (1-200 chars), descricao? (max 1000)           |
| `PUT /tasks/:id`      | `updateTaskSchema` | titulo? (1-200), descricao? (max 1000), status? (enum) |

---

## 11. Variáveis de Ambiente

| Variável         | Obrigatória | Exemplo                                    | Descrição                             |
| ---------------- | ----------- | ------------------------------------------ | ------------------------------------- |
| `PORT`           | Não         | `3000`                                     | Porta do servidor (default: 3000)     |
| `DATABASE_URL`   | Sim         | `postgresql://user:pass@localhost:5432/db`  | String de conexão PostgreSQL          |
| `JWT_SECRET`     | Sim         | `a1b2c3...` (min 32 caracteres)            | Segredo para assinatura JWT           |
| `JWT_EXPIRES_IN` | Não         | `24h`                                      | Tempo de expiração do token (default: 24h) |
| `NODE_ENV`       | Não         | `development`                              | Ambiente de execução                  |

O módulo `config/env.ts` carrega e valida todas as variáveis na inicialização. Se uma variável obrigatória estiver ausente, a aplicação não inicia (fail fast — RS-DATA-002).

---

## 12. Definição de Rotas

### 12.1 Organização

```typescript
// routes/index.ts — Agregador de rotas
router.use('/api/auth', authRoutes)
router.use('/api/tasks', authMiddleware, taskRoutes)
```

### 12.2 Rotas de Autenticação

```typescript
// routes/auth.routes.ts
router.post('/signup', validate(signupSchema), authController.signup)
router.post('/login',  validate(loginSchema),  authController.login)
```

### 12.3 Rotas de Tarefas

```typescript
// routes/task.routes.ts
// authMiddleware já aplicado no nível do grupo em routes/index.ts
router.post('/',    idempotencyMiddleware, validate(createTaskSchema), taskController.create)
router.get('/',                                 taskController.list)
router.put('/:id',  idempotencyMiddleware, validate(updateTaskSchema), taskController.update)
router.delete('/:id', idempotencyMiddleware,                           taskController.delete)
```

---

## 13. Rastreabilidade Arquitetura → Requisitos

| Decisão Arquitetural                           | Requisitos Atendidos                        |
| ---------------------------------------------- | ------------------------------------------- |
| Camadas Controller → Service → Repository      | RNF-MAINT-001                               |
| Prisma ORM com queries parametrizadas          | RS-INPUT-002, RNF-PERF-002                  |
| Middleware de validação com Zod                 | RNF-REL-002, RS-INPUT-001                   |
| Middleware de autenticação JWT                  | RF-PROT-001, RS-AUTH-002, RS-SESS-001       |
| Filtro por userId em todas as queries           | RF-PROT-002                                 |
| Middleware global de erro                       | RNF-REL-001, RS-ERR-001                     |
| Bcrypt para hash de senhas                      | RS-AUTH-001                                  |
| Variáveis de ambiente via dotenv + validação    | RNF-PORT-001, RS-DATA-002                   |
| Helmet para headers de segurança                | RS-HEAD-001                                  |
| CORS configurável                               | RNF-COMPAT-002                              |
| Respostas JSON padronizadas                     | RNF-MAINT-002, RNF-COMPAT-001              |
| TypeScript strict mode                          | RNF-MAINT-003                               |
| Índices no banco (email, userId, userId+status) | RNF-PERF-002                                |
| Exclusão de `senha` nas respostas               | RS-DATA-001                                  |
| Respostas HATEOAS com `_links`                  | RNF-MAINT-002 (padrão de resposta)           |
