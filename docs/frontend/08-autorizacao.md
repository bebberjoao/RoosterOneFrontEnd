# Autorização (Frontend)

## Três sistemas, não um — e eles não fazem a mesma coisa

1. **Permissão real** (`hub/permission-context.tsx`, `PermissionProvider`/`usePermissions()`/`useCanAccess()`/`useCan()`/`RequireAccess`) — a fonte de verdade. Sempre derivada da sessão realmente autenticada (`session.permissoes`, capturada de `acesso.permissoes` na resposta de `POST /auth/login`), nunca de uma persona de demonstração.
2. **Visão de demonstração** (`role-context.tsx`, `useRole()`, "RoleSwitcher") — um seletor de persona pra visualizar como cada papel veria o menu ("Visão: Admin", "Visão: Professor"...), guardado em `localStorage`, sem relação com login/JWT. Continua existindo depois da correção abaixo, mas como camada **adicional**, nunca substituindo a permissão real.
3. **Catálogo por módulo** (`*/permissions.ts`, ex. `academy/permissions.ts`, `finance/permissions.ts`) — matrizes `Role → ação[]` usadas só pra habilitar/desabilitar **botão** dentro de uma tela já liberada (ex. "Professor não vê o botão 'Nova turma' porque `academyProfessorKeys` não inclui essa ação no backend"). Continuam indexadas pela Visão de demonstração (`useRole()`), não pela permissão real — decisão intencional: são \~9 arquivos pequenos, um por módulo, cobrindo só gating de botão dentro de uma tela à qual o usuário já teve acesso liberado pela camada 1. Nunca decidem *o que buscar* da API, só *o que mostrar*.

## Camada 1 — Permissão real (`hub/permission-context.tsx`)

`PermissionProvider` lê `session.usuario`/`session.permissoes` diretamente (via `session.subscribe()`) — nunca compara nome de persona contra usuário real, nunca chama `usuariosService.list()`. `granted` é o `Set<string>` de chaves `modulo.tela.acao` (mesmo formato de `Permissao.nome`) do usuário logado; `hasCustom` é só `usuario !== null` (sessão real ativa).

```ts
const { granted, hasCustom } = usePermissions(); // vem da sessão real, ponto.
```

`useCanAccess(route)` e `useCan(route, acao)` resolvem a tela pela rota (`findScreenByRoute`, `permission-catalog.ts`) e checam `granted.has(permissionKey(...))`. Enquanto a sessão ainda não foi restaurada (`!hasCustom`), o acesso é liberado por padrão — evita bloquear a tela antes do primeiro `session.restore()` completar; `RequireAccess` espera `ready` antes de decidir, pra não piscar "sem acesso" nesse intervalo.

**Efeito prático**: pra um admin real (que tem todas as permissões), nada muda visualmente — a Visão de demonstração continua controlando 100% da prévia de menu, como sempre controlou. Pra qualquer outro usuário real, a permissão dele vira um **teto**: nenhuma Visão consegue fazer aparecer mais do que ele realmente pode acessar.

## Catálogo de permissões (`hub/permission-catalog.ts`)

Fonte única do vocabulário `módulo/tela(recurso)/ação` usado tanto pra exibir/esconder elemento de UI quanto pra bater com o `@RequirePermission` do backend. `permissionKey(moduloId, telaId, acaoId)` é sempre o **último segmento da rota** da tela (ou `"dashboard"` quando a tela é a raiz do módulo) — mesma convenção do `prisma/seed-dev.ts` no backend. Uma permissão nova precisa existir nos dois lados com a mesma grafia; não há geração automática de um catálogo a partir do outro nem verificação cruzada automatizada (uma divergência entre os dois só aparece manualmente, via `grep`, ou em produção como 403 inesperado).

## `RequireAccess`

Montado dentro de `AppShell` (`app-shell.tsx`), envolvendo `children` com `<RequireAccess route={pathname}>` — **toda** rota renderizada dentro do `AppShell` já passa por essa checagem automaticamente, sem precisar que o layout de cada módulo (`academy.tsx`, `finance.tsx`, etc.) adicione nada próprio. Bloqueia o conteúdo (tela "Acesso negado") se a ação `acessar` da rota atual não estiver no `granted` resolvido pela Camada 1.

## Combinação no menu (`app-sidebar.tsx`)

O menu lateral aplica as camadas 1 e 2 em **E lógico**: `modulesForRole(role)` (Visão de demonstração, decide o que aquele papel *veria*) filtrado por `allowsRoute(to)` (permissão real, decide o que o usuário *pode* de verdade) — um item só aparece se as duas condições valerem. Um módulo cuja permissão real falte desaparece do menu mesmo que a Visão ativa devesse mostrá-lo.

## Camada 3 — `*/permissions.ts` por módulo

Cada módulo com tela de gestão tem seu próprio arquivo (`academy/permissions.ts`, `assets/permissions.ts`, `finance/permissions.ts`, etc.) exportando um tipo de ação específico do módulo (ex. `FinancePerm = "viewDashboard" | "manageCharges" | ...`) e uma `MATRIX: Record<Role, Perm[]>` indexada pela Visão de demonstração. Usado dentro de componentes de tela pra decidir se um botão específico aparece habilitado (`academyCan(role, "manageClasses")`), nunca pra decidir se a tela inteira é acessível (isso é sempre a Camada 1, via `AppShell`/`RequireAccess`) nem pra decidir qual dado buscar da API.

**Risco desse padrão, achado em auditoria e corrigido parcialmente**: como esses arquivos são indexados pela Visão (não pela permissão real), usar o valor deles pra decidir *o que buscar* — não só *o que mostrar* — reintroduz o mesmo problema que a Camada 1 resolve. Isso foi encontrado em `academy.attendance.tsx`, `academy.grades.tsx`, `academy.index.tsx`, `learn.classes.tsx` e `learn.index.tsx`: todas usavam `role === "professor"` (Visão) pra decidir se passavam `{minhas:true}` numa chamada de API, em vez de usar a permissão real (`useCan("/academy/manage", "acessar")`) — um professor de verdade cuja Visão ainda estivesse em "admin" (valor padrão) recebia 403 do backend, porque a tela buscava turmas de todo mundo sem `{minhas:true}}` mesmo ele não tendo essa permissão real. Corrigido nessas cinco telas: a decisão de *o que buscar* agora usa sempre `useCan()`/`useCanAccess()` (Camada 1); a Visão de demonstração (`*/permissions.ts`, `useRole()`) continua controlando só habilitar/desabilitar botão dentro da tela, seu uso original e seguro.

## Autorização real (o que de fato importa)

A UI decidir mostrar ou esconder algo **não substitui** a checagem do backend — toda operação passa pelo `PermissionGuard` do lado servidor de qualquer forma. A checagem de UI aqui documentada é só para experiência (não mostrar botão que vai dar 403 ou buscar dado que o usuário não pode ver), nunca a fonte de verdade de segurança.
