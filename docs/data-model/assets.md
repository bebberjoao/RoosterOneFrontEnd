# Modelo de dados — Rooster Assets

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O módulo persiste o **cadastro de patrimônio** (bens/ativos) da instituição,
suas **categorias**, os **setores** aos quais os bens são vinculados e o
**histórico de movimentações** (troca de setor, sala, empréstimo, devolução,
envio para manutenção).

Dependências externas:

- **Rooster Rooms**: `locationId` referencia um ambiente físico (`rooms`);
  enquanto não integrado, o bem guarda apenas o texto livre `location`.
- **Rooster Hub**: `ownerUserId` referencia o usuário responsável pelo bem
  (`usuarios`) e o setor do bem deveria referenciar `setores` (Hub); hoje o
  cadastro de setores é local ao módulo (`asset_sectors`), com texto livre
  `sector` no ativo.
- **Rooster Desk**: `maintenanceTicketId` referencia o chamado de manutenção
  aberto para o bem (`tickets`).

## 2. Diagrama de relacionamentos

```text
┌────────────────────┐            ┌───────────────────┐
│  asset_categories   │            │   asset_sectors    │
└──────────┬──────────┘            └──────────┬─────────┘
           │ 1:N                              │ 1:N (por nome, hoje texto livre)
           │                                   │
           ▼                                   ▼
     ┌─────────────────────────────────────────────┐
     │                   assets                     │
     │  category_id ──▶ asset_categories(id)        │
     │  location_id ──▶ rooms(id)        [Rooms]    │
     │  owner_user_id ─▶ usuarios(id)    [Hub]       │
     │  maintenance_ticket_id ─▶ tickets(id) [Desk]  │
     └───────────────────┬───────────────────────────┘
                          │ 1:N (on delete cascade)
                  ┌───────▼──────────┐
                  │ asset_movements  │
                  └──────────────────┘
```

## 3. Tabelas

### 3.1 `asset_categories` — tipo TS `AssetCategory` (`src/mock/database/assetCategories.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome da categoria (UNIQUE) |
| `description` | text | sim | — | Descrição |
| `tone` | text | não | — | Cor de identificação (token/OKLCH) |
| `system` | boolean | não | `false` | Categoria de sistema (não removível) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (name)`.

### 3.2 `asset_sectors` — tipo TS `AssetSector` (`src/mock/database/assetSectors.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome do setor (UNIQUE) |
| `description` | text | sim | — | Descrição |
| `manager` | text | sim | — | Responsável (migrar p/ `manager_id → usuarios`) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (name)`. Ao integrar com o Hub, esta tabela tende a ser
substituída por `setores` (Hub); o identificador virtual
`UNASSIGNED_SECTOR_ID` (`sec-none`) representa bens sem setor cadastrado e não
deve existir como linha física — é tratado na aplicação (`sector_id is null`).

### 3.3 `assets` — tipo TS `Asset` (`src/mock/database/assets.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome do bem |
| `tag` | text | não | — | Número de patrimônio (UNIQUE) |
| `category_id` | uuid | não | — | FK → `asset_categories(id)` |
| `brand` | text | não | — | Marca |
| `model` | text | não | — | Modelo |
| `serial` | text | sim | — | Número de série |
| `location_id` | uuid | sim | — | FK → `rooms(id)` (Rooster Rooms), quando alocado |
| `location` | text | não | — | Localização (fallback pré-Rooms) |
| `sector_id` | uuid | sim | — | FK → `asset_sectors(id)` ou `setores(id)` (Hub) |
| `sector` | text | não | — | Setor (fallback pré-Hub) |
| `owner_user_id` | uuid | sim | — | FK → `usuarios(id)` (Hub) |
| `owner` | text | não | — | Nome do responsável (fallback pré-Hub) |
| `status` | `asset_status` | não | `'disponivel'` | Situação atual |
| `condition` | `asset_condition` | não | `'bom'` | Estado de conservação |
| `acquired_at` | date | não | — | Data de aquisição |
| `value` | numeric(12,2) | não | `0` | Valor de aquisição |
| `notes` | text | sim | — | Observações |
| `photo` | text | sim | — | URL da foto |
| `maintenance_ticket_id` | uuid | sim | — | FK → `tickets(id)` (Rooster Desk) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (tag)`; `check (value >= 0)`.
Índices: `idx_assets_category(category_id)`, `idx_assets_sector(sector_id)`,
`idx_assets_status(status)`, `idx_assets_location(location_id)`.

### 3.4 `asset_movements` — tipo TS `AssetMovement` (`src/mock/database/assetMovements.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `asset_id` | uuid | não | — | FK → `assets(id)` `on delete cascade` |
| `type` | `asset_movement_type` | não | — | Tipo de movimentação |
| `from` | text | sim | — | Origem (setor/sala/pessoa) |
| `to` | text | sim | — | Destino (setor/sala/pessoa) |
| `user` | text | não | — | Quem registrou a movimentação |
| `date` | timestamptz | não | — | Data/hora da movimentação |
| `notes` | text | sim | — | Observações |

Índices: `idx_movements_asset_date(asset_id, date desc)`.

## 4. Enums

```sql
create type asset_status as enum (
  'disponivel','em-uso','emprestado','manutencao','baixado');

create type asset_condition as enum (
  'novo','bom','regular','ruim','inservivel');

create type asset_movement_type as enum (
  'setor','sala','emprestimo','devolucao','manutencao');
```

Os valores devem permanecer idênticos aos literais TS em
`src/mock/database/assets.ts` e `src/mock/database/assetMovements.ts`.

## 5. Regras de negócio

1. `status = 'baixado'` é terminal: o bem não pode voltar a `disponivel`,
   `em-uso` ou `emprestado` sem uma nova movimentação administrativa explícita.
2. `status = 'emprestado'` exige um registro em `asset_movements` do tipo
   `emprestimo`; a devolução gera um novo registro do tipo `devolucao` e volta
   o bem para `disponivel`.
3. `status = 'manutencao'` deve ter uma movimentação do tipo `manutencao`
   associada e, quando integrado ao Rooster Desk, um `maintenance_ticket_id`.
4. Alterar `sector`/`sector_id` ou `location`/`location_id` de um bem sempre
   gera uma linha em `asset_movements` (`setor` ou `sala`, respectivamente)
   com o valor anterior em `from` e o novo em `to`.
5. `tag` (número de patrimônio) é único e imutável após a criação.
6. Categorias com `system = true` não podem ser excluídas, apenas
   desativadas/renomeadas.
7. Excluir uma categoria ou setor com bens vinculados é bloqueado
   (`on delete restrict`); é preciso realocar os bens antes.

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts`.

| Recurso | Base | Operações |
|---|---|---|
| Categorias | `/patrimonio-categorias` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Patrimônio | `/patrimonio` | idem + filtros `?categoriaId=&setorId=&status=&condicao=` |
| Movimentações | `/patrimonio-movimentacoes` | `GET` (+ filtro `?patrimonioId=`), `POST` |

Observação: o cadastro de setores do módulo (`asset_sectors`) ainda não possui
endpoint próprio no `MOCK_ENDPOINT_MAP`; ao integrar, avaliar se ele será
substituído diretamente por `/setores` (Rooster Hub) ou exposto como
`/patrimonio-setores`.

## 7. Mapa frontend → banco

| Frontend | Tabela mock | Tabela física |
|---|---|---|
| `AssetCategory` | `src/mock/database/assetCategories.ts` | `asset_categories` |
| `AssetSector` | `src/mock/database/assetSectors.ts` | `asset_sectors` (ou `setores` do Hub) |
| `Asset` | `src/mock/database/assets.ts` | `assets` |
| `AssetMovement` | `src/mock/database/assetMovements.ts` | `asset_movements` |
| `HubSector`/`HubUser` (`src/components/rooster/assets/hub-directory.ts`) | `src/services/hub/seed.ts` | `setores` / `usuarios` (Hub) |
