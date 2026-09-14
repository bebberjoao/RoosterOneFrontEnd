# Design System — Rooster One

## Objetivo

Este documento descreve o sistema de design compartilhado do Rooster One:
os tokens visuais definidos em `src/styles.css` e os componentes de UI
reutilizáveis em `src/components/shared/`, usados por todos os módulos
(Hub, Desk, Student, Academy, Rooms, Assets, Finance, Learn, Boost) para
manter consistência visual e de interação.

## Tokens visuais (`src/styles.css`)

O arquivo importa Tailwind CSS (`@import "tailwindcss" source(none)`) e
`tw-animate-css`, e define um design system baseado em variáveis CSS no
formato `oklch`.

### Estrutura
- **`@theme inline`** — mapeia variáveis CSS semânticas (`--background`,
  `--foreground`, `--primary`, etc.) para classes utilitárias Tailwind
  (`bg-background`, `text-foreground`, `bg-primary`...), além de definir a
  escala de raios de borda (`--radius-sm` até `--radius-4xl`, derivados de
  `--radius`).
- **`:root`** — valores de tema claro (light) para todas as variáveis
  semânticas: `background`, `foreground`, `card`, `popover`, `primary`,
  `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`,
  paleta de gráficos (`chart-1` a `chart-5`) e paleta da sidebar
  (`sidebar*`). Também define sombras (`--shadow-xs/sm/md`) e fontes
  (`--font-sans`: Inter; `--font-display`: Inter Display).
- **`.dark`** — sobrescreve as mesmas variáveis com os valores do tema
  escuro. A alternância é feita adicionando/removendo a classe `dark` no
  elemento raiz (controlado por `theme-context.tsx`, ver
  `docs/shell-navegacao.md`).
- **`@layer base`** — regras globais: toda borda usa `--color-border`; o
  `body` usa `--color-background`/`--color-foreground`, fonte `--font-sans`
  e ajustes de rendering de texto; títulos (`h1`–`h6`) usam
  `--font-display` com leve redução de tracking.

### Regra de ouro
Todas as cores devem ser definidas em `oklch`. Para adicionar uma nova cor
semântica: (1) declarar a variável em `:root` e `.dark`; (2) registrá-la em
`@theme inline` como `--color-<nome>: var(--<nome>)` para que vire uma
classe Tailwind (`bg-<nome>`, `text-<nome>`...).

### Paleta de apoio usada nos módulos
Além dos tokens do tema, os módulos usam cores `oklch` diretas para tons
específicos (categorias, tipos, status), sempre combinadas com
`color-mix(in oklab, <cor> <%>, transparent)` para gerar fundos suaves. Essa
convenção aparece em badges (`Chip`, `StatusChip`, `TypeBadge` etc.) tanto
nos componentes compartilhados quanto nos componentes de módulo (Learn,
Boost).

## Componentes compartilhados (`src/components/shared/`)

O arquivo `index.ts` reexporta tudo dos seguintes módulos:
`primitives`, `data-table`, `overlays`, `form`, `tabs`, `crud-page`,
`tree-view`.

### `primitives.tsx`

- **`Chip({ tone, children })`** — selo colorido genérico (fundo/borda
  derivados de `tone` via `color-mix`).
- **`TONE`** — objeto com paleta semântica nomeada: `ok`, `info`, `cyan`,
  `warn`, `danger`, `muted`, `purple`, `orange` (valores `oklch`).
- **`StatusChip({ status })`** — mapeia uma string de status (ex.:
  `aprovado`, `pendente`, `pago`, `confirmada`, `resolvido`, `alta`, etc.)
  para um `Chip` com tom e rótulo em português; usa fallback `muted` para
  status desconhecidos.
- **`ProgressBar({ value, tone?, className? })`** — barra de progresso
  genérica (0–100), usada como base em várias telas fora de Learn/Boost
  (que têm suas próprias versões locais).
- **`StatCard({ label, value, hint?, icon, tone? })`** — cartão de
  indicador numérico com ícone, usado em dashboards.
- **`SectionCard({ title, description?, action?, children, className? })`**
  — cartão de seção com cabeçalho (título + descrição opcional + ação) e
  conteúdo.
- **`Avatar({ initials, tone?, size? })`** — avatar circular com iniciais.
- **`EmptyState({ icon, title, description? })`** — estado vazio padrão
  (usado também internamente por `DataTable`).
- **`FilterInput({ value, onChange, placeholder, icon? })`** — campo de
  busca/filtro com ícone opcional.
- **`Select({ value, onChange, options })`** — select nativo estilizado
  (versão simples, diferente do componente shadcn `Select`).
- **`Btn({ children, variant?, onClick?, className?, type? })`** — botão
  genérico com variantes `solid` (fundo `foreground`) e `ghost` (borda).
- **`Table({ head, children })`** — wrapper de tabela simples com
  cabeçalho estilizado.
- **`Pagination({ page, pages, onPage, total })`** — controles de
  paginação (Anterior/Próxima) com contagem de registros.

### `data-table.tsx`

- **`Column<T>`** — tipo de definição de coluna: `key`, `header`, `cell(row)`,
  `sortValue?(row)` (habilita ordenação), `className?`.
- **`DataTable<T extends { id: string }>({ rows, columns, onRowClick?, pageSize?, emptyMessage? })`**
  — tabela completa com:
  - Ordenação por coluna (clique no cabeçalho alterna asc/desc), via estado
    interno `sort`.
  - Paginação interna (`pageSize`, padrão 10), via estado `page` e o
    componente `Pagination`.
  - Linha clicável opcional (`onRowClick`).
  - Estado vazio com `Inbox` e mensagem customizável quando `rows.length === 0`.

### `overlays.tsx`

- **`useEscape(open, onClose)`** — hook interno que fecha um overlay ao
  pressionar `Escape`.
- **`Modal({ open, onClose, title, description?, footer?, children, size? })`**
  — modal centralizado (tamanhos `sm`/`md`/`lg`), com cabeçalho (título +
  botão fechar `X`), corpo e rodapé opcional de ações.
- **`Drawer({ open, onClose, title, subtitle?, actions?, children, width? })`**
  — painel lateral direito (usado em fluxos de detalhe/edição tipo CRUD),
  com overlay de fundo clicável para fechar.
- **`ConfirmDialog({ open, onClose, onConfirm, title?, description?, confirmLabel? })`**
  — modal de confirmação padrão (ex.: exclusão), com botões "Cancelar" e
  ação destrutiva (rótulo customizável, padrão "Excluir"); chama
  `onConfirm()` e depois `onClose()`.

### `form.tsx`

- **`Field({ label, hint?, required?, className?, children })`** — wrapper
  de rótulo + controle + dica, com asterisco quando `required`.
- **`TextInput`**, **`TextArea`**, **`SelectInput`** — inputs estilizados
  com a classe base `controlClass` (borda, fundo, foco com anel).
- **`FileUpload({ value?, onChange, accept?, label?, preview? })`** —
  upload de arquivo simulado: abre seletor de arquivo nativo, gera
  `URL.createObjectURL` para pré-visualização (quando `preview` é `true` e
  o arquivo é imagem), e permite remover o arquivo selecionado. Pronto para
  ser trocado por um endpoint real de upload.

### `tabs.tsx`

- **`TabItem = { value, label, badge? }`**.
- **`TabBar({ tabs, value, onChange, className? })`** — barra de abas
  consistente usada nas telas consolidadas de módulo (ex.: Learn Home e
  ActivityDetail usam este componente para as abas Atividades/Turmas/
  Relatórios e Descrição/Questões/Mídias/etc.).

### `crud-page.tsx`

- **`CrudHeader({ title, description?, actions?, breadcrumbs? })`** —
  cabeçalho padrão de telas administrativas (título + descrição + ações),
  alternativa mais simples ao `PageHeader` de `rooster/page-header.tsx`.
- **`CrudToolbar({ search, onSearch, placeholder?, filters?, trailing?, className? })`**
  — barra de busca + filtros + ações adicionais, posicionada acima de
  tabelas.
- **`Breadcrumbs({ items })`** — trilha de navegação com itens clicáveis
  (`onClick?`) ou apenas texto no último item.

### `tree-view.tsx`

- **`TreeNode = { id, label, icon?, meta?, children? }`**.
- **`TreeView({ nodes, selectedId?, onSelect, defaultExpanded?, level? })`**
  — navegador hierárquico estilo explorador de arquivos (ex.: campus >
  blocos > ambientes, ou categorias > subcategorias), com expansão
  recursiva por nó e seleção de item ativo.

## Convenções de uso

- Componentes de `components/shared` são genéricos e reutilizáveis entre
  módulos administrativos (CRUD). Módulos como Learn e Boost mantêm suas
  próprias variações locais de `ProgressBar`, badges de status etc.
  (em `learn/badges.tsx` e `boost/badges.tsx`) para tons e rótulos
  específicos do domínio, mas seguem o mesmo padrão visual (selo com
  `color-mix`, barra de progresso com altura `h-1.5`).
- Toda cor de destaque usada em badges/gráficos é declarada em `oklch` e
  aplicada via `style` inline combinada com `color-mix(in oklab, ...)`,
  nunca por classes Tailwind de cor fixas, para manter compatibilidade com
  os temas claro/escuro.
- `PageHeader` (`rooster/page-header.tsx`) é o cabeçalho padrão dentro dos
  módulos de produto (Learn, Boost, etc.), enquanto `CrudHeader`
  (`shared/crud-page.tsx`) é o padrão em telas administrativas de CRUD.
