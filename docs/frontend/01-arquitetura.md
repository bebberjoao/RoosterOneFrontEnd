# Arquitetura

## Tecnologias (`package.json`)

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Framework | TanStack Start (renderização no servidor) | `^1.168.26` |
| Roteamento | TanStack Router (rotas por arquivo) | `^1.170.16` |
| Interface | React | `^19.2.0` |
| Build | Vite | `^8.0.16` |
| CSS | Tailwind CSS | `^4.2.1` |
| Componentes | Radix UI (primitivos em `src/components/ui`, no padrão shadcn) | diversas |
| Camada de dados instalada | `@tanstack/react-query` | `^5.101.1` |
| Tempo real | `socket.io-client` | `^4.8.3` |
| Testes | Vitest e Testing Library | ver `package.json` |

Situação: **implementado**.

## Inicialização da aplicação

Três arquivos de inicialização na raiz de `src/`:

1. **`src/start.ts`**: cria a instância do TanStack Start (`createStart`) com um `errorMiddleware` de servidor, que
   captura exceções não tratadas e devolve página HTML estática de erro (`renderErrorPage()`, de
   `src/lib/error-page.ts`), em vez de encerrar a requisição sem resposta.
2. **`src/server.ts`**: ponto de entrada de requisições do servidor (Nitro, por meio do preset
   `@lovable.dev/vite-tanstack-config`). Invoca o handler gerado por `@tanstack/react-start/server-entry` e realiza uma
   normalização adicional: quando o `h3` (servidor interno do TanStack Start) intercepta uma exceção e devolve o JSON
   genérico `{"unhandled":true,"message":"HTTPError"}` com status igual ou superior a 500, o arquivo identifica o
   padrão e substitui a resposta pela página de erro estática, recuperando o erro original registrado por
   `src/lib/error-capture.ts` (que intercepta `console.error` para guardar o último erro).
3. **`src/router.tsx`**: `createRouter({ routeTree, context: { queryClient }, scrollRestoration: true,
   defaultPreloadStaleTime: 0 })`, que cria um `QueryClient` do TanStack Query e o injeta no contexto do roteador.

`src/routeTree.gen.ts` é gerado automaticamente pelo plugin de roteamento do TanStack a partir dos arquivos de
`src/routes/` e **não deve ser editado manualmente** (ver `src/routes/README.md`).

## Rota raiz (`src/routes/__root.tsx`)

`createRootRouteWithContext<{ queryClient: QueryClient }>()` define:

- `shellComponent: RootShell`: o documento HTML completo (`<html><head><HeadContent/></head><body>{children}<Scripts/></body></html>`),
  renderizado no servidor;
- `component: RootComponent`: a árvore de providers globais, montada uma única vez para toda a aplicação:

```
QueryClientProvider (queryClient do roteador)
  -> ThemeProvider
       -> AuthProvider
            -> RoleProvider
                 -> AssistenteProvider (conversa do assistente)
                      -> TourProvider (roteiro guiado em execução)
                           -> <Outlet /> (rotas filhas)
```

O `AssistenteProvider` e o `TourProvider` ficam na raiz, e não no `AppShell`, porque o `AppShell` é montado de novo
a cada módulo (cada layout de módulo o instancia): na raiz, a conversa e o roteiro guiado sobrevivem à navegação
entre módulos, que o próprio roteiro realiza. Ambos são esvaziados ao encerrar a sessão.

- `notFoundComponent` e `errorComponent`: páginas de contingência para rota inexistente (404) e para erro não
  capturado por error boundary mais específico. O `errorComponent` também aciona `reportLovableError` (telemetria do
  editor Lovable, `src/lib/lovable-error-reporting.ts`) em `useEffect`.

Situação: **implementado**.

### Providers montados fora da raiz

Parte dos providers é montada apenas em layouts específicos:

- **`PermissionProvider`** (`src/components/rooster/hub/permission-context.tsx`) é montado no `AppShell`
  (`src/components/rooster/app-shell.tsx`), uma vez por navegação autenticada. Ver `08-autorizacao.md`.
- **`AssetsProvider`** (`src/components/rooster/assets/store.tsx`) envolve apenas as rotas de `/assets` (montado em
  `src/routes/assets.tsx`).
- **`SidebarProvider`** (Radix/shadcn, `src/components/ui/sidebar.tsx`) também é montado no `AppShell`.

## `AppShell`: layout autenticado

`src/components/rooster/app-shell.tsx` é utilizado por todos os layouts de módulo (`hub.tsx`, `desk.tsx`,
`rooms.tsx`, `assets.tsx`, `finance.tsx`, `student.tsx`, `academy.tsx`, `learn.tsx`, `boost.tsx`, `settings.tsx` e
`index.tsx`) para envolver o respectivo `<Outlet />`. O componente:

1. lê `authed` e `ready` de `useAuth()` e, se `ready && !authed`, redireciona para `/login` por
   `navigate({ to: "/login", replace: true })`;
2. enquanto `!ready || !authed`, exibe esqueleto de carregamento (`Skeleton` de cabeçalho, cartões e bloco de
   conteúdo), o que evita a exibição momentânea de conteúdo protegido sem deixar a tela vazia;
3. envolve o conteúdo em `PermissionProvider` → `GlobalSearchProvider` (paleta de comandos Ctrl/Cmd+K) →
   `SidebarProvider` → `AppSidebar`, `AppTopbar` e `<main>` com `RequireAccess route={pathname}`, que bloqueia a
   tela quando o usuário não possui a permissão de acesso (ver `08-autorizacao.md`);
4. monta o `AssistenteChat` (botão flutuante e painel do assistente de dúvidas; ver `04-componentes.md`), presente
   em todas as telas autenticadas.

As rotas `login.tsx` e `redefinir-senha.tsx` **não** utilizam o `AppShell`, por serem públicas, assim como as rotas
do portal do Boost (`/boost-portal/*`), que possuem layout e sessão próprios.

## Build e execução

- `vite.config.ts` utiliza o preset `@lovable.dev/vite-tanstack-config`, que inclui as ferramentas de
  desenvolvimento do TanStack, `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, Nitro (destino padrão
  Cloudflare) e injeção das variáveis `VITE_*`. O comentário do próprio arquivo orienta a não duplicar esses plugins.
- Para execução como servidor Node.js (por exemplo, em Windows Server), o build deve ser gerado com
  `NITRO_PRESET=node-server`; o servidor resultante é iniciado por `node .output/server/index.mjs`. A aplicação
  depende de renderização no servidor e não é distribuída como conjunto de arquivos estáticos. Ver
  `docs/operations/04-deploy.md` no repositório do backend. O instalador para Windows (`scripts/instalador`, no
  repositório do backend; ver `docs/operations/09-instalador.md`) aplica esse ajuste automaticamente.
- Alias de importação `@/*` → `./src/*` (`tsconfig.json`).
- Scripts (`package.json`): `dev` (`vite dev`), `build`, `build:dev`, `preview`, `lint`, `format`, `test`
  (`vitest run`) e `audit`. O `lint` não integra o CI, e o código ainda não foi formatado de modo uniforme pelo
  Prettier (registrado em `docs/engineering/08-divida-tecnica.md`, no backend).

Situação: **implementado**.
