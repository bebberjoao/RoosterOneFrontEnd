# Mapa RBAC do Rooster One

## Contrato da permissão

Não existe mais Perfil/Role como intermediário: um usuário recebe
permissões diretamente (`usuarios_permissoes`). A fonte única do catálogo é
`src/components/rooster/hub/permission-catalog.ts` — módulo → tela → ação,
derivado de `module-config.ts` (não duplicado à mão). A chave canônica de
uma permissão é `modulo.tela.acao` (`permissionKey()`), e toda tela tem a
ação obrigatória `acessar`: sem ela, o menu esconde a tela e a rota mostra
"Acesso negado" (`useCanAccess`/`RequireAccess` em `permission-context.tsx`).

Ao conceder uma permissão pela tela **Hub > Acessos e permissões**, o
registro em `permissoes` é criado sob demanda (`recurso` = rota da tela,
`acao` = id da ação) e o vínculo vai para `usuarios_permissoes`. É a mesma
tabela que o backend consulta em `@RequirePermission` — conceder ali
controla a API de verdade, não só a interface.

## Telas e ações por módulo

Fonte de verdade em código: `permission-catalog.ts`. Resumo (cada tela tem,
além do listado, a ação `acessar`):

| Módulo | Tela | Ações |
| --- | --- | --- |
| Rooster Hub | `/hub/usuarios` | criar, editar, excluir |
| Rooster Hub | `/hub/setores` | criar, editar, excluir, gerenciar-usuarios |
| Rooster Hub | `/hub/acessos` | gerenciar-permissoes, conceder, revogar |
| Rooster Desk | `/desk/tickets` | criar, editar, encerrar, reabrir, transferir, registrar-solucao, anexar, nota-interna |
| Rooster Desk | `/desk/categories` | criar, editar, excluir, subcategorias |
| Rooster Desk | `/desk/team` | criar, editar, excluir, vincular-categoria |
| Rooster Rooms | `/rooms/book` | solicitar |
| Rooster Rooms | `/rooms/reservations` | mensagem, alterar-horario, cancelar |
| Rooster Rooms | `/rooms/manage` | aprovar, responder, cancelar, alterar-horario |
| Rooster Rooms | `/rooms/structure` | criar, editar, excluir, gerar-periodos |
| Rooster Assets | `/assets/inventory` | criar, editar, excluir, movimentar, gerenciar-categorias |
| Rooster Student, Academy, Finance, Learn, Boost | — | ver `permission-catalog.ts` (telas mapeadas, sem backend próprio ainda) |

## Estado da integração (backend)

Hub, Desk, Rooms e Assets têm `PermissionGuard` + `@RequirePermission`
registrados em **todos** os endpoints (não só no Desk) — ver
[`RoosterOneBackend-main/docs/rbac.md`](../../RoosterOneBackend-main/docs/rbac.md)
para o mapeamento completo `modulo/recurso/acao` de cada rota. O `recurso`
usado pelo backend é a mesma rota de tela deste catálogo (ex.:
`/rooms/manage`), não um nome de recurso genérico — as duas pontas falam a
mesma linguagem.

Academy, Learn, Finance, Boost e Student têm telas mapeadas aqui (para a UI
mostrar/ocultar corretamente), mas **nenhuma permissão deles é validada no
servidor**, porque esses módulos não têm backend ainda.

## Matriz padrão de demonstração

Quando um usuário não tem nenhuma permissão própria em `usuarios_permissoes`
(`hasCustom === false` em `permission-context.tsx`), a navegação cai de
volta para a matriz por papel de demonstração em `module-config.ts` +
`role-context.tsx` (a mesma usada pelo `RoleSwitcher`, rotulado "Visão" —
não é mais um papel do RBAC, só a persona ativa no ambiente de
desenvolvimento). Isso existe só para o ambiente continuar navegável antes
de qualquer permissão real ser concedida a alguém.
