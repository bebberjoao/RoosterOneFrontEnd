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

## Formatação de datas, horários e números

Toda exibição de data, horário, número decimal, percentual, valor monetário ou tamanho de arquivo utiliza as
funções de `src/lib/formatacao.ts`, e não `toLocaleDateString`, `toLocaleString` ou `toFixed` diretamente:

- `fmtData` (dd/mm/aaaa), `fmtDataHora` (dd/mm/aaaa · hh:mm), `fmtHora` (hh:mm) e `fmtMesAno` (título de
  calendário, "Outubro de 2026");
- `soData`, para reduzir ao formato interno `aaaa-mm-dd` os valores de data pura recebidos da API, e
  `dataLocalIso`, para obter a data de hoje no fuso local;
- `paraNumero`, `fmtNumero`, `fmtNumeroLivre`, `fmtPercentual`, `fmtMoeda` e `fmtTamanho`, com vírgula decimal.

Dois cuidados motivaram a centralização. As colunas de data pura do banco (`@db.Date`) chegam da API como
meia-noite UTC (`2026-10-03T00:00:00.000Z`); repassadas sem normalização ao calendário de reservas, produziam
"Invalid Date" e dias "NaN", e convertidas por `new Date()` no fuso de Brasília exibiriam o dia anterior. Os
valores `Decimal` chegam como texto; somados sem conversão, eram concatenados (defeito observado no valor
patrimonial do Assets). Pelo mesmo motivo, `toISOString().slice(0, 10)` não deve ser utilizado para obter a data
de hoje, pois calcula a data em UTC. As regras são verificadas por `src/lib/formatacao.test.ts`.

## Inclusão ou alteração de roteiro guiado do assistente

1. No backend, o roteiro é declarado em `src/assistente/roteiros.ts` (identificador, entrada do manual, permissão e
   frases de exemplo); ver `docs/backend/13-guia-desenvolvedor.md` no repositório do backend.
2. Em `src/components/rooster/assistente/roteiros.ts`, as etapas recebem o mesmo identificador. Cada passo informa o
   `alvo`, a `acao` (`clicar`, `preencher` ou `observar`), o `titulo`, o `texto` (o que fazer) e o `porque`
   (finalidade do campo), em registro formal e impessoal; o primeiro passo informa a `rota`. Para alvos que reúnem
   vários controles, `avancaEm` restringe os cliques que concluem o passo; `opcional` e `seAusente` tratam elementos
   que dependem do conteúdo da tela.
3. Os elementos são marcados pela propriedade `tour` (`Btn`, `Field` e `SectionCard`) ou pelo atributo `data-tour`;
   o mesmo valor em vários elementos destaca todos eles no passo.
4. `roteiros.test.ts` verifica a lista de identificadores (cópia da lista do backend) e a existência, no código, de
   todo alvo citado; recomenda-se ainda percorrer o roteiro no navegador com o perfil que executa a tarefa.

## Verificação antes da conclusão de alteração no frontend

- [ ] `npx tsc --noEmit` sem erros.
- [ ] Permissão nova, se houver, com grafia idêntica no backend (`@RequirePermission`) e em `permission-catalog.ts`.
- [ ] Tela que integra roteiro guiado: marcadores `data-tour` preservados (`roteiros.test.ts`).
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
