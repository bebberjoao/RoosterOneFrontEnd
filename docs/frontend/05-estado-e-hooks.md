# Estado e Hooks

## Contextos globais (montados em `__root.tsx`)

`QueryClientProvider → ThemeProvider → AuthProvider → RoleProvider`; ver `01-arquitetura.md`.

- **`auth-context.tsx` (`useAuth`)**: sessão: `authed`, `ready`, `usuario`, `login`, `logout`,
  `requestPasswordReset` e `resetPassword`.
- **`role-context.tsx` (`useRole` e `useCurrentPerson`)**: o perfil de interface (administrador, professor, aluno
  etc.) é **deduzido das permissões efetivas da sessão** (`deriveRole`), sem troca manual; `useCurrentPerson()`
  devolve o nome e as iniciais do usuário autenticado. Ver `08-autorizacao.md`.
- **`notifications/use-notificacoes.ts` (`useNotificacoes`)**: caixa de entrada, com **um único estado
  compartilhado** entre o ícone da barra superior, a página `/notifications` e o painel do aluno, que exibem sempre a
  mesma quantidade de não lidas. Consulta `GET /notificacoes/minhas` na montagem, a cada 30 segundos e no retorno do
  foco à aba; a marcação como lida é otimista (atualiza a tela de imediato e recarrega em caso de falha da API); a
  caixa é limpa na troca de usuário.
- **`theme-context.tsx`**: tema claro ou escuro, persistido em `localStorage`.

O portal do Boost possui contexto de autenticação próprio (`src/services/boost-portal/auth-context.tsx`), montado no
layout `boost-portal.tsx`; ver `07-autenticacao.md`.

## Contextos montados no `AppShell` (apenas em rota autenticada)

- **`PermissionProvider`** (`hub/permission-context.tsx`): permissões efetivas para o controle da interface
  (exibição de menus e ações). Ver `08-autorizacao.md`.
- **`AssetsProvider`** (`assets/store.tsx`): apenas em `/assets`; estado de patrimônio, categorias, setores e
  movimentações, com métodos que acionam a API (`registerMovement`, `returnLoan` etc.).
- **`SidebarProvider`**: estado de recolhimento do menu lateral (Radix/shadcn).

## `@tanstack/react-query`: instalado, sem uso na busca de dados

O `QueryClient` é criado em `router.tsx`, e o `QueryClientProvider` envolve toda a aplicação, mas **nenhuma tela
utiliza `useQuery` ou `useMutation`**, conforme verificado por busca em `src/`. A busca de dados segue o padrão manual
`useEffect` e `useState`, com chamada direta a método de `src/services/mock-api/*.service.ts`. A infraestrutura do
TanStack Query está disponível, mas não constitui, atualmente, o mecanismo de busca de dados da aplicação.

## Padrão predominante de busca de dados

```tsx
const [dados, setDados] = useState<T[]>([]);
useEffect(() => { algumService.getAll().then(setDados); }, []);
```

O padrão repete-se nas telas que relacionam dados; não há hook personalizado reutilizado entre módulos (por exemplo,
`useResource`), e cada tela declara os próprios `useState` e `useEffect`.

As telas de Academy (gestão), Learn e Student seguem o mesmo padrão:

- **Recarga após alteração**: as abas de `academy.manage.tsx` utilizam o contador
  `const [refresh, setRefresh] = useState(0)` como dependência do `useEffect` de busca; toda ação de criação,
  edição, exclusão ou ativação executa `setRefresh((r) => r + 1)` ao final, forçando nova consulta, em vez de
  atualizar o estado local de forma otimista.
- **Estado "sem vínculo" nas telas do aluno**: as rotas `/student/*` e `/learn/student` chamam
  `studentService.getMyEnrollments()` ou `learnService.getMyActivities()` no `useEffect` e tratam o erro em
  `catch(() => setNoLink(true))`; quando o usuário não possui `Aluno` vinculado, a tela exibe `EmptyState` ("Sem
  vínculo de aluno"), sem propagar o erro. Ver `10-tratamento-erros.md`.
- Nenhuma dessas telas utiliza `react-query`; o padrão manual permanece o único mecanismo de busca de dados.

## Hooks personalizados (`src/hooks/`)

- **`use-mobile.tsx`**: detecção de largura de tela, utilizada pelo menu lateral responsivo.
- **`use-ticket-socket.ts`**: conexão ao WebSocket do backend (namespace `/desk`; ver
  `docs/engineering/05-fluxos-tecnicos.md` no repositório do backend) para o recebimento de novas mensagens no chamado
  aberto, autenticada por `getApiToken()` (`services/hub/session.ts`).
- **`use-boost-conversas-socket.ts`**: WebSocket das conversas do Boost para o orientador (namespace `/boost`), com a
  sala da conversa aberta e os avisos da caixa de entrada.
- **`use-boost-portal-socket.ts`**: WebSocket da conversa do aluno externo com os orientadores, autenticado pelo
  token do portal do Boost.

## Estado local de formulário

Não há `react-hook-form` (removido em setembro de 2026, por falta de uso): os formulários utilizam `useState` por
campo e função de validação síncrona por campo (por exemplo, `HubField.validate` no `HubCrud`). Ver
`09-validacoes.md`.
