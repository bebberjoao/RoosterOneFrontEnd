# Rooster Academy — Gestão Acadêmica

## Objetivo do módulo

O Rooster Academy é o módulo de gestão acadêmica institucional: cadastro e manutenção de
disciplinas, turmas, professores e calendário letivo, além do lançamento de frequência e notas
por turma e de um painel com indicadores gerais (disciplinas ativas, turmas, professores,
ocupação, aprovação etc.). É o "back office" acadêmico que alimenta o que o aluno vê no Rooster
Student.

O acesso é controlado por permissões de perfil (`src/components/rooster/academy/permissions.ts`):
apenas `admin`, `coordenador` e `professor` têm alguma permissão; `aluno`, `financeiro`,
`tecnico` e `institucional` não têm acesso e veem uma tela de "Acesso restrito".

## Rotas

Layout raiz: `src/routes/academy.tsx` (`/academy`) valida acesso via `academyHasAccess(role)` e
renderiza `<Outlet />` dentro do `AppShell`.

| Rota | Arquivo | Tela |
|---|---|---|
| `/academy` | `src/routes/academy.index.tsx` | Painel acadêmico (dashboard) |
| `/academy/manage` | `src/routes/academy.manage.tsx` | Gestão acadêmica (abas: Disciplinas, Turmas, Professores, Calendário) |
| `/academy/attendance` | `src/routes/academy.attendance.tsx` | Chamada (lançamento de frequência) |
| `/academy/grades` | `src/routes/academy.grades.tsx` | Notas (lançamento de boletim por turma) |

## Telas

### Painel acadêmico (`academy.index.tsx`)

Dashboard com cartões de indicadores (disciplinas ativas, turmas ativas, professores ativos,
aulas hoje, alunos matriculados, atividades pendentes vindas do Rooster Learn, ocupação média,
aprovação média), gráficos (recharts: matrículas por turma, evolução mensal de aulas/presença,
distribuição de disciplinas por curso) e lista de próximos eventos do calendário. Usa dados de
`src/components/rooster/academy/mock-data.ts` diretamente (não chama o serviço).

### Gestão acadêmica (`academy.manage.tsx`)

Contêiner com `TabBar` (`@/components/shared`) que alterna entre quatro abas, cada uma um
componente em `src/components/rooster/academy/manage/`:

- **Disciplinas** (`disciplines-tab.tsx`): CRUD de disciplinas do catálogo.
- **Turmas** (`classes-tab.tsx`): CRUD de turmas, matrícula/desmatrícula de alunos e
  documentos anexos da turma.
- **Professores** (`teachers-tab.tsx`): CRUD do corpo docente.
- **Calendário** (`calendar-tab.tsx`): eventos do calendário acadêmico e períodos letivos
  (termos), com CRUD de ambos.

Todas as quatro abas usam `academyCan(role, perm)` para exibir/ocultar botões de criar/editar
conforme a permissão do perfil logado, e consomem `academyService` (ver seção Serviços) para
carregar e persistir dados no mock-db.

### Chamada (`academy.attendance.tsx`)

Lançamento de frequência de uma turma em uma data: seleção de turma e data, marcação em massa
("Marcar todos") e marcação individual por aluno com os códigos P (presente), F (falta), A
(atraso) e J (justificada). Exibe cartões de contagem por status e o percentual de presença
efetiva calculado no cliente. Os dados de turma/alunos vêm de `mock-data.ts`; o estado das
marcações é local (`useState`) e não é persistido pelo botão "Salvar chamada" (sem chamada de
serviço implementada).

### Notas (`academy.grades.tsx`)

Lançamento de notas por turma: seleciona turma, lista os itens de avaliação da turma
(`GRADE_ITEMS`) e permite editar a nota de cada aluno por item em campos numéricos (0–10).
Calcula média ponderada por aluno, média da turma e percentual de aprovação (nota ≥ 6) no
cliente. Os valores iniciais vêm de `STUDENT_GRADES`; edições ficam em estado local
(`grades`), sem chamada de serviço para os botões "Nova avaliação" / "Salvar boletim" (não
implementados nesta tela — diferente das abas de `manage/`, que já usam `academyService`).

## Componentes

- `src/components/rooster/academy/badges.tsx`: `DisciplineStatusBadge`, `KlassStatusBadge`,
  `TeacherStatusBadge`, `EventTypeBadge`, `ProgressBar` — chips/indicadores visuais reutilizados
  nas abas de gestão.
- `src/components/rooster/academy/permissions.ts`: define `AcademyPerm` (permissões granulares:
  `viewDashboard`, `manageDisciplines`, `manageClasses`, `manageTeachers`,
  `manageEnrollments`, `manageCalendar`, `launchAttendance`, `launchContents`,
  `launchGrades`, `viewPerformance`, `manageTerms`, `manageDocuments`) e a matriz por `Role`,
  com as funções `academyCan(role, perm): boolean` e `academyHasAccess(role): boolean`.
- `src/components/rooster/academy/mock-data.ts`: dados e tipos do módulo — `Term`, `Course`,
  `Teacher`, `Discipline`, `Student`, `Klass`, `CalendarEvent`, `AttendanceMark`,
  `LessonContent`, `GradeItem`, `StudentGrade`, `AcademyDoc` — e coleções (`TERMS`, `COURSES`,
  `TEACHERS`, `DISCIPLINES`, `STUDENTS`, `KLASSES`, `EVENTS`, `CONTENTS`, `GRADE_ITEMS`,
  `STUDENT_GRADES`, `DOCS`) com helpers (`disciplineById`, `teacherById`, `courseById`,
  `termById`, `klassById`, `studentById`, `studentAttendance`, `computeAverage`,
  `EVENT_TONE`, `EVENT_LABEL`, `formatDate`, `today`).
- `src/components/rooster/academy/manage/disciplines-tab.tsx`: aba de CRUD de disciplinas.
- `src/components/rooster/academy/manage/classes-tab.tsx`: aba de CRUD de turmas, matrícula de
  alunos e documentos da turma.
- `src/components/rooster/academy/manage/teachers-tab.tsx`: aba de CRUD de professores.
- `src/components/rooster/academy/manage/calendar-tab.tsx`: aba de calendário de eventos e
  gestão de períodos letivos (termos).

## Serviço: `src/services/mock-api/academy.service.ts`

Serviço mock com delay simulado sobre o banco fake `@/mock/database`. É o serviço efetivamente
usado pelas abas de `academy/manage/*` (via chamadas diretas `academyService.<método>`).

Assinaturas:

Disciplinas:
- `getAll(filters?: Filters<Discipline>): Promise<Discipline[]>`
- `getById(id: string): Promise<Discipline | undefined>`
- `create(dto: Omit<Discipline, "id">): Promise<Discipline>`
- `update(id: string, dto: Partial<Discipline>): Promise<Discipline | undefined>`
- `remove(id: string): Promise<boolean>`
- `search(query: string): Promise<Discipline[]>`

Cursos / Períodos letivos:
- `getCourses(): Promise<Course[]>`
- `getTerms(): Promise<Term[]>`
- `createTerm(dto: Omit<Term, "id">): Promise<Term>`
- `updateTerm(id: string, dto: Partial<Term>): Promise<Term | undefined>`
- `removeTerm(id: string): Promise<boolean>`

Turmas:
- `getClasses(filters?: Filters<SchoolClass>): Promise<SchoolClass[]>`
- `getClassById(id: string): Promise<SchoolClass | undefined>`
- `createClass(dto: Omit<SchoolClass, "id">): Promise<SchoolClass>`
- `updateClass(id: string, dto: Partial<SchoolClass>): Promise<SchoolClass | undefined>`
- `removeClass(id: string): Promise<boolean>`

Professores:
- `getTeachers(filters?: Filters<Teacher>): Promise<Teacher[]>`
- `getTeacherById(id: string): Promise<Teacher | undefined>`
- `createTeacher(dto: Omit<Teacher, "id" | "userId">): Promise<Teacher>`
- `updateTeacher(id: string, dto: Partial<Teacher>): Promise<Teacher | undefined>`
- `removeTeacher(id: string): Promise<boolean>`

Alunos (somente leitura, reutilizado do domínio do Rooster Student):
- `getStudents(): Promise<Student[]>`
- `getStudentById(id: string): Promise<Student | undefined>`

Calendário:
- `getCalendarEvents(): Promise<CalendarEvent[]>`
- `createCalendarEvent(dto: Omit<CalendarEvent, "id">): Promise<CalendarEvent>`
- `updateCalendarEvent(id: string, dto: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>`
- `removeCalendarEvent(id: string): Promise<boolean>`

Matrículas:
- `getEnrollmentsByClass(classId: string): Promise<Enrollment[]>`
- `enrollStudent(classId: string, studentId: string): Promise<Enrollment>`
- `unenrollStudent(classId: string, studentId: string): Promise<boolean>`

Notas:
- `getGradeItems(classId: string): Promise<GradeItem[]>`
- `createGradeItem(dto: Omit<GradeItem, "id">): Promise<GradeItem>`
- `getGrades(classId: string): Promise<Grade[]>`
- `setGrade(studentId: string, itemId: string, value: number | null): Promise<Grade>`

Frequência:
- `getAttendanceByClass(classId: string): Promise<AttendanceRecord[]>`

Conteúdos de aula:
- `getContentsByClass(classId: string): Promise<LessonContent[]>`
- `createContent(dto: Omit<LessonContent, "id">): Promise<LessonContent>`

Documentos:
- `getDocs(filters?: Filters<AcademyDoc>): Promise<AcademyDoc[]>`
- `createDoc(dto: Omit<AcademyDoc, "id">): Promise<AcademyDoc>`
- `removeDoc(id: string): Promise<boolean>`

Observação: as telas `academy.attendance.tsx` (Chamada) e `academy.grades.tsx` (Notas) usam os
dados de `mock-data.ts` e mantêm o estado apenas em memória local, sem chamar
`getAttendanceByClass`, `getGrades` ou `setGrade` do serviço — a integração de persistência
dessas duas telas com o `academyService` ainda não foi feita.

## Estado

- Estado local por rota/aba via `useState`, sem store global.
- As abas de `manage/*` seguem o padrão: `useEffect` carrega listas via `academyService.getX()`
  ao montar (e após `refresh` incrementar), estado de modal (`modalNew`, `editing`,
  `confirmDelete`) para criar/editar/excluir, e um objeto `draft` com os campos do formulário
  antes de enviar ao serviço.
- `academy.attendance.tsx` mantém `marks` (mapa `studentId -> AttendanceMark`) e `academy.grades.tsx`
  mantém `grades` (mapa `"studentId_itemId" -> nota`) — ambos apenas no cliente.

## Tabela de botões e ações

| Label | Local | O que faz | Serviço chamado |
|---|---|---|---|
| "Calendário acadêmico" | Painel (`academy.index.tsx`) | Navega para `/academy/manage` (aba calendário) | Roteamento |
| Abas Disciplinas/Turmas/Professores/Calendário | Gestão acadêmica (`academy.manage.tsx`) | Alterna a aba exibida | Nenhum |
| "Nova disciplina" | Aba Disciplinas | Abre modal de criação de disciplina | Nenhum (abre modal; salvar chama serviço) |
| "Salvar" (modal nova disciplina) | Aba Disciplinas | Cria disciplina | `academyService.create(draft)` |
| "Editar" | Aba Disciplinas (linha selecionada) | Entra em modo de edição da disciplina | Nenhum |
| "Salvar" (edição) | Aba Disciplinas | Salva alterações da disciplina | `academyService.update(id, draft)` |
| "Excluir" | Aba Disciplinas | Confirma e remove a disciplina | `academyService.remove(id)` |
| "Cancelar" (modais de disciplina) | Aba Disciplinas | Fecha modal/edição sem salvar | Nenhum |
| "Nova turma" | Aba Turmas | Abre modal de criação de turma | Nenhum |
| "Salvar" (nova turma) | Aba Turmas | Cria turma | `academyService.createClass(draft)` |
| "Editar" | Aba Turmas | Entra em modo de edição da turma | Nenhum |
| "Salvar" (edição de turma) | Aba Turmas | Salva alterações da turma | `academyService.updateClass(id, draft)` |
| "Excluir" | Aba Turmas | Remove a turma | `academyService.removeClass(id)` |
| "Matricular" | Aba Turmas (lista de alunos disponíveis) | Matricula aluno na turma | `academyService.enrollStudent(classId, studentId)` + `academyService.getClassById(classId)` |
| "Remover" | Aba Turmas (lista de alunos matriculados) | Remove matrícula do aluno na turma | `academyService.unenrollStudent(classId, studentId)` + `academyService.getClassById(classId)` |
| "Adicionar" (documento) | Aba Turmas (documentos da turma) | Anexa documento à turma | `academyService.createDoc(dto)` |
| Remover documento (ícone lixeira) | Aba Turmas (documentos da turma) | Remove documento da turma | `academyService.removeDoc(id)` |
| "Cancelar" (modais de turma) | Aba Turmas | Fecha modal/edição sem salvar | Nenhum |
| "Novo professor" | Aba Professores | Abre modal de criação de professor | Nenhum |
| "Salvar" (novo professor) | Aba Professores | Cria professor | `academyService.createTeacher(draft)` |
| "Editar" | Aba Professores | Entra em modo de edição do professor | Nenhum |
| "Salvar" (edição de professor) | Aba Professores | Salva alterações do professor | `academyService.updateTeacher(id, draft)` |
| "Excluir" | Aba Professores | Remove o professor | `academyService.removeTeacher(id)` |
| "Cancelar" (modais de professor) | Aba Professores | Fecha modal/edição sem salvar | Nenhum |
| "Hoje" | Aba Calendário | Volta a visão do calendário para o mês atual | Nenhum |
| Setas de navegação (‹ ›) | Aba Calendário | Move o calendário um mês para trás/frente | Nenhum |
| "Novo evento" | Aba Calendário | Abre modal de criação de evento | Nenhum |
| "Salvar" (modal novo evento) | Aba Calendário | Cria evento no calendário | `academyService.createCalendarEvent(dto)` |
| "Cancelar" (modal evento) | Aba Calendário | Fecha modal sem salvar | Nenhum |
| Selecionar período letivo (card) | Aba Calendário | Abre detalhe do período letivo (termo) | Nenhum |
| "Novo período" | Aba Calendário | Abre modal de criação de período letivo | Nenhum |
| "Salvar" (novo período) | Aba Calendário | Cria período letivo (termo) | `academyService.createTerm(draft)` |
| "Editar" (termo) | Aba Calendário (detalhe do termo) | Entra em modo de edição do período letivo | Nenhum |
| "Salvar" (edição de termo) | Aba Calendário | Salva alterações do período letivo | `academyService.updateTerm(id, draft)` |
| "Excluir" (termo) | Aba Calendário | Remove o período letivo | `academyService.removeTerm(id)` |
| "Cancelar" (modais de termo) | Aba Calendário | Fecha modal/edição sem salvar | Nenhum |
| Seleção de turma / data | Chamada (`academy.attendance.tsx`) | Troca a turma/data exibida e reseta as marcações locais | Nenhum |
| "Todos: <status>" | Chamada | Marca todos os alunos da turma com o status escolhido | Nenhum |
| Botões de marca por aluno (P/F/A/J) | Chamada | Define o status de frequência do aluno | Nenhum |
| "Salvar chamada" | Chamada | Botão de salvar exibido no cabeçalho; sem lógica de persistência implementada | Nenhum |
| Seleção de turma | Notas (`academy.grades.tsx`) | Troca a turma exibida no boletim | Nenhum |
| Campos de nota por aluno/item | Notas | Atualiza a nota do aluno naquele item de avaliação (estado local) | Nenhum |
| "Nova avaliação" | Notas | Botão de ação exibido no cabeçalho; sem lógica implementada nesta tela | Nenhum |
| "Salvar boletim" | Notas | Botão de ação exibido no cabeçalho; sem lógica implementada nesta tela | Nenhum |

Nota sobre permissões: nas abas de `manage/*`, os botões de criação/edição/exclusão só são
renderizados quando `academyCan(role, perm)` retorna verdadeiro para a permissão
correspondente (ex.: `manageDisciplines`, `manageClasses`, `manageTeachers`, `manageCalendar`,
`manageTerms`, `manageEnrollments`, `manageDocuments`).
