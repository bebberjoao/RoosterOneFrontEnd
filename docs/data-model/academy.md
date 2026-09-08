# Modelo de dados — Rooster Academy

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O módulo persiste a **estrutura acadêmica** da instituição: cursos, períodos
letivos, disciplinas, professores, turmas e a matrícula de alunos nelas, além
dos registros derivados de vida acadêmica (notas, frequência, calendário e
documentos institucionais).

Dependências externas: `usuarios` (Rooster Hub) para o vínculo 1:1 de
professores e alunos com a conta de acesso (`teachers.user_id`,
`students.user_id`); Rooster Finance para dados de bolsa (`scholarship`) hoje
mesclados no seed via `financeStudents`; Rooster Rooms para o ambiente físico
da turma (hoje texto livre em `classes.room_label`, ideal migrar para
`room_id → rooms`); Rooster Learn para itens de nota de origem `learn`
(`grade_items.origin`).

## 2. Diagrama de relacionamentos

```text
┌───────────┐        ┌───────────┐        ┌───────────┐
│  courses  │        │   terms   │        │ teachers  │──▶ usuarios (Hub)
└─────┬─────┘        └─────┬─────┘        └─────┬─────┘   [user_id]
      │ 1:N                │ 1:N                │ 1:N
      └──────────┬─────────┘                    │
                 ┌▼──────────────┐               │
                 │  disciplines  │◀──────────────┘
                 └───────┬───────┘
                         │ 1:N
                 ┌───────▼───────┐
                 │    classes    │──▶ rooms (Rooms) [room_id opcional]
                 └───┬───────┬───┘
      1:N ───────────┘       └─────────────── 1:N
┌─────▼─────────┐                      ┌──────▼───────────┐
│ enrollments   │◀── students ──▶ usuarios (Hub) [user_id]  │ grade_items    │
└───────────────┘      │                └──────┬───────────┘
      │ (studentId)     │                       │ 1:N
      │                 │ 1:N              ┌────▼────────┐
      │                 └─────────────────▶│   grades    │
      │                                     └─────────────┘
      │ 1:N
┌─────▼──────────┐
│  attendance    │
└────────────────┘

┌────────────────┐        ┌───────────────┐
│ calendar_events│        │ academy_docs  │──▶ disciplines (opcional)
└────────────────┘        └───────────────┘

courses/terms → disciplines (1:N cada); disciplines → classes (1:N);
classes.teacher_id → teachers; enrollments/attendance são a materialização
de classes.student_ids (hoje um array denormalizado no mock).
```

## 3. Tabelas

### 3.1 `terms` — tipo TS `Term` (`src/mock/database/disciplines.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome do período (ex.: `2026.1`), UNIQUE |
| `start_date` | date | não | — | Início do período letivo |
| `end_date` | date | não | — | Fim do período letivo |
| `active` | boolean | não | `false` | Período corrente |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (name)`; `check (end_date > start_date)`.

### 3.2 `courses` — tipo TS `Course`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome do curso |
| `code` | text | não | — | Sigla (UNIQUE) |
| `degree` | `course_degree` | não | — | Nível do curso |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`.

### 3.3 `teachers` — tipo TS `Teacher`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `user_id` | uuid | sim | — | FK → `usuarios(id)` (Hub) |
| `name` | text | não | — | Nome completo |
| `initials` | text | não | — | Iniciais para avatar |
| `email` | text | não | — | E-mail institucional (UNIQUE) |
| `title` | text | não | — | Titulação (ex.: `Prof. Dr.`) |
| `department` | text | não | — | Departamento |
| `weekly_hours` | smallint | não | `0` | Carga horária semanal |
| `status` | `teacher_status` | não | `'ativo'` | Situação funcional |
| `tone` | text | não | — | Cor de identificação (OKLCH) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (email)`; `check (weekly_hours >= 0)`.

### 3.4 `disciplines` — tipo TS `Discipline`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `code` | text | não | — | Código da disciplina (UNIQUE) |
| `name` | text | não | — | Nome |
| `description` | text | sim | — | Ementa resumida |
| `course_id` | uuid | não | — | FK → `courses(id)` `on delete restrict` |
| `term_id` | uuid | não | — | FK → `terms(id)` `on delete restrict` |
| `teacher_id` | uuid | sim | — | FK → `teachers(id)` `on delete set null` |
| `workload` | smallint | não | `0` | Carga horária em horas |
| `status` | `discipline_status` | não | `'ativa'` | Situação |
| `accent` | text | não | — | Cor de identificação (OKLCH) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`; `check (workload > 0)`.
Índices: `idx_disciplines_course(course_id)`, `idx_disciplines_term(term_id)`.

### 3.5 `students` — tipo TS `Student`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `user_id` | uuid | sim | — | FK → `usuarios(id)` (Hub) |
| `ra` | text | não | — | Registro acadêmico (UNIQUE) |
| `name` | text | não | — | Nome completo |
| `initials` | text | não | — | Iniciais para avatar |
| `email` | text | não | — | E-mail institucional (UNIQUE) |
| `course_id` | uuid | não | — | FK → `courses(id)` `on delete restrict` |
| `semester` | smallint | não | `1` | Semestre atual do aluno |
| `scholarship` | text | sim | — | Nome da bolsa (espelho do Rooster Finance) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (ra)`; `unique (email)`; `check (semester >= 1)`.

### 3.6 `classes` — tipo TS `Klass`/`SchoolClass`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `code` | text | não | — | Código da turma (UNIQUE) |
| `discipline_id` | uuid | não | — | FK → `disciplines(id)` `on delete cascade` |
| `term_id` | uuid | não | — | FK → `terms(id)` `on delete restrict` |
| `shift` | `class_shift` | não | — | Turno |
| `capacity` | integer | não | `0` | Vagas totais |
| `teacher_id` | uuid | sim | — | FK → `teachers(id)` `on delete set null` |
| `room_id` | uuid | sim | — | FK → `rooms(id)` (Rooms), quando integrado |
| `room_label` | text | sim | — | Local em texto livre (fallback pré-Rooms) |
| `schedule` | text | não | — | Horário legível (ex.: `Ter/Qui 19:00-22:30`) |
| `status` | `class_status` | não | `'aberta'` | Situação da turma |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`; `check (capacity >= 0)`.
Índices: `idx_classes_discipline(discipline_id)`, `idx_classes_teacher(teacher_id)`.
`student_ids` (array denormalizado no mock) é substituído pela tabela
`enrollments` no banco real.

### 3.7 `enrollments` — matrícula do aluno na turma

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `student_id` | uuid | não | — | FK → `students(id)` `on delete cascade` |
| `class_id` | uuid | não | — | FK → `classes(id)` `on delete cascade` |
| `discipline_id` | uuid | não | — | FK → `disciplines(id)`, redundante p/ desempenho |
| `status` | `enrollment_status` | não | `'aberta'` | Situação da matrícula |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (student_id, class_id)`.
Índices: `idx_enrollments_student(student_id)`, `idx_enrollments_class(class_id)`.

### 3.8 `grade_items` — itens avaliativos de uma turma

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `class_id` | uuid | não | — | FK → `classes(id)` `on delete cascade` |
| `name` | text | não | — | Nome da avaliação (ex.: `P1`) |
| `weight` | numeric(4,3) | não | — | Peso na média (0..1) |
| `origin` | `grade_item_origin` | não | `'manual'` | Origem do lançamento |
| `max` | numeric(4,1) | não | `10` | Nota máxima |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `check (weight > 0 and weight <= 1)`; `check (max > 0)`.

### 3.9 `grades` — nota do aluno em um item

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `student_id` | uuid | não | — | FK → `students(id)` `on delete cascade` |
| `item_id` | uuid | não | — | FK → `grade_items(id)` `on delete cascade` |
| `value` | numeric(4,1) | sim | — | Nota lançada; `null` = ainda não lançada |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (student_id, item_id)`.

### 3.10 `attendance` — frequência do aluno na turma

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `student_id` | uuid | não | — | FK → `students(id)` `on delete cascade` |
| `class_id` | uuid | não | — | FK → `classes(id)` `on delete cascade` |
| `percent` | numeric(5,2) | não | `0` | % de presença acumulada (0-100) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (student_id, class_id)`; `check (percent between 0 and 100)`.
No mock, `percent` é calculado deterministicamente
(`studentAttendance`); no banco real deve ser agregado a partir de registros
de chamada por aula (fora do escopo atual).

### 3.11 `calendar_events` — tipo TS `CalendarEvent`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `title` | text | não | — | Título do evento |
| `date` | date | não | — | Data de início |
| `end_date` | date | sim | — | Data de término (eventos de múltiplos dias) |
| `time_range` | text | sim | — | Faixa de horário (`HH:MM-HH:MM`) |
| `type` | `calendar_event_type` | não | — | Categoria do evento |
| `audience` | text | não | — | Público-alvo |
| `location` | text | sim | — | Local |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

### 3.12 `academy_docs` — tipo TS `AcademyDoc`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome do documento |
| `kind` | `academy_doc_kind` | não | — | Categoria |
| `discipline_id` | uuid | sim | — | FK → `disciplines(id)` `on delete cascade` (opcional) |
| `updated_at` | timestamptz | não | `now()` | Última atualização |
| `size` | text | sim | — | Tamanho legível do arquivo |
| `author` | text | não | — | Autor/responsável |
| `created_at` | timestamptz | não | `now()` | Auditoria |

## 4. Enums

```sql
create type course_degree as enum ('Graduação','Pós-graduação','Técnico','Extensão');

create type teacher_status as enum ('ativo','afastado','inativo');

create type discipline_status as enum ('ativa','arquivada','inativa');

create type class_shift as enum ('Matutino','Vespertino','Noturno');

create type class_status as enum ('aberta','em-andamento','encerrada');

create type enrollment_status as enum ('aberta','em-andamento','encerrada');

create type grade_item_origin as enum ('manual','learn');

create type calendar_event_type as enum (
  'semestre','prova','feriado','reuniao','apresentacao','semana','institucional');

create type academy_doc_kind as enum (
  'Plano de ensino','Ementa','Regulamento','Institucional');
```

Os valores devem permanecer idênticos aos literais TS em
`src/components/rooster/academy/mock-data.ts`.

## 5. Regras de negócio

1. Uma disciplina só pode ser vinculada a um curso e a um período letivo
   existentes; ao arquivar/excluir o período, disciplinas vinculadas devem
   ficar `arquivada`.
2. `classes.capacity` limita o número de `enrollments` ativas por turma
   (`aberta`/`em-andamento`).
3. `enrollments.status` acompanha `classes.status` (ver seed: status da
   matrícula = status da turma no momento da matrícula).
4. Um aluno não pode ter duas matrículas ativas na mesma turma
   (`unique (student_id, class_id)`).
5. `grade_items.weight` de uma mesma turma deve somar no máximo `1`
   (validação de aplicação, não constraint de banco).
6. A média final do aluno é a soma ponderada de `grades.value` pelos pesos de
   `grade_items` da turma, ignorando itens sem lançamento (`value is null`).
7. `attendance.percent` abaixo do mínimo institucional (hoje 75%, ver
   `MIN_ATTENDANCE` no portal do aluno) caracteriza risco de reprovação por
   falta — regra de exibição, não de banco.
8. Excluir uma disciplina cascateia em `classes`; excluir uma turma cascateia
   em `enrollments`, `grade_items`/`grades` e `attendance`.
9. `academy_docs.discipline_id` nulo indica documento institucional (não
   vinculado a uma disciplina específica).

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts`.

| Recurso | Base | Operações |
|---|---|---|
| Disciplinas | `/disciplinas` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Cursos | `/cursos` | idem |
| Períodos letivos | `/periodos-letivos` | idem |
| Professores | `/professores` | idem + filtro `?departamento=&status=` |
| Alunos | `/alunos` | idem + filtro `?cursoId=` |
| Turmas | `/turmas` | idem + filtros `?disciplinaId=&professorId=&status=` |
| Matrículas | `/matriculas` | idem + filtros `?alunoId=&turmaId=` |
| Calendário | `/calendario-eventos` | idem + filtro `?tipo=&de=&ate=` |
| Notas | `/notas` | `GET`, `PATCH` (lançamento por aluno/item) |
| Itens de nota | `/notas-itens` | idem + filtro `?turmaId=` |
| Frequência | `/frequencias` | `GET` + filtro `?alunoId=&turmaId=` |
| Documentos acadêmicos | `/documentos-academicos` | idem + filtro `?disciplinaId=` |

## 7. Mapa frontend → banco

| Frontend | Tabela mock | Tabela física |
|---|---|---|
| `Term` | `src/mock/database/disciplines.ts` (`terms`) | `terms` |
| `Course` | `src/mock/database/disciplines.ts` (`courses`) | `courses` |
| `Teacher` | `src/mock/database/teachers.ts` | `teachers` |
| `Discipline` | `src/mock/database/disciplines.ts` | `disciplines` |
| `Student` | `src/mock/database/students.ts` | `students` |
| `Klass`/`SchoolClass` | `src/mock/database/classes.ts` | `classes` |
| `Enrollment` | `src/mock/database/enrollments.ts` (derivada de `classes.studentIds`) | `enrollments` |
| `GradeItem` | `src/mock/database/grades.ts` | `grade_items` |
| `Grade`/`StudentGrade` | `src/mock/database/grades.ts` | `grades` |
| `AttendanceRecord` | `src/mock/database/attendance.ts` (derivada de `studentAttendance()`) | `attendance` |
| `CalendarEvent` | `src/mock/database/calendarEvents.ts` | `calendar_events` |
| `AcademyDoc` | `src/mock/database/academyDocs.ts` | `academy_docs` |
| `academyService.*` | `src/services/mock-api/academy.service.ts` | consumidor dos endpoints acima |
