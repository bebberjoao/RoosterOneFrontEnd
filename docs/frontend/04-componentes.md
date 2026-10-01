# Componentes

## Componentes genéricos (`src/components/shared/`)

Reexportados por `index.ts` (importação única por `@/components/shared`) e utilizados por qualquer módulo:

- **`primitives.tsx`**: `Chip`, `StatusChip`, `StatCard`, `SectionCard`, `Avatar`, `EmptyState`, `Btn`, `Table`,
  `Pagination` e `LoadingCards`.
- **`data-table.tsx`**: `DataTable` genérica, com ordenação, paginação e estado vazio.
- **`crud-page.tsx`**: `CrudHeader`, `CrudToolbar` e `Breadcrumbs`.
- **`overlays.tsx`**: `Modal`, `Drawer` e `ConfirmDialog`.
- **`form.tsx`**: `Field`, `TextInput`, `TextArea`, `SelectInput` e `FileUpload`.
- **`dropdown.tsx`**: `PopoverSelect`, base de `SelectInput` e `Select`. Não se trata de `<select>` HTML nativo, e sim
  de botão que abre um painel de opções, aspecto relevante para a automação de testes de interface.

## `HubCrud`: componente central de CRUD

`src/components/rooster/hub/crud-panel.tsx`. As telas de CRUD (usuários, setores, categorias, patrimônio, ambientes
etc.) consistem, essencialmente, em `<HubCrud service={...} fields={[...]} columns={[...]} />`, que realiza a
listagem por `service.list()`, o modal de criação e edição com validação por campo (`HubField.validate`), a
confirmação de exclusão e a coluna de ações extensível pela propriedade `rowExtra` (utilizada, por exemplo, no botão
de redefinição de senha da tela de usuários).

`service` é sempre um `HubResource<T>`, com o mesmo contrato (`list`, `get`, `create`, `update` e `remove`) de
`src/services/hub/index.ts` e de `mapped-resource.ts`, o que permite que a mesma tela genérica atenda a entidades
distintas.

## Componentes de domínio (`src/components/rooster/<modulo>/`)

Cada um dos nove módulos possui pasta própria, com rótulos, formulários e estados específicos do domínio (por exemplo,
`desk/categories-store.ts`, `assets/store.tsx` e `rooms/labels.ts`). Não seguem contrato genérico e são específicos
das telas que os utilizam.

### `src/components/rooster/academy/manage/`: abas da gestão acadêmica

As cinco abas de `academy.manage.tsx` (`disciplines-tab.tsx`, `classes-tab.tsx`, `teachers-tab.tsx`,
`students-tab.tsx` e `calendar-tab.tsx`) utilizam `academyService` (listagem, criação, edição e exclusão pela API, com
`useState` e `useEffect` e contador `refresh` para recarga após alteração; ver `05-estado-e-hooks.md`). A aba
`students-tab.tsx` realiza o CRUD de `Aluno` (busca por nome, RA ou e-mail, filtro por curso e situação, painel de
detalhe, ativação e exclusão), no mesmo leiaute de `teachers-tab.tsx`.

### `UserPicker` (`academy/manage/user-picker.tsx`): vínculo de usuário existente do Hub

Componente reutilizável das abas **Alunos** e **Professores** no cadastro de `Aluno` ou `Professor`. Em vez de
formulário de novo usuário, realiza busca na lista de usuários do Hub (`usuariosService.list()`, `GET /usuarios`) por
nome ou e-mail e devolve o `usuarioId` selecionado: a tela não cria `Usuario`, apenas vincula usuário existente ao
cadastro acadêmico (`createStudent` e `createTeacher` exigem `usuarioId`). Após a seleção, exibe cartão com avatar,
nome e e-mail e o botão "Trocar"; na edição de registro existente, o campo é bloqueado (`lockUser`), pois o vínculo
`usuarioId` não pode ser alterado após a criação, apenas por exclusão e novo cadastro. É o componente de referência
para futuras telas que necessitem do mesmo tipo de vínculo (por exemplo, coordenador ou atendente).

## Componentes de estrutura (`src/components/rooster/*.tsx`, fora de subpastas)

`app-shell.tsx`, `app-sidebar.tsx`, `app-topbar.tsx` e `page-header.tsx`: layout autenticado, menu lateral, barra
superior e cabeçalho padrão de página. Ver `01-arquitetura.md` quanto à sua articulação com a rota raiz.

## `src/components/ui/`: primitivos Radix/shadcn

Componentes de baixo nível (button, dialog, table, sidebar etc.), no padrão shadcn, que servem de base aos
componentes de `shared/` e, na maioria dos casos, não são utilizados diretamente pelas telas.
