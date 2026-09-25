# O que muda e por quê

<!-- Qual problema isso resolve? Descreva o problema, não só a solução. -->

## Como foi verificado

<!-- Não basta "testei". Diga o quê. Não há teste automatizado neste repositório. -->

- [ ] `npx tsc --noEmit` limpo
- [ ] `npm run build` concluindo
- [ ] Testado manualmente no navegador: <!-- quais telas, qual perfil de permissão -->
- [ ] Testado com um usuário **sem** a permissão relevante (o caso negativo)
- [ ] Verificado em largura de tela reduzida, se mexeu em layout

## Impacto na documentação

**Nenhuma mudança de comportamento entra sem a documentação correspondente.**

- [ ] Não há impacto na documentação (justifique: ____)
- [ ] Documentação atualizada neste mesmo PR

Marque o que foi revisado:

- [ ] `docs/frontend/03-paginas-e-rotas.md` — se criou, removeu ou mudou tela
- [ ] `docs/frontend/02-estrutura.md` — se criou ou removeu arquivo/pasta
- [ ] `docs/frontend/08-autorizacao.md` — se mexeu em permissão ou gating
- [ ] `docs/frontend/06-integracao-api.md` — se mexeu em serviço de API
- [ ] `permission-catalog.ts` — se criou tela ou ação nova (precisa casar com o seed do backend)
- [ ] **Alguma afirmação de ausência ("ainda é mock", "não tem backend") ficou desatualizada?**

## Checklist de autorização e dados

- [ ] A **Visão de demonstração** (`useRole`) não decide *o que buscar* da API — só *o que mostrar*
- [ ] A permissão real (`useCan`/`useCanAccess`) é quem decide acesso a rota e ação
- [ ] Nenhuma regra de negócio do backend foi replicada aqui
- [ ] Tela nova está sob o `AppShell` (herda `RequireAccess` automaticamente)

## Padrões de interface

- [ ] Estado de carregamento usa esqueleto (`LoadingBlock`/`LoadingCards`)
- [ ] Lista vazia usa `EmptyState`
- [ ] Operação de escrita emite toast de sucesso/erro
- [ ] Componentes compartilhados importados pelo barril `@/components/shared`

## Riscos e pontos de atenção

<!-- O que o revisor deve olhar com mais cuidado? -->

## Classe de risco da mudança

- [ ] Baixo (texto, documentação, ajuste visual)
- [ ] Médio (tela nova, serviço novo, dependência acrescentada)
- [ ] **Alto** (autorização, sessão, cliente HTTP, remoção de dependência)
