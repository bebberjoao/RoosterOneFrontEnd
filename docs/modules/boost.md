# Módulo Rooster Boost

## Objetivo

O Rooster Boost é a plataforma de cursos online, treinamentos e
certificações do Rooster One. Permite criar e publicar cursos estruturados
em módulos e aulas, acompanhar matrículas, avaliações, certificados
emitidos e indicadores de desempenho (conclusão, engajamento, avaliações).

O módulo é hoje inteiramente orientado a dados mockados
(`mock-data.ts`), preparado para futura integração com uma API real.

## Controle de acesso

Diferente do Rooster Learn, o `boost.tsx` não implementa nenhuma checagem de
permissão própria (não usa `learnHasAccess`/`learnCan` equivalentes). O
controle de quem enxerga o módulo no menu é feito em
`src/components/rooster/module-config.ts`, no item `MODULES` com
`id: "boost"`, cujo campo `roles` é `["admin", "aluno"]` — ou seja, apenas
Administrador e Aluno veem "Rooster Boost" na barra lateral. Não há tela de
"sem acesso" dedicada: qualquer perfil que acesse a URL diretamente
consegue visualizar o conteúdo, pois a rota não bloqueia.

## Rotas

Arquivos em `src/routes/`:

| Arquivo | Rota | Componente | Descrição |
|---|---|---|---|
| `boost.tsx` | `/boost` (layout) | função inline | Layout raiz do módulo: envolve as rotas filhas em `AppShell`. Define `head` com título/descrição ("Rooster Boost — Plataforma de cursos e certificações"). |
| `boost.index.tsx` | `/boost/` | `BoostDashboard` | Dashboard com indicadores gerais, gráficos e listas (cursos mais acessados, últimas matrículas, últimas avaliações). |
| `boost.courses.$id.tsx` | `/boost/courses/$id` | `CourseDetail` | Detalhe de um curso: capa, metadados, estrutura de módulos/aulas, objetivos, pré-requisitos e métricas de conclusão. |

## Tela: `/boost/` — BoostDashboard

Componente principal `BoostDashboard()`. Não possui estado local (dados
derivados diretamente de `COURSES`, `ENROLLMENTS`, `CERTIFICATES` via
cálculos simples).

### Cabeçalho (`PageHeader`)
- Eyebrow: "Rooster Boost". Título: "Visão geral".
- Ação: link "Criar curso" (ícone `ArrowUpRight`), atualmente aponta para
  `/boost` (não implementa criação real).

### Cartões de estatísticas (`STATS`)
Total de cursos, Cursos ativos, Em desenvolvimento, Alunos matriculados,
Certificados emitidos, Horas publicadas — todos calculados a partir de
`COURSES` e `CERTIFICATES`.

### Gráficos (biblioteca `recharts`)
- **Matrículas por mês** (`AreaChart`) — usa `ENROLLMENTS_PER_MONTH`.
- **Cursos por categoria** (`PieChart`) — agrupa `COURSES` por `CATEGORIES`.
- **Taxa de conclusão** (`BarChart` horizontal) — top 5 cursos por
  `completionRate`.
- **Tempo médio de conclusão** (`LineChart`) — usa `AVG_COMPLETION_TIME`.

### Listas
- **Cursos mais acessados** — top 5 por número de alunos (`students`),
  mostra capa, título, instrutor, carga horária, avaliação (`RatingStars`),
  barra de conclusão (`ProgressBar`) e contagem de alunos. Link "Ver todos"
  aponta para `/boost` (sem filtro real).
- **Últimas matrículas** — 5 primeiras `ENROLLMENTS`, com progresso
  (`ProgressBar`) e último acesso. Link "Ver todas" aponta para `/boost`.
- **Últimas avaliações** — lista estática (`lastReviews`, hard-coded no
  componente) com nome do aluno, curso avaliado, comentário e nota em
  estrelas.

## Tela: `/boost/courses/$id` — CourseDetail

Componente principal `CourseDetail()`. Usa `loader` na definição da rota:

```
loader: ({ params }) => {
  const course = COURSES.find((c) => c.id === params.id);
  if (!course) throw notFound();
  return { course };
}
```

Se o curso não existir, renderiza `notFoundComponent: NotFound`, que mostra
mensagem "Curso não encontrado." com link de volta ao catálogo (`/boost`).

Estado local: `expanded: Record<string, boolean>` — controla quais módulos
do curso estão expandidos no acordeão de estrutura (inicializado com apenas
o primeiro módulo aberto). Função `toggle(id: string)` alterna o estado de
um módulo.

### Mapas de apoio
- `CONTENT_ICON: Record<ContentType, LucideIcon>` — ícone para cada tipo de
  bloco de conteúdo de aula (texto, vídeo, YouTube, Vimeo, PDF, doc, slide,
  planilha, imagem, áudio, link, código, download).
- `CONTENT_LABEL: Record<ContentType, string>` — rótulo em português para
  cada tipo de conteúdo.

### Cabeçalho do curso
Capa (`course.cover`), categoria (`categoryColor`/`categoryName`), nível
(`LevelBadge`), status (`StatusBadge`), selo de certificado (se
`course.certificate`), data de publicação. Título, descrição, instrutor
(avatar/nome/cargo), carga horária, número de aulas, número de alunos,
avaliação (`RatingStars`, se `rating > 0`).

Botões de ação do curso: Publicar/Republicar (`Rocket`), Duplicar (`Copy`),
Arquivar (`Archive`), Excluir (`Trash2`) — nenhum possui lógica conectada.

### Estrutura do curso
Lista de módulos (`course.modules`) em acordeão. Cada módulo mostra número
de aulas e resumo; ao expandir, lista as aulas com: numeração (m.l),
título, selo "Avaliação" (se `hasQuiz`), badges de blocos de conteúdo
(ícone + rótulo) e duração. Rodapé de cada módulo tem botões "Aula"
(`Plus`) e "Avaliação" (`ClipboardList`) sem ação implementada. Botão
"Novo módulo" no cabeçalho da seção, também sem ação implementada.

### Barra lateral (aside)
- **Objetivos** — lista de `course.objectives`.
- **Pré-requisitos** — lista de `course.prerequisites` (ou mensagem "Nenhum
  pré-requisito."), além de Público-alvo (`course.audience`) e Tags
  (`course.tags`).
- **Taxa de conclusão** — `ProgressBar` com `course.completionRate`,
  contadores de Reviews e Avaliação, e botão "Ver comentários"
  (`MessageSquare`) sem ação implementada.

## Componentes do módulo (`src/components/rooster/boost/`)

### `badges.tsx`
- `StatusBadge({ status: CourseStatus })` — selo do status do curso
  (publicado, rascunho, em revisão, arquivado).
- `LevelBadge({ level: CourseLevel })` — selo do nível (iniciante,
  intermediário, avançado).
- `ProgressBar({ value, tone? })` — barra de progresso genérica.
- `RatingStars({ value })` — exibe estrela + valor numérico (`toFixed(1)`).

### `mock-data.ts`
Fonte única de dados fictícios e helpers do módulo:

- Tipos: `CourseLevel`, `CourseStatus`, `ContentType`, `Instructor`,
  `Lesson`, `Module`, `Course`, `VideoAsset`, `Certificate`, `Enrollment`.
- Mapas de rótulo/cor: `LEVEL_LABEL`, `LEVEL_TONE`, `STATUS_LABEL`,
  `STATUS_TONE`.
- Coleções: `CATEGORIES`, `INSTRUCTORS`, `COURSES` (gerado a partir de
  `COURSE_SEED` + `mkModules`), `VIDEOS`, `CERTIFICATES`, `ENROLLMENTS`.
- Séries para gráficos: `ENROLLMENTS_PER_MONTH`, `AVG_COMPLETION_TIME`.
- Funções utilitárias:
  - `mkModules(seed: number, count: number): Module[]` — gera módulos e
    aulas fictícios de forma determinística a partir de uma seed.
  - `categoryName(id: string): string` — nome da categoria pelo id.
  - `categoryColor(id: string): string` — cor da categoria pelo id.
  - `formatDate(iso: string): string` — formata data em pt-BR (dia/mês
    abreviado/ano), tratando valores vazios ou `"—"`.

## Tabela de botões e ações

| Tela | Botão/Ação | Ícone | Efeito atual |
|---|---|---|---|
| `/boost/` | Criar curso | `ArrowUpRight` | Link para `/boost` (sem fluxo de criação implementado). |
| `/boost/` | Ver todos (Cursos mais acessados) | — | Link para `/boost` (sem filtro aplicado). |
| `/boost/` | Ver todas (Últimas matrículas) | — | Link para `/boost` (sem filtro aplicado). |
| `/boost/courses/$id` | Voltar ao catálogo | `ArrowLeft` | Navega para `/boost`. |
| `/boost/courses/$id` | Publicar / Republicar | `Rocket` | Sem ação implementada (placeholder); rótulo muda conforme `course.status`. |
| `/boost/courses/$id` | Duplicar | `Copy` | Sem ação implementada. |
| `/boost/courses/$id` | Arquivar | `Archive` | Sem ação implementada. |
| `/boost/courses/$id` | Excluir | `Trash2` | Sem ação implementada. |
| `/boost/courses/$id` | Expandir/recolher módulo | `ChevronDown`/`ChevronRight` | Alterna estado `expanded` (visual apenas). |
| `/boost/courses/$id` | Novo módulo | `Plus` | Sem ação implementada. |
| `/boost/courses/$id` | Aula (dentro do módulo) | `Plus` | Sem ação implementada. |
| `/boost/courses/$id` | Avaliação (dentro do módulo) | `ClipboardList` | Sem ação implementada. |
| `/boost/courses/$id` | Ver comentários | `MessageSquare` | Sem ação implementada. |
