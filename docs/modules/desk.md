# Rooster Desk

## Objetivo do módulo

O Rooster Desk é o sistema de chamados (helpdesk/tickets) do Rooster One. Permite abrir, listar, filtrar e acompanhar chamados internos, com categorias, SLA, prioridade, status, histórico de eventos (timeline) e comentários públicos/internos. Atualmente opera sobre dados mockados em memória (`src/mock/database` e `src/services/mock-api`), simulando uma futura API real de tickets.

## Rotas

Arquivo de layout: `src/routes/desk.tsx` — define a rota `/desk` e envolve as subrotas com `AppShell` via `<Outlet />`.

| Rota | Arquivo | Componente | Descrição |
|---|---|---|---|
| `/desk` | `src/routes/desk.index.tsx` | `DeskDashboard` | Painel geral com indicadores, últimos chamados, chamados críticos e relatório de SLA por categoria. |
| `/desk/tickets` | `src/routes/desk.tickets.tsx` | `TicketsRoute` / `TicketsList` | Lista completa de chamados com filtros, criação de chamado e catálogo de categorias. Também é o layout (`Outlet`) da rota de detalhe. |
| `/desk/tickets/$id` | `src/routes/desk.tickets.$id.tsx` | `TicketDetail` | Detalhe de um chamado: dados, ações rápidas, pessoas envolvidas, etiquetas e timeline de conversa/comentários internos. |
| `/desk/categories` | `src/routes/desk.categories.tsx` | layout (`Outlet`) | Layout das telas de taxonomia de chamados. |
| `/desk/categories` | `src/routes/desk.categories.index.tsx` | `CategoriesPage` | Lista de categorias por setor, com SLA médio, responsável e CRUD. |
| `/desk/categories/$id` | `src/routes/desk.categories.$id.tsx` | `SubcategoriesPage` | Subcategorias da categoria: cadastro, edição, exclusão e SLA médio de cada uma. |
| `/desk/team` | `src/routes/desk.team.tsx` | `TeamPage` | Atendentes e permissões: vincula atendentes às subcategorias que podem atender. |

A rota `/desk/tickets` aceita o parâmetro de busca `new` (`validateSearch`); quando `new=true`, abre automaticamente o modal de novo chamado (usado pelo link "Novo chamado" do dashboard).

## Telas

### `/desk` — Central de atendimento (`DeskDashboard`)

Carrega todos os tickets e categorias via `ticketService.getAll()` e `ticketService.getCategories()`. Duas abas (`TabBar`):

1. **Visão geral**
   - Cartões de estatísticas: Abertos, Em atendimento, Pendentes, Resolvidos (soma de `resolvido` + `encerrado`), SLA médio (média de `slaPercent`, meta 92%).
   - "Últimos chamados": 6 mais recentes por `updatedAt`, com número, título, categoria, prioridade, status e tempo relativo; cada linha navega para o detalhe.
   - "Chamados críticos": até 5 chamados com prioridade `critica` ou `slaPercent < 30`, com barra de SLA e data de abertura.
2. **Relatório de SLA**: lista por categoria com SLA médio (barra de progresso colorida por faixa) e quantidade de chamados.

### `/desk/tickets` — Chamados (`TicketsList`)

- Cartões de status (`StatusFilterChips`) acima da busca: Todos, Em aberto, Em andamento, Pausado, Finalizado e Aguardando terceiro, cada um com o contador de chamados (2 dígitos, `99+` acima de 99) e cor do status. Clicar filtra a fila; clicar no cartão ativo limpa o filtro.
- Toolbar de busca (número, título ou solicitante) e dois filtros (`Select`): categoria e prioridade (status vem dos cartões).
- Tabela (`DataTable`) de todos os chamados filtrados, colunas: favorito (estrela), número, título/subcategoria, categoria, solicitante/setor, técnico, prioridade, status, SLA, data de abertura, data de atualização. Todas as colunas, exceto a estrela, são ordenáveis por clique no cabeçalho (`sortValue`; prioridade ordena por severidade). Clique na linha navega para o detalhe.
- Modal "Abrir novo chamado" (`NewTicketModal`): título, categoria, subcategoria (dependente da categoria), prioridade, descrição.

### `/desk/categories` — Categorias (`CategoriesPage`)

- Lê o store reativo `useDeskCategories()`; busca por nome/setor/responsável e filtro por setor.
- Grade de cards: nome, setor, responsável, SLA médio (h) e quantidade de subcategorias; clique abre as subcategorias.
- Ações no card: editar (modal `CategoryModal` com nome, setor, responsável e SLA médio) e excluir (`ConfirmDialog`).

### `/desk/categories/$id` — Subcategorias (`SubcategoriesPage`)

- Cabeçalho com setor, responsável e SLA médio da categoria; atalhos "Voltar" e "Gerenciar atendentes".
- Cards de subcategoria com nome e SLA; modal de criação/edição com nome e SLA médio.
- Atendentes NÃO são definidos aqui — a atribuição é exclusiva da tela `/desk/team`.

### `/desk/team` — Atendentes e permissões (`TeamPage`)

- Lista de atendentes (`AGENTS`) com avatar, total de subcategorias atribuídas e chips das 3 primeiras.
- Busca por nome e filtro por setor (limita as categorias exibidas no drawer).
- Ao clicar em um atendente abre um `Drawer` com todas as categorias/subcategorias do escopo: alternar item a item ou usar "Marcar todas"/"Remover todas" por categoria.

### `/desk/tickets/$id` — Detalhe do chamado (`TicketDetail`)

Carregado via `loader` da rota (`ticketService.getById(params.id)`); se não encontrado, exibe `notFoundComponent` com link de volta para a lista.

- Cabeçalho: título, favorito, número, data de abertura, categoria/subcategoria.
- Botões de ação no topo: Transferir, Registrar solução, Reabrir, Encerrar (atualmente sem handler implementado — apenas visuais/placeholder).
- Barra lateral (`aside`):
  - "Detalhes": status, prioridade, SLA (barra + prazo), categoria/subcategoria.
  - "Ações rápidas": três `Select` (QuickSelect) para alterar status, prioridade e categoria — exibidos com valor padrão, sem persistência implementada (apenas UI).
  - "Pessoas": solicitante e técnico responsável (ou "Não atribuído").
  - "Etiquetas": tags do chamado, se houver.
- Painel de timeline com duas abas: "Conversa" (mensagens públicas) e "Comentários internos" (mensagens marcadas como `internal`). Mostra a descrição inicial do chamado e os eventos (`TicketEvent`): mensagens, mudança de status, de prioridade, atribuição de técnico e mudança de categoria.
- Campo de resposta (`Textarea`) com botão "Anexar" e botão "Enviar" — sem persistência implementada (apenas UI, não há chamada de serviço ao enviar).

## Componentes

- `src/components/rooster/desk/badges.tsx`
  - `StatusBadge({ status })` — selo colorido com o rótulo do status (usa `STATUS_LABEL`/`STATUS_TONE`).
  - `PriorityBadge({ priority })` — selo colorido com o rótulo da prioridade (usa `PRIORITY_LABEL`/`PRIORITY_TONE`).
  - `SlaBar({ percent })` — barra de progresso do SLA restante, com cor por faixa (verde/amarelo/vermelho).
- `src/components/rooster/desk/assignee-picker.tsx`
  - `AgentAvatar({ name })` — avatar circular com as iniciais do atendente.
  - `AssigneePicker({ value, onChange })` — seletor múltiplo de atendentes com busca e chips.
- `src/components/rooster/desk/categories-store.ts` — store reativo (`useSyncExternalStore`) das categorias/subcategorias. Não guarda dado semente: importa o seed de `src/mock/database/deskCategories.ts`. Exporta `useDeskCategories()`, `getDeskCategoriesSnapshot()`, `categoriesApi` (`upsert`, `remove`, `addSub`, `updateSub`, `removeSub`), `SECTORS` e `AGENTS`.
- `src/components/rooster/desk/mock-data.ts` — fonte de dados e utilitários do domínio de tickets (também consumido indiretamente por `src/mock/database/tickets.ts`, que reexporta os mesmos tipos/dados renomeando `category` para `categoryId`):
  - Tipos: `TicketStatus`, `TicketPriority`, `TicketCategory`, `TicketEvent`, `Ticket`.
  - Dados semente: `CATEGORIES` (6 categorias fixas: TI, Suporte, Audiovisual, Acadêmico, Financeiro, Predial) e `TICKETS` (15 chamados gerados proceduralmente a partir de nomes/títulos fixos).
  - Dicionários: `PRIORITY_LABEL`, `STATUS_LABEL`, `PRIORITY_TONE`, `STATUS_TONE`.
  - Funções: `categoryName(id)`, `categoryColor(id)`, `formatDate(iso)`, `relative(iso)`.

## Serviços

### `src/services/mock-api/ticket.service.ts` (`ticketService`)

Opera sobre uma cópia em memória de `db.tickets` (`let tickets = [...db.tickets]`) e `db.ticketCategories`, com atraso artificial (`delay`) simulando latência de rede.

| Método | Assinatura | Descrição |
|---|---|---|
| `getAll` | `(filters?: Filters<Ticket>) => Promise<Ticket[]>` | Lista tickets, aplicando filtros genéricos (`applyFilters`). |
| `getById` | `(id: string) => Promise<Ticket \| undefined>` | Busca um ticket pelo id. |
| `create` | `(dto: Omit<Ticket, "id" \| "number" \| "events">) => Promise<Ticket>` | Cria um ticket com id/`number` gerados (`nextId("tk")`) e `events` vazio. |
| `update` | `(id: string, dto: Partial<Ticket>) => Promise<Ticket \| undefined>` | Atualiza campos do ticket (merge raso). |
| `remove` | `(id: string) => Promise<boolean>` | Remove o ticket; retorna se algo foi removido. |
| `search` | `(query: string) => Promise<Ticket[]>` | Busca por título ou número (case-insensitive). |
| `getCategories` | `() => Promise<TicketCategory[]>` | Retorna a lista de categorias. |
| `getByCategory` | `(categoryId: string) => Promise<Ticket[]>` | Filtra tickets por categoria. |

Somente `getAll`, `getById`, `getCategories` e `create` são efetivamente usados pelas telas atuais do módulo (rotas `desk.index.tsx` e `desk.tickets.tsx`).

### `src/services/mock-api/desk-category.service.ts` (`deskCategoryService`)

Superfície REST prevista para a taxonomia de chamados. Opera sobre o store reativo (`categories-store`), cujo seed vem de `src/mock/database/deskCategories.ts`.

| Método | Assinatura | Endpoint previsto |
|---|---|---|
| `getAll` | `(filters?: Filters<DeskCategory>) => Promise<DeskCategory[]>` | `GET /chamados-categorias` |
| `getById` | `(id: string) => Promise<DeskCategory \| undefined>` | `GET /chamados-categorias/:id` |
| `create` | `(dto: Omit<DeskCategory, "id">) => Promise<DeskCategory>` | `POST /chamados-categorias` |
| `update` | `(id, dto: Partial<DeskCategory>) => Promise<DeskCategory \| undefined>` | `PATCH /chamados-categorias/:id` |
| `remove` | `(id: string) => Promise<boolean>` | `DELETE /chamados-categorias/:id` |
| `addSubcategory` | `(categoryId, dto: Omit<DeskSubcategory, "id">)` | `POST /chamados-categorias/:id/subcategorias` |
| `updateSubcategory` | `(categoryId, subId, dto: Partial<DeskSubcategory>)` | `PATCH /chamados-categorias/:id/subcategorias/:subId` |
| `removeSubcategory` | `(categoryId, subId)` | `DELETE /chamados-categorias/:id/subcategorias/:subId` |
| `getAgents` | `() => Promise<string[]>` | `GET /chamados-atendentes` |
| `getSectors` | `() => Promise<string[]>` | `GET /chamados-setores` |
| `setAgentSubcategories` | `(agent: string, subIds: string[]) => Promise<boolean>` | `PUT /chamados-atendentes/:id/subcategorias` |

As telas de categorias/atendentes hoje mutam o store diretamente (`categoriesApi`) para manter a reatividade instantânea; na integração, cada chamada de `categoriesApi` deve ser substituída pelo método equivalente de `deskCategoryService`.

## Dados mockados do módulo

| Tabela (`db`) | Arquivo | Conteúdo | Endpoint previsto |
|---|---|---|---|
| `tickets` | `src/mock/database/tickets.ts` | Chamados (com `categoryId` e `events`). | `/chamados` |
| `ticketCategories` | `src/mock/database/tickets.ts` | Categorias usadas pela fila de chamados. | `/chamados-categorias` |
| `deskCategories` | `src/mock/database/deskCategories.ts` | Categorias + subcategorias (SLA e atendentes). | `/chamados-categorias` |
| `deskSectors` | `src/mock/database/deskCategories.ts` | Setores donos de categorias. | `/chamados-setores` |
| `deskAgents` | `src/mock/database/deskCategories.ts` | Atendentes disponíveis (36 registros). | `/chamados-atendentes` |

Para remover o mock após a integração: apague `src/mock/database/tickets.ts` e `src/mock/database/deskCategories.ts`, tire as entradas de `src/mock/database/index.ts` e de `MOCK_ENDPOINT_MAP`, e troque o corpo de `ticket.service.ts`/`desk-category.service.ts` por chamadas `http`. Nenhuma tela do Desk importa `src/mock` diretamente, exceto os tipos reexportados.

## Estado

- `DeskDashboard`: `tickets` e `categories` (`useState`, populados em `useEffect` via `ticketService`), `tab` (aba ativa: geral/sla). Listas derivadas com `useMemo` (`latest`, `critical`, `byCategory`).
- `TicketsList`: `tickets`, `categories` (carregados via `useEffect`), `q` (busca textual), `cat`/`status`/`priority` (filtros; `status` é controlado pelos cartões), `newOpen` (modal de criação). Contadores por status derivados com `useMemo` (`counts`). A rota também gerencia o parâmetro de busca `new` para abrir o modal de criação automaticamente ao navegar de `/desk`.
- `NewTicketModal`: estado local do formulário (`title`, `categoryId`, `subcategory`, `priority`, `description`, `saving`).
- `CategoriesPage` / `SubcategoriesPage` / `TeamPage`: dados vêm do store `useDeskCategories()`; estado local apenas para busca, filtro de setor, item em edição e visibilidade de modal/drawer.
- `TicketDetail`: `tab` (conversa/comentários internos) e `reply` (texto do campo de resposta, sem persistência); dados do ticket vêm do `loader` da rota (`Route.useLoaderData()`), não de estado React próprio.

## Tabela de botões e ações

| Botão/Ação | Local | O que faz | Serviço chamado |
|---|---|---|---|
| "Novo chamado" | `/desk` (cabeçalho do dashboard) | Navega para `/desk/tickets?new=true`, que abre o modal de criação | Nenhum (navegação) |
| "Ver todos" | `/desk`, card "Últimos chamados" | Navega para `/desk/tickets` | Nenhum (navegação) |
| Linha de chamado (últimos/críticos) | `/desk`, dashboard | Navega para `/desk/tickets/$id` do chamado clicado | Nenhum (navegação) |
| Abas "Visão geral" / "Relatório de SLA" | `/desk`, dashboard | Alterna o conteúdo exibido | Nenhum (estado local `tab`) |
| Cartões de status (Todos/Em aberto/Em andamento/Pausado/Finalizado/Aguardando terceiro) | `/desk/tickets`, acima da busca | Filtra a fila pelo status; clicar no cartão ativo limpa o filtro | Nenhum (estado local `status`) |
| Cabeçalho de coluna da tabela | `/desk/tickets` | Ordena a fila por aquela coluna (asc/desc) | Nenhum (ordenação em memória no `DataTable`) |
| "Novo chamado" | `/desk/tickets` (cabeçalho) | Abre o modal de criação de chamado | Nenhum até enviar |
| Campo de busca + filtros (categoria/status/prioridade) | `/desk/tickets`, toolbar | Filtra a tabela localmente | Nenhum (filtro em memória sobre `tickets`) |
| Clique em linha da tabela | `/desk/tickets` | Navega para `/desk/tickets/$id` | Nenhum (navegação) |
| "Enviar chamado" | Modal "Abrir novo chamado" | Valida título/categoria e cria o chamado, fecha o modal e insere na lista | `ticketService.create(dto)` |
| "Cancelar" | Modal "Abrir novo chamado" | Fecha o modal sem salvar | Nenhum |
| "Transferir" | `/desk/tickets/$id`, cabeçalho | Botão visual, sem ação implementada | Nenhum |
| "Registrar solução" | `/desk/tickets/$id`, cabeçalho | Botão visual, sem ação implementada | Nenhum |
| "Reabrir" | `/desk/tickets/$id`, cabeçalho | Botão visual, sem ação implementada | Nenhum |
| "Encerrar" | `/desk/tickets/$id`, cabeçalho | Botão visual, sem ação implementada | Nenhum |
| Seletores "Alterar status/prioridade/categoria" (Ações rápidas) | `/desk/tickets/$id`, barra lateral | Exibem valor atual; troca de seleção não persiste (sem handler de submit) | Nenhum |
| Abas "Conversa" / "Comentários internos" | `/desk/tickets/$id`, timeline | Alterna quais eventos são exibidos (públicos vs. internos) | Nenhum (estado local `tab`) |
| "Nova categoria" / editar / excluir | `/desk/categories` | Abre modal de categoria ou confirmação de exclusão e grava no store | `categoriesApi.upsert` / `categoriesApi.remove` |
| Card de categoria | `/desk/categories` | Navega para `/desk/categories/$id` | Nenhum (navegação) |
| "Nova subcategoria" / editar / excluir | `/desk/categories/$id` | Cria, edita ou remove subcategoria (nome + SLA médio) | `categoriesApi.addSub` / `updateSub` / `removeSub` |
| "Gerenciar atendentes" | `/desk/categories/$id` | Navega para `/desk/team` | Nenhum (navegação) |
| Card de atendente | `/desk/team` | Abre o drawer de permissões do atendente | Nenhum (estado local) |
| Subcategoria no drawer / "Marcar todas" / "Remover todas" | `/desk/team` | Adiciona ou remove o atendente das subcategorias | `categoriesApi.updateSub` |
| "Anexar" | `/desk/tickets/$id`, caixa de resposta | Botão visual, sem ação implementada | Nenhum |
| "Enviar" (resposta) | `/desk/tickets/$id`, caixa de resposta | Botão visual, sem ação implementada (não persiste `reply`) | Nenhum |

Observação: diversas ações de detalhe do chamado (transferir, registrar solução, reabrir, encerrar, alterar status/prioridade/categoria via ações rápidas, enviar resposta/anexo) existem apenas como elementos de interface nesta versão; não há integração com `ticketService` para essas operações.
