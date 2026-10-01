# Alteração e motivação

<!-- Descrever o problema tratado, e não apenas a solução adotada. -->

## Verificação realizada

<!-- Indicar o que foi verificado; a menção genérica a "testado" não é suficiente. -->

- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm test` aprovado
- [ ] `npm run build` concluído
- [ ] Verificação manual no navegador: <!-- telas e perfil de permissão utilizados -->
- [ ] Verificação com usuário **sem** a permissão pertinente (caso negativo)
- [ ] Verificação em largura de tela reduzida, em caso de alteração de leiaute

## Impacto na documentação

**Nenhuma alteração de comportamento é integrada sem a documentação correspondente, em registro técnico-formal.**

- [ ] Sem impacto na documentação (justificativa: ____)
- [ ] Documentação atualizada neste pull request

Itens revisados:

- [ ] `docs/frontend/03-paginas-e-rotas.md`, em caso de criação, remoção ou alteração de tela
- [ ] `docs/frontend/02-estrutura.md`, em caso de criação ou remoção de arquivo ou diretório
- [ ] `docs/frontend/08-autorizacao.md`, em caso de alteração de permissão ou de controle de exibição
- [ ] `docs/frontend/06-integracao-api.md`, em caso de alteração de serviço de API
- [ ] `permission-catalog.ts`, em caso de tela ou ação nova (com correspondência ao seed do backend)
- [ ] Manual do Usuário, em caso de alteração visível ao usuário
- [ ] **Alguma afirmação de ausência ("ainda é simulado", "não tem backend") tornou-se incorreta?**

## Lista de verificação de autorização e dados

- [ ] O perfil de interface (`useRole`) não determina *quais dados buscar*, apenas *o que exibir*
- [ ] A permissão efetiva (`useCan` e `useCanAccess`) determina o acesso a rotas e ações
- [ ] Nenhuma regra de negócio do backend foi replicada
- [ ] A tela nova está no `AppShell` (com `RequireAccess` automático)
- [ ] Toda promessa possui tratamento de rejeição

## Padrões de interface

- [ ] O estado de carregamento utiliza esqueleto (`LoadingBlock` ou `LoadingCards`)
- [ ] A lista vazia utiliza `EmptyState`
- [ ] Operações de escrita emitem aviso de sucesso ou de erro
- [ ] Componentes compartilhados importados por `@/components/shared`

## Riscos e pontos de atenção

<!-- Aspectos que exigem análise mais cuidadosa do revisor. -->

## Classe de risco da alteração

- [ ] Baixo (texto, documentação, ajuste visual)
- [ ] Médio (tela nova, serviço novo, dependência incluída)
- [ ] **Alto** (autorização, sessão, cliente HTTP, remoção de dependência)
