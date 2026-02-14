# Documento de Modelagem de Dados — Backend da Plataforma de Tarefas

## 1. Convenção de Trigramação

### 1.1 Definição

Trigramação é a convenção de nomenclatura em que cada entidade do banco de dados recebe um **código de 3 letras maiúsculas** (trigrama). Esse trigrama é utilizado como prefixo em todos os nomes de colunas da entidade, garantindo **identificação única global** de cada coluna no schema.

### 1.2 Regras de Nomenclatura

| Elemento            | Convenção                                  | Exemplo                         |
| ------------------- | ------------------------------------------ | ------------------------------- |
| **Tabela**          | Plural, snake_case, sem prefixo            | `users`, `tasks`                |
| **Trigrama**        | 3 letras maiúsculas derivadas do nome      | `USR`, `TSK`                    |
| **Coluna**          | `{TRI}_{nome}`, snake_case                 | `USR_ID`, `TSK_TITULO`          |
| **PK**              | `{TRI}_ID`                                 | `USR_ID`, `TSK_ID`              |
| **FK**              | `{TRI}_{TRI_REF}_ID`                       | `TSK_USR_ID`                    |
| **Índice**          | `IDX_{tabela}_{colunas}`                   | `IDX_USERS_USR_EMAIL`           |
| **Unique**          | `UNQ_{tabela}_{coluna}`                    | `UNQ_USERS_USR_EMAIL`           |
| **FK Constraint**   | `FK_{tabela}_{tabela_ref}`                 | `FK_TASKS_USERS`                |
| **PK Constraint**   | `PK_{tabela}`                              | `PK_USERS`                      |
| **Timestamps**      | `{TRI}_CREATED_AT`, `{TRI}_UPDATED_AT`     | `USR_CREATED_AT`                |

### 1.3 Benefícios

- **Colunas globalmente únicas** — em JOINs, `USR_ID` e `TSK_ID` nunca colidem; elimina ambiguidade sem necessidade de alias.
- **Legibilidade em queries** — ao ler `TSK_USR_ID`, sabe-se imediatamente que é a FK de tasks referenciando users.
- **Rastreabilidade** — o trigrama identifica a tabela de origem de qualquer coluna em views, relatórios e logs.
- **Padronização** — regra determinística para nomear qualquer nova coluna ou tabela futura.

---

## 2. Registro de Trigramas

| Trigrama | Entidade      | Tabela   | Descrição                              |
| -------- | ------------- | -------- | -------------------------------------- |
| `USR`    | Usuário       | `users`  | Usuários registrados no sistema        |
| `TSK`    | Tarefa        | `tasks`  | Tarefas criadas pelos usuários         |

---

## 3. Diagrama Entidade-Relacionamento (DER)

```
┌─────────────────────────────────┐          ┌──────────────────────────────────────┐
│             users               │          │               tasks                  │
├─────────────────────────────────┤          ├──────────────────────────────────────┤
│ USR_ID         INT  PK  AI     │ 1──────N │ TSK_ID          INT  PK  AI         │
│ USR_NOME       VARCHAR(100) NN │          │ TSK_TITULO      VARCHAR(200) NN     │
│ USR_EMAIL      VARCHAR(255) UQ │          │ TSK_DESCRICAO   TEXT         NULL    │
│ USR_SENHA      VARCHAR(255) NN │          │ TSK_STATUS      VARCHAR(20)  NN     │
│ USR_CREATED_AT TIMESTAMP    NN │          │ TSK_USR_ID      INT  FK NN ──────┐  │
│ USR_UPDATED_AT TIMESTAMP    NN │          │ TSK_CREATED_AT  TIMESTAMP   NN   │  │
└─────────────────────────────────┘          │ TSK_UPDATED_AT  TIMESTAMP   NN   │  │
                                             └─────────────────────────────────┘  │
                                                        │                         │
                                                        └─── FK_TASKS_USERS ──────┘
                                                             ON DELETE CASCADE

Legenda: PK = Primary Key | FK = Foreign Key | AI = Auto Increment
         NN = NOT NULL     | UQ = UNIQUE      | NULL = Nullable
         1──N = Um para Muitos
```

**Cardinalidade:**
- Um **Usuário** possui **zero ou muitas** Tarefas (1:N).
- Uma **Tarefa** pertence a **exatamente um** Usuário (N:1).

---

## 4. Especificação das Entidades

### 4.1 Entidade: Usuário — `users` (USR)

| Coluna           | Tipo           | Nulável | Default          | Restrições                                     | Requisito          |
| ---------------- | -------------- | ------- | ---------------- | ---------------------------------------------- | ------------------- |
| `USR_ID`         | `INTEGER`      | Não     | Auto Increment   | PK                                             | RF-USR-001          |
| `USR_NOME`       | `VARCHAR(100)` | Não     | —                | Mínimo 2 caracteres                            | RF-USR-001 regra 2  |
| `USR_EMAIL`      | `VARCHAR(255)` | Não     | —                | UNIQUE, formato RFC 5322, normalizado lowercase | RF-USR-001 regra 3  |
| `USR_SENHA`      | `VARCHAR(255)` | Não     | —                | Hash bcrypt (nunca texto plano)                | RS-AUTH-001         |
| `USR_CREATED_AT` | `TIMESTAMP`    | Não     | `CURRENT_TIMESTAMP` | Imutável após inserção                       | —                   |
| `USR_UPDATED_AT` | `TIMESTAMP`    | Não     | `CURRENT_TIMESTAMP` | Atualizado a cada UPDATE                     | —                   |

**Constraints:**

| Nome                     | Tipo    | Coluna(s)     | Detalhes                    |
| ------------------------ | ------- | ------------- | --------------------------- |
| `PK_USERS`               | PK      | `USR_ID`      | Identificador único         |
| `UNQ_USERS_USR_EMAIL`    | UNIQUE  | `USR_EMAIL`   | E-mail não pode repetir     |

**Índices:**

| Nome                     | Coluna(s)     | Tipo    | Justificativa                         |
| ------------------------ | ------------- | ------- | ------------------------------------- |
| `UNQ_USERS_USR_EMAIL`    | `USR_EMAIL`   | UNIQUE  | Busca por e-mail no login (RF-USR-002), verificação de duplicidade no cadastro (RF-USR-001) |

**Regras de domínio:**
- `USR_NOME`: string com 2 ≤ length ≤ 100.
- `USR_EMAIL`: validado contra formato RFC 5322, armazenado em lowercase.
- `USR_SENHA`: hash bcrypt com cost factor ≥ 10, salt automático. O valor original nunca é persistido.
- `USR_CREATED_AT`: definido uma vez na inserção, nunca alterado.
- `USR_UPDATED_AT`: atualizado automaticamente pelo ORM a cada operação UPDATE.

---

### 4.2 Entidade: Tarefa — `tasks` (TSK)

| Coluna           | Tipo           | Nulável | Default          | Restrições                                       | Requisito            |
| ---------------- | -------------- | ------- | ---------------- | ------------------------------------------------ | -------------------- |
| `TSK_ID`         | `INTEGER`      | Não     | Auto Increment   | PK                                               | RF-TASK-001          |
| `TSK_TITULO`     | `VARCHAR(200)` | Não     | —                | Mínimo 1 caractere                               | RF-TASK-001 regra 3  |
| `TSK_DESCRICAO`  | `TEXT`         | Sim     | `NULL`           | Máximo 1000 caracteres (validado na aplicação)   | RF-TASK-001 regra 4  |
| `TSK_STATUS`     | `VARCHAR(20)`  | Não     | `'pendente'`     | Valores aceitos: `'pendente'`, `'concluida'`     | RF-TASK-001 regra 5  |
| `TSK_USR_ID`     | `INTEGER`      | Não     | —                | FK → `users.USR_ID`, ON DELETE CASCADE           | RF-PROT-002          |
| `TSK_CREATED_AT` | `TIMESTAMP`    | Não     | `CURRENT_TIMESTAMP` | Imutável após inserção                        | —                    |
| `TSK_UPDATED_AT` | `TIMESTAMP`    | Não     | `CURRENT_TIMESTAMP` | Atualizado a cada UPDATE                      | —                    |

**Constraints:**

| Nome                     | Tipo    | Coluna(s)     | Detalhes                                  |
| ------------------------ | ------- | ------------- | ----------------------------------------- |
| `PK_TASKS`               | PK      | `TSK_ID`      | Identificador único                       |
| `FK_TASKS_USERS`         | FK      | `TSK_USR_ID`  | Referencia `users.USR_ID`, CASCADE DELETE |

**Índices:**

| Nome                             | Coluna(s)                  | Tipo    | Justificativa                                                    |
| -------------------------------- | -------------------------- | ------- | ---------------------------------------------------------------- |
| `IDX_TASKS_TSK_USR_ID`          | `TSK_USR_ID`               | B-Tree  | Listagem de tarefas por usuário (RF-TASK-002), JOINs             |
| `IDX_TASKS_TSK_USR_ID_STATUS`   | `TSK_USR_ID`, `TSK_STATUS` | B-Tree  | Filtro de tarefas por status dentro do escopo do usuário (RF-TASK-002 regra 4) |

**Regras de domínio:**
- `TSK_TITULO`: string com 1 ≤ length ≤ 200.
- `TSK_DESCRICAO`: string com length ≤ 1000, ou NULL. A restrição de comprimento é aplicada na camada de validação (Zod), não no banco.
- `TSK_STATUS`: aceita exclusivamente `'pendente'` ou `'concluida'`. Validado na camada de aplicação. Default na inserção: `'pendente'`.
- `TSK_USR_ID`: sempre extraído do token JWT (RF-PROT-002 regra 3), nunca fornecido pelo cliente.
- `TSK_CREATED_AT`: definido uma vez na inserção, nunca alterado.
- `TSK_UPDATED_AT`: atualizado automaticamente pelo ORM a cada operação UPDATE.

**Comportamento ON DELETE CASCADE:**
Quando um registro de `users` é removido, todas as `tasks` vinculadas via `TSK_USR_ID` são automaticamente excluídas pelo banco de dados.

---

## 5. Dicionário de Dados

### 5.1 Tabela `users`

| # | Coluna           | Significado                                        |
| - | ---------------- | -------------------------------------------------- |
| 1 | `USR_ID`         | Identificador único do usuário                     |
| 2 | `USR_NOME`       | Nome de exibição do usuário                        |
| 3 | `USR_EMAIL`      | Endereço de e-mail (credencial de login)           |
| 4 | `USR_SENHA`      | Hash bcrypt da senha do usuário                    |
| 5 | `USR_CREATED_AT` | Data/hora de criação do registro                   |
| 6 | `USR_UPDATED_AT` | Data/hora da última atualização do registro        |

### 5.2 Tabela `tasks`

| # | Coluna           | Significado                                        |
| - | ---------------- | -------------------------------------------------- |
| 1 | `TSK_ID`         | Identificador único da tarefa                      |
| 2 | `TSK_TITULO`     | Título resumido da tarefa                          |
| 3 | `TSK_DESCRICAO`  | Descrição detalhada da tarefa (opcional)            |
| 4 | `TSK_STATUS`     | Estado atual: `'pendente'` ou `'concluida'`        |
| 5 | `TSK_USR_ID`     | Referência ao usuário proprietário da tarefa       |
| 6 | `TSK_CREATED_AT` | Data/hora de criação do registro                   |
| 7 | `TSK_UPDATED_AT` | Data/hora da última atualização do registro        |

---

## 6. DDL — Scripts de Criação

```sql
-- ============================================================
-- Plataforma de Tarefas — DDL com Trigramação
-- SGBD: PostgreSQL
-- ============================================================

-- 6.1 Tabela de Usuários
CREATE TABLE users (
    USR_ID         SERIAL        NOT NULL,
    USR_NOME       VARCHAR(100)  NOT NULL,
    USR_EMAIL      VARCHAR(255)  NOT NULL,
    USR_SENHA      VARCHAR(255)  NOT NULL,
    USR_CREATED_AT TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    USR_UPDATED_AT TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_USERS            PRIMARY KEY (USR_ID),
    CONSTRAINT UNQ_USERS_USR_EMAIL UNIQUE (USR_EMAIL)
);

-- 6.2 Tabela de Tarefas
CREATE TABLE tasks (
    TSK_ID         SERIAL        NOT NULL,
    TSK_TITULO     VARCHAR(200)  NOT NULL,
    TSK_DESCRICAO  TEXT,
    TSK_STATUS     VARCHAR(20)   NOT NULL DEFAULT 'pendente',
    TSK_USR_ID     INTEGER       NOT NULL,
    TSK_CREATED_AT TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TSK_UPDATED_AT TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_TASKS        PRIMARY KEY (TSK_ID),
    CONSTRAINT FK_TASKS_USERS  FOREIGN KEY (TSK_USR_ID)
        REFERENCES users (USR_ID)
        ON DELETE CASCADE
);

-- 6.3 Índices
CREATE INDEX IDX_TASKS_TSK_USR_ID        ON tasks (TSK_USR_ID);
CREATE INDEX IDX_TASKS_TSK_USR_ID_STATUS ON tasks (TSK_USR_ID, TSK_STATUS);

-- 6.4 Trigger para atualização automática de UPDATED_AT
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.USR_UPDATED_AT := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

-- Trigger equivalente para tasks (coluna diferente)
CREATE OR REPLACE FUNCTION fn_update_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.TSK_UPDATED_AT := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_task_timestamp();
```

---

## 7. Mapeamento Prisma ↔ Trigramação

O Prisma utiliza camelCase no TypeScript e `@map()` / `@@map()` para mapear nomes ao banco com trigramação.

### 7.1 Model User

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
```

### 7.2 Model Task

```prisma
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

### 7.3 Tabela de Correspondência

| Prisma (TypeScript) | Banco (Trigramação) | Tabela  |
| ------------------- | ------------------- | ------- |
| `User.id`           | `USR_ID`            | `users` |
| `User.nome`         | `USR_NOME`          | `users` |
| `User.email`        | `USR_EMAIL`         | `users` |
| `User.senha`        | `USR_SENHA`         | `users` |
| `User.createdAt`    | `USR_CREATED_AT`    | `users` |
| `User.updatedAt`    | `USR_UPDATED_AT`    | `users` |
| `Task.id`           | `TSK_ID`            | `tasks` |
| `Task.titulo`       | `TSK_TITULO`        | `tasks` |
| `Task.descricao`    | `TSK_DESCRICAO`     | `tasks` |
| `Task.status`       | `TSK_STATUS`        | `tasks` |
| `Task.userId`       | `TSK_USR_ID`        | `tasks` |
| `Task.createdAt`    | `TSK_CREATED_AT`    | `tasks` |
| `Task.updatedAt`    | `TSK_UPDATED_AT`    | `tasks` |

---

## 8. Exemplos de Queries com Trigramação

### 8.1 Cadastro de Usuário

```sql
INSERT INTO users (USR_NOME, USR_EMAIL, USR_SENHA)
VALUES ('Rafael', 'rafael@email.com', '$2b$10$...');
```

### 8.2 Login — Busca por E-mail

```sql
SELECT USR_ID, USR_NOME, USR_EMAIL, USR_SENHA
FROM users
WHERE USR_EMAIL = 'rafael@email.com';
```

### 8.3 Criar Tarefa

```sql
INSERT INTO tasks (TSK_TITULO, TSK_DESCRICAO, TSK_STATUS, TSK_USR_ID)
VALUES ('Estudar HATEOAS', 'Ler RFC 5988', 'pendente', 1);
```

### 8.4 Listar Tarefas do Usuário com Filtro

```sql
SELECT TSK_ID, TSK_TITULO, TSK_DESCRICAO, TSK_STATUS, TSK_CREATED_AT
FROM tasks
WHERE TSK_USR_ID = 1
  AND TSK_STATUS = 'pendente'
ORDER BY TSK_CREATED_AT DESC;
```

### 8.5 Atualizar Tarefa (com Verificação de Propriedade)

```sql
UPDATE tasks
SET TSK_TITULO     = 'Título atualizado',
    TSK_STATUS     = 'concluida',
    TSK_UPDATED_AT = CURRENT_TIMESTAMP
WHERE TSK_ID     = 5
  AND TSK_USR_ID = 1;
```

### 8.6 Deletar Tarefa (com Verificação de Propriedade)

```sql
DELETE FROM tasks
WHERE TSK_ID     = 5
  AND TSK_USR_ID = 1;
```

### 8.7 JOIN — Tarefas com Dados do Usuário

```sql
SELECT u.USR_NOME,
       t.TSK_TITULO,
       t.TSK_STATUS
FROM tasks t
INNER JOIN users u ON u.USR_ID = t.TSK_USR_ID
WHERE u.USR_ID = 1;
```

> Note como `USR_ID` e `TSK_ID` não colidem no JOIN — benefício direto da trigramação.

---

## 9. Rastreabilidade Modelagem → Requisitos

| Elemento de Dados              | Requisitos Atendidos                                |
| ------------------------------ | --------------------------------------------------- |
| `USR_ID` (PK)                  | RF-USR-001, RF-USR-002 (identificação)              |
| `USR_NOME`                     | RF-USR-001 regra 2                                  |
| `USR_EMAIL` (UNIQUE)           | RF-USR-001 regras 3-4, RNF-PERF-002                |
| `USR_SENHA` (hash)             | RF-USR-001 regra 6, RS-AUTH-001                     |
| `TSK_ID` (PK)                  | RF-TASK-001, RF-TASK-003, RF-TASK-004               |
| `TSK_TITULO`                   | RF-TASK-001 regra 3, RF-TASK-003 regra 4            |
| `TSK_DESCRICAO`                | RF-TASK-001 regra 4, RF-TASK-003 regra 4            |
| `TSK_STATUS`                   | RF-TASK-001 regra 5, RF-TASK-003 regra 5            |
| `TSK_USR_ID` (FK)              | RF-PROT-002, RF-TASK-002 regra 2                    |
| `IDX_TASKS_TSK_USR_ID`         | RNF-PERF-002 critério 1                             |
| `IDX_TASKS_TSK_USR_ID_STATUS`  | RNF-PERF-002 critério 1, RF-TASK-002 regra 4        |
| `UNQ_USERS_USR_EMAIL`          | RF-USR-001 regra 4, RNF-PERF-002 critério 3         |
| `FK_TASKS_USERS` (CASCADE)     | Requisitos.md §5.2 — integridade referencial        |
