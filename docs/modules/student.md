# Rooster Student — Portal do Aluno

## Objetivo do módulo

O Rooster Student é o portal acadêmico voltado ao estudante. Reúne em um único lugar as
informações do semestre corrente e histórico do aluno: disciplinas matriculadas, atividades e
avaliações (integradas ao Rooster Learn), notas, frequência, histórico acadêmico, calendário,
cursos extracurriculares (Boost), financeiro, reservas de espaços, chamados de suporte,
documentos e notificações.

Todo o módulo opera sobre dados mockados definidos em
`src/components/rooster/student/mock-data.ts` (ainda não consome o `student.service.ts` nas
telas — ver seção "Serviços" abaixo). O acesso é restrito por perfil (`role`): apenas os perfis
`aluno` e `admin` visualizam o portal; os demais veem uma tela de "Acesso restrito".

## Rotas

Layout raiz: `src/routes/student.tsx` (`/student`), que renderiza o cabeçalho do aluno
(avatar, nome, curso/semestre/RA), a busca global (`StudentGlobalSearch`) e a navegação em
abas (`TABS`) para as rotas filhas via `<Outlet />`.

| Rota | Arquivo | Tela |
|---|---|---|
| `/student` | `src/routes/student.index.tsx` | Início (dashboard do aluno) |
| `/student/profile` | `src/routes/student.profile.tsx` | Perfil acadêmico |
| `/student/disciplines` | `src/routes/student.disciplines.tsx` | Disciplinas |
| `/student/activities` | `src/routes/student.activities.tsx` | Atividades e avaliações |
| `/student/grades` | `src/routes/student.grades.tsx` | Notas / boletim |
| `/student/attendance` | `src/routes/student.attendance.tsx` | Frequência |
| `/student/history` | `src/routes/student.history.tsx` | Histórico acadêmico |
| `/student/calendar` | `src/routes/student.calendar.tsx` | Calendário acadêmico |
| `/student/courses` | `src/routes/student.courses.tsx` | Cursos (Rooster Boost) |
| `/student/finance` | `src/routes/student.finance.tsx` | Financeiro |
| `/student/reservations` | `src/routes/student.reservations.tsx` | Reservas de espaços |
| `/student/tickets` | `src/routes/student.tickets.tsx` | Chamados de suporte |
| `/student/documents` | `src/routes/student.documents.tsx` | Documentos |
| `/student/notifications` | `src/routes/student.notifications.tsx` | Notificações |

Controle de acesso: `StudentLayout` usa `useRole()` (`@/components/rooster/role-context`) e
bloqueia o conteúdo se `role !== "aluno" && role !== "admin"`.

## Telas (resumo funcional)

- **Início (`student.index.tsx`)**: cards de indicadores (disciplinas, média geral/CR,
  frequência média, financeiro em aberto), alerta de disciplinas em risco de frequência,
  próximas atividades, gráfico de desempenho (recharts), notas recentes, cursos em andamento,
  próximos eventos do calendário e avisos institucionais (`NOTICES`).
- **Perfil (`student.profile.tsx`)**: dados pessoais e acadêmicos do aluno, com edição restrita
  aos campos definidos em `EDITABLE_FIELDS` (email pessoal, telefone, endereço, bairro,
  cidade, CEP, contato de emergência).
- **Disciplinas (`student.disciplines.tsx`)**: lista das disciplinas do semestre em modo grade
  ou lista, com médias parciais e frequência.
- **Atividades (`student.activities.tsx`)**: lista filtrável (busca, status, disciplina) e
  paginada de atividades (arquivo, discursiva, quiz, vídeo). Modal `ActivityModal` permite
  realizar a entrega conforme o tipo de atividade.
- **Notas (`student.grades.tsx`)**: boletim com avaliações (`ASSESSMENTS`) e exportação.
- **Frequência (`student.attendance.tsx`)**: indicadores de frequência geral, faltas, alerta de
  disciplinas abaixo do mínimo (`MIN_ATTENDANCE` = 75%), tabela por disciplina.
- **Histórico (`student.history.tsx`)**: histórico acadêmico completo (`HISTORY`) com situação
  de cada disciplina cursada e opção de baixar o histórico.
- **Calendário (`student.calendar.tsx`)**: visão mensal/agenda dos eventos acadêmicos
  (`EVENTS`), com filtro por fonte/origem e navegação entre meses.
- **Cursos (`student.courses.tsx`)**: cursos extracurriculares do Rooster Boost
  (`BOOST_COURSES`), com inscrição, continuidade e emissão de certificado.
- **Financeiro (`student.finance.tsx`)**: cobranças (`CHARGES`), bolsa (`SCHOLARSHIP`), boleto e
  PIX.
- **Reservas (`student.reservations.tsx`)**: reserva de espaços do campus (`RESERVATIONS`,
  `AVAILABLE_SPACES`), com criação e cancelamento.
- **Chamados (`student.tickets.tsx`)**: abertura e acompanhamento de chamados de suporte
  (`TICKETS`, `SECTORS`), com chat de mensagens.
- **Documentos (`student.documents.tsx`)**: documentos institucionais, enviados e solicitados
  (`DOCUMENTS`), com envio e download.
- **Notificações (`student.notifications.tsx`)**: lista de notificações (`NOTIFICATIONS`) com
  marcação de lida.

## Componentes

- `src/components/rooster/student/ui.tsx`: reexporta os primitivos compartilhados de
  `@/components/shared/primitives` usados nas telas do Student: `SectionCard`, `StatusChip`,
  `FilterInput`, `Select`, `Chip`, `TONE`, `EmptyState`, `Btn`, `Pagination`, `ProgressBar`,
  `Table`, `StatCard`, `Avatar`, entre outros.
- `src/components/rooster/student/global-search.tsx` (`StudentGlobalSearch`): busca global do
  portal do aluno. Indexa disciplinas, atividades, documentos, cursos, chamados, cobranças e
  reservas (a partir do mock-data) e navega para a rota correspondente ao resultado
  selecionado.
- `src/components/rooster/student/mock-data.ts`: fonte única de dados mockados do módulo —
  tipos (`StudentDiscipline`, `Assessment`, `StudentActivity`, `BoostCourse`, `Charge`,
  `Reservation`, `Ticket`, `DocItem`, `Notification`, `HistoryRow`) e coleções
  (`DISCIPLINES`, `ASSESSMENTS`, `ACTIVITIES`, `BOOST_COURSES`, `CHARGES`, `RESERVATIONS`,
  `TICKETS`, `DOCUMENTS`, `NOTIFICATIONS`, `HISTORY`, `EVENTS`, `NOTICES`, `PROFILE`), além de
  funções utilitárias (`disciplineById`, `partialAverage`, `overallAverage`,
  `overallAttendance`, `CR`, `money`, `formatDate`, `shiftDate`, `today`).

## Serviço: `src/services/mock-api/student.service.ts`

Serviço mock (delay simulado) baseado no banco fake `@/mock/database`. Observação: as telas do
módulo hoje consomem diretamente os arrays de `mock-data.ts` (dados de UI), não este serviço;
o `student.service.ts` representa a camada de dados de domínio (`db.students`) usada por outras
partes do sistema (ex.: Rooster Academy) e está pronta para ser plugada nas telas quando a
integração com API real ocorrer.

Assinaturas:

- `getAll(filters?: Filters<Student>): Promise<Student[]>` — lista alunos, com filtros
  genéricos.
- `getById(id: string): Promise<Student | undefined>` — busca aluno por id.
- `create(dto: Omit<Student, "id" | "userId">): Promise<Student>` — cria aluno.
- `update(id: string, dto: Partial<Student>): Promise<Student | undefined>` — atualiza aluno.
- `remove(id: string): Promise<boolean>` — remove aluno.
- `search(query: string): Promise<Student[]>` — busca por nome ou RA.
- `getEnrollments(studentId: string)` — matrículas do aluno (`db.enrollments`).
- `getAttendance(studentId: string)` — registros de frequência (`db.attendance`).
- `getGrades(studentId: string)` — notas do aluno (`db.grades`).
- `getCharges(studentId: string)` — cobranças/mensalidades (`db.tuitions`).
- `getNotifications(userId: string)` — notificações do usuário (`db.notifications`).

## Estado

Todo o estado é local a cada rota, via `useState`/`useMemo` do React (não há store global para
o módulo). Padrões recorrentes:

- Filtros de busca/listagem (`q`, `status`, `disc`, `page`) com paginação client-side
  (`Pagination`).
- Controle de modais (`open`, `modal`, `selected`) para detalhe/edição/criação.
- Listas de "ações simuladas" acumuladas em estado local (ex.: `done`, `enrolled`, `sent`,
  `cancelled`, `created`, `read`) que sobrepõem os dados mockados sem persistir nada — ao
  recarregar a página o estado volta ao inicial definido em `mock-data.ts`.

## Tabela de botões e ações

| Label | Local | O que faz | Serviço chamado |
|---|---|---|---|
| Busca global (input) | Header (`student.tsx` / `StudentGlobalSearch`) | Filtra itens indexados e navega para a rota do item selecionado | Nenhum (client-side sobre mock-data) |
| Abas de navegação (Início, Perfil, Disciplinas, ...) | Header (`student.tsx`) | Navega entre as rotas do portal | Roteamento (TanStack Router) |
| "X novas" (sino) | Início | Link para `/student/notifications` | Roteamento |
| Buscar atividade/professor (input) | Atividades | Filtra atividades por título/professor | Nenhum (filtro local) |
| Filtro de status / disciplina (selects) | Atividades | Filtra lista de atividades | Nenhum (filtro local) |
| "Detalhes" | Atividades (cada card) | Abre modal `ActivityModal` com os dados da atividade | Nenhum |
| "Realizar entrega" | Atividades (cada card) | Abre modal de entrega da atividade | Nenhum |
| "Anexar arquivo" | Modal de atividade (tipo arquivo) | Simula anexar um arquivo à lista de entrega | Nenhum |
| Remover arquivo (X) | Modal de atividade (tipo arquivo) | Remove arquivo da lista simulada | Nenhum |
| Opções de quiz (radio) | Modal de atividade (tipo quiz) | Marca resposta selecionada e atualiza barra de progresso | Nenhum |
| Checkbox "Confirmo que assisti" | Modal de atividade (tipo vídeo) | Marca vídeo como assistido | Nenhum |
| "Cancelar" (modal atividade) | Modal de atividade | Fecha o modal sem enviar | Nenhum |
| "Enviar entrega" | Modal de atividade | Marca a atividade como entregue localmente e fecha o modal | Nenhum |
| "Exportar boletim" | Notas | Ação de exportação (sem lógica de download real) | Nenhum |
| Alternância de mês / "Hoje" | Calendário | Navega entre meses e volta ao mês atual | Nenhum |
| Chips de fonte (toggle) | Calendário | Filtra eventos por origem exibida | Nenhum |
| "Mês" / "Agenda" (toggle de visão) | Calendário | Alterna o modo de exibição do calendário | Nenhum |
| Alternância grade/lista | Disciplinas | Alterna layout de exibição das disciplinas | Nenhum |
| "Certificado" | Cursos (curso concluído) | Simula download do certificado do curso | Nenhum |
| "Continuar" | Cursos (curso em andamento) | Simula continuidade do curso | Nenhum |
| "Inscrever-se" | Cursos (curso disponível) | Marca curso como inscrito localmente | Nenhum |
| "Baixar PDF" | Cursos | Simula download de material | Nenhum |
| "Baixar boleto" | Financeiro | Simula download do boleto | Nenhum |
| "Copiar código PIX" | Financeiro | Simula cópia do código PIX | Nenhum |
| "Baixar histórico" | Histórico | Simula download do histórico acadêmico | Nenhum |
| "Marcar todas como lidas" | Notificações | Marca todas as notificações como lidas localmente | Nenhum |
| Filtro por tipo (chips) | Notificações | Filtra notificações por categoria | Nenhum |
| "Marcar lida" | Notificações (item) | Marca notificação individual como lida | Nenhum |
| "Editar dados permitidos" | Perfil | Ativa modo de edição dos campos permitidos | Nenhum |
| "Cancelar" (perfil) | Perfil (modo edição) | Descarta edição e sai do modo edição | Nenhum |
| "Salvar" (perfil) | Perfil (modo edição) | Salva edição localmente e exibe confirmação | Nenhum |
| Alterar foto (ícone lápis) | Perfil | Placeholder para troca de foto | Nenhum |
| "Enviar documento" | Documentos | Abre modal de envio de documento | Nenhum |
| "Enviar" (documento pendente) | Documentos (item) | Marca documento como enviado e abre modal | Nenhum |
| "Baixar" | Documentos (item) | Simula download do documento | Nenhum |
| "Cancelar" / "Enviar para análise" | Modal de envio de documento | Fecha modal / confirma envio simulado | Nenhum |
| "Nova reserva" | Reservas | Abre modal de criação de reserva | Nenhum |
| "Cancelar" (reserva existente) | Reservas (item) | Marca reserva como cancelada localmente | Nenhum |
| "Fechar" / "Cancelar" / "Solicitar reserva" | Modal de reserva | Fecha modal ou confirma solicitação simulada | Nenhum |
| "Abrir chamado" | Chamados | Abre modal de novo chamado | Nenhum |
| Selecionar chamado (item) | Chamados | Abre detalhe/chat do chamado selecionado | Nenhum |
| "Enviar" (mensagem no chamado) | Chamados (detalhe) | Adiciona mensagem ao chat do chamado localmente | Nenhum |
| "Fechar" / "Cancelar" / "Enviar chamado" | Modal de chamado | Fecha modal ou confirma abertura simulada de chamado | Nenhum |

Observação geral: nenhuma tela do Rooster Student chama atualmente `student.service.ts` — todas
as ações acima operam sobre os arrays em memória de `mock-data.ts`, sem persistência real.
