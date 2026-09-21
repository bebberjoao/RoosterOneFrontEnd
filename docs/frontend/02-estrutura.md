# Estrutura de diretorios

Arvore de `src/` (confirmada via listagem direta do repositorio):

```
src/
  assets/              Ativos estaticos (ex.: rooster-logo.png.asset.json)
  components/
    rooster/           Componentes de dominio do Rooster One (nao genericos)
      hub/              CRUD generico do Hub, catalogo/contexto de permissoes
      desk/             Store e widgets especificos do Desk
      rooms/            Badges/labels/mock-data do Rooms
      assets/           Store, formulario e mock-data do Assets
      finance/          Store, badges, nav e mock-data do Finance (mock)
      student/          Busca global (student/global-search.tsx) e UI (ui.tsx, real via studentService/learnService/academyService); mock-data.ts restante cobre so Financeiro/Documentos/Notificacoes (mock, fora de escopo)
      academy/          manage/ = abas de gestao academica (disciplines/classes/teachers/students/calendar-tab.tsx + user-picker.tsx), reais via academyService; badges.tsx e permissions.ts tambem reais; mock-data.ts remanescente usado so por /academy, /academy/attendance e /academy/grades (mock)
      learn/            badges.tsx real (usado por learn.*.tsx); forms-store.ts e mock-data.ts sao o banco de questoes/quiz antigo, mantido so porque academy.grades.tsx (fora de escopo) ainda importa (mock)
      boost/            Badges e mock-data (mock)
      auth-context.tsx        Sessao real (login/logout)
      role-context.tsx        Seletor de persona de demonstracao ("Visao")
      role-switcher.tsx       Dropdown do RoleSwitcher (usa role-context)
      theme-context.tsx       Tema claro/escuro (localStorage)
      module-config.ts        Catalogo de modulos/menus e roles permitidas
      app-shell.tsx            Layout autenticado (ver 01-arquitetura.md)
      app-sidebar.tsx          Menu lateral
      app-topbar.tsx           Barra superior (busca, tema, RoleSwitcher, logout)
      page-header.tsx          Cabecalho padrao de pagina
    shared/            Componentes de UI genericos reutilizaveis entre modulos
      primitives.tsx    Chip, StatusChip, StatCard, SectionCard, Avatar, EmptyState, Btn, Table, Pagination
      data-table.tsx    DataTable generica (sort, paginacao, empty state)
      crud-page.tsx     CrudHeader, CrudToolbar, Breadcrumbs
      overlays.tsx      Modal, Drawer, ConfirmDialog
      form.tsx          Field, TextInput, TextArea, SelectInput, FileUpload
      dropdown.tsx      PopoverSelect (base do SelectInput/Select)
      tabs.tsx, tree-view.tsx
      index.ts          Reexporta tudo (import unico via "@/components/shared")
    ui/                Primitivos Radix/shadcn (button, dialog, table, sidebar, form, etc.)
  hooks/
    use-mobile.tsx      Hook de breakpoint (usado pela sidebar responsiva)
    use-ticket-socket.ts Hook de WebSocket (Desk) - ver 06-integracao-api.md
  lib/
    utils.ts             cn() (clsx + tailwind-merge)
    error-capture.ts      Captura de erro fora de banda para o SSR
    error-page.ts         HTML estatico de fallback de erro
    lovable-error-reporting.ts  Ponte de telemetria com o editor Lovable
  mock/
    database/           "Tabelas" mockadas - um arquivo por entidade (arrays estaticos)
    index.ts             Agrega tudo em mockDatabase/db e define MOCK_ENDPOINT_MAP
    modules.ts           MODULE_MANIFEST: mapa modulo para rotas/servicos/tabelas/endpoint
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
    mock-api/           Um "*.service.ts" por modulo - alguns reais, alguns 100% mock
  router.tsx           createRouter() + QueryClient
  server.ts            Entrypoint de fetch do servidor (Nitro/Cloudflare)
  start.ts             createStart() + middleware de erro
  styles.css           Entrada do Tailwind
  routeTree.gen.ts     Gerado - nao editar
```

Status: Implementado (arvore extraida da listagem real do repositorio).
