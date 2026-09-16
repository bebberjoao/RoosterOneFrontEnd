# Rooster Assets

## Objetivo do módulo

Cadastro e gestão do patrimônio institucional (equipamentos, mobiliário etc.): situação (disponível, emprestado, em manutenção, baixado), categorias, movimentações (empréstimo, transferência de setor/local) e histórico por item. Possui controle de acesso por papel (`role`) e ações condicionadas por permissão.

## Rotas

| Rota | Arquivo | Componente | Descrição |
|---|---|---|---|
| `/assets` | `src/routes/assets.tsx` | `AssetsLayout` | Layout raiz: verifica permissão de acesso (`assetsHasAccess`), envolve subrotas com `AppShell` e `AssetsProvider`. Se sem acesso, mostra tela de "Acesso restrito". |
| `/assets/` | `src/routes/assets.index.tsx` | `AssetsDashboard` | Painel com indicadores (total, disponíveis, emprestados, em manutenção, inativos), últimos cadastros e movimentações recentes. |
| `/assets/inventory` | `src/routes/assets.inventory.tsx` | `InventoryPage` | Listagem/pesquisa de patrimônios, drawer de detalhes com abas (Informações, Localização, Movimentações, Histórico, Foto), CRUD e registro de movimentações. |

## Telas e componentes

### AssetsLayout (`/assets`)
- Usa `AppShell`, `PageHeader`, `useRole` (contexto de papel do usuário), `assetsHasAccess` (permissões), `AssetsProvider` (store de contexto).
- Sem acesso: renderiza card com ícone `Lock` e mensagem de acesso restrito.

### AssetsDashboard (`/assets/`)
- Usa `CrudHeader`, `StatCard`, `SectionCard`, `TONE` (de `@/components/shared`).
- Usa `Breadcrumbs`, `AssetStatusBadge`, `CategoryChip`, `MovementBadge` (de `@/components/rooster/assets/ui`).
- Consome `useAssets()` (store) para `assets`, `movements`, `categoryName`, `categoryTone`.
- Usa `fmtDate`, `money` (de `@/components/rooster/assets/mock-data`).
- Estado local: apenas `useMemo` derivados (`stats`, `latest`, `lastMoves`); não há estado de formulário.

### InventoryPage (`/assets/inventory`)
- Usa `CrudHeader`, `CrudToolbar`, `Breadcrumbs`, `DataTable`, `Drawer`, `Modal`, `ConfirmDialog`, `TabBar`, `Btn`, `Select`, `EmptyState`, `Field`, `TextArea`, `SelectInput` (de `@/components/shared`).
- Usa `AssetStatusBadge`, `CategoryChip`, `ConditionBadge`, `MovementBadge` (de `@/components/rooster/assets/ui`).
- Usa `AssetFormModal` (`@/components/rooster/assets/asset-form`) e `CategoriesModal` (`@/components/rooster/assets/categories-modal`).
- Consome `useAssets()` para `assets`, `categories`, `categoryName`, `categoryTone`, `createAsset`, `updateAsset`, `deleteAsset`, `movementsOf`, `registerMovement`.
- Usa `assetsCan` (permissões) e `useRole`/`ROLE_META` para identificar o usuário atual.
- Estado local: `q` (busca), `status`, `cat` (filtros), `selected` (item aberto no drawer), `tab` (aba do drawer), `formOpen`/`editing` (modal de formulário), `toDelete` (confirmação de exclusão), `categoriesOpen`, `mType`/`mTo`/`mNotes` (formulário de nova movimentação).

## Serviços e funções usadas

Serviço: `assetService` em `src/services/mock-api/asset.service.ts` — ligado
ao backend real (`/patrimonio*`) via `mapResource` (ver
`docs/integracao-backend.md`).

| Função | Assinatura | Uso |
|---|---|---|
| `getAll` | `(filters?) => Promise<Asset[]>` | Carregado pelo `AssetsProvider` ao montar |
| `getById` | `(id: string) => Promise<Asset \| undefined>` | Não usado diretamente nas telas |
| `create` | `(dto: Omit<Asset, "id" \| "createdAt">) => Promise<Asset>` | Criar patrimônio (`createAsset` da store, usado pelo `AssetFormModal`) |
| `update` | `(id, dto: Partial<Asset>) => Promise<Asset \| undefined>` | Editar patrimônio |
| `remove` | `(id: string) => Promise<boolean>` | Excluir patrimônio |
| `search` | `(query: string) => Promise<Asset[]>` | Não usado diretamente nas telas (a busca é feita client-side com `useMemo`) |
| `getCategories` | `() => Promise<AssetCategory[]>` | Carregado pelo `AssetsProvider` |
| `createCategory` | `(dto: Omit<AssetCategory, "id">) => Promise<AssetCategory>` | Usado no `CategoriesModal` |
| `updateCategory` | `(id, dto: Partial<AssetCategory>) => Promise<AssetCategory \| undefined>` | Usado no `CategoriesModal` |
| `removeCategory` | `(id: string) => Promise<boolean>` | Usado no `CategoriesModal` |
| `getMovements` | `(filters?) => Promise<AssetMovement[]>` | Carregado pelo `AssetsProvider` |
| `registerMovement` | `(dto: Omit<AssetMovement, "id">) => Promise<AssetMovement>` | Registrar movimentação (aba "Movimentações" do drawer) |

Store de contexto: `AssetsProvider`/`useAssets` em `src/components/rooster/assets/store.tsx`, expõe: `assets`, `categories`, `movements`, `loading`, `createAsset`, `updateAsset`, `deleteAsset`, `createCategory`, `updateCategory`, `deleteCategory`, `registerMovement`, `categoryName`, `categoryTone`, `movementsOf`.

Permissões: `src/components/rooster/assets/permissions.ts`, função `assetsCan(role, perm)` com `perm` em `"view" | "create" | "edit" | "delete" | "move" | "manageCategories"`, e `assetsHasAccess(role)`. Matriz: `admin` tem todas as permissões; `tecnico` tem view/create/edit/move/manageCategories; `coordenador`, `institucional`, `financeiro` têm apenas `view`; `professor` e `aluno` não têm acesso.

Fonte de dados mock: `src/mock/database/assets.ts`, `assetMovements.ts`, `assetCategories.ts`.

## Estado

Estado global do módulo é mantido pelo `AssetsProvider` (contexto React), carregado uma vez via `useEffect` ao montar e atualizado localmente (otimista) após cada operação de criação/edição/exclusão/movimentação, sem recarregar do zero.

## Tabela de botões e ações

| Label | Local | O que faz | Serviço chamado |
|---|---|---|---|
| Ver todos | `AssetsDashboard`, seção "Últimos patrimônios cadastrados" | Navega para `/assets/inventory` | — |
| Categorias | `InventoryPage` (header) | Abre `CategoriesModal` | — |
| Novo patrimônio | `InventoryPage` (header, visível se `canCreate`) | Abre `AssetFormModal` em modo criação | — |
| Linha da tabela (clique) | `InventoryPage`, `DataTable` | Abre `Drawer` de detalhes do patrimônio (`openDrawer`) | — |
| Editar | `InventoryPage`, drawer de detalhes (visível se `canEdit`) | Abre `AssetFormModal` em modo edição | — |
| Excluir | `InventoryPage`, drawer de detalhes (visível se `canDelete`) | Abre `ConfirmDialog`; ao confirmar remove o patrimônio e fecha o drawer | `assetService.remove` (via `deleteAsset`) |
| Abas do drawer (Informações/Localização/Movimentações/Histórico/Foto) | `InventoryPage`, `TabBar` | Alterna `tab` exibida no drawer | — |
| Registrar movimentação | `InventoryPage`, aba "Movimentações" (visível se `canMove`) | Cria uma nova movimentação (empréstimo/transferência/setor) para o patrimônio selecionado | `assetService.registerMovement` (via `registerMovement`) |
| Salvar (AssetFormModal) | `AssetFormModal` (componente compartilhado) | Cria ou atualiza o patrimônio conforme `editing` | `assetService.create` / `assetService.update` (via `createAsset`/`updateAsset`) |
| Cancelar (ConfirmDialog) | `InventoryPage` | Fecha o diálogo de confirmação de exclusão sem excluir | — |
| Ações no `CategoriesModal` (adicionar/editar/remover categoria) | `CategoriesModal` (componente compartilhado) | CRUD de categorias de patrimônio | `assetService.createCategory` / `updateCategory` / `removeCategory` |
