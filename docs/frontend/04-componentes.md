# Componentes

## Componentes genéricos (`src/components/shared/`)

Reexportados via `index.ts` (import único `@/components/shared`), usados por qualquer módulo:

- **`primitives.tsx`** — `Chip`, `StatusChip`, `StatCard`, `SectionCard`, `Avatar`, `EmptyState`, `Btn`, `Table`, `Pagination`.
- **`data-table.tsx`** — `DataTable` genérica, com ordenação, paginação e estado vazio.
- **`crud-page.tsx`** — `CrudHeader`, `CrudToolbar`, `Breadcrumbs`.
- **`overlays.tsx`** — `Modal`, `Drawer`, `ConfirmDialog`.
- **`form.tsx`** — `Field`, `TextInput`, `TextArea`, `SelectInput`, `FileUpload`.
- **`dropdown.tsx`** — `PopoverSelect`, a base de `SelectInput`/`Select` (não é um `<select>` HTML nativo — é um botão que abre um popover de opções; relevante para quem for automatizar teste de UI).

## `HubCrud` — o componente central de Hub/Desk/Rooms/Assets

`src/components/rooster/hub/crud-panel.tsx`. Uma tela de CRUD (usuários, setores, categorias, patrimônio, ambientes...) é, na prática, `<HubCrud service={...} fields={[...]} columns={[...]} />` — ele resolve sozinho: listagem via `service.list()`, modal de criar/editar com validação por campo (`HubField.validate`), confirmação de exclusão, e uma coluna de ações extensível via prop `rowExtra` (usado, por exemplo, para o botão de redefinir senha na tela de usuários).

`service` é sempre um `HubResource<T>` — o mesmo contrato (`list/get/create/update/remove`) usado em `src/services/hub/index.ts` e em `mapped-resource.ts`. Isso é o que permite a mesma tela de CRUD genérica funcionar para entidades completamente diferentes.

## Componentes de domínio (`src/components/rooster/<modulo>/`)

Cada módulo (Hub/Desk/Rooms/Assets — e também os módulos só-mock) tem sua própria pasta com badges, formulários e stores específicos daquele domínio (ex.: `desk/categories-store.ts`, `assets/store.tsx`, `rooms/labels.ts`). Não seguem um contrato genérico — são específicos da tela que os usa.

### `src/components/rooster/academy/manage/` — abas de Gestão acadêmica

As cinco abas de `academy.manage.tsx` (`disciplines-tab.tsx`, `classes-tab.tsx`, `teachers-tab.tsx`, `students-tab.tsx`, `calendar-tab.tsx`) estão todas ligadas a `academyService` (listar/criar/editar/excluir via API real, com `useState`/`useEffect` + `refresh` contador para recarregar após mutação — ver `05-estado-e-hooks.md`). `students-tab.tsx` é a mais nova: CRUD de `Aluno` (busca por nome/RA/e-mail, filtro por curso e situação, drawer de detalhe, ativar/desativar, excluir), seguindo o mesmo layout de `teachers-tab.tsx`.

### `UserPicker` (`academy/manage/user-picker.tsx`) — vincular usuário do Hub existente

Componente reutilizável usado pelas abas **Alunos** e **Professores** de `academy.manage.tsx` no cadastro de um novo `Aluno`/`Professor`. Em vez de abrir um formulário de "novo usuário", ele busca na lista real de usuários do Hub (`usuariosService.list()`, `GET /usuarios`) por nome/e-mail e devolve o `usuarioId` escolhido — a tela nunca cria um `Usuario` novo, só vincula um já existente do Hub ao cadastro acadêmico (`createStudent`/`createTeacher` exigem `usuarioId`). Depois de selecionado, mostra um cartão com avatar/nome/e-mail e um botão "Trocar"; a edição de um registro já existente trava esse campo (`lockUser` em `students-tab.tsx`), porque o vínculo `usuarioId` não pode ser alterado depois de criado — só excluindo e recadastrando. É o primeiro componente desse padrão "linkar usuário existente" no projeto; se uma tela futura precisar do mesmo tipo de vínculo (ex.: coordenador, atendente), este é o componente a reaproveitar.

## Componentes de casca (`src/components/rooster/*.tsx`, fora de subpastas)

`app-shell.tsx`, `app-sidebar.tsx`, `app-topbar.tsx`, `page-header.tsx` — layout autenticado, menu lateral, barra superior, cabeçalho padrão de página. Ver `01-arquitetura.md` para como se encaixam no root.

## `src/components/ui/` — primitivos Radix/shadcn

Componentes de baixo nível (button, dialog, table, sidebar, form...) gerados no estilo shadcn — base para os componentes de `shared/`, não usados diretamente pelas telas na maior parte dos casos.
