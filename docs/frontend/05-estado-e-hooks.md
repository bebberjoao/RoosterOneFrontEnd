# Estado e Hooks

## Contexts globais (montados no `__root.tsx`)

`QueryClientProvider → ThemeProvider → AuthProvider → RoleProvider` — ver `01-arquitetura.md`.

- **`auth-context.tsx` (`useAuth`)** — sessão real: `authed`, `ready`, `usuario`, `login`, `logout`, `requestPasswordReset`, `resetPassword`.
- **`role-context.tsx` (`useRole`)** — seletor de persona de **demonstração** ("Visão"), não é a sessão real. Ver `08-autorizacao.md` para o acoplamento entre os dois.
- **`theme-context.tsx`** — tema claro/escuro, persistido em `localStorage`.

## Contexts montados dentro de `AppShell` (só em rota autenticada)

- **`PermissionProvider`** (`hub/permission-context.tsx`) — permissões efetivas para controle de UI (esconder/mostrar menu e ação). Ver `08-autorizacao.md`.
- **`AssetsProvider`** (`assets/store.tsx`) — só dentro de `/assets`: estado de patrimônio, categorias, setores, movimentações, com métodos que já chamam a API real (`registerMovement`, `returnLoan`, etc.).
- **`SidebarProvider`** — estado de colapso do menu lateral (Radix/shadcn).

## `@tanstack/react-query` — instalado, não usado para data fetching

`QueryClient` é criado em `router.tsx` e o `QueryClientProvider` envolve toda a aplicação, mas **nenhuma tela usa `useQuery`/`useMutation`** — confirmado por busca em todo `src/`. Toda a busca de dado real segue o padrão manual `useEffect` + `useState` chamando um método de `src/services/mock-api/*.service.ts` diretamente. O TanStack Query está com a infraestrutura pronta (client + provider) mas não é, hoje, o mecanismo de data fetching do app.

## Padrão predominante de busca de dado em tela

```tsx
const [dados, setDados] = useState<T[]>([]);
useEffect(() => { algumService.getAll().then(setDados); }, []);
```

Repetido em praticamente toda tela que lista dado real — não há um hook customizado tipo `useResource` reaproveitado entre módulos (cada tela declara seu próprio `useState`/`useEffect`).

As telas de Academy (gestão), Learn e Student seguem o mesmo padrão desde que passaram a consumir API real:

- **Recarga após mutação**: as abas de `academy.manage.tsx` usam um contador `const [refresh, setRefresh] = useState(0)` como dependência do `useEffect` de busca; toda ação de criar/editar/excluir/ativar chama `setRefresh((r) => r + 1)` no final para forçar um novo `getAll()` em vez de atualizar o estado local otimisticamente.
- **Estado "sem vínculo" em telas de aluno**: as rotas `/student/*` e `/learn/student` chamam `studentService.getMyEnrollments()`/`learnService.getMyActivities()` no `useEffect` e capturam o erro num `catch(() => setNoLink(true))` — quando o usuário logado não tem `Aluno` vinculado, a tela renderiza um `EmptyState` ("Sem vínculo de aluno") em vez de propagar o erro. Ver o padrão completo (por que isso não é um `ApiError`) em `10-tratamento-erros.md`.
- Nenhuma dessas telas passou a usar `react-query` — o padrão manual `useEffect` + `useState` permanece o único mecanismo de data fetching também em Academy/Learn/Student.

## Hooks customizados (`src/hooks/`)

- **`use-mobile.tsx`** — hook de breakpoint, usado pela sidebar responsiva.
- **`use-ticket-socket.ts`** — conecta ao WebSocket do backend (`namespace /desk`, ver `docs/engineering/05-fluxos-tecnicos.md` no backend) para receber push de mensagem nova em um chamado aberto; usa `getApiToken()` de `services/hub/session.ts` para autenticar o socket.

## Estado local de formulário

Sem `react-hook-form` em uso real (só existe como dependência de um componente base em `components/ui/form.tsx`, não instanciado por nenhuma tela) — formulários usam `useState` por campo e uma função de validação síncrona por campo (ex.: `HubField.validate` em `HubCrud`). Ver `09-validacoes.md`.
