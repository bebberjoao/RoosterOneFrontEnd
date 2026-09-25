# Guia do Desenvolvedor — Frontend

## Adicionar uma nova tela a um módulo (todos os 9 têm backend real)

1. Crie o arquivo em `src/routes/` seguindo a convenção (`<modulo>.<nome>.tsx` = `/modulo/nome`; ver `src/routes/README.md`). `routeTree.gen.ts` é regenerado automaticamente pelo dev server — não edite à mão.
2. Se a tela for um CRUD simples, use `HubCrud` (`docs/frontend/04-componentes.md`) com um `HubResource<T>` já existente em `src/services/hub/index.ts`, ou crie um novo `service` seguindo o padrão de `mapResource`/`createResource` (`docs/frontend/06-integracao-api.md`).
3. Se a tela precisar de uma nova permissão de acesso, adicione a entrada em `permission-catalog.ts` com a **mesma grafia exata** (`módulo/recurso/ação`) que vai existir no backend, e registre a rota em `module-config.ts` para aparecer no menu.
4. Envolva a tela em `AppShell` (normalmente automático, se o layout do módulo — `desk.tsx`, `rooms.tsx` etc. — já usa `AppShell`).

## Consumir um endpoint novo do backend

1. Adicione o tipo de resposta em `services/hub/types.ts` (se for do Hub) ou direto no `*.service.ts` do módulo.
2. Chame via `request()`/`uploadFile()`/`requestBlob()` de `client.ts` — nunca `fetch` direto (perde a injeção automática de `Authorization` e o tratamento uniforme de erro).
3. Se o endpoint devolver um formato "não achatado" (ex.: uma resposta transacional tipo `{ movimentacao, patrimonio }`), **não** tente encaixar no `mapResource` genérico — escreva a chamada e a tradução manualmente, como já feito em `asset.service.ts::registerMovement`.

## Adicionar um campo a um formulário existente do `HubCrud`

Adicione a entrada em `HubField<T>[]` da tela (nome do campo, label, `validate` se precisar), sem mexer no `crud-panel.tsx` — o componente genérico já sabe renderizar o campo novo.

## Checklist antes de considerar uma mudança de frontend pronta

- [ ] `npx tsc --noEmit` sem erro.
- [ ] Permissão nova (se houver) existe com a mesma grafia no backend (`@RequirePermission`) e no `permission-catalog.ts`.
- [ ] `npm test` (Vitest) passando. A suíte cobre lógica pura, o cliente HTTP e componentes isolados — **não** cobre jornada de tela, então continua valendo o item abaixo.
- [ ] Testado manualmente no navegador. Não há teste de ponta a ponta em navegador (Playwright/Cypress); a verificação da jornada completa ainda é manual. Ver `docs/engineering/14-estrategia-de-testes.md`, no repositório backend.

### Escrevendo teste de frontend

Arquivos `*.test.ts`/`*.test.tsx` ao lado do código que testam. Config em `vitest.config.ts` — separada do `vite.config.ts` do app de propósito, porque aquele é montado pelo preset `@lovable.dev/vite-tanstack-config`, que já injeta TanStack Start, nitro e tailwind e avisa para não receber plugins manualmente. O teste precisa só de React, do alias `@` e de um DOM (jsdom).

Bons alvos, na ordem: lógica pura (ex.: `components/rooster/rooms/labels.ts`), contrato de serviço (ex.: `services/hub/client.ts`, com `fetch` substituído por dublê) e componente compartilhado com comportamento próprio (ex.: `components/shared/data-table.tsx`). Telas de rota inteiras dependem do contexto do TanStack Router e dão pouco retorno pelo esforço — é onde o teste manual continua valendo mais.
- [ ] Se a tela consome API real, testado com o backend rodando de verdade (não só o estado vazio de "offline").
- [ ] Documentação correspondente atualizada — ver o mapa de impacto em `docs/engineering/12-processo-de-desenvolvimento.md` (repositório backend).

## Processo, commit e revisão

Este guia cobre **como implementar**. Para **como entregar** — padrão de mensagem de commit, branch, pull request e o checklist de revisão de código — ver o `CONTRIBUTING.md` na raiz deste repositório e `docs/engineering/12-processo-de-desenvolvimento.md` no repositório do backend, que vale para os dois.
