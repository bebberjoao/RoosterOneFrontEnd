# Modelo de dados — Rooster Boost

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O módulo persiste a **plataforma de treinamentos/EAD corporativos**: categorias
e instrutores, cursos com estrutura de módulos/aulas/blocos de conteúdo,
biblioteca de vídeos reutilizáveis, matrículas dos colaboradores e os
certificados emitidos ao concluir um curso.

Dependências externas: `usuarios`/`setores` (Rooster Hub) para o colaborador
matriculado e seu setor. Enquanto o Hub não estiver integrado, os campos
correspondentes podem permanecer textuais (`student`, `student_sector`).

## 2. Diagrama de relacionamentos

```text
┌────────────────────┐        ┌────────────────────┐
│  boost_categories   │        │  boost_instructors  │
└──────────┬──────────┘        └──────────┬──────────┘
           │ 1:N                          │ 1:N
           │                              │
   ┌───────▼──────────────────────────────▼───────┐
   │                boost_courses                   │
   └───────┬─────────────────────────────┬─────────┘
           │ 1:N (on delete cascade)      │ 1:N (on delete restrict)
   ┌───────▼──────────┐          ┌────────▼────────────┐
   │  boost_modules     │          │  boost_enrollments   │───▶ usuarios (Hub)
   └───────┬────────────┘          └────────┬────────────┘      [student_id]
           │ 1:N (on delete cascade)         │ 1:N
   ┌───────▼──────────┐            ┌─────────▼───────────┐
   │  boost_lessons     │            │  boost_certificates  │
   └───────┬────────────┘            └──────────────────────┘
           │ 1:N (on delete cascade)
   ┌───────▼───────────────┐        ┌────────────────────┐
   │ boost_lesson_blocks     │──────▶│  boost_videos       │
   │ (conteúdo da aula)       │ N:1  │ (quando type =       │
   └─────────────────────────┘ opc. │ 'video-upload')      │
                                     └────────────────────┘

boost_courses.category_id/instructor_id são desnormalizados em
category_color/instructor (nome+avatar) no mock, apenas por conveniência de
exibição — no banco relacional usar sempre a FK.
```

## 3. Tabelas

### 3.1 `boost_categories` — array TS `CATEGORIES` (`src/mock/database/boostCategories.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | text | não | — | PK (slug curto, ex.: `tec`) |
| `name` | text | não | — | Nome da categoria |
| `color` | text | não | — | Cor de identificação (token/OKLCH) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

### 3.2 `boost_instructors` — tipo TS `Instructor` (`src/mock/database/instructors.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `user_id` | uuid | sim | — | FK → `usuarios(id)` (Hub), quando integrado |
| `name` | text | não | — | Nome do instrutor |
| `role` | text | não | — | Área/cargo |
| `avatar` | text | sim | — | Iniciais/URL do avatar |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

### 3.3 `boost_courses` — tipo TS `Course` (`src/mock/database/boostCourses.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `slug` | text | não | — | Slug (UNIQUE) |
| `title` | text | não | — | Título |
| `category_id` | text | não | — | FK → `boost_categories(id)` |
| `instructor_id` | uuid | não | — | FK → `boost_instructors(id)` |
| `cover` | text | sim | — | Gradiente/URL de capa |
| `description` | text | sim | — | Descrição |
| `objectives` | text[] | não | `'{}'` | Objetivos de aprendizagem |
| `prerequisites` | text[] | não | `'{}'` | Pré-requisitos |
| `audience` | text | sim | — | Público-alvo |
| `workload` | text | não | — | Carga horária (ex.: `40h`) |
| `students` | integer | não | `0` | Nº de alunos (cache; recalculável via `boost_enrollments`) |
| `rating` | numeric(2,1) | não | `0` | Avaliação média |
| `reviews` | integer | não | `0` | Nº de avaliações |
| `level` | `course_level` | não | `'iniciante'` | Nível |
| `status` | `course_status` | não | `'rascunho'` | Situação editorial |
| `certificate` | boolean | não | `true` | Emite certificado ao concluir |
| `price` | `course_price` | não | `'gratuito'` | Gratuito ou restrito |
| `published_at` | date | sim | — | Data de publicação |
| `tags` | text[] | não | `'{}'` | Tags de busca |
| `completion_rate` | smallint | não | `0` | % médio de conclusão (cache) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (slug)`; `check (rating between 0 and 5)`;
`check (completion_rate between 0 and 100)`.
Índices: `idx_boost_courses_category(category_id)`,
`idx_boost_courses_status(status)`.

### 3.4 `boost_modules` — campo TS `Course.modules`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `course_id` | uuid | não | — | FK → `boost_courses(id)` `on delete cascade` |
| `title` | text | não | — | Título do módulo |
| `summary` | text | sim | — | Resumo |
| `order` | smallint | não | — | Ordem de exibição |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (course_id, order)`.

### 3.5 `boost_lessons` — campo TS `Module.lessons`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `module_id` | uuid | não | — | FK → `boost_modules(id)` `on delete cascade` |
| `title` | text | não | — | Título da aula |
| `duration` | text | não | — | Duração (ex.: `08:12`) |
| `has_quiz` | boolean | não | `false` | Possui quiz de checkpoint |
| `order` | smallint | não | — | Ordem de exibição |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (module_id, order)`.

### 3.6 `boost_lesson_blocks` — campo TS `Lesson.blocks`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `lesson_id` | uuid | não | — | FK → `boost_lessons(id)` `on delete cascade` |
| `type` | `content_type` | não | — | Tipo de conteúdo do bloco |
| `label` | text | não | — | Rótulo de exibição |
| `video_id` | uuid | sim | — | FK → `boost_videos(id)`, quando `type = 'video-upload'` |
| `order` | smallint | não | — | Ordem de exibição |

Constraints: `unique (lesson_id, order)`.

### 3.7 `boost_videos` — tipo TS `VideoAsset` (`src/mock/database/videos.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `title` | text | não | — | Título |
| `description` | text | sim | — | Descrição |
| `duration` | text | não | — | Duração (`mm:ss`) |
| `author` | text | não | — | Autor/instrutor |
| `category_id` | text | sim | — | FK → `boost_categories(id)` |
| `thumb` | text | sim | — | Miniatura/gradiente |
| `size` | text | não | — | Tamanho do arquivo (ex.: `184 MB`) |
| `used_in` | integer | não | `0` | Nº de aulas que usam o vídeo (cache) |
| `uploaded_at` | date | não | — | Data de upload |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

### 3.8 `boost_enrollments` — tipo TS `Enrollment` (`src/mock/database/boostEnrollments.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `course_id` | uuid | não | — | FK → `boost_courses(id)` `on delete restrict` |
| `student_id` | uuid | sim | — | FK → `usuarios(id)` (Hub) |
| `student` | text | não | — | Nome do aluno (fallback pré-Hub) |
| `student_sector` | text | sim | — | Setor do aluno (fallback pré-Hub) |
| `progress` | smallint | não | `0` | % de progresso |
| `last_access` | timestamptz | sim | — | Último acesso |
| `status` | `enrollment_status` | não | `'ativo'` | Situação da matrícula |
| `grade` | numeric(3,1) | sim | — | Nota final |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (course_id, student_id)`; `check (progress between 0 and 100)`;
`check (grade is null or grade between 0 and 10)`.
Índices: `idx_boost_enroll_course(course_id)`, `idx_boost_enroll_student(student_id)`,
`idx_boost_enroll_status(status)`.

### 3.9 `boost_certificates` — tipo TS `Certificate` (`src/mock/database/certificates.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `code` | text | não | — | Código do certificado (UNIQUE), ex.: `RB-2026-0001` |
| `enrollment_id` | uuid | sim | — | FK → `boost_enrollments(id)` |
| `course_id` | uuid | não | — | FK → `boost_courses(id)` |
| `student` | text | não | — | Nome do aluno (desnormalizado para exibição) |
| `course` | text | não | — | Título do curso no momento da emissão |
| `workload` | text | não | — | Carga horária concluída |
| `issued_at` | date | não | — | Data de emissão |
| `status` | `certificate_status` | não | `'pendente'` | Situação do certificado |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`.

## 4. Enums

```sql
create type course_level as enum ('iniciante','intermediario','avancado');

create type course_status as enum ('publicado','rascunho','revisao','arquivado');

create type course_price as enum ('gratuito','restrito');

create type content_type as enum (
  'texto','video-upload','youtube','vimeo','pdf','doc','slide',
  'planilha','imagem','audio','link','codigo','download');

create type enrollment_status as enum ('ativo','concluido','atrasado','cancelado');

create type certificate_status as enum ('emitido','pendente','revogado');
```

Os valores devem permanecer idênticos aos literais TS em
`src/components/rooster/boost/mock-data.ts`.

## 5. Regras de negócio

1. `boost_courses.status = 'publicado'` é o único status visível para
   matrícula de colaboradores; `rascunho`/`revisao`/`arquivado` só aparecem no
   painel administrativo.
2. `boost_enrollments.progress = 100` dispara automaticamente
   `status = 'concluido'`; se o curso tiver `certificate = true`, gera uma
   linha em `boost_certificates` com `status = 'emitido'`.
3. `status = 'atrasado'` é atribuído quando não há acesso (`last_access`) por
   um período configurável e `progress < 100`.
4. Uma matrícula cancelada (`status = 'cancelado'`) não pode voltar a
   `ativo` diretamente — deve ser recriada.
5. Transições válidas de `boost_enrollments.status`: `ativo → concluido | atrasado | cancelado`;
   `atrasado → ativo | concluido | cancelado`. `concluido` e `cancelado` são terminais.
6. `boost_courses.students`, `boost_courses.completion_rate` e
   `boost_videos.used_in` são caches derivados de `boost_enrollments` e
   `boost_lesson_blocks`; recalcular em job periódico ou trigger.
7. `boost_certificates.status = 'revogado'` não exclui o registro — mantém
   histórico para auditoria.
8. `slug` de curso e `code` de certificado são únicos.
9. Excluir um curso cascateia módulos, aulas e blocos; matrículas e
   certificados vinculados usam `on delete restrict` — arquivar o curso
   (`status = 'arquivado'`) em vez de excluir quando houver matrículas.

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts`.

| Recurso | Base | Operações |
|---|---|---|
| Cursos | `/boost-cursos` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` + filtros `?categoria=&status=&nivel=` |
| Módulos/aulas | `/boost-cursos/:id/modulos` | `GET`, `PUT` (substitui a árvore de módulos/aulas/blocos) |
| Categorias | `/boost-categorias` | `GET`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Instrutores | `/boost-instrutores` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Vídeos | `/boost-videos` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Matrículas | `/boost-matriculas` | `GET`, `GET /:id`, `POST`, `PATCH /:id/status` + filtros `?cursoId=&alunoId=&status=` |
| Certificados | `/certificados` | `GET`, `GET /:id`, `POST`, `PATCH /:id/status` + filtro `?alunoId=&cursoId=` |

> `MOCK_ENDPOINT_MAP` hoje registra apenas `boostCourses` e `certificates`;
> `boost-categorias`, `boost-instrutores`, `boost-videos` e
> `boost-matriculas` devem ser acrescentados ao mapa quando o backend estiver pronto.

## 7. Mapa frontend → banco

| Frontend | Tabela mock | Tabela física |
|---|---|---|
| `CATEGORIES` | `src/mock/database/boostCategories.ts` | `boost_categories` |
| `Instructor` | `src/mock/database/instructors.ts` | `boost_instructors` |
| `Course` | `src/mock/database/boostCourses.ts` | `boost_courses` (+ `boost_modules`, `boost_lessons`, `boost_lesson_blocks`) |
| `VideoAsset` | `src/mock/database/videos.ts` | `boost_videos` |
| `Enrollment` | `src/mock/database/boostEnrollments.ts` | `boost_enrollments` |
| `Certificate` | `src/mock/database/certificates.ts` | `boost_certificates` |
| `ENROLLMENTS_PER_MONTH`, `AVG_COMPLETION_TIME` | `src/components/rooster/boost/mock-data.ts` | agregações calculadas sobre `boost_enrollments` (não persistidas como tabela própria) |
