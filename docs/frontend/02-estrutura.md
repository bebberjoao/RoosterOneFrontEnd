# Estrutura de diretorios

Arvore de `src/` (confirmada via listagem direta do repositorio):

```
src/
  assets/              Ativos estaticos (ex.: rooster-logo.png.asset.json)
  components/
    rooster/           Componentes de dominio do Rooster One (nao genericos)
      hub/              CRUD generico do Hub, catalogo/contexto de permissoes
      desk/             Store e widgets especificos do Desk
      rooms/            badges.tsx, labels.ts (rotulos/tons/helpers canonicos) e mock-data.ts (hoje so TIPOS)
      assets/           Store, formulario e permissions.ts do Assets
      finance/          badges.tsx, format.ts e permissions.ts do Finance
      student/          Busca global (student/global-search.tsx), ui.tsx e mock-data.ts (avisos/documentos de exemplo do portal)
      academy/          manage/ = abas de gestao academica (disciplines/classes/teachers/students/calendar-tab.tsx + user-picker.tsx); badges.tsx, permissions.ts e event-labels.ts (EVENT_TONE/EVENT_LABEL)
      learn/            badges.tsx; forms-store.ts = construtor de formularios local (sem endpoint), semeado por forms-seed.ts
      boost/            manage/ = abas de gestao do curso (badges, conteudo, detalhes, alunos/chat)
      auth-context.tsx        Sessao real (login/logout)
      role-context.tsx        Perfil de interface DEDUZIDO das permissoes reais (deriveRole) + useCurrentPerson() (nome do usuario logado)
      notifications/          Notificacoes reais: use-notificacoes.ts (estado compartilhado + polling), notification-bell.tsx (sino da barra superior), notifications-list.tsx (pagina completa)
      theme-context.tsx       Tema claro/escuro (localStorage)
      module-config.ts        Catalogo de modulos/menus e roles permitidas
      app-shell.tsx            Layout autenticado (ver 01-arquitetura.md)
      app-sidebar.tsx          Menu lateral
      app-topbar.tsx           Barra superior (busca, sino de notificacoes, tema, logout)
      page-header.tsx          Cabecalho padrao de pagina
      global-command-palette.tsx  Command palette global (Ctrl/Cmd+K): GlobalSearchProvider + GlobalCommandPalette, montados no app-shell
    shared/            Componentes de UI genericos reutilizaveis entre modulos
      primitives.tsx    Chip, StatusChip, StatCard, SectionCard, Avatar, EmptyState, Btn, Table, Pagination
      data-table.tsx    DataTable generica (sort, paginacao, empty state)
      crud-page.tsx     CrudHeader, CrudToolbar, Breadcrumbs
      overlays.tsx      Modal, Drawer, ConfirmDialog
      form.tsx          Field, TextInput, TextArea, SelectInput, FileUpload
      dropdown.tsx      PopoverSelect (base do SelectInput/Select)
      tabs.tsx, tree-view.tsx
      index.ts          Reexporta tudo (import unico via "@/components/shared")
    ui/                Primitivos Radix/shadcn (button, dialog, table, sidebar, command, etc.) - form.tsx foi removido
  hooks/
    use-mobile.tsx              Hook de breakpoint (usado pela sidebar responsiva)
    use-ticket-socket.ts        WebSocket do chat do Desk - ver 06-integracao-api.md
    use-boost-conversas-socket.ts  WebSocket das conversas do Boost (lado orientador): sala da conversa aberta + aviso da caixa de entrada
    use-boost-portal-socket.ts     WebSocket da conversa do aluno externo com o orientador
  lib/
    utils.ts             cn() (clsx + tailwind-merge)
    error-capture.ts      Captura de erro fora de banda para o SSR
    error-page.ts         HTML estatico de fallback de erro
    lovable-error-reporting.ts  Ponte de telemetria com o editor Lovable
  mock/
    database/           Nome historico. Hoje sao 10 arquivos, e nenhum alimenta a aplicacao em runtime:
                        4 deles (rooms, blocks, campuses, reservations) sao SO reexport de tipo;
                        os demais (assets*, tickets, deskCategories) guardam tipos e dados de exemplo
                        que nao sao lidos pelas telas reais. Ver docs/engineering/08-divida-tecnica.md
                        (limpeza de codigo morto) no repo do backend.
  routes/              Rotas por arquivo (TanStack Router) - ver 03-paginas-e-rotas.md
    README.md            Convencao oficial de nomes de arquivo de rota
    __root.tsx            Root route / shell HTML / providers globais
  services/
    hub/                Cliente HTTP central e servicos do Rooster Hub (backend real)
      client.ts           request/uploadFile/requestBlob, ApiError/ApiUnavailableError
      session.ts           Sessao JWT (localStorage)
      mapped-resource.ts    mapResource(): traducao de campos PT (backend) / EN (tela)
      types.ts              Tipos espelhando os DTOs/schema Prisma do backend
      validation.ts          Helpers de validacao client-side
      index.ts               createResource(), HubResource, offlineState, servicos do Hub
    boost-portal/       Sessao e cliente HTTP SEPARADOS do portal publico do Boost
      auth-context.tsx    Sessao do aluno externo (BoostUsuario), independente do Hub
      client.ts           Cliente HTTP proprio (token com claim tipo='boost')
      session.ts          Chaves de localStorage distintas das do Hub
      cursos.service.ts   Catalogo/matricula/progresso do portal publico
    mock-api/           Um "*.service.ts" por modulo. Nome historico: TODOS os 9 falam com a API
                        real via services/hub/client.ts - nenhum le dado mockado em runtime.
  router.tsx           createRouter() + QueryClient
  server.ts            Entrypoint de fetch do servidor (Nitro/Cloudflare)
  start.ts             createStart() + middleware de erro
  styles.css           Entrada do Tailwind
  routeTree.gen.ts     Gerado - nao editar
```

Status: Implementado (arvore extraida da listagem real do repositorio).
