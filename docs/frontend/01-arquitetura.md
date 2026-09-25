# Arquitetura

## Stack confirmada (`package.json`)

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Framework | TanStack Start | `^1.168.26` |
| Roteamento | TanStack Router (file-based) | `^1.170.16` |
| UI | React | `^19.2.0` |
| Build | Vite | `^8.0.16` |
| CSS | Tailwind CSS | `^4.2.1` |
| Componentes | Radix UI (primitivos em `src/components/ui`, estilo shadcn) | várias |
| Data layer instalado | `@tanstack/react-query` | `^5.101.1` |
| Realtime | `socket.io-client` | `^4.8.3` |

Status: **Implementado.**

## Inicialização da aplicação

Três arquivos de bootstrap na raiz de `src/`:

1. **`src/start.ts`** — cria a instância do TanStack Start (`createStart`) com um `errorMiddleware` de servidor que captura exceções não tratadas e devolve uma página HTML estática de erro (`renderErrorPage()`, de `src/lib/error-page.ts`) em vez de deixar o request quebrar sem resposta.
2. **`src/server.ts`** — o entrypoint de fetch usado pelo runtime de servidor (Nitro/Cloudflare, via o preset `@lovable.dev/vite-tanstack-config`). Chama o handler gerado por `@tanstack/react-start/server-entry` e faz uma normalização extra: quando o `h3` (servidor interno do TanStack Start) engole um throw e devolve um JSON genérico `{"unhandled":true,"message":"HTTPError"}` com status >= 500, esse arquivo detecta o padrão e troca a resposta pela página de erro estática, recuperando o erro original registrado por `src/lib/error-capture.ts` (que faz monkey-patch de `console.error` para guardar o último erro real).
3. **`src/router.tsx`** — `createRouter({ routeTree, context: { queryClient }, scrollRestoration: true, defaultPreloadStaleTime: 0 })`. Cria um `QueryClient` do TanStack Query e o injeta no contexto do router.

`src/routeTree.gen.ts` é gerado automaticamente pelo plugin de roteamento do TanStack a partir dos arquivos em `src/routes/`. **Não deve ser editado manualmente** (ver `src/routes/README.md`).

## Root route (`src/routes/__root.tsx`)

`createRootRouteWithContext<{ queryClient: QueryClient }>()` define:

- `shellComponent: RootShell` — o `<html><head><HeadContent/></head><body>{children}<Scripts/></body></html>` renderizado no SSR (documento HTML completo).
- `component: RootComponent` — a árvore de providers globais, montada uma única vez para toda a aplicação:

```
QueryClientProvider (queryClient do router)
  -> ThemeProvider
       -> AuthProvider
            -> RoleProvider
                 -> <Outlet /> (rotas filhas)
```

- `notFoundComponent` / `errorComponent` — páginas de fallback para rota inexistente (404) e para erro não capturado por nenhum error boundary mais específico. `errorComponent` também dispara `reportLovableError` (telemetria do editor Lovable, ver `src/lib/lovable-error-reporting.ts`) em `useEffect`.

Status: **Implementado** (lido diretamente de `src/routes/__root.tsx`).

### Providers montados fora da raiz

Nem todos os providers ficam no root — alguns só existem dentro de layouts específicos:

- **`PermissionProvider`** (`src/components/rooster/hub/permission-context.tsx`) é montado dentro de `AppShell` (`src/components/rooster/app-shell.tsx`), ou seja, uma vez por navegação autenticada, não no root. Ver `08-autorizacao.md` para o funcionamento e o acoplamento com `RoleProvider`.
- **`AssetsProvider`** (`src/components/rooster/assets/store.tsx`) só envolve as rotas dentro de `/assets` (montado em `src/routes/assets.tsx`).
- **`SidebarProvider`** (Radix/shadcn, `src/components/ui/sidebar.tsx`) também é montado dentro de `AppShell`.

## `AppShell` — o layout autenticado

`src/components/rooster/app-shell.tsx` é o componente que todo layout de módulo (`hub.tsx`, `desk.tsx`, `rooms.tsx`, `assets.tsx`, `finance.tsx`, `student.tsx`, `academy.tsx`, `learn.tsx`, `boost.tsx`, `settings.tsx`, e também `index.tsx`) usa para envolver seu `<Outlet />`. Ele:

1. Lê `authed`/`ready` de `useAuth()`. Se `ready && !authed`, redireciona para `/login` via `navigate({ to: "/login", replace: true })`.
2. Enquanto `!ready || !authed`, renderiza um esqueleto de carregamento (`Skeleton` de cabeçalho, cartões e bloco de conteúdo) — evita "flash" de conteúdo protegido sem deixar a tela vazia.
3. Envolve o conteúdo em `PermissionProvider` -> `GlobalSearchProvider` (command palette Ctrl/Cmd+K) -> `SidebarProvider` -> `AppSidebar` + `AppTopbar` + `<main>` com `RequireAccess route={pathname}` (bloqueia a tela se o usuário ativo não tiver a permissão de acesso — ver `08-autorizacao.md`).

`login.tsx` e `redefinir-senha.tsx` **não** usam `AppShell` — são as únicas rotas públicas.

## Build/dev

- `vite.config.ts` usa o preset `@lovable.dev/vite-tanstack-config`, que já inclui TanStack devtools, `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, Nitro (alvo padrão Cloudflare) e injeção de `VITE_*`. O próprio comentário do arquivo avisa para não duplicar esses plugins manualmente.
- Alias de import `@/*` -> `./src/*` (`tsconfig.json`).
- Scripts (`package.json`): `dev` (`vite dev`), `build`, `build:dev`, `preview`, `lint`, `format`.

Status: **Implementado.**
