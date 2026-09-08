# Modelo de dados — Rooster Learn

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O módulo persiste as **atividades avaliativas** (provas, listas, trabalhos,
questionários e materiais) criadas por professores para uma turma, as
**entregas** dos alunos para essas atividades e os **conteúdos de aula**
publicados por turma.

Dependências externas: `classes`/`teachers`/`students`/`disciplines`
(Rooster Academy) para turma, professor, aluno e disciplina de cada atividade;
`usuarios` (Hub) quando a autenticação real substituir os IDs mockados de
professor/aluno.

## 2. Diagrama de relacionamentos

```text
┌──────────────┐        ┌───────────────┐
│ disciplines  │        │    classes    │
│  (Academy)   │◀──1:N──│   (Academy)   │
└──────────────┘        └───────┬───────┘
                                 │ 1:N
                         ┌───────▼───────┐        ┌────────────────┐
                         │  activities   │──1:N──▶│   questions    │
                         │ (teacher_id ↴)│        │ (embutidas na  │
                         └───────┬───────┘        │  atividade)    │
                                 │ 1:N             └────────────────┘
                         ┌───────▼───────────┐
                         │   submissions     │───▶ students (Academy)
                         └───────────────────┘

┌───────────────┐        ┌────────────────────┐
│    classes    │──1:N──▶│  lesson_contents   │
│   (Academy)   │        └────────────────────┘

activities.teacher_id ──▶ teachers (Academy)
```

## 3. Tabelas

### 3.1 `activities` — tipo TS `Activity` (`src/mock/database/activities.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `code` | text | não | — | Código legível (UNIQUE), ex.: `LRN-2400` |
| `title` | text | não | — | Título da atividade |
| `type` | `activity_type` | não | — | Tipo (prova, lista, trabalho, ...) |
| `discipline_id` | uuid | não | — | FK → `disciplines(id)` (Academy) |
| `class_id` | uuid | não | — | FK → `classes(id)` (Academy) `on delete cascade` |
| `teacher_id` | uuid | não | — | FK → `teachers(id)` (Academy) |
| `status` | `activity_status` | não | `'rascunho'` | Situação da atividade |
| `weight` | numeric(5,2) | não | `1` | Peso na composição da média |
| `max_grade` | numeric(5,2) | não | `10` | Nota máxima |
| `open_at` | timestamptz | não | — | Abertura para envio |
| `due_at` | timestamptz | não | — | Prazo final |
| `time_limit_min` | smallint | sim | — | Limite de tempo (provas/questionários) |
| `allow_late` | boolean | não | `true` | Aceita envio após o prazo |
| `published_at` | timestamptz | sim | — | Data de publicação (`null` se rascunho) |
| `questions_count` | smallint | não | `0` | Nº de questões (0 para `material`) |
| `submissions_count` | integer | não | `0` | Total de entregas recebidas |
| `to_grade_count` | integer | não | `0` | Entregas aguardando correção |
| `graded_count` | integer | não | `0` | Entregas já corrigidas |
| `avg_grade` | numeric(5,2) | sim | — | Média das notas corrigidas |
| `description` | text | sim | — | Enunciado/descrição |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`; `check (due_at > open_at)`;
`check (max_grade > 0)`; `check (weight > 0)`.
Índices: `idx_activities_class(class_id)`, `idx_activities_teacher(teacher_id)`,
`idx_activities_status(status)`.

Contadores (`submissions_count`, `to_grade_count`, `graded_count`, `avg_grade`)
são hoje calculados no seed mock; no backend devem ser materializados por
trigger/consulta agregada sobre `submissions`, não editáveis via API.

### 3.2 `questions` — tipo TS `Question` (embutidas na atividade no mock)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `activity_id` | uuid | não | — | FK → `activities(id)` `on delete cascade` |
| `type` | `question_type` | não | — | Tipo de questão |
| `statement` | text | não | — | Enunciado |
| `points` | numeric(5,2) | não | `1` | Pontuação |
| `hint` | text | sim | — | Dica |
| `explanation` | text | sim | — | Explicação/gabarito comentado |
| `shuffle` | boolean | não | `false` | Embaralhar alternativas |
| `char_limit` | integer | sim | — | Limite de caracteres (dissertativas) |
| `category` | text | sim | — | Categoria/tópico |
| `discipline_id` | uuid | sim | — | FK → `disciplines(id)` (Academy) |
| `difficulty` | `question_difficulty` | não | `'media'` | Nível de dificuldade |
| `order_index` | smallint | não | `0` | Ordem de exibição na atividade |

Índice: `idx_questions_activity(activity_id)`.

### 3.3 `question_options` — alternativas de questões objetivas

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `question_id` | uuid | não | — | FK → `questions(id)` `on delete cascade` |
| `label` | text | não | — | Texto da alternativa |
| `correct` | boolean | não | `false` | Alternativa correta |
| `order_index` | smallint | não | `0` | Ordem de exibição |

Índice: `idx_question_options_question(question_id)`.

### 3.4 `submissions` — tipo TS `Submission` (`src/mock/database/submissions.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `activity_id` | uuid | não | — | FK → `activities(id)` `on delete cascade` |
| `student_id` | uuid | não | — | FK → `students(id)` (Academy) |
| `status` | `submission_status` | não | `'pendente'` | Situação da entrega |
| `submitted_at` | timestamptz | sim | — | Data/hora do envio |
| `grade` | numeric(5,2) | sim | — | Nota atribuída |
| `feedback` | text | sim | — | Comentário do professor |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (activity_id, student_id)`;
`check (grade is null or (grade >= 0 and grade <= 10))`.
Índices: `idx_submissions_activity(activity_id)`,
`idx_submissions_student(student_id)`, `idx_submissions_status(status)`.

### 3.5 `lesson_contents` — tipo TS `LessonContent` (`src/mock/database/lessonContents.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `class_id` | uuid | não | — | FK → `classes(id)` (Academy) `on delete cascade` |
| `date` | date | não | — | Data da aula |
| `title` | text | não | — | Título do conteúdo |
| `summary` | text | não | — | Resumo da aula |
| `notes` | text | sim | — | Observações internas |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Índice: `idx_lesson_contents_class(class_id)`.

### 3.6 `lesson_materials` — materiais de apoio de uma aula

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `lesson_content_id` | uuid | não | — | FK → `lesson_contents(id)` `on delete cascade` |
| `name` | text | não | — | Nome do material |
| `kind` | `lesson_material_kind` | não | — | Tipo (pdf, link, video, slide) |
| `order_index` | smallint | não | `0` | Ordem de exibição |

Índice: `idx_lesson_materials_content(lesson_content_id)`.

## 4. Enums

```sql
create type activity_type as enum (
  'prova','lista','trabalho','questionario','material');

create type activity_status as enum (
  'rascunho','agendada','publicada','encerrada','arquivada');

create type question_type as enum (
  'dissertativa','multipla-uma','multipla-varias','vf','curta','longa',
  'upload','imagem','pdf');

create type question_difficulty as enum ('facil','media','dificil');

create type submission_status as enum (
  'pendente','enviada','corrigida','reenvio','atrasada');

create type lesson_material_kind as enum ('pdf','link','video','slide');
```

Os valores devem permanecer idênticos aos literais TS em
`src/components/rooster/learn/mock-data.ts` (tipos) e
`src/components/rooster/academy/mock-data.ts` (materiais de aula).

## 5. Regras de negócio

1. Uma entrega (`submissions`) só pode existir para atividades com
   `status` diferente de `rascunho`/`agendada`.
2. `unique (activity_id, student_id)`: cada aluno tem no máximo uma entrega
   por atividade (reenvios atualizam a mesma linha, com histórico opcional
   em tabela de auditoria).
3. `grade` só pode ser preenchida quando `status = 'corrigida'`.
4. `submitted_at` não pode ser anterior a `activities.open_at`; se posterior a
   `due_at` e `allow_late = false`, a entrega deve ser recusada pela API.
5. `avg_grade`, `submissions_count`, `to_grade_count` e `graded_count` de
   `activities` são derivados de `submissions` e recalculados a cada mudança
   de status/nota — nunca definidos diretamente pelo cliente.
6. Atividades do tipo `material` não possuem `questions` (`questions_count = 0`).
7. Transição de `status` da atividade: `rascunho → agendada|publicada`;
   `agendada → publicada`; `publicada → encerrada`; `encerrada → arquivada`.
   `arquivada` é terminal.
8. `lesson_contents.date` deve corresponder a um dia letivo da turma
   (calendário acadêmico, Rooster Academy).

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts`.

| Recurso | Base | Operações |
|---|---|---|
| Atividades | `/atividades` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` + filtros `?turmaId=&status=&tipo=` |
| Busca de atividades | `/atividades/busca?q=` | `GET` |
| Entregas | `/entregas` | `GET` + filtros `?atividadeId=&alunoId=&status=` |
| Correção | `/entregas/:id/corrigir` | `PATCH` — grava `grade`/`feedback` e marca `corrigida` |
| Conteúdos de aula | `/conteudos-aula` | `GET`, `POST`, `PATCH /:id`, `DELETE /:id` + filtro `?turmaId=` |

## 7. Mapa frontend → banco

| Frontend | Tabela mock | Tabela física |
|---|---|---|
| `Activity` | `src/mock/database/activities.ts` | `activities` (+ `questions`, `question_options`) |
| `Question` | `src/components/rooster/learn/mock-data.ts` (`QUESTIONS`) | `questions` (+ `question_options`) |
| `Submission` | `src/mock/database/submissions.ts` | `submissions` |
| `LessonContent` | `src/mock/database/lessonContents.ts` | `lesson_contents` (+ `lesson_materials`) |
| `learnService.*` | `src/services/mock-api/learn.service.ts` | consumidor dos endpoints acima |
