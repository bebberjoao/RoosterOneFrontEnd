# Extração de módulos para o backend

Fonte de verdade em código: `src/mock/modules.ts` (`MODULE_MANIFEST`).
Cada módulo declara seus **arquivos de tela**, **serviços**, **tabelas mockadas**
e, via `endpointsForModule(id)`, os **endpoints REST previstos**.

```ts
import { MODULE_MANIFEST, endpointsForModule } from "@/mock";

endpointsForModule("desk");
// { tickets: "/chamados", deskCategories: "/chamados-categorias", ... }
```

## Ordem recomendada de integração

1. **Hub** (usuários, perfis, setores, permissões) — base de auth de todo o resto.
2. **Academy** (cursos, disciplinas, turmas, matrículas) — base acadêmica.
3. **Desk**, **Rooms**, **Assets** — independentes entre si.
4. **Finance** (depende de alunos/matrículas).
5. **Learn** e **Boost** (dependem de turmas/alunos).
6. **Student** — apenas consome os demais; migre por último.

## Mapa resumido

| Módulo | Rotas (`src/routes/`) | Serviços | Tabelas (`src/mock/database/`) |
| --- | --- | --- | --- |
| Hub | `hub.*` | `services/hub/*`, `user.service` | usuarios, setores, perfis, modulos, permissoes, sessoes, logsAuditoria, notificacoes |
| Desk | `desk.*` | `ticket.service`, `desk-category.service` | tickets, ticketCategories, deskCategories, deskSectors, deskAgents |
| Student | `student.*` | `student.service`, `notification.service` | students, enrollments, grades, attendance, academyDocs |
| Academy | `academy.*` | `academy.service` | courses, terms, disciplines, teachers, classes, enrollments, calendarEvents, grades, gradeItems, attendance, academyDocs |
| Rooms | `rooms.*` | `room.service` | campuses, blocks, rooms, reservations |
| Assets | `assets.*` | `asset.service` | assetCategories, assets, assetMovements |
| Finance | `finance.*` | `finance.service` | products, services, charges, tuitions, payments |
| Learn | `learn.*` | `learn.service` | activities, submissions, lessonContents |
| Boost | `boost.*` | `boost.service` | boostCourses, certificates |

## Passo a passo por módulo

1. Ler `docs/modules/<modulo>.md` (telas, botões, permissões, regras).
2. Gerar o schema Prisma a partir dos tipos TS exportados pelas tabelas do módulo.
3. Implementar os endpoints listados em `endpointsForModule("<modulo>")`.
4. Trocar o corpo dos serviços do módulo por chamadas `http` (assinatura igual —
   `getAll/getById/create/update/remove`); nenhuma tela muda.
5. Apagar os arquivos de tabela do módulo em `src/mock/database/` e removê-los do
   `db` e do `MOCK_ENDPOINT_MAP`.
6. Remover a entrada `tables` do módulo em `src/mock/modules.ts`.

Quando `MODULE_MANIFEST` não tiver mais nenhuma tabela, `src/mock/` inteira pode
ser apagada.
