# Dados mockados — ponto único de integração

Todo dado falso da aplicação vive em `src/mock/`. Nenhuma tela declara dado
mockado inline; as telas consomem sempre a camada de serviços.

```text
src/mock/
  index.ts            <- PONTO ÚNICO: agrega tudo + mapa de endpoints REST
  database/
    index.ts          <- objeto `db` com todas as "tabelas"
    users.ts, roles.ts, students.ts, teachers.ts, disciplines.ts, ...
src/services/
  mock-api/*.service.ts  <- serviços por domínio (getAll/getById/create/...)
  hub/                   <- Hub: client HTTP real + fallback offline (seed.ts)
  http.ts                <- wrapper fetch para o backend real
```

## `src/mock/index.ts`

Exporta:

| Export | Descrição |
| --- | --- |
| `mockDatabase` | Objeto com todas as tabelas dos módulos operacionais (`db`). |
| `MockDatabase` | Tipo do objeto acima. |
| `mockHubDatabase` | Seed do Rooster Hub (usuários, perfis, setores, permissões, sessões, logs). |
| `MODULE_MANIFEST` / `endpointsForModule()` | Manifesto por módulo: rotas, serviços, tabelas e endpoints (`src/mock/modules.ts`). |
| `MOCK_ENDPOINT_MAP` | Mapa `tabela -> endpoint REST` esperado no backend. |
| `MockEndpointKey` | União dos nomes de tabela. |
| `export * from "./database"` | Acesso direto a qualquer tabela individual. |

## Tabelas disponíveis

Academic: `courses`, `terms`, `disciplines`, `teachers`, `students`, `classes`,
`enrollments`, `calendarEvents`, `grades`, `gradeItems`, `attendance`,
`academyDocs`.

Learn: `activities`, `submissions`, `lessonContents`.

Rooms: `campuses`, `blocks`, `rooms`, `reservations`.

Assets: `assetCategories`, `assets`, `assetMovements`.

Desk: `tickets`, `ticketCategories`, `deskCategories`, `deskSectors`,
`deskAgents`.

Finance: `products`, `services`, `charges`, `tuitions`, `payments`.

Boost: `boostCourses`, `certificates`.

Transversais: `roles`, `users`, `notifications`.

Hub (seed próprio): `usuarios`, `setores`, `perfis`, `modulos`, `permissoes`,
`usuariosPerfis`, `usuariosSetores`, `perfisPermissoes`, `notificacoes`,
`sessoes`, `logsAuditoria`.

## Regras

1. Novo dado mockado entra em `src/mock/database/<tabela>.ts` e é registrado no
   `db` de `src/mock/database/index.ts`.
2. Novo recurso ganha uma entrada em `MOCK_ENDPOINT_MAP` com o endpoint REST
   previsto — esse mapa é o contrato com o backend.
3. Telas nunca importam de `src/mock` diretamente; sempre via
   `src/services/mock-api`.
4. Quando todos os serviços apontarem para o backend real, `src/mock/` pode ser
   apagada inteira sem tocar em nenhuma tela.