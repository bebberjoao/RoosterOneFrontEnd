# Modelo de dados por módulo — padrão

Esta pasta documenta **as tabelas do banco (PostgreSQL/Prisma) de cada módulo** e
seus relacionamentos, servindo de especificação para o backend NestJS. Nada aqui
é renderizado na interface.

O documento de referência (padrão a ser seguido pelos demais módulos) é
[rooms.md](./rooms.md); a versão enxuta em formato `campo tipo` fica em
[rooms-tabelas.md](./rooms-tabelas.md).

## Índice por módulo

| Módulo | Documento completo | Tabelas (enxuto) | Consumo de API (frontend) |
| --- | --- | --- | --- |
| Hub | [hub.md](./hub.md) | [hub-tabelas.md](./hub-tabelas.md) | `src/services/hub/index.ts` + `client.ts` |
| Desk | [desk.md](./desk.md) | [desk-tabelas.md](./desk-tabelas.md) | `src/services/mock-api/ticket.service.ts`, `desk-category.service.ts` |
| Rooms | [rooms.md](./rooms.md) | [rooms-tabelas.md](./rooms-tabelas.md) | `src/services/mock-api/room.service.ts` |
| Assets | [assets.md](./assets.md) | [assets-tabelas.md](./assets-tabelas.md) | `src/services/mock-api/asset.service.ts` |
| Academy | [academy.md](./academy.md) | — | `src/services/mock-api/academy.service.ts` |
| Finance | [finance.md](./finance.md) | — | `src/services/mock-api/finance.service.ts` |
| Learn | [learn.md](./learn.md) | — | `src/services/mock-api/learn.service.ts` |
| Boost | [boost.md](./boost.md) | — | `src/services/mock-api/boost.service.ts` |
| Student | [student.md](./student.md) | — | `src/services/mock-api/student.service.ts` |

Todas as chamadas HTTP passam por `src/services/http.ts` (mock-api) ou
`src/services/hub/client.ts` (Hub); o contrato de endpoints é
`MOCK_ENDPOINT_MAP` em `src/mock/index.ts`.

## Estrutura obrigatória de cada documento

1. **Visão geral** — o que o módulo persiste e de quais outros módulos depende.
2. **Diagrama de relacionamentos** — ASCII, em bloco ` ```text `.
3. **Tabelas** — uma seção por tabela, com:
   - nome físico (snake_case, plural) e tipo TS de origem no frontend;
   - tabela de colunas: `Coluna | Tipo SQL | Nulo | Default | Descrição`;
   - chaves, índices e constraints (UNIQUE, CHECK, FK + ação `ON DELETE`).
4. **Enums** — todos os enums Postgres com seus valores (iguais aos literais TS).
5. **Regras de negócio** — validações que o backend deve garantir (não só a UI).
6. **Endpoints REST** — devem bater com `MOCK_ENDPOINT_MAP` (`src/mock/index.ts`).
7. **Mapa frontend → banco** — tipo TS / tabela mock → tabela física.

## Convenções gerais

- PK: `id uuid primary key default gen_random_uuid()`.
- Toda tabela tem `created_at timestamptz not null default now()` e
  `updated_at timestamptz not null default now()`.
- Nomes de tabela e coluna em `snake_case`; a API responde em `camelCase`.
- Datas isoladas em `date`; horários de grade em `time`; carimbos em `timestamptz`.
- Exclusões que quebrariam histórico usam `on delete restrict`; hierarquias
  estruturais usam `on delete cascade`.
- Valores monetários em `numeric(12,2)`. Percentuais em `numeric(5,2)`.
- Listas curtas e fixas viram `enum`; listas extensíveis viram tabela auxiliar.
