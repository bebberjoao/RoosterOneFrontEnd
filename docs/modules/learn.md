# Módulo Rooster Learn

## Objetivo

O Rooster Learn é o ambiente virtual de aprendizagem do Rooster One. Permite
que professores e coordenadores criem, publiquem e corrijam atividades
(provas, listas, trabalhos, questionários e materiais), acompanhem turmas e
relatórios de desempenho, e permite que alunos realizem atividades e
consultem suas notas e feedbacks.

Todo o conteúdo do módulo hoje é orientado a dados mockados (arquivo
`mock-data.ts`), preparado para futura integração com uma API real.

## Controle de acesso

O acesso e as permissões são resolvidos em `src/components/rooster/role-context.tsx`:

- `learnHasAccess(role: Role): boolean` — define quais perfis podem entrar no
  módulo. Hoje todos os perfis têm acesso, exceto `financeiro` e
  `institucional`.
- `learnCan(role: Role, perm: LearnPerm): boolean` — checagem granular de
  permissões dentro do módulo. `LearnPerm` é um union type com os valores:
  `createActivity`, `gradeActivity`, `manageQuestions`, `manageClasses`,
  `viewAllGrades`, `viewReports`, `submitActivity`.
  - `admin`: todas as permissões.
  - `professor`: todas exceto `submitActivity`.
  - `coordenador`: `viewAllGrades`, `viewReports`, `manageClasses`.
  - `aluno`: apenas `submitActivity`.
  - `financeiro`, `tecnico`, `institucional`: nenhuma.

Quando o perfil ativo não tem acesso (`learnHasAccess` retorna falso), a rota
`/learn` renderiza o estado `NoAccess`, com ícone de cadeado e mensagem
explicando que o perfil não possui permissão.

## Rotas

Arquivos em `src/routes/`:

| Arquivo | Rota | Componente | Descrição |
|---|---|---|---|
| `learn.tsx` | `/learn` (layout) | `LearnLayout` | Layout raiz do módulo. Envolve as rotas filhas em `AppShell` e valida acesso via `learnHasAccess`. Define `head` com título/descrição da página ("Rooster Learn — Ambiente virtual de aprendizagem"). |
| `learn.index.tsx` | `/learn/` | `LearnHome` | Página inicial: cartões de estatísticas, abas Atividades / Turmas / Relatórios. |
| `learn.activities.$id.tsx` | `/learn/activities/$id` | `ActivityDetail` | Detalhe/edição de uma atividade (ou criação, quando `id === "new"`), organizado em abas. |

### `LearnLayout` (learn.tsx)

- Usa `useRole()` para obter o perfil atual.
- Se `!learnHasAccess(role)`, renderiza `NoAccess` dentro do `AppShell`.
- Caso contrário, renderiza `<Outlet />` dentro do `AppShell`.

Função interna `NoAccess({ roleLabel }: { roleLabel: string })`: bloco central
com ícone `Lock`, título "Sem acesso ao Rooster Learn" e mensagem citando o
perfil sem permissão.

## Tela: `/learn/` — LearnHome

Componente principal `LearnHome()`. Estado local:
- `tab: Tab` (`"atividades" | "turmas" | "relatorios"`), padrão `"atividades"`.

Permissões consultadas: `learnCan(role, "viewReports")` e
`learnCan(role, "manageClasses")` controlam a exibição das abas
"Relatórios" e "Turmas".

### Cabeçalho (`PageHeader`)
- Eyebrow: "Rooster Learn".
- Título: "Atividades".
- Ação: botão/link "Nova atividade" (ícone `Plus`), visível apenas se
  `learnCan(role, "createActivity")`. Leva para
  `/learn/activities/$id` com `id = "new"`.

### Cartões de estatísticas
Calculados a partir de `ACTIVITIES` e `SUBMISSIONS` (mock-data):
- Para papéis não-aluno (`STATS_TEACHER`): Atividades publicadas, Aguardando
  correção, Turmas ativas, Média geral.
- Para `aluno` (`STATS_ALUNO`): Pendentes, Concluídas, Média geral (fixa em
  "7.6").

### Abas (via `TabBar` de `@/components/shared`)
- **Atividades** (`ActivitiesPanel`) — sempre visível.
- **Turmas** (`ClassesPanel`) — visível se `manageClasses`.
- **Relatórios** (`ReportsPanel`) — visível se `viewReports`.

### `ActivitiesPanel()`
Estado local: `q` (busca texto), `disc`, `kls`, `status`, `teach` (filtros
por select). Filtra `ACTIVITIES` via `useMemo`.

Tabela com colunas: Atividade (título + badge de tipo + código/questões/peso),
Disciplina, Turma, Professor, Prazo (`relativeDue` + `formatDate`), Situação
(`ActivityStatusBadge`), Entregas (contagem `submissionsCount/total`), Média
(`avgGrade`), Ações.

Paginação simulada (botões "Anterior"/"Próximo", sem lógica real de páginas).

### `ClassesPanel()`
Grade de cards por turma (`KLASSES`), mostrando disciplina, nome da turma,
número de alunos, número de atividades, média e barra de participação
(`ProgressBar`).

### `ReportsPanel()`
Três cartões de indicadores: Entregas, Média geral, Entregas atrasadas —
calculados a partir de `SUBMISSIONS`.

### Componente auxiliar
`FilterSelect({ value, onChange, placeholder, options })` — wrapper de
`Select` (shadcn) usado pelos filtros do painel de atividades.

## Tela: `/learn/activities/$id` — ActivityDetail

Componente principal `ActivityDetail()`. Parâmetro de rota `id` via
`Route.useParams()`. Se `id === "new"`, `isNew = true` e não busca atividade
existente. Caso o id não exista em `ACTIVITIES`, mostra mensagem "Atividade
não encontrada" com link de volta para `/learn`.

Estado local: `tab: Tab` com valores
`"descricao" | "questoes" | "midias" | "entregas" | "correcao" | "notas" | "feedback" | "historico"`.

Abas exibidas dependem do contexto:
- `descricao`, `questoes`, `midias`: sempre.
- `entregas`, `notas`, `feedback`, `historico`: apenas se `!isNew`.
- `correcao`: apenas se `!isNew` e `learnCan(role, "gradeActivity")`.

### Cabeçalho
- Link "Voltar" para `/learn` (ícone `ArrowLeft`).
- `PageHeader` com badge de status (`ActivityStatusBadge`, se `!isNew`) e
  botões de ação "Salvar rascunho" (`Save`) e "Publicar"/"Salvar" (`Send`).

### Função utilitária
`uid(): string` — gera um id curto aleatório (`Math.random().toString(36).slice(2, 9)`), usado para criar ids de novas questões/opções.

### Sub-componentes (abas)

- **`DescricaoTab({ activity })`** — formulário com campos: Nome da
  atividade, Disciplina (`Select`), Turma (`Select`), Professor responsável
  (`Select`), Peso, Nota máxima, Abertura (datetime), Prazo final
  (datetime), Tempo máximo (min), Instruções gerais (`Textarea`). Usa
  componente auxiliar `Field({ label, children })` para rótulo + controle.

- **`QuestoesTab()`** — CRUD local (estado `questions: Question[]`) de
  questões da atividade. Ações: `addQuestion()` adiciona questão vazia;
  `removeQuestion(id)` remove; `updateQuestion(id, patch)` atualiza campos.
  Cada questão tem enunciado (`Textarea`), pontos (input numérico) e,
  opcionalmente, alternativas (rádio + texto), com botão "Adicionar
  alternativa".

- **`MidiasTab()`** — três seções: Imagens (`FileUpload` de
  `@/components/shared`, aceita `image/*`), Vídeos (placeholder estático com
  texto informativo), Arquivos de apoio (`FileUpload` genérico,
  `preview={false}`).

- **`EntregasTab({ activityId })`** — tabela somente leitura das submissões
  (`SUBMISSIONS`) da atividade: Aluno, Enviado em, Situação
  (`SubmissionBadge`), Nota.

- **`CorrecaoTab({ activityId })`** — tela mestre/detalhe de correção.
  Lista lateral de entregas (`submissions`), estado `selected` controla qual
  entrega está aberta. Painel direito mostra respostas do aluno (placeholder
  de texto), campo de Nota final (`Input`) e Feedback (`Textarea`). Botões
  "Solicitar reenvio" (`RotateCcw`) e "Aprovar" (`CheckCircle2`) — ainda sem
  lógica de submissão conectada.

- **`NotasTab({ activity })`** — tabela de notas por aluno da turma da
  atividade.

- **`FeedbackTab({ activityId })`** — lista de feedbacks já enviados
  (submissões com `feedback` preenchido); mostra mensagem vazia caso não
  haja nenhum.

- **`HistoricoTab({ activity })`** — linha do tempo simples com eventos fixos
  "Atividade criada" e "Atividade publicada", com data formatada.

## Componentes do módulo (`src/components/rooster/learn/`)

### `badges.tsx`
- `TypeBadge({ type: ActivityType })` — selo colorido do tipo de atividade
  (prova, lista, trabalho, questionário, material).
- `ActivityStatusBadge({ status: ActivityStatus })` — selo de status da
  atividade (rascunho, agendada, publicada, encerrada, arquivada).
- `SubmissionBadge({ status: SubmissionStatus })` — selo de status da
  entrega (pendente, enviada, corrigida, reenvio, atrasada).
- `ProgressBar({ value, tone? })` — barra de progresso genérica usada em
  cards de turma.

### `mock-data.ts`
Fonte única de dados fictícios e helpers do módulo:

- Tipos: `ActivityStatus`, `ActivityType`, `QuestionType`, `Discipline`,
  `Klass`, `Teacher`, `Student`, `Question`, `Activity`, `SubmissionStatus`,
  `Submission`.
- Coleções: `DISCIPLINES`, `TEACHERS`, `KLASSES`, `STUDENTS`, `QUESTIONS`,
  `ACTIVITIES`, `SUBMISSIONS`.
- Mapas de rótulo/cor: `TYPE_LABEL`, `TYPE_TONE`, `STATUS_LABEL`,
  `STATUS_TONE`, `SUB_LABEL`, `SUB_TONE`, `QTYPE_LABEL`.
- Funções utilitárias:
  - `discipline(id: string)` — retorna a disciplina pelo id.
  - `klass(id: string)` — retorna a turma pelo id.
  - `teacher(id: string)` — retorna o professor pelo id.
  - `formatDate(iso: string): string` — formata data/hora em pt-BR.
  - `relativeDue(iso: string): string` — texto relativo ao prazo ("em Xh",
    "há Xh", "em Xd").
- Séries para gráficos (não usadas atualmente na tela, mas exportadas):
  `SUBMISSIONS_PER_MONTH`, `AVG_BY_KLASS`, `EVOLUTION`.

## Tabela de botões e ações

| Tela | Botão/Ação | Ícone | Efeito atual |
|---|---|---|---|
| `/learn/` | Nova atividade | `Plus` | Navega para `/learn/activities/new`. Visível só com permissão `createActivity`. |
| `/learn/` (Atividades) | Exportar | `Download` | Botão presente na barra de filtros; sem ação implementada. |
| `/learn/` (Atividades) | Abrir / Realizar (linha da tabela) | — | Navega para `/learn/activities/$id`. Rótulo "Realizar" para `aluno`, "Abrir" para os demais. |
| `/learn/` (Atividades) | Anterior / Próximo (paginação) | — | Botões de paginação sem lógica de múltiplas páginas conectada. |
| `/learn/activities/$id` | Voltar (breadcrumb) | `ArrowLeft` | Navega para `/learn`. |
| `/learn/activities/$id` | Salvar rascunho | `Save` | Sem ação implementada (placeholder). |
| `/learn/activities/$id` | Publicar / Salvar | `Send` | Sem ação implementada (placeholder); rótulo muda conforme `isNew`. |
| Aba Questões | Nova questão | `Plus` | Adiciona questão vazia ao estado local (`addQuestion`). |
| Aba Questões | Remover questão (lixeira) | `Trash2` | Remove a questão do estado local (`removeQuestion`). |
| Aba Questões | Adicionar alternativa | `Plus` | Adiciona alternativa vazia à questão de múltipla escolha. |
| Aba Mídias | Enviar imagem | `Upload` (via `FileUpload`) | Seleciona arquivo local e gera preview via `URL.createObjectURL`; sem envio real. |
| Aba Mídias | Enviar arquivo | `Upload` (via `FileUpload`) | Idêntico ao acima, sem preview de imagem. |
| Aba Correção | Solicitar reenvio | `RotateCcw` | Sem ação implementada (placeholder). |
| Aba Correção | Aprovar | `CheckCircle2` | Sem ação implementada (placeholder). |
| Aba Correção | Selecionar entrega (lista lateral) | `ChevronRight` | Atualiza estado `selected`, trocando a entrega exibida no painel. |
