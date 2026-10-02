# Estrutura de diretórios

Árvore de `src/`, extraída da listagem do repositório (revisão de 01/10/2026):

```
src/
  assets/              Recursos estáticos importados pelo Vite (rooster-logo.png, logotipo do sistema)
  components/
    rooster/           Componentes de domínio do Rooster One (não genéricos)
      hub/              CRUD genérico do Hub; catálogo e contexto de permissões
      desk/             Estado e componentes específicos do Desk
      rooms/            badges.tsx, labels.ts (rótulos, tons e funções auxiliares) e mock-data.ts (apenas tipos)
      assets/           Estado, formulário e permissions.ts do Assets
      finance/          badges.tsx, format.ts e permissions.ts do Finance
      student/          Busca global (student/global-search.tsx), ui.tsx e mock-data.ts (avisos e documentos de exemplo do portal)
      academy/          manage/ (abas de gestão acadêmica: disciplinas, turmas, professores, alunos, calendário e user-picker.tsx);
                        badges.tsx, permissions.ts e event-labels.ts (EVENT_TONE e EVENT_LABEL)
      learn/            badges.tsx; questions.tsx (editor, preenchimento e resultado das questões) e questions-utils.ts;
                        submission-modals.tsx (modais de resposta e revisão, compartilhados por Learn e Student)
      boost/            manage/ (abas de gestão do curso: identificação, conteúdo, detalhes, alunos e conversas)
      auth-context.tsx        Sessão (login e logout)
      role-context.tsx        Perfil de interface deduzido das permissões efetivas (deriveRole) e useCurrentPerson() (nome do usuário)
      notifications/          Notificações: use-notificacoes.ts (estado compartilhado e consulta periódica),
                              notification-bell.tsx (ícone da barra superior) e notifications-list.tsx (página completa)
      theme-context.tsx       Tema claro e escuro (localStorage)
      module-config.ts        Catálogo de módulos e menus e perfis permitidos
      app-shell.tsx           Layout autenticado (ver 01-arquitetura.md)
      app-sidebar.tsx         Menu lateral
      app-topbar.tsx          Barra superior (busca, notificações, tema e saída)
      page-header.tsx         Cabeçalho padrão de página
      global-command-palette.tsx  Paleta de comandos global (Ctrl/Cmd+K): GlobalSearchProvider e GlobalCommandPalette, montados no app-shell
    shared/            Componentes genéricos de interface, reutilizados entre módulos
      primitives.tsx    Chip, StatusChip, StatCard, SectionCard, Avatar, EmptyState, Btn, Table e Pagination
      data-table.tsx    DataTable genérica (ordenação, paginação e estado vazio)
      crud-page.tsx     CrudHeader, CrudToolbar e Breadcrumbs
      overlays.tsx      Modal, Drawer e ConfirmDialog
      form.tsx          Field, TextInput, TextArea, SelectInput e FileUpload
      dropdown.tsx      PopoverSelect (base de SelectInput e Select)
      tabs.tsx, tree-view.tsx
      index.ts          Reexportação (importação única por "@/components/shared")
    ui/                Primitivos Radix/shadcn (button, dialog, table, sidebar, command etc.)
  hooks/
    use-mobile.tsx                 Detecção de largura de tela (menu lateral responsivo)
    use-ticket-socket.ts           WebSocket da conversa do Desk (ver 06-integracao-api.md)
    use-boost-conversas-socket.ts  WebSocket das conversas do Boost (orientador): sala da conversa aberta e aviso da caixa de entrada
    use-boost-portal-socket.ts     WebSocket da conversa do aluno externo com o orientador
  lib/
    utils.ts                    cn() (clsx e tailwind-merge)
    formatacao.ts               Formatação de exibição no padrão brasileiro: datas (dd/mm/aaaa), horários, números,
                                percentuais, moeda e tamanho de arquivo (ver 11-guia-desenvolvedor.md)
    error-capture.ts            Captura de erro para a renderização no servidor
    error-page.ts               Página HTML estática de erro
    lovable-error-reporting.ts  Integração de telemetria com o editor Lovable
  mock/
    database/          Denominação histórica. Contém dez arquivos, nenhum utilizado pela aplicação em execução:
                       quatro (rooms, blocks, campuses e reservations) apenas reexportam tipos; os demais
                       (assets*, tickets e deskCategories) contêm tipos e dados de exemplo não consumidos pelas telas.
                       Ver docs/engineering/08-divida-tecnica.md, no repositório do backend.
  routes/              Rotas por arquivo (TanStack Router); ver 03-paginas-e-rotas.md
    README.md            Convenção de nomes dos arquivos de rota
    __root.tsx           Rota raiz, documento HTML e providers globais
  services/
    hub/                Cliente HTTP central e serviços do Rooster Hub
      client.ts           request, uploadFile, requestBlob e uploadFileWithProgress; ApiError e ApiUnavailableError; renovação de sessão
      session.ts          Sessão (access token e refresh token, em localStorage)
      mapped-resource.ts  mapResource(): conversão de campos entre a nomenclatura do backend e a das telas
      types.ts            Tipos correspondentes aos DTOs e ao schema Prisma do backend
      validation.ts       Funções auxiliares de validação no cliente
      notificacoes.ts     Serviço da caixa de notificações
      configuracoes.ts    Serviço de configurações (e-mail)
      index.ts            createResource(), HubResource, offlineState e serviços do Hub
    boost-portal/       Sessão e cliente HTTP próprios do portal público do Boost
      auth-context.tsx    Sessão do aluno externo (BoostUsuario), independente do Hub
      client.ts           Cliente HTTP próprio (token com tipo='boost')
      session.ts          Chaves de localStorage distintas das do Hub
      cursos.service.ts   Catálogo, matrícula, progresso, conversa e verificação de certificado
    mock-api/           Um "*.service.ts" por módulo. Denominação histórica: os nove serviços comunicam-se com a API
                        por services/hub/client.ts, e nenhum utiliza dados simulados em execução.
  test/
    setup.ts            Configuração dos testes (Vitest e Testing Library)
  router.tsx           createRouter() e QueryClient
  server.ts            Ponto de entrada do servidor (Nitro)
  start.ts             createStart() e middleware de erro
  styles.css           Entrada do Tailwind
  routeTree.gen.ts     Arquivo gerado; não deve ser editado
```

Os testes automatizados residem junto ao código testado, em arquivos `*.test.ts` e `*.test.tsx` (por exemplo,
`src/services/hub/client.test.ts` e `src/components/shared/acessibilidade.test.tsx`).

Situação: implementado (árvore extraída da listagem do repositório).
