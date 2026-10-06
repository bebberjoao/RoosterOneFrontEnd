# Autorização (frontend)

## Três mecanismos com finalidades distintas

1. **Permissão efetiva** (`hub/permission-context.tsx`: `PermissionProvider`, `usePermissions()`, `useCanAccess()`,
   `useCan()` e `RequireAccess`): fonte de verdade da interface, sempre derivada da sessão autenticada
   (`session.permissoes`, obtida de `acesso.permissoes` na resposta de `POST /auth/login`).
2. **Perfil de interface** (`role-context.tsx`, `useRole()`): deduzido das permissões efetivas por `deriveRole` (quem
   possui `hub.acessos.gerenciar-permissoes` é `admin`; `finance.dashboard.acessar` → `financeiro`;
   `student.dashboard.acessar` → `aluno`; `academy.manage.acessar` → `coordenador`; `academy.dashboard.acessar` →
   `professor`; `desk.tickets.encerrar` ou `assets.inventory.movimentar` → `tecnico`; os demais → `institucional`, o
   perfil de menor privilégio). **O antigo seletor manual de perfil (RoleSwitcher) foi removido**, pois permitia a
   qualquer usuário simular outro perfil e exibia nomes fictícios no lugar do usuário autenticado. O perfil apenas
   organiza a interface (menus e botões); a permissão efetiva permanece o limite.
3. **Catálogo por módulo** (`*/permissions.ts`: `academy/permissions.ts`, `assets/permissions.ts` e
   `finance/permissions.ts`): matrizes `Perfil → ação[]` utilizadas apenas para habilitar ou desabilitar **botões** em
   tela já autorizada pela camada 1 (por exemplo, o professor não visualiza o botão "Nova turma", ação ausente de
   `academyProfessorKeys` no backend). São indexadas pelo perfil deduzido (`useRole()`), por decisão de projeto: são
   três arquivos pequenos, restritos ao controle de botões. Os demais módulos realizam esse controle diretamente com
   `useCan()`. Esses arquivos nunca determinam *quais dados buscar* na API, apenas *o que exibir*.

## Camada 1: permissão efetiva (`hub/permission-context.tsx`)

`PermissionProvider` lê `session.usuario` e `session.permissoes` diretamente (por `session.subscribe()`), sem
comparar nomes de perfil e sem consultar `usuariosService.list()`. `granted` é o `Set<string>` das chaves
`modulo.tela.acao` (mesmo formato de `Permissao.nome`) do usuário autenticado; `hasCustom` corresponde a
`usuario !== null` (sessão ativa).

```ts
const { granted, hasCustom } = usePermissions(); // obtido exclusivamente da sessão
```

`useCanAccess(route)` e `useCan(route, acao)` identificam a tela pela rota (`findScreenByRoute`,
`permission-catalog.ts`) e verificam `granted.has(permissionKey(...))`. Enquanto a sessão não foi restaurada
(`!hasCustom`), o acesso é liberado por padrão, para não bloquear a tela antes da conclusão de `session.restore()`; o
`RequireAccess` aguarda `ready` antes de decidir, evitando a exibição momentânea de "sem acesso".

**Efeito**: cada usuário visualiza o menu do perfil indicado por suas permissões, e a permissão efetiva constitui um
**limite**: nada é exibido além do que o usuário pode acessar. Limitação conhecida: a dedução segue a convenção das
chaves listadas; usuário com combinação atípica de permissões é enquadrado no perfil mais próximo pela ordem de
verificação, e o backend permanece a barreira definitiva.

## Catálogo de permissões (`hub/permission-catalog.ts`)

Fonte única do vocabulário `módulo/tela (recurso)/ação`, utilizado tanto para exibir ou ocultar elementos da interface
quanto para corresponder ao `@RequirePermission` do backend. `permissionKey(moduloId, telaId, acaoId)` utiliza o
**último segmento da rota** da tela (ou `"dashboard"`, quando a tela é a raiz do módulo), mesma convenção de
`prisma/seed-dev.ts` no backend. Toda nova permissão deve existir nos dois lados com grafia idêntica; não há geração
automática de um catálogo a partir do outro nem verificação cruzada automatizada, de modo que divergências são
identificadas apenas por busca manual ou, em uso, como `403` ou "Acesso negado" inesperados. Na conferência de
05/10/2026, os dois catálogos foram igualados (149 permissões): o banco recebeu a ação `acessar` de sete telas, que
faltava (migration `20261005090000_permissoes_acesso_telas`), e o catálogo deixou de oferecer cinco opções sem efeito.

Ao salvar, a tela "Acessos e permissões" (`hub.acessos.tsx`) cria no banco a permissão do catálogo que ainda não
existe, vinculada ao módulo das demais permissões da mesma tela, e só então a concede ao usuário.

`canAccessRoute(route, granted)` é a versão sem hook da mesma regra de `useCanAccess`, utilizada quando a rota é
conhecida apenas em tempo de execução (por exemplo, o atalho "Abrir a tela" das respostas do assistente de dúvidas).
O roteiro guiado, por sua vez, é liberado pelo backend: a resposta informa `roteiro.permitido`, calculado pela
permissão declarada para a tarefa (RN052); sem ela, o chat não oferece "Mostrar na tela". O roteiro apenas conduz o
usuário pela interface, e toda operação continua sujeita às verificações do backend.

## `RequireAccess`

Montado no `AppShell` (`app-shell.tsx`), envolvendo o conteúdo com `<RequireAccess route={pathname}>`: **toda** rota
renderizada no `AppShell` é submetida automaticamente à verificação, sem necessidade de tratamento no layout de cada
módulo. O conteúdo é bloqueado (tela "Acesso negado") quando a ação `acessar` da rota atual não consta de `granted`.

## Composição no menu (`app-sidebar.tsx`)

O menu lateral combina as camadas 1 e 2 por **conjunção lógica**: `modulesForRole(role)` (perfil deduzido, que define
o que o perfil exibiria) filtrado por `allowsRoute(to)` (permissão efetiva, que define o que o usuário pode acessar);
o item é exibido somente quando as duas condições são satisfeitas.

## Camada 3: `*/permissions.ts` por módulo

Cada módulo com tela de gestão possui arquivo próprio, que exporta tipo de ação específico (por exemplo,
`FinancePerm = "viewDashboard" | "manageCharges" | ...`) e uma `MATRIX: Record<Role, Perm[]>`, indexada pelo perfil
deduzido. É utilizado nos componentes de tela para determinar se um botão é exibido habilitado
(`academyCan(role, "manageClasses")`), e nunca para determinar o acesso à tela (sempre decidido pela camada 1, no
`AppShell`) nem os dados a buscar na API.

**Risco do padrão, identificado em auditoria e corrigido**: por serem indexados pelo perfil, e não pela permissão
efetiva, esses arquivos, se utilizados para decidir *o que buscar*, reintroduziriam o problema resolvido pela camada
1. A situação foi encontrada em `academy.attendance.tsx`, `academy.grades.tsx`, `academy.index.tsx`,
`learn.classes.tsx` e `learn.index.tsx`, que utilizavam `role === "professor"` (à época, perfil escolhido
manualmente) para decidir o envio de `{minhas:true}` na chamada à API, em lugar da permissão efetiva
(`useCan("/academy/manage", "acessar")`); o professor cujo perfil selecionado permanecia "admin" (valor padrão)
recebia `403`, pois a tela buscava as turmas de todos sem possuir essa permissão. Nas cinco telas, a decisão sobre os
dados passou a utilizar `useCan()` e `useCanAccess()` (camada 1); o perfil deduzido continua a controlar apenas a
habilitação de botões.

## Autorização efetiva

A exibição ou ocultação de elementos na interface **não substitui** a verificação do backend: toda operação é
submetida ao `PermissionGuard` no servidor. As verificações descritas neste documento destinam-se à experiência de uso
(não exibir botão que resultaria em `403` nem buscar dado inacessível) e não constituem a fonte de verdade da
segurança.
