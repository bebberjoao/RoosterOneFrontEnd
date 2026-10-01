# Guia do Desenvolvedor — Frontend

## Inclusão de tela em módulo existente

1. Criar o arquivo em `src/routes/` conforme a convenção (`<modulo>.<nome>.tsx` corresponde a `/modulo/nome`; ver
   `src/routes/README.md`). O `routeTree.gen.ts` é regenerado automaticamente pelo servidor de desenvolvimento e não
   deve ser editado manualmente.
2. Para CRUD simples, utilizar `HubCrud` (`04-componentes.md`) com `HubResource<T>` existente em
   `src/services/hub/index.ts`, ou criar novo serviço conforme o padrão de `mapResource` e `createResource`
   (`06-integracao-api.md`).
3. Se a tela exigir nova permissão de acesso, incluir a entrada em `permission-catalog.ts`, com **grafia idêntica**
   (`módulo/recurso/ação`) à do backend, e registrar a rota em `module-config.ts` para exibição no menu.
4. Envolver a tela no `AppShell` (em geral automático, quando o layout do módulo, como `desk.tsx` ou `rooms.tsx`, já o
   utiliza).

## Consumo de novo endpoint do backend

1. Incluir o tipo da resposta em `services/hub/types.ts` (Hub) ou no `*.service.ts` do módulo.
2. Realizar a chamada por `request()`, `uploadFile()` ou `requestBlob()` de `client.ts`, e nunca por `fetch` direto,
   que dispensaria a inclusão automática de `Authorization`, a renovação de sessão e o tratamento uniforme de erros.
3. Se o endpoint devolver formato não plano (por exemplo, resposta transacional `{ movimentacao, patrimonio }`), não
   utilizar o `mapResource` genérico: implementar a chamada e a conversão manualmente, como em
   `asset.service.ts::registerMovement`.
4. Prefixo `/v1`: aplicado automaticamente pelo cliente; o caminho informado não deve incluí-lo.

## Inclusão de campo em formulário do `HubCrud`

Incluir a entrada na lista `HubField<T>[]` da tela (nome do campo, rótulo e `validate`, se necessário), sem alterar
`crud-panel.tsx`, que renderiza o novo campo automaticamente.

## Verificação antes da conclusão de alteração no frontend

- [ ] `npx tsc --noEmit` sem erros.
- [ ] Permissão nova, se houver, com grafia idêntica no backend (`@RequirePermission`) e em `permission-catalog.ts`.
- [ ] `npm test` (Vitest) aprovado. A suíte cobre lógica pura, o cliente HTTP, componentes isolados e acessibilidade,
      mas **não** cobre a jornada completa de telas, razão do item seguinte.
- [ ] Verificação manual no navegador, com o backend em execução (e não apenas o estado vazio de indisponibilidade).
      Não há teste de ponta a ponta em navegador no repositório (Playwright ou Cypress); ver
      `docs/engineering/14-estrategia-de-testes.md`, no repositório do backend.
- [ ] Documentação correspondente atualizada, em registro técnico-formal, conforme o mapa de impacto de
      `docs/engineering/12-processo-de-desenvolvimento.md` (repositório do backend), inclusive o Manual do Usuário
      quando a alteração afetar telas.

### Elaboração de testes do frontend

Os arquivos `*.test.ts` e `*.test.tsx` residem ao lado do código testado. A configuração está em `vitest.config.ts`,
separada de `vite.config.ts` por decisão de projeto, pois este é montado pelo preset
`@lovable.dev/vite-tanstack-config`, que já inclui TanStack Start, Nitro e Tailwind e orienta a não receber plugins
manualmente. Os testes requerem apenas React, o alias `@` e um DOM (jsdom).

Alvos recomendados, em ordem: lógica pura (por exemplo, `components/rooster/rooms/labels.ts`), contrato de serviço (por
exemplo, `services/hub/client.ts`, com `fetch` substituído por dublê) e componente compartilhado com comportamento
próprio (por exemplo, `components/shared/data-table.tsx`). As telas de rota completas dependem do contexto do TanStack
Router e oferecem retorno reduzido em relação ao esforço; nelas, a verificação manual permanece mais eficaz.

## Processo, commit e revisão

Este guia trata da **implementação**. A **entrega** (padrão de mensagem de commit, branch, pull request e lista de
verificação de revisão) está descrita no `CONTRIBUTING.md` deste repositório e em
`docs/engineering/12-processo-de-desenvolvimento.md`, no repositório do backend, aplicável aos dois repositórios.
