# Guia do Desenvolvedor — Frontend

## Adicionar uma nova tela a um módulo com backend real (Hub/Desk/Rooms/Assets)

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
- [ ] Testado manualmente no navegador — não há suíte de teste automatizado de frontend hoje (`docs/engineering/08-divida-tecnica.md`, no repositório backend).
- [ ] Se a tela consome API real, testado com o backend rodando de verdade (não só o estado vazio de "offline").
- [ ] Documentação correspondente atualizada — ver `docs/frontend/`, `docs/system/`, conforme o que mudou.
