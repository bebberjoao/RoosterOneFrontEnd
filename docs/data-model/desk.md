# Modelo de dados — Rooster Desk

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O módulo persiste **categorias de chamado** (com subcategorias), o **diretório
de atendentes** e os **chamados (tickets)** abertos pelos usuários, incluindo
o histórico de eventos (mensagens, mudanças de status/prioridade, atribuição).

Dependências externas: `usuarios` e `setores` (Rooster Hub) para
solicitante/atendente/setor. Enquanto o Hub não estiver integrado, os campos
correspondentes permanecem textuais (`requesterName`, `assigneeName`, `sector`).

## 2. Diagrama de relacionamentos

```text
┌────────────────────┐        ┌────────────────────────┐
│  desk_categories    │ 1:N ──▶│ desk_subcategories      │
└──────────┬──────────┘        └──────────┬──────────────┘
           │ 1:N                          │
           │                              │
┌──────────▼──────────┐        ┌──────────▼──────────────┐
│      tickets         │◀───── │  (subcategory_id opc.)   │
│ (category_id ↴)      │        └──────────────────────────┘
└──────────┬───────────┘
           │ 1:N
┌──────────▼───────────┐
│   ticket_events       │
└───────────────────────┘

┌────────────────────┐
│   desk_agents        │──▶ usuarios (Hub) [futuro]
└────────────────────┘
```

## 3. Tabelas

### 3.1 `desk_categories` — tipo TS `DeskCategory` (`src/mock/database/deskCategories.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome da categoria |
| `sector` | text | não | — | Setor responsável (migrar p/ `sector_id → setores`) |
| `owner` | text | não | — | Responsável pela categoria (migrar p/ `usuarios`) |
| `sla_hours` | smallint | não | — | SLA padrão em horas |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (name)`.

### 3.2 `desk_subcategories` — campo TS `DeskCategory.subcategories`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `category_id` | uuid | não | — | FK → `desk_categories(id)` `on delete cascade` |
| `name` | text | não | — | Nome da subcategoria |
| `sla_hours` | smallint | não | — | SLA específico (herda da categoria por padrão) |

Constraints: `unique (category_id, name)`.

### 3.3 `desk_subcategory_assignees` — campo TS `DeskSubcategory.assignees`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `subcategory_id` | uuid | não | — | FK → `desk_subcategories(id)` `on delete cascade` |
| `agent_id` | uuid | não | — | FK → `desk_agents(id)` `on delete cascade` |

PK composta `(subcategory_id, agent_id)`.

### 3.4 `desk_agents` — tipo TS `DeskAgent`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome do atendente |
| `email` | text | não | — | E-mail (UNIQUE) |
| `sector` | text | não | — | Setor do atendente |
| `role` | text | não | — | Cargo (`Atendente`, `Analista`, `Especialista`, `Supervisor`) |
| `active` | boolean | não | `true` | Atendente ativo |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (email)`.

### 3.5 `tickets` — tipo TS `Ticket` (`src/mock/database/tickets.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `number` | text | não | — | Protocolo legível (UNIQUE), ex.: `#4820` |
| `title` | text | não | — | Título do chamado |
| `category_id` | uuid | não | — | FK → `desk_categories(id)` `on delete restrict` |
| `subcategory_id` | uuid | sim | — | FK → `desk_subcategories(id)` |
| `requester_id` | uuid | sim | — | FK → `usuarios(id)` (Hub) |
| `requester_name` | text | não | — | Nome do solicitante (fallback pré-Hub) |
| `requester_role` | text | sim | — | Papel do solicitante |
| `requester_sector` | text | sim | — | Setor do solicitante |
| `assignee_id` | uuid | sim | — | FK → `desk_agents(id)` |
| `priority` | `ticket_priority` | não | `'media'` | Prioridade |
| `status` | `ticket_status` | não | `'aberto'` | Situação |
| `sla_percent` | smallint | não | `100` | % de SLA restante |
| `sla_deadline` | timestamptz | não | — | Prazo do SLA |
| `opened_at` | timestamptz | não | `now()` | Abertura |
| `description` | text | não | — | Descrição do incidente |
| `tags` | text[] | não | `'{}'` | Marcadores (`recorrente`, `vip`, ...) |
| `favorite` | boolean | não | `false` | Marcado como favorito pelo usuário atual |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (number)`; `check (sla_percent between 0 and 100)`.
Índices: `idx_tickets_status(status)`, `idx_tickets_category(category_id)`,
`idx_tickets_assignee(assignee_id)`.

### 3.6 `ticket_events` — campo TS `Ticket.events`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `ticket_id` | uuid | não | — | FK → `tickets(id)` `on delete cascade` |
| `kind` | `ticket_event_kind` | não | — | Tipo do evento |
| `author` | text | não | — | Autor (nome; migrar p/ `usuarios`) |
| `role` | text | sim | — | Papel do autor no evento `message` |
| `body` | text | sim | — | Corpo da mensagem (evento `message`) |
| `internal` | boolean | não | `false` | Nota interna (não visível ao solicitante) |
| `attachments` | text[] | não | `'{}'` | URLs de anexos |
| `from_value` | text | sim | — | Valor anterior (status/prioridade) |
| `to_value` | text | sim | — | Novo valor (status/prioridade/atribuição/categoria) |
| `at` | timestamptz | não | `now()` | Momento do evento |

Índice: `idx_ticket_events_ticket(ticket_id, at)`.

## 4. Enums

```sql
create type ticket_status as enum (
  'aberto','atendimento','pendente','resolvido','encerrado');

create type ticket_priority as enum ('baixa','media','alta','critica');

create type ticket_event_kind as enum (
  'message','status','priority','assign','category');
```

Os valores devem permanecer idênticos aos literais TS em
`src/mock/database/tickets.ts`.

## 5. Regras de negócio

1. `subcategory_id`, quando informado, deve pertencer a `category_id` do
   mesmo ticket.
2. `sla_deadline` é calculado a partir de `opened_at` + `sla_hours` da
   (sub)categoria; recalculado a cada mudança de categoria.
3. Transições válidas de status seguem o fluxo:
   `aberto → atendimento`; `atendimento → pendente | resolvido`;
   `pendente → atendimento`; `resolvido → encerrado | atendimento` (reabertura).
   `encerrado` é terminal.
4. Toda mudança de `status`, `priority`, `assignee` ou `category` gera uma
   linha em `ticket_events` com o valor anterior e o novo.
5. Eventos com `internal = true` não podem ser retornados para o papel
   `solicitante`.
6. `desk_agents.email` é único; agente inativo (`active = false`) não recebe
   novas atribuições.
7. Excluir uma categoria com chamados vinculados é bloqueado
   (`on delete restrict`); usar desativação lógica.

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts`.

| Recurso | Base | Operações |
|---|---|---|
| Categorias | `/chamados-categorias` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Setores de chamado | `/chamados-setores` | `GET`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Atendentes | `/chamados-atendentes` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Chamados | `/chamados` | idem + filtros `?categoriaId=&status=&prioridade=&atendenteId=` |
| Eventos do chamado | `/chamados/:id/eventos` | `GET`, `POST` (nova mensagem/mudança) |
| Decisão | `/chamados/:id/status` | `PATCH` — muda status/prioridade/atribuição |

## 7. Mapa frontend → banco

| Frontend | Tabela mock | Tabela física |
|---|---|---|
| `TicketCategory` / `DeskCategory` | `src/mock/database/tickets.ts`, `src/mock/database/deskCategories.ts` | `desk_categories` (+ `desk_subcategories`) |
| `DeskAgent` | `src/mock/database/deskCategories.ts` | `desk_agents` |
| `Ticket` | `src/mock/database/tickets.ts` | `tickets` |
| `TicketEvent` | `src/mock/database/tickets.ts` (campo `events`) | `ticket_events` |
| `deskService.*` | `src/services/mock-api/*` | consumidor dos endpoints acima |
