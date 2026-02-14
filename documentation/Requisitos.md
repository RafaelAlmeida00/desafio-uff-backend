# Documento de Requisitos — Backend da Plataforma de Tarefas

## 1. Introdução

### 1.1 Propósito

Este documento especifica os requisitos do backend da Plataforma de Tarefas, cobrindo requisitos funcionais, não funcionais e de segurança. Seu objetivo é servir como referência única e rastreável para o desenvolvimento, testes e validação do sistema.

### 1.2 Escopo do Sistema

O backend é uma API REST responsável por:

- Gerenciar o ciclo de vida de usuários (cadastro e autenticação).
- Prover operações CRUD sobre tarefas vinculadas a usuários autenticados.
- Garantir isolamento de dados entre usuários.
- Aplicar controles de segurança em todas as camadas (entrada, processamento, saída e armazenamento).

### 1.3 Definições e Convenções

- **Requisito Funcional (RF):** Define **o que** o sistema deve fazer — comportamentos, operações e funcionalidades observáveis.
- **Requisito Não Funcional (RNF):** Define **como** o sistema deve se comportar — atributos de qualidade como desempenho, manutenibilidade e confiabilidade.
- **Requisito de Segurança (RS):** Define controles de proteção contra ameaças — autenticação, criptografia, validação de entrada e tratamento de erros seguros.
- **Prioridade:** Cada requisito é classificado como **Alta**, **Média** ou **Baixa**.

---

## 2. Requisitos Funcionais

### 2.1 Módulo de Usuários

#### RF-USR-001 — Cadastro de Usuário

| Campo            | Valor                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Descrição**    | O sistema deve permitir o cadastro de novos usuários.                 |
| **Prioridade**   | Alta                                                                  |

**Regras:**

1. O corpo da requisição deve conter: `nome`, `email` e `senha`.
2. O campo `nome` deve ser uma string não vazia com no mínimo 2 e no máximo 100 caracteres.
3. O campo `email` deve ser um endereço de e-mail válido conforme RFC 5322, normalizado para lowercase.
4. O campo `email` deve ser único no sistema; tentativas de cadastro com e-mail já existente devem retornar erro.
5. O campo `senha` deve ter no mínimo 8 caracteres.
6. A senha deve ser armazenada como hash seguro (nunca em texto plano).
7. Em caso de sucesso, o sistema deve retornar os dados do usuário criado (sem a senha) e status HTTP 201.
8. Em caso de dados inválidos, retornar status HTTP 400 com mensagens de erro descritivas por campo.
9. Em caso de e-mail duplicado, retornar status HTTP 409 (Conflict).

**Critérios de Aceitação:**

- Usuário cadastrado com sucesso aparece no banco de dados com senha em hash.
- Requisição sem campos obrigatórios retorna 400.
- Requisição com e-mail duplicado retorna 409.
- Resposta de sucesso não contém o campo `senha`.

---

#### RF-USR-002 — Login / Autenticação

| Campo            | Valor                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| **Descrição**    | O sistema deve autenticar usuários registrados e emitir um token JWT.          |
| **Prioridade**   | Alta                                                                           |

**Regras:**

1. O corpo da requisição deve conter: `email` e `senha`.
2. O sistema deve verificar se o e-mail existe e se a senha corresponde ao hash armazenado.
3. Em caso de credenciais válidas, o sistema deve retornar um token JWT assinado contendo ao menos o `id` do usuário e tempo de expiração.
4. O token JWT deve ter tempo de expiração configurável (padrão sugerido: 24 horas).
5. Em caso de credenciais inválidas (e-mail inexistente ou senha incorreta), retornar status HTTP 401 com mensagem genérica que não revele se o e-mail existe ou não.
6. A comparação de senhas deve usar função de tempo constante para prevenir ataques de timing.

**Critérios de Aceitação:**

- Login com credenciais válidas retorna token JWT decodificável com `id` do usuário.
- Login com e-mail inexistente retorna 401 com mensagem genérica.
- Login com senha incorreta retorna 401 com a mesma mensagem genérica do caso anterior.
- Token JWT contém campo `exp` com expiração futura.

---

### 2.2 Módulo de Tarefas

#### RF-TASK-001 — Criar Tarefa

| Campo            | Valor                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| **Descrição**    | O sistema deve permitir que um usuário autenticado crie uma nova tarefa. |
| **Prioridade**   | Alta                                                                     |

**Regras:**

1. A rota deve ser protegida — apenas usuários autenticados via JWT válido podem acessá-la.
2. O corpo da requisição deve conter: `titulo` e opcionalmente `descricao`.
3. O campo `titulo` deve ser uma string não vazia com no mínimo 1 e no máximo 200 caracteres.
4. O campo `descricao` deve ter no máximo 1000 caracteres (pode ser vazio ou nulo).
5. O campo `status` deve ser automaticamente definido como `"pendente"` na criação.
6. A tarefa deve ser vinculada ao usuário identificado pelo token JWT (campo `userId`).
7. Em caso de sucesso, retornar a tarefa criada com status HTTP 201.

**Critérios de Aceitação:**

- Tarefa criada aparece no banco vinculada ao usuário correto.
- Tarefa criada possui status `"pendente"`.
- Requisição sem token retorna 401.
- Requisição com `titulo` vazio retorna 400.

---

#### RF-TASK-002 — Listar Tarefas do Usuário

| Campo            | Valor                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------- |
| **Descrição**    | O sistema deve retornar todas as tarefas pertencentes ao usuário autenticado.                |
| **Prioridade**   | Alta                                                                                         |

**Regras:**

1. A rota deve ser protegida — apenas usuários autenticados via JWT válido podem acessá-la.
2. O sistema deve retornar somente as tarefas do usuário identificado pelo token JWT.
3. As tarefas devem ser retornadas ordenadas por data de criação (mais recente primeiro).
4. O sistema deve suportar filtro opcional por `status` (`"pendente"` ou `"concluida"`).
5. Em caso de nenhuma tarefa encontrada, retornar array vazio com status HTTP 200.

**Critérios de Aceitação:**

- Usuário A não consegue ver tarefas do Usuário B.
- Filtro por status retorna apenas tarefas com o status correspondente.
- Sem filtro, retorna todas as tarefas do usuário.
- Lista vazia retorna `[]` com status 200.

---

#### RF-TASK-003 — Atualizar Tarefa

| Campo            | Valor                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Descrição**    | O sistema deve permitir a atualização de uma tarefa existente do usuário autenticado.  |
| **Prioridade**   | Alta                                                                                   |

**Regras:**

1. A rota deve ser protegida — apenas usuários autenticados via JWT válido podem acessá-la.
2. O sistema deve identificar a tarefa pelo `id` passado como parâmetro de rota.
3. O sistema deve verificar se a tarefa pertence ao usuário autenticado; caso contrário, retornar 404.
4. Os campos atualizáveis são: `titulo`, `descricao` e `status`.
5. O campo `status` aceita apenas os valores `"pendente"` ou `"concluida"`.
6. Campos não enviados no corpo da requisição devem manter seus valores atuais (atualização parcial).
7. Em caso de sucesso, retornar a tarefa atualizada com status HTTP 200.
8. Se a tarefa não existir ou não pertencer ao usuário, retornar 404.

**Critérios de Aceitação:**

- Tarefa atualizada reflete os novos valores no banco de dados.
- Atualização parcial (apenas `status`) não altera `titulo` nem `descricao`.
- Usuário A não consegue atualizar tarefa do Usuário B (recebe 404).
- Status inválido (ex: `"arquivada"`) retorna 400.

---

#### RF-TASK-004 — Deletar Tarefa

| Campo            | Valor                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Descrição**    | O sistema deve permitir a exclusão de uma tarefa do usuário autenticado.           |
| **Prioridade**   | Alta                                                                               |

**Regras:**

1. A rota deve ser protegida — apenas usuários autenticados via JWT válido podem acessá-la.
2. O sistema deve identificar a tarefa pelo `id` passado como parâmetro de rota.
3. O sistema deve verificar se a tarefa pertence ao usuário autenticado; caso contrário, retornar 404.
4. A exclusão deve ser permanente (hard delete).
5. Em caso de sucesso, retornar status HTTP 204 (No Content).
6. Se a tarefa não existir ou não pertencer ao usuário, retornar 404.

**Critérios de Aceitação:**

- Tarefa deletada não aparece mais em listagens.
- Usuário A não consegue deletar tarefa do Usuário B (recebe 404).
- Tentativa de deletar tarefa inexistente retorna 404.

---

### 2.3 Rotas Protegidas

#### RF-PROT-001 — Middleware de Autenticação

| Campo            | Valor                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **Descrição**    | Todas as rotas de tarefas devem ser protegidas por middleware de verificação de token JWT.        |
| **Prioridade**   | Alta                                                                                             |

**Regras:**

1. Requisições sem header `Authorization` devem retornar 401.
2. Requisições com token malformado, expirado ou com assinatura inválida devem retornar 401.
3. O formato esperado do header é: `Authorization: Bearer <token>`.
4. Após validação bem-sucedida, o `id` do usuário extraído do token deve ser disponibilizado para os handlers subsequentes.

**Critérios de Aceitação:**

- Requisição sem header `Authorization` retorna 401.
- Requisição com token expirado retorna 401.
- Requisição com token válido permite acesso ao recurso protegido.
- Token assinado com chave diferente é rejeitado.

---

#### RF-PROT-002 — Isolamento de Dados por Usuário

| Campo            | Valor                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| **Descrição**    | Cada usuário deve acessar exclusivamente seus próprios recursos.                                  |
| **Prioridade**   | Alta                                                                                              |

**Regras:**

1. Todas as queries de tarefas devem incluir a cláusula de filtro pelo `userId` do token JWT.
2. Tentativas de acessar recursos de outro usuário (via manipulação de IDs) devem retornar 404 (não 403, para não revelar a existência do recurso).
3. O `userId` para filtragem deve ser extraído exclusivamente do token JWT, nunca de parâmetros enviados pelo cliente.

**Critérios de Aceitação:**

- Query SQL/ORM gerada para listagem sempre inclui filtro por `userId`.
- Acesso a tarefa de outro usuário retorna 404.

---

## 3. Requisitos Não Funcionais

### 3.1 Desempenho

#### RNF-PERF-001 — Tempo de Resposta da API

| Campo            | Valor                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **Descrição**    | A API deve responder a requisições dentro de limites aceitáveis.          |
| **Prioridade**   | Média                                                                     |
| **Métrica**      | Tempo de resposta medido do recebimento da requisição até envio da resposta. |

**Critérios:**

1. Endpoints de leitura (GET): tempo de resposta inferior a **200ms** no percentil 95 sob carga normal.
2. Endpoints de escrita (POST, PUT, DELETE): tempo de resposta inferior a **500ms** no percentil 95 sob carga normal.
3. Carga normal definida como até 50 requisições concorrentes.

---

#### RNF-PERF-002 — Eficiência de Consultas ao Banco de Dados

| Campo            | Valor                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| **Descrição**    | As consultas ao banco de dados devem ser otimizadas para evitar degradação.          |
| **Prioridade**   | Média                                                                                |

**Critérios:**

1. Índices devem ser criados nas colunas utilizadas em cláusulas WHERE e JOIN (ex: `email` em usuários, `userId` em tarefas).
2. Nenhum endpoint deve executar queries N+1.
3. A coluna `email` na tabela de usuários deve possuir índice único.

---

### 3.2 Manutenibilidade

#### RNF-MAINT-001 — Organização em Camadas

| Campo            | Valor                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| **Descrição**    | O código deve seguir separação clara de responsabilidades.                                  |
| **Prioridade**   | Alta                                                                                        |

**Critérios:**

1. O backend deve estar organizado em camadas distintas: rotas, controllers, services e models/repositories.
2. Lógica de negócio não deve residir em rotas ou controllers.
3. Acesso ao banco de dados deve ser encapsulado em camadas dedicadas (models ou repositories).

---

#### RNF-MAINT-002 — Padronização de Respostas da API

| Campo            | Valor                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Descrição**    | A API deve seguir um formato padronizado de respostas.                                |
| **Prioridade**   | Média                                                                                 |

**Critérios:**

1. Respostas de sucesso devem seguir estrutura consistente com os dados no corpo.
2. Respostas de erro devem seguir estrutura consistente contendo ao menos: `message` (mensagem legível) e `errors` (array de detalhes, quando aplicável).
3. Códigos de status HTTP devem ser usados corretamente conforme semântica REST:
   - 200: sucesso em operações de leitura/atualização.
   - 201: recurso criado com sucesso.
   - 204: operação bem-sucedida sem conteúdo de retorno.
   - 400: erro de validação do cliente.
   - 401: não autenticado.
   - 404: recurso não encontrado.
   - 409: conflito (ex: e-mail duplicado).
   - 500: erro interno do servidor.

---

#### RNF-MAINT-003 — Tipagem Estática

| Campo            | Valor                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| **Descrição**    | O código deve utilizar TypeScript com tipagem estrita.                  |
| **Prioridade**   | Alta                                                                    |

**Critérios:**

1. Todos os arquivos de código devem ser escritos em TypeScript (`.ts`).
2. O compilador deve estar configurado com `strict: true`.
3. O uso de `any` deve ser evitado; quando inevitável, deve ser justificado com comentário.

---

### 3.3 Confiabilidade

#### RNF-REL-001 — Tratamento Global de Erros

| Campo            | Valor                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **Descrição**    | O sistema deve capturar e tratar erros de forma centralizada, sem expor detalhes internos.      |
| **Prioridade**   | Alta                                                                                            |

**Critérios:**

1. Deve existir um middleware global de tratamento de erros.
2. Erros não tratados devem retornar status HTTP 500 com mensagem genérica.
3. Stack traces e detalhes internos nunca devem ser expostos em respostas de produção.
4. Erros devem ser registrados em log no servidor com stack trace completo.

---

#### RNF-REL-002 — Validação de Dados de Entrada

| Campo            | Valor                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Descrição**    | Toda entrada de dados deve ser validada antes do processamento.                                |
| **Prioridade**   | Alta                                                                                           |

**Critérios:**

1. A validação deve ocorrer no lado do servidor, independentemente de qualquer validação no frontend.
2. Deve existir uma camada de validação dedicada (middleware ou schema validation).
3. Dados inválidos devem ser rejeitados com mensagens de erro descritivas por campo.
4. Tipos de dados, comprimentos, formatos e valores permitidos devem ser verificados.

---

### 3.4 Compatibilidade

#### RNF-COMPAT-001 — Formato de Comunicação

| Campo            | Valor                                                         |
| ---------------- | ------------------------------------------------------------- |
| **Descrição**    | A API deve comunicar-se exclusivamente via JSON.              |
| **Prioridade**   | Alta                                                          |

**Critérios:**

1. Todas as requisições com corpo devem aceitar `Content-Type: application/json`.
2. Todas as respostas devem conter `Content-Type: application/json` (exceto 204).
3. O charset deve ser UTF-8.

---

#### RNF-COMPAT-002 — Suporte a CORS

| Campo            | Valor                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Descrição**    | A API deve permitir requisições cross-origin do frontend.                               |
| **Prioridade**   | Alta                                                                                    |

**Critérios:**

1. O backend deve configurar headers CORS permitindo a origem do frontend.
2. Os métodos HTTP permitidos devem incluir: GET, POST, PUT, DELETE, OPTIONS.
3. O header `Authorization` deve ser permitido em requisições cross-origin.
4. Em produção, as origens permitidas devem ser restritas (não usar `*` irrestritamente).

---

### 3.5 Portabilidade

#### RNF-PORT-001 — Configuração via Variáveis de Ambiente

| Campo            | Valor                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| **Descrição**    | Toda configuração sensível ou variável entre ambientes deve ser externalizada.                    |
| **Prioridade**   | Alta                                                                                              |

**Critérios:**

1. As seguintes configurações devem ser definidas via variáveis de ambiente:
   - Porta do servidor (`PORT`)
   - String de conexão com o banco de dados (`DATABASE_URL`)
   - Segredo para assinatura do JWT (`JWT_SECRET`)
   - Tempo de expiração do JWT (`JWT_EXPIRES_IN`)
2. Um arquivo `.env.example` deve documentar todas as variáveis necessárias (sem valores reais).
3. O arquivo `.env` deve estar listado no `.gitignore`.

---

## 4. Requisitos de Segurança

> Requisitos baseados no OWASP Secure Coding Practices Quick Reference Guide e OWASP ASVS v5.0, nível 1.

### 4.1 Autenticação e Gerenciamento de Credenciais

#### RS-AUTH-001 — Hash Seguro de Senhas

| Campo            | Valor                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Descrição**    | As senhas devem ser armazenadas usando algoritmo de hash adaptativo e com salt.    |
| **Prioridade**   | Alta                                                                               |

**Critérios:**

1. Utilizar `bcrypt` com cost factor mínimo de 10.
2. Cada senha deve possuir salt único gerado automaticamente pelo algoritmo.
3. Senhas em texto plano nunca devem ser registradas em logs, respostas ou qualquer armazenamento.
4. A operação de hash deve ocorrer exclusivamente no servidor.

---

#### RS-AUTH-002 — Segurança do Token JWT

| Campo            | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| **Descrição**    | Os tokens JWT devem ser gerados e validados de forma segura.                      |
| **Prioridade**   | Alta                                                                              |

**Critérios:**

1. O token deve ser assinado com algoritmo HMAC-SHA256 (`HS256`) ou superior.
2. O segredo de assinatura (`JWT_SECRET`) deve ter no mínimo 256 bits de entropia.
3. O token deve conter os claims: `sub` (ID do usuário), `iat` (emissão) e `exp` (expiração).
4. O algoritmo deve ser verificado explicitamente na validação (prevenir ataque `alg: none`).
5. Tokens expirados devem ser rejeitados sem exceção.

---

#### RS-AUTH-003 — Prevenção contra Enumeração de Usuários

| Campo            | Valor                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Descrição**    | O sistema não deve revelar se um e-mail está cadastrado através de respostas de erro.                     |
| **Prioridade**   | Alta                                                                                                      |

**Critérios:**

1. Login com e-mail inexistente e login com senha incorreta devem retornar a mesma mensagem de erro e o mesmo status HTTP (401).
2. O tempo de resposta para ambos os cenários deve ser equivalente (usar comparação de hash mesmo quando o usuário não existe).
3. O endpoint de cadastro pode indicar que o e-mail já está em uso (necessário para UX), mas deve implementar rate limiting para dificultar enumeração em massa.

---

#### RS-AUTH-004 — Proteção contra Força Bruta

| Campo            | Valor                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Descrição**    | O sistema deve limitar tentativas de login para prevenir ataques de força bruta.               |
| **Prioridade**   | Média                                                                                          |

**Critérios:**

1. Implementar rate limiting no endpoint de login (ex: máximo de 10 tentativas por IP em janela de 15 minutos).
2. Após exceder o limite, retornar status HTTP 429 (Too Many Requests) com header `Retry-After`.
3. O rate limiting deve ser aplicado por IP ou por combinação de IP + e-mail.

---

### 4.2 Validação de Entrada

#### RS-INPUT-001 — Validação no Lado do Servidor

| Campo            | Valor                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| **Descrição**    | Toda entrada recebida pela API deve ser validada no servidor antes do processamento.        |
| **Prioridade**   | Alta                                                                                        |

**Critérios:**

1. A validação deve utilizar uma biblioteca de schema validation (ex: Zod, Joi).
2. Cada endpoint deve definir um schema de validação para o corpo da requisição.
3. Dados que não passarem na validação devem ser rejeitados com erro 400 antes de atingir a lógica de negócio.
4. Os tipos, comprimentos, formatos e valores permitidos devem ser validados para cada campo.
5. Parâmetros de rota (ex: `:id`) devem ser validados quanto ao formato esperado.

---

#### RS-INPUT-002 — Proteção contra Injeção

| Campo            | Valor                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| **Descrição**    | O sistema deve prevenir ataques de injeção (SQL, NoSQL, XSS).                                          |
| **Prioridade**   | Alta                                                                                                    |

**Critérios:**

1. Todas as consultas ao banco de dados devem usar queries parametrizadas ou ORM com binding de parâmetros (nunca concatenação de strings).
2. Dados do usuário inseridos em respostas JSON devem ser tratados corretamente (encoding nativo do JSON).
3. O sistema não deve interpretar dados de entrada como comandos ou código.
4. Headers HTTP de segurança devem ser configurados: `X-Content-Type-Options: nosniff`.

---

#### RS-INPUT-003 — Sanitização de Dados de Saída

| Campo            | Valor                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **Descrição**    | Dados retornados pela API devem ser sanitizados para prevenir ataques XSS armazenado.      |
| **Prioridade**   | Média                                                                                      |

**Critérios:**

1. Campos de texto livre armazenados (titulo, descricao) devem ser sanitizados na entrada ou na saída para remover scripts maliciosos.
2. A serialização JSON deve utilizar o encoding nativo do framework (sem construção manual de strings JSON).
3. O header `Content-Type: application/json` deve estar presente em todas as respostas para evitar interpretação como HTML.

---

### 4.3 Gerenciamento de Sessão (JWT)

#### RS-SESS-001 — Transmissão Segura de Token

| Campo            | Valor                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| **Descrição**    | O token JWT deve ser transmitido de forma segura.                             |
| **Prioridade**   | Alta                                                                          |

**Critérios:**

1. O token deve ser transmitido exclusivamente via header `Authorization` (formato Bearer).
2. O token não deve ser incluído em URLs, logs ou mensagens de erro.
3. Em produção, o sistema deve operar sob HTTPS para proteger o token em trânsito.

---

### 4.4 Tratamento de Erros Seguro

#### RS-ERR-001 — Mensagens de Erro Seguras

| Campo            | Valor                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| **Descrição**    | As mensagens de erro não devem expor informações internas do sistema.                                   |
| **Prioridade**   | Alta                                                                                                    |

**Critérios:**

1. Erros internos (500) devem retornar mensagem genérica: `"Erro interno do servidor"`.
2. Stack traces, nomes de tabelas, queries SQL e caminhos de arquivos nunca devem aparecer em respostas da API.
3. Mensagens de erro de validação devem ser informativas para o cliente, mas não devem revelar detalhes da implementação.
4. Em ambiente de desenvolvimento, detalhes adicionais podem ser exibidos de forma controlada via flag de configuração.

---

#### RS-ERR-002 — Logging de Erros e Eventos de Segurança

| Campo            | Valor                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Descrição**    | Eventos relevantes de segurança devem ser registrados em log.                                  |
| **Prioridade**   | Média                                                                                          |

**Critérios:**

1. Registrar em log: falhas de autenticação, falhas de validação de token, tentativas de acesso a recursos de outros usuários.
2. Os logs devem conter: timestamp, IP de origem, endpoint acessado e tipo do evento.
3. Os logs não devem conter: senhas, tokens JWT completos, ou outros dados sensíveis.
4. Dados fornecidos pelo usuário não devem ser executáveis no contexto do visualizador de logs (prevenção de log injection).

---

### 4.5 Proteção de Dados

#### RS-DATA-001 — Dados Sensíveis em Respostas

| Campo            | Valor                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| **Descrição**    | A API não deve expor dados sensíveis em respostas.                                   |
| **Prioridade**   | Alta                                                                                 |

**Critérios:**

1. O campo `senha` (hash ou texto) nunca deve ser retornado em respostas da API.
2. Campos internos do banco (ex: metadados de ORM) devem ser filtrados das respostas.
3. O `JWT_SECRET` e credenciais de banco não devem estar presentes no código-fonte; devem vir exclusivamente de variáveis de ambiente.

---

#### RS-DATA-002 — Proteção do Segredo JWT

| Campo            | Valor                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| **Descrição**    | O segredo utilizado para assinar tokens JWT deve ser protegido adequadamente.               |
| **Prioridade**   | Alta                                                                                        |

**Critérios:**

1. O segredo deve ser definido via variável de ambiente (`JWT_SECRET`), nunca hardcoded no código.
2. O segredo deve ter no mínimo 32 caracteres alfanuméricos aleatórios.
3. O sistema não deve iniciar se `JWT_SECRET` não estiver definido (fail fast).

---

### 4.6 Segurança de Headers HTTP

#### RS-HEAD-001 — Headers de Segurança

| Campo            | Valor                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| **Descrição**    | A API deve incluir headers HTTP de segurança nas respostas.                  |
| **Prioridade**   | Média                                                                        |

**Critérios:**

1. `X-Content-Type-Options: nosniff` — prevenir MIME type sniffing.
2. `X-Frame-Options: DENY` — prevenir clickjacking.
3. `Strict-Transport-Security` — forçar HTTPS (quando em produção com TLS).
4. O header `X-Powered-By` deve ser removido para não revelar o framework utilizado.

---

## 5. Modelagem de Dados (Requisitos de Estrutura)

> Esta seção define os requisitos estruturais do banco de dados, complementando os requisitos funcionais.

### 5.1 Entidade: Usuário (`users`)

| Campo         | Tipo         | Restrições                                       |
| ------------- | ------------ | ------------------------------------------------ |
| `id`          | UUID / Int   | PK, gerado automaticamente                       |
| `nome`        | VARCHAR(100) | NOT NULL, mínimo 2 caracteres                    |
| `email`       | VARCHAR(255) | NOT NULL, UNIQUE, formato de e-mail válido       |
| `senha`       | VARCHAR(255) | NOT NULL, armazenado como hash bcrypt            |
| `created_at`  | TIMESTAMP    | NOT NULL, default: data/hora atual               |
| `updated_at`  | TIMESTAMP    | NOT NULL, atualizado automaticamente             |

**Índices:**
- Índice único em `email`.

---

### 5.2 Entidade: Tarefa (`tasks`)

| Campo         | Tipo         | Restrições                                       |
| ------------- | ------------ | ------------------------------------------------ |
| `id`          | UUID / Int   | PK, gerado automaticamente                       |
| `titulo`      | VARCHAR(200) | NOT NULL, mínimo 1 caractere                     |
| `descricao`   | TEXT         | NULLABLE, máximo 1000 caracteres                 |
| `status`      | ENUM/VARCHAR | NOT NULL, valores: `"pendente"`, `"concluida"`   |
| `user_id`     | UUID / Int   | FK → `users.id`, NOT NULL                        |
| `created_at`  | TIMESTAMP    | NOT NULL, default: data/hora atual               |
| `updated_at`  | TIMESTAMP    | NOT NULL, atualizado automaticamente             |

**Índices:**
- Índice em `user_id` (otimização de queries por usuário).
- Índice composto em `(user_id, status)` (otimização de filtro por status).

**Relacionamento:**
- `tasks.user_id` → `users.id` (N:1 — muitas tarefas pertencem a um usuário).
- Comportamento on delete: CASCADE (deletar usuário remove suas tarefas).

---

## 6. Mapeamento de Endpoints (Requisitos de Interface)

> Consolidação dos endpoints derivados dos requisitos funcionais.

| Método   | Rota               | Autenticação | Requisito de Origem    | Descrição                      |
| -------- | ------------------- | ------------ | ---------------------- | ------------------------------ |
| `POST`   | `/api/auth/signup`  | Pública      | RF-USR-001             | Cadastro de novo usuário       |
| `POST`   | `/api/auth/login`   | Pública      | RF-USR-002             | Login e emissão de JWT         |
| `POST`   | `/api/tasks`        | JWT          | RF-TASK-001            | Criar nova tarefa              |
| `GET`    | `/api/tasks`        | JWT          | RF-TASK-002            | Listar tarefas do usuário      |
| `PUT`    | `/api/tasks/:id`    | JWT          | RF-TASK-003            | Atualizar tarefa existente     |
| `DELETE` | `/api/tasks/:id`    | JWT          | RF-TASK-004            | Deletar tarefa                 |

---

## 7. Matriz de Rastreabilidade


| MATRIZ DE RASTREABILIDADE                                | Requisitos Associados                                          |
| ------------------------------------------------ | -------------------------------------------------------------- |
| Banco de Dados → Modelo de usuário               | RF-USR-001, §5.1                                               |
| Banco de Dados → Modelo de tarefa                | RF-TASK-001, §5.2                                              |
| Banco de Dados → Relacionamento                  | §5.2 (FK user_id)                                              |
| Backend → Cadastro de usuário                    | RF-USR-001                                                     |
| Backend → Login/autenticação                     | RF-USR-002, RS-AUTH-001, RS-AUTH-002                           |
| Backend → CRUD de tarefas                        | RF-TASK-001, RF-TASK-002, RF-TASK-003, RF-TASK-004            |
| Backend → Rotas protegidas                       | RF-PROT-001, RF-PROT-002                                      |
| Backend → Hash de senha                          | RS-AUTH-001                                                    |
| Backend → Validação de input                     | RNF-REL-002, RS-INPUT-001                                     |
| Backend → Proteção contra injeção SQL/XSS        | RS-INPUT-002, RS-INPUT-003                                     |
| Backend → Tratamento de erros                    | RNF-REL-001, RS-ERR-001, RS-ERR-002                           |
| Filtro de tarefas (opcional)                     | RF-TASK-002 (parâmetro de filtro)                              |
| Boas práticas de código e organização            | RNF-MAINT-001, RNF-MAINT-002, RNF-MAINT-003                  |
| Segurança básica aplicada                        | RS-AUTH-*, RS-INPUT-*, RS-ERR-*, RS-DATA-*, RS-HEAD-001       |

---