# Modelo de dados — Rooster Student

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O Rooster Student é o **portal do aluno**: majoritariamente uma camada de
**leitura/consulta** (views) sobre dados que pertencem a outros módulos —
não introduz um domínio de dados próprio. As poucas escritas do módulo são:
atualização de dados de contato do próprio aluno, envio de atividades,
solicitação/upload de documentos, reserva de salas de estudo, abertura de
chamados e marcação de notificações como lidas.

Tabelas de origem consultadas pelo portal, por outro módulo:

| Módulo de origem | Tabelas |
|---|---|
| Rooster Academy | `students`, `courses`, `terms`, `classes`, `enrollments`, `disciplines`, `teachers`, `grade_items`, `grades`, `attendance`, `calendar_events` |
| Rooster Learn | `activities`, `submissions` |
| Rooster Boost | `boost_courses`, `boost_enrollments`, `certificates` |
| Rooster Finance | `charges`/`tuitions`, `payments`, bolsa (`students.scholarship`, espelhado do Finance) |
| Rooster Rooms | `rooms`, `room_slots`, `reservations` (o aluno como `responsible`) |
| Rooster Desk | `tickets`, `deskSectors` |
| Rooster Hub | `usuarios` (autenticação/perfil), `notificacoes` |

As únicas tabelas cujo dono conceitual é o próprio aluno enquanto ator (e não
outro módulo) são as descritas em §3: dados de contato editáveis,
notificações lidas/não lidas e a fila de documentos pessoais enviados/
solicitados. Todo o restante do portal (boletim, frequência, histórico,
financeiro, atividades, reservas, chamados, cursos Boost) é **view** de
tabelas já modeladas em `academy.md`, `finance`, `rooms.md`, `desk` e
`boost`.

## 2. Diagrama de relacionamentos

```text
                         ┌───────────────┐
                         │   usuarios    │ (Hub)
                         └───────┬───────┘
                                 │ 1:1
                         ┌───────▼───────┐
                         │   students    │ (Academy — dono do registro)
                         └───────┬───────┘
        ┌────────────────────────┼─────────────────────────────┐
        │                        │                              │
┌───────▼────────┐      ┌────────▼─────────┐          ┌─────────▼─────────┐
│  enrollments    │      │     grades        │          │    attendance     │
│  (Academy)      │      │  + grade_items    │          │     (Academy)     │
└─────────────────┘      │     (Academy)     │          └───────────────────┘
                          └───────────────────┘

┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  activities   │   │  submissions  │   │   charges/    │   │  reservations │
│   (Learn)     │──▶│    (Learn)    │   │   payments    │   │    (Rooms)    │
└───────────────┘   └───────────────┘   │  (Finance)    │   └───────────────┘
                                          └───────────────┘

┌───────────────┐   ┌───────────────┐   ┌────────────────────┐
│ boost_courses │   │   tickets     │   │ student_documents   │ (Student — próprio)
│ + certificates│   │   (Desk)      │   │ student_notifications│
│   (Boost)     │   └───────────────┘   └────────────────────┘
```

## 3. Tabelas próprias do módulo

O portal do aluno só é dono de três tabelas; as demais telas leem dados
descritos nos documentos dos módulos de origem (ver §7).

### 3.1 `student_contacts` — dados de contato editáveis pelo aluno

Complemento a `students` (Academy) com os campos que o aluno pode alterar
(`EDITABLE_FIELDS` no mock: `personalEmail`, `phone`, `address`, `district`,
`city`, `zip`, `emergency`).

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `student_id` | uuid | não | — | PK e FK → `students(id)` (Academy) `on delete cascade` |
| `personal_email` | text | sim | — | E-mail pessoal |
| `phone` | text | sim | — | Telefone |
| `address` | text | sim | — | Logradouro |
| `district` | text | sim | — | Bairro |
| `city` | text | sim | — | Cidade/UF |
| `zip` | text | sim | — | CEP |
| `emergency_contact` | text | sim | — | Contato de emergência |
| `updated_at` | timestamptz | não | `now()` | Última edição pelo aluno |

Dados institucionais imutáveis pelo aluno (nome, RA, CPF, RG, curso, campus,
turno, coordenador, data de matrícula, status) permanecem em `students` e
tabelas do Hub/Academy, exibidos como somente leitura no perfil.

### 3.2 `student_documents` — documentos pessoais do aluno

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `student_id` | uuid | não | — | FK → `students(id)` `on delete cascade` |
| `name` | text | não | — | Nome do documento |
| `kind` | `student_doc_kind` | não | — | Origem do documento |
| `status` | `student_doc_status` | não | `'pendente'` | Situação de análise |
| `file_url` | text | sim | — | Arquivo enviado (quando `kind = 'Enviado'`) |
| `size` | text | sim | — | Tamanho legível |
| `note` | text | sim | — | Observação (ex.: motivo de recusa, prazo) |
| `updated_at` | timestamptz | não | `now()` | Última atualização |
| `created_at` | timestamptz | não | `now()` | Auditoria |

Documentos do tipo `Institucional` (declaração de matrícula, histórico,
contrato) são gerados pela Secretaria a partir de dados de `students`/
`enrollments`/`grades` e apenas listados aqui para download.

### 3.3 `student_notifications` — leitura de notificações do aluno

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `student_id` | uuid | não | — | FK → `students(id)` `on delete cascade` |
| `title` | text | não | — | Título |
| `body` | text | não | — | Corpo da mensagem |
| `kind` | `student_notification_kind` | não | — | Categoria de origem |
| `read` | boolean | não | `false` | Lida pelo aluno |
| `created_at` | timestamptz | não | `now()` | Data de envio |

Na prática, cada evento relevante de outro módulo (nota lançada, boleto
gerado, prazo de atividade, resposta de chamado) publica uma linha aqui;
`read` é o único campo mutável pelo aluno.

## 4. Enums

```sql
create type student_doc_kind as enum ('Institucional','Enviado','Solicitado');

create type student_doc_status as enum (
  'disponivel','em-analise','aprovado','recusado','pendente');

create type student_notification_kind as enum (
  'academico','financeiro','atividade','chamado','curso','institucional');
```

Os valores devem permanecer idênticos aos literais TS de `DocItem` e
`Notification` em `src/components/rooster/student/mock-data.ts`.

## 5. Regras de negócio

1. O aluno só pode editar os campos listados em `EDITABLE_FIELDS`
   (`student_contacts`); os demais dados do perfil vêm de `students`/Hub e
   são somente leitura no portal.
2. `student_documents.kind = 'Enviado'` exige `file_url`; ao ser recusado
   (`status = 'recusado'`), `note` deve conter o motivo.
3. `student_documents.kind = 'Institucional'` não é criado pelo aluno; é
   emitido pela Secretaria a partir de views de `students`/`enrollments`/
   `grades`/`attendance` (histórico, declaração de matrícula etc.).
4. Frequência abaixo do mínimo institucional (`MIN_ATTENDANCE = 75%`, tabela
   `attendance` do Academy) é sinalizada no portal, mas o cálculo e a
   persistência do percentual pertencem ao Academy, não ao Student.
5. Médias parciais e finais exibidas no boletim são calculadas em tempo de
   leitura a partir de `grades`/`grade_items` (Academy); o Student não grava
   notas.
6. Reservas de sala criadas pelo aluno gravam em `reservations` (Rooms) com
   `responsible_id` apontando para o `usuarios.id` vinculado ao aluno — o
   fluxo de aprovação segue as regras de `rooms.md`.
7. Entregas de atividades gravam em `submissions` (Learn); o Student apenas
   consome `activities` e exibe status/nota vindos de lá.
8. Marcar uma notificação como lida (`student_notifications.read = true`) é
   a única escrita permitida sobre essa tabela pelo próprio aluno.

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts`. O portal
consome majoritariamente endpoints já previstos em outros módulos (Academy,
Learn, Finance, Rooms, Desk, Boost); apenas os três recursos próprios abaixo
são exclusivos do Student.

| Recurso | Base | Operações |
|---|---|---|
| Contato do aluno (próprio) | `/alunos/:id/contato` | `GET`, `PATCH` |
| Documentos do aluno (próprio) | `/alunos/:id/documentos` | `GET`, `POST` (envio), filtro `?kind=&status=` |
| Notificações do aluno (próprio) | `/alunos/:id/notificacoes` | `GET`, `PATCH /:id` (marcar como lida) |
| Boletim/histórico (leitura) | `/alunos/:id/boletim`, `/alunos/:id/historico` | `GET` — agrega `enrollments`+`grades`+`attendance` |
| Atividades (leitura, Learn) | `/atividades?alunoId=` | `GET` |
| Entregas (Learn) | `/entregas` | `POST`, `GET ?alunoId=` |
| Financeiro (leitura, Finance) | `/mensalidades?alunoId=`, `/cobrancas?alunoId=` | `GET` |
| Reservas (Rooms) | `/reservas` | `POST`, `GET ?responsavelId=` |
| Chamados (Desk) | `/chamados?abertoPor=` | `GET`, `POST` |
| Cursos Boost (leitura) | `/boost-cursos?alunoId=` | `GET` |
| Certificados (Boost) | `/certificados?alunoId=` | `GET` |

## 7. Mapa frontend → banco

| Frontend | Mock de origem | Tabela física | Módulo dono |
|---|---|---|---|
| `PROFILE` (dados institucionais) | `src/mock/database/students.ts` | `students` | Academy |
| `PROFILE` (campos editáveis) | `src/components/rooster/student/mock-data.ts` | `student_contacts` | Student |
| `DISCIPLINES` (boletim) | deriva de `enrollments`+`disciplines`+`teachers`+`attendance`+`grades` | idem | Academy |
| `ASSESSMENTS` | `src/mock/database/grades.ts` | `grade_items` + `grades` | Academy |
| `HISTORY` | deriva de `enrollments`+`grades`+`attendance` por período | idem | Academy |
| `EVENTS` (calendário) | `src/mock/database/calendarEvents.ts` | `calendar_events` | Academy |
| `ACTIVITIES` | equivalente Learn (`src/components/rooster/learn`) | `activities` | Learn |
| entregas de atividade | equivalente Learn | `submissions` | Learn |
| `BOOST_COURSES` | mock Boost | `boost_courses` (+ `boost_enrollments`) | Boost |
| certificados (`certificate`) | mock Boost | `certificates` | Boost |
| `CHARGES` | mock Finance | `charges`/`tuitions` + `payments` | Finance |
| `SCHOLARSHIP` | mock Finance (`financeStudents`) | espelhado em `students.scholarship` | Finance |
| `RESERVATIONS` / `AVAILABLE_SPACES` | mock Rooms | `reservations` / `rooms` + `room_slots` | Rooms |
| `TICKETS` / `SECTORS` | mock Desk | `tickets` / `deskSectors` | Desk |
| `DOCUMENTS` | `src/components/rooster/student/mock-data.ts` | `student_documents` | Student |
| `NOTIFICATIONS` | `src/components/rooster/student/mock-data.ts` | `student_notifications` | Student |
| `NOTICES` | `calendar_events`/mural institucional | `calendar_events` (ou tabela de avisos do Hub) | Academy/Hub |
| `studentService.*` | `src/services/mock-api/student.service.ts` | consumidor dos endpoints acima | Student |
