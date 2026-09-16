# Shell e Navegação — Rooster One

## Objetivo

Este documento descreve a estrutura de "casca" (shell) da aplicação: o
layout comum a todos os módulos (sidebar + topbar + área de conteúdo), o
contexto de perfil de usuário (role), o contexto de tema (claro/escuro) e o
arquivo central de configuração de módulos que alimenta o menu lateral.

## Visão geral da árvore de componentes

```
AppShell
├── SidebarProvider (shadcn/ui)
│   ├── AppSidebar
│   └── SidebarInset
│       ├── AppTopbar
│       └── main (conteúdo da rota, via children)
```

`AppShell` é utilizado em praticamente todas as rotas de layout de módulo
(`*.tsx` com `Outlet`) para padronizar sidebar, topbar e o container de
conteúdo.

## `app-shell.tsx`

Componente: `AppShell({ children }: { children: ReactNode })`.

- Usa `useRouterState` para obter `pathname` atual.
- Monta `SidebarProvider` > `AppSidebar` + `SidebarInset`.
- Dentro de `SidebarInset`: `AppTopbar` seguido de `<main>` com padding
  (`p-6 lg:p-8`).
- O conteúdo (`children`) é envolvido em uma `div` com `key={pathname}` e
  classes de animação (`animate-in fade-in-0 slide-in-from-bottom-1
  duration-200`) — garante uma transição sutil de entrada ao trocar de
  rota.

Não expõe funções de ação; é puramente estrutural.

## `app-sidebar.tsx`

Componente principal: `AppSidebar()`. Constrói a barra lateral (baseada nos
primitivos `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`,
`SidebarMenu*` de `@/components/ui/sidebar`).

### Estado e hooks

- `useRole()` — perfil ativo, usado para filtrar módulos visíveis.
- `useRouterState` — obtém `pathname` para destacar item ativo.
- `useState<string>("")` — `query`, texto de busca de módulos/páginas.
- Hook interno `useExpandedState(role, autoOpen)`:
  - Estado `expanded: Record<string, boolean>` — quais módulos estão
    abertos no acordeão.
  - Persiste em `localStorage` na chave `rooster.sidebar.expanded`.
  - `autoOpen` (id do módulo ativo pela rota atual) é aberto
    automaticamente ao navegar.
  - Retorna `{ expanded, toggle(id: string) }`.

### Estrutura visual

1. **Cabeçalho** (`SidebarHeader`): logo "R" + nome "Rooster One" +
   subtítulo "Universidade Modelo" (link para `/`); campo de busca
   ("Buscar módulos, páginas...") com botão de limpar (`X`).
2. **Conteúdo** (`SidebarContent`):
   - Item "Início" (`HOME_ITEM`), sempre visível (exceto quando a busca não
     corresponde ao termo "início"/"home").
   - Lista de módulos visíveis para o perfil (`modulesForRole(role)`),
     renderizados via `ModuleAccordion` — cada módulo pode ser expandido
     para mostrar sub-itens (`children`).
   - Se `role === "admin"` e não há busca ativa, seção adicional com
     `ADMIN_ITEMS` (ex.: "Configurações").
3. **Rodapé** (`SidebarFooter`): avatar com iniciais + nome + legenda da
   persona atual (`ROLE_META[role].person`).

### Componentes internos

- `ModuleAccordion({ module, pathname, open, onToggle })` — renderiza um
  módulo do menu em dois modos: colapsado (ícone apenas, quando a sidebar
  está no modo `icon`) e expandido (nome + seta + sub-itens em lista).
  Chama `onToggle()` ao clicar no cabeçalho do módulo.
- `SubNavLink({ item, pathname, accent })` — link individual de sub-item
  dentro de um módulo, destaca o item ativo comparando `pathname === item.to`.

### Busca

A busca filtra `visibleModules` por nome do módulo (`m.name`/`m.short`) ou
por título de sub-itens (`m.children`), usando `useMemo` (`filteredModules`).
Quando não há resultados, mostra mensagem "Nenhum resultado".

## `app-topbar.tsx`

Componente: `AppTopbar()`. Barra superior fixa (`sticky top-0`).

### Hook interno
`useBreadcrumb()` — resolve o nome a exibir no breadcrumb com base no
`pathname` atual, comparando contra `MODULES` e `ADMIN_ITEMS` de
`module-config.ts`. Retorna `"Início"` para `/` ou o nome do módulo/rota
correspondente, com fallback `"Rooster One"`.

### Composição
- `SidebarTrigger` — botão para recolher/expandir a sidebar.
- Breadcrumb textual: "Rooster One / {nome da seção atual}".
- Barra de busca global (botão decorativo, sem ação de busca implementada),
  com atalho visual `⌘K`.
- Botão de notificações (`Bell`) — apenas visual, com indicador vermelho
  fixo; sem lista de notificações implementada.
- Botão de alternância de tema (`Sun`/`Moon`) — chama `toggle()` de
  `useTheme()`.
- Botão de Configurações (`Settings`) — link para `/settings`.
- `RoleSwitcher` — seletor de perfil de desenvolvimento.
- Avatar com iniciais do usuário atual (`ROLE_META[role].person`).

## `role-context.tsx`

Define o contexto de perfil (role) usado em toda a aplicação para simular
diferentes tipos de usuário sem autenticação real.

### Tipos e dados
- `Role` — union: `"admin" | "professor" | "coordenador" | "aluno" | "financeiro" | "tecnico" | "institucional"`.
- `ROLE_META: Record<Role, {...}>` — metadados de cada perfil: `label`
  (nome completo), `short` (nome curto), `tone` (cor oklch), `person` (nome,
  iniciais e legenda de uma pessoa fictícia representando o perfil).
- `ROLES: Role[]` — lista ordenada de todos os perfis.

### Provider e hook
- `RoleProvider({ children })` — mantém o estado `role` (padrão `"admin"`),
  carregado/salvo em `localStorage` (`rooster.role`).
- `useRole(): { role: Role; setRole(r: Role): void }` — hook de acesso ao
  contexto; retorna fallback seguro (`role: "admin"`, `setRole` no-op) se
  usado fora do provider.

### Permissões do Learn (definidas aqui, específicas do módulo)
- `LearnPerm` — union de permissões: `createActivity`, `gradeActivity`,
  `manageQuestions`, `manageClasses`, `viewAllGrades`, `viewReports`,
  `submitActivity`.
- `learnCan(role: Role, perm: LearnPerm): boolean` — consulta uma matriz de
  permissões por perfil (ver detalhes em `docs/modules/learn.md`).
- `learnHasAccess(role: Role): boolean` — define quais perfis podem acessar
  o módulo Learn (todos exceto `financeiro` e `institucional`).

## `role-switcher.tsx`

Componente: `RoleSwitcher()`. Menu suspenso (dropdown) de desenvolvimento
para alternar rapidamente entre os perfis (`Role`) sem necessidade de
login/logout real.

- Botão de disparo mostra o perfil atual (bolinha colorida + rótulo curto).
- Lista todos os `ROLES`, cada item mostra cor do perfil, rótulo completo e
  nome da pessoa fictícia; marca com `Check` o perfil ativo.
- Ao clicar em um item, chama `setRole(r)` do `useRole()`.

Serve exclusivamente para fins de demonstração/desenvolvimento (indicado
pelo texto "Alternar perfil (dev)").

## `theme-context.tsx`

Define o contexto de tema claro/escuro.

- `Theme = "light" | "dark"`.
- `ThemeProvider({ children })`:
  - Estado `theme`, inicializado a partir de `localStorage`
    (`rooster-theme`) ou da preferência do sistema
    (`prefers-color-scheme: dark`).
  - Ao mudar `theme`, alterna a classe `dark` em `document.documentElement`
    e ajusta `style.colorScheme`.
  - `setTheme(t: Theme)` persiste a escolha em `localStorage`.
  - `toggle()` alterna entre `light` e `dark`.
- `useTheme(): { theme, setTheme, toggle }` — hook de acesso ao contexto.

## `module-config.ts`

Arquivo central que define todos os módulos do Rooster One e alimenta tanto
a sidebar quanto o breadcrumb da topbar.

### Tipos
- `SubItem = { id, title, to, icon? }` — sub-item de navegação dentro de um
  módulo.
- `ModuleItem = { id, name, short, path, icon, description, accent, roles, children? }`
  — descreve um módulo: `roles` pode ser `"all"` ou uma lista de `Role`
  permitidas.

### Dados
- `HOME_ITEM` — item fixo "Início" (`/`).
- `MODULES: ModuleItem[]` — lista de todos os módulos do sistema, **na ordem
  exata em que aparecem na barra lateral**: Rooster Hub, Desk, Rooms, Assets,
  Finance, Student, Academy, Learn, Boost — cada um com ícone, cor de destaque
  (`accent`), perfis permitidos (`roles`) e sub-itens (`children`).
  A ordem da sidebar é a ordem do array; não há ordenação em tempo de execução.
- `ADMIN_ITEMS` — itens extras exibidos apenas para `admin` (hoje apenas
  "Configurações", `/settings`).

### Funções
- `moduleAllowed(m: ModuleItem, role: Role): boolean` — verifica se o
  módulo é visível para o perfil (`m.roles === "all"` ou
  `m.roles.includes(role)`).
- `modulesForRole(role: Role): ModuleItem[]` — filtra `MODULES` retornando
  apenas os permitidos para o perfil informado. É a função usada pela
  `AppSidebar` para montar a lista de módulos exibidos.

### Regras de visibilidade por módulo (campo `roles`)

| Módulo | Perfis com acesso |
|---|---|
| Rooster Hub | admin |
| Rooster Desk | admin, professor, coordenador, financeiro, tecnico, institucional |
| Rooster Rooms | admin, professor, coordenador, aluno, tecnico, institucional |
| Rooster Assets | admin, tecnico, coordenador, financeiro, institucional |
| Rooster Finance | admin, financeiro |
| Rooster Student | admin, aluno, coordenador |
| Rooster Academy | admin, professor, coordenador |
| Rooster Learn | admin, professor, coordenador, aluno |
| Rooster Boost | admin, aluno |


## `page-header.tsx`

Componente `PageHeader({ eyebrow?, title, description?, actions? })` —
cabeçalho padrão usado no topo do conteúdo de cada tela de módulo (eyebrow
em caixa alta, título grande, descrição opcional e área de ações à
direita). Usado por Learn, Boost e demais módulos.

## Tabela de botões e ações do shell

| Componente | Botão/Ação | Ícone | Efeito atual |
|---|---|---|---|
| `AppTopbar` | Recolher/expandir sidebar (`SidebarTrigger`) | — | Alterna estado colapsado/expandido da sidebar. |
| `AppTopbar` | Buscar em toda a plataforma | `Search` + `⌘K` | Botão decorativo; sem busca implementada. |
| `AppTopbar` | Notificações | `Bell` | Botão decorativo; sem lista/ação implementada. |
| `AppTopbar` | Alternar tema | `Sun`/`Moon` | Chama `toggle()` de `useTheme()`, alternando claro/escuro. |
| `AppTopbar` | Configurações | `Settings` | Link para `/settings`. |
| `AppTopbar` (via `RoleSwitcher`) | Selecionar perfil (dev) | `UserCog`, `Check` | Chama `setRole(r)`, trocando o perfil ativo em toda a aplicação. |
| `AppSidebar` | Ir para Início | logo "R" | Link para `/`. |
| `AppSidebar` | Buscar módulos/páginas | `Search`, `X` (limpar) | Filtra módulos/sub-itens exibidos conforme texto digitado. |
| `AppSidebar` | Ir para Início (item de menu) | `Home` | Link para `/`. |
| `AppSidebar` | Expandir/recolher módulo | `ChevronDown` | Alterna `expanded[m.id]`, persistido em `localStorage`. |
| `AppSidebar` | Navegar para módulo/sub-item | ícone do módulo/sub-item | Navega para a rota correspondente (`Link to`). |
| `AppSidebar` | Ir para Configurações (admin) | `Settings` | Link para `/settings`, visível apenas para `admin`. |
