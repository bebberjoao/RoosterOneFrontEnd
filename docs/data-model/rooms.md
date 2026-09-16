# Modelo de dados — Rooster Rooms

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O módulo persiste a **estrutura física** da instituição (campus → bloco →
ambiente), os **períodos de horário reserváveis** de cada ambiente e as
**reservas** feitas sobre esses períodos.

Dependências externas: `usuarios` e `setores` (Rooster Hub) para responsável e
setor solicitante da reserva. Enquanto o Hub não estiver integrado, os campos
correspondentes podem permanecer textuais (`responsible`, `sector`).

## 2. Diagrama de relacionamentos

```text
                 ┌───────────────┐
                 │   campuses    │
                 └───────┬───────┘
                         │ 1:N (on delete cascade)
                 ┌───────▼───────┐
                 │    blocks     │
                 └───────┬───────┘
                         │ 1:N (on delete cascade)
                 ┌───────▼───────┐         ┌────────────────────┐
                 │     rooms     │ 1:N ───▶│    room_slots      │
                 │ (campus_id ↴) │         └────────────────────┘
                 └───────┬───────┘   1:N
                         │           ────▶ ┌────────────────────┐
                         │                 │  room_resources    │
                         │                 └────────────────────┘
                         │ 1:N (on delete restrict)
                 ┌───────▼───────────┐
                 │   reservations    │───▶ usuarios (Hub) [responsible_id]
                 └───────┬───────────┘───▶ setores  (Hub) [sector_id]
                         │ 1:N
                 ┌───────▼───────────────┐
                 │ reservation_equipment │
                 └───────────────────────┘

rooms.campus_id é redundante (derivável de blocks) e existe por desempenho:
manter consistente via constraint composta (ver §3.3).
```

## 3. Tabelas

### 3.1 `campuses` — tipo TS `Campus` (`src/mock/database/campuses.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome do campus |
| `code` | text | não | — | Sigla/código (UNIQUE) |
| `address` | text | sim | — | Logradouro |
| `city` | text | sim | — | Cidade |
| `state` | char(2) | sim | — | UF |
| `zip` | text | sim | — | CEP |
| `manager` | text | sim | — | Responsável (migrar p/ `manager_id → usuarios`) |
| `active` | boolean | não | `true` | Campus ativo |
| `notes` | text | sim | — | Observações |
| `color` | text | não | — | Cor de identificação (token/OKLCH) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`; `check (char_length(code) between 1 and 12)`.

### 3.2 `blocks` — tipo TS `Block`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `campus_id` | uuid | não | — | FK → `campuses(id)` `on delete cascade` |
| `name` | text | não | — | Nome do bloco |
| `code` | text | não | — | Código do bloco |
| `floors` | smallint | não | `1` | Número de andares |
| `manager` | text | sim | — | Responsável |
| `active` | boolean | não | `true` | Bloco ativo |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (campus_id, code)`; `check (floors >= 0)`;
`unique (id, campus_id)` (suporte à FK composta de `rooms`).
Índice: `idx_blocks_campus on blocks(campus_id)`.

### 3.3 `rooms` — tipo TS `Space`/`Room`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `campus_id` | uuid | não | — | FK → `campuses(id)` |
| `block_id` | uuid | não | — | FK → `blocks(id)` `on delete cascade` |
| `name` | text | não | — | Nome do ambiente |
| `code` | text | não | — | Código (UNIQUE) |
| `floor` | smallint | não | `0` | Andar |
| `number` | text | sim | — | Número/porta |
| `type` | `space_type` | não | `'sala'` | Tipo do ambiente |
| `capacity` | integer | não | `0` | Lotação máxima |
| `area` | numeric(8,2) | sim | — | Área em m² |
| `description` | text | sim | — | Descrição |
| `cover` | text | sim | — | URL da imagem de capa |
| `gallery` | text[] | não | `'{}'` | URLs adicionais |
| `status` | `space_status` | não | `'disponivel'` | Situação operacional |
| `opening_hours` | text | não | `'07:00-22:00'` | Faixa de funcionamento |
| `weekdays` | text[] | não | `'{}'` | Dias de funcionamento (`seg`..`dom`) |
| `slot_minutes` | smallint | não | `60` | Duração padrão dos períodos gerados |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`; `check (capacity >= 0)`;
FK composta `foreign key (block_id, campus_id) references blocks(id, campus_id)`
— garante que o campus do ambiente é sempre o campus do bloco.
Índices: `idx_rooms_block(block_id)`, `idx_rooms_campus(campus_id)`,
`idx_rooms_status(status)`.

### 3.4 `room_slots` — períodos reserváveis (campo TS `Space.slots`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `room_id` | uuid | não | — | FK → `rooms(id)` `on delete cascade` |
| `start_time` | time | não | — | Início (ex.: `07:00`) |
| `end_time` | time | não | — | Término (ex.: `08:00`) |
| `weekday` | smallint | sim | — | 0–6; `null` = vale para todos os dias |
| `active` | boolean | não | `true` | Período habilitado |

Constraints: `check (end_time > start_time)`;
`unique (room_id, weekday, start_time, end_time)`.
Quando o ambiente não tem linhas aqui, o backend gera os períodos a partir de
`opening_hours` + `slot_minutes` (mesma regra de `buildSlots` no frontend).

### 3.5 `room_resources` — recursos do ambiente (campo TS `Space.resources`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `room_id` | uuid | não | — | FK → `rooms(id)` `on delete cascade` |
| `resource` | `room_resource` | não | — | Recurso disponível |

PK composta `(room_id, resource)`. Alternativa aceitável: coluna
`resources room_resource[]` em `rooms`; a tabela auxiliar é preferida por
permitir filtro indexado.

### 3.6 `reservations` — tipo TS `Reservation`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `code` | text | não | — | Protocolo legível (UNIQUE), ex.: `RS-2026-0142` |
| `room_id` | uuid | não | — | FK → `rooms(id)` `on delete restrict` |
| `responsible_id` | uuid | sim | — | FK → `usuarios(id)` (Hub) |
| `responsible` | text | não | — | Nome do solicitante (fallback pré-Hub) |
| `sector_id` | uuid | sim | — | FK → `setores(id)` (Hub) |
| `sector` | text | sim | — | Setor (fallback pré-Hub) |
| `event` | text | não | — | Título do evento |
| `purpose` | text | sim | — | Finalidade |
| `date` | date | não | — | Data da reserva |
| `start_time` | time | não | — | Início |
| `end_time` | time | não | — | Término |
| `participants` | integer | não | `1` | Nº de participantes |
| `status` | `reservation_status` | não | `'analise'` | Situação |
| `recurrence` | `reservation_recurrence` | não | `'unica'` | Recorrência |
| `notes` | text | sim | — | Mensagem/observação do solicitante |
| `decided_by` | uuid | sim | — | FK → `usuarios(id)`, quem aprovou/recusou |
| `decided_at` | timestamptz | sim | — | Data da decisão |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`; `check (end_time > start_time)`;
`check (participants > 0)`.
Índices: `idx_res_room_date(room_id, date)`, `idx_res_date(date)`,
`idx_res_status(status)`.

**Anticonflito (obrigatório no banco, não só na UI):**

```sql
alter table reservations
  add column period tstzrange
    generated always as (
      tstzrange((date + start_time), (date + end_time), '[)')
    ) stored;

create extension if not exists btree_gist;
alter table reservations
  add constraint reservations_no_overlap
  exclude using gist (
    room_id with =,
    period  with &&
  ) where (status in ('confirmada','andamento'));
```

Reservas em `analise` não bloqueiam a agenda; ao aprovar, a constraint impede a
sobreposição.

### 3.7 `reservation_equipment` — equipamentos extras solicitados

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `reservation_id` | uuid | não | — | FK → `reservations(id)` `on delete cascade` |
| `item` | text | não | — | Equipamento pedido (projetor, notebook, ...) |
| `quantity` | smallint | não | `1` | Quantidade |
| `asset_id` | uuid | sim | — | FK → `assets(id)` (Rooster Assets), quando alocado |

PK composta `(reservation_id, item)`. Hoje o frontend concatena esses itens em
`notes`; ao integrar, gravar como linhas desta tabela.

## 4. Enums

```sql
create type space_type as enum (
  'sala','lab','lab-info','auditorio','biblioteca','reuniao',
  'ginasio','quadra','anfiteatro','multiuso','estudio','outro');

create type space_status as enum ('disponivel','em-uso','manutencao','bloqueado');

create type reservation_status as enum (
  'confirmada','analise','cancelada','finalizada','andamento');

create type reservation_recurrence as enum ('unica','diaria','semanal','mensal');

create type room_resource as enum (
  'projetor','ar-condicionado','quadro-branco','tv','som','wifi',
  'computadores','acessibilidade','bancadas','lab-equip');
```

Os valores devem permanecer idênticos aos literais TS em
`src/components/rooster/rooms/mock-data.ts`.

## 5. Regras de negócio

1. Reserva só pode iniciar/terminar em um período existente em `room_slots`
   (ou gerado por `opening_hours` + `slot_minutes`).
2. `participants` não pode exceder `rooms.capacity`.
3. Ambiente com `status` diferente de `disponivel` não aceita novas reservas.
4. A data da reserva deve cair em um dos `rooms.weekdays`.
5. Reservas criadas em `/rooms/book` nascem como `analise`; a transição para
   `confirmada` é privilégio do setor gestor (`admin`, `tecnico`,
   `institucional`, `coordenador`).
6. Transições válidas: `analise → confirmada | cancelada`;
   `confirmada → andamento | cancelada`; `andamento → finalizada`.
   `finalizada` e `cancelada` são terminais.
7. Excluir campus/bloco cascateia na estrutura; ambiente com reservas
   históricas não pode ser excluído (`on delete restrict`) — usar
   `status = 'bloqueado'`.
8. `code` de campus, bloco (por campus), ambiente e reserva é único.

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts`.

| Recurso | Base | Operações |
|---|---|---|
| Campus | `/campus` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Blocos | `/blocos` | idem + filtro `?campusId=` |
| Ambientes | `/ambientes` | idem + filtros `?campusId=&blocoId=&tipo=&status=` |
| Períodos | `/ambientes/:id/periodos` | `GET`, `PUT` (substitui a lista) |
| Disponibilidade | `/ambientes/:id/disponibilidade?data=` | `GET` — períodos livres do dia |
| Reservas | `/reservas` | idem + filtros `?ambienteId=&data=&status=&de=&ate=` |
| Decisão | `/reservas/:id/status` | `PATCH` — aprovar/recusar/cancelar |
| Estrutura | `/campus/arvore` | `GET` — campus → blocos → ambientes |

## 7. Mapa frontend → banco

| Frontend | Tabela mock | Tabela física |
|---|---|---|
| `Campus` | `src/mock/database/campuses.ts` | `campuses` |
| `Block` | `src/mock/database/blocks.ts` | `blocks` |
| `Space`/`Room` | `src/mock/database/rooms.ts` | `rooms` (+ `room_slots`, `room_resources`) |
| `Reservation` | `src/mock/database/reservations.ts` | `reservations` (+ `reservation_equipment`) |
| `roomService.*` | `src/services/mock-api/room.service.ts` | consumidor dos endpoints acima |

## Acompanhamento e gestão de reservas

- **Minhas reservas** lista as solicitações do usuário autenticado e abre o histórico compartilhado.
- O solicitante pode enviar mensagens, solicitar nova data/horário e cancelar com motivo.
- **Gerenciar reservas** é restrito a administrador, técnico, institucional e coordenador; mantém agenda e fila completa.
- Gestores podem responder, aprovar, alterar horário ou cancelar informando o motivo.
- Toda ação grava um `reservation_event`; a tela nunca lê seeds diretamente e usa apenas `roomService`.

### Endpoints adicionais

- `GET /reservas/:id`
- `POST /reservas/:id/mensagens`
- `PATCH /reservas/:id/horario`
- `PATCH /reservas/:id/status`
- `GET /reservas?responsible_id=me`
