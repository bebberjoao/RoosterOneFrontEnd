# Páginas e Rotas

Roteamento por arquivo do TanStack Router (`src/routes/`, convenção em `src/routes/README.md`). URL derivada do nome do arquivo (`.` = segmento de rota, `$id` = parâmetro dinâmico, `index.tsx` = rota exata do prefixo, `*.tsx` sem sufixo = layout que envolve os filhos com `<Outlet/>`).

Coluna **Dado**: `Real` = a tela consome API real do backend; `Mock` = consome só `src/mock/database/*` (ou um `*/mock-data.ts` local) estático, sem persistência real.

Hub/Desk/Rooms/Assets já eram `Real`. Academy (todas as rotas), Learn (todas as rotas), Finance (todas as rotas, incluindo `/student/finance`) e Student (todas as rotas exceto Documentos/Notificações) foram migradas de mock para API real. Rooster Boost é **misto**: o lado instrutor (`boost.*.tsx`, dentro do `AppShell`) segue `Mock`; o lado aluno (`boost-portal.*.tsx`, fora do `AppShell`, com login público próprio) já é `Real` — ver seção própria abaixo e `docs/system/02-escopo.md`.

## Públicas (sem `AppShell`, sem exigir sessão)

| Rota | Arquivo | Função |
|---|---|---|
| `/login` | `login.tsx` | Login + solicitar redefinição de senha |
| `/redefinir-senha` | `redefinir-senha.tsx` | Define nova senha a partir do token recebido por e-mail |

## `/` — Início

| Rota | Arquivo | Dado |
|---|---|---|
| `/` | `index.tsx` | — (painel agregador, ver `04-componentes.md`) |

## Rooster Hub (`Real`)

| Rota | Arquivo | Função |
|---|---|---|
| `/hub` | `hub.index.tsx` | Dashboard: estatísticas + atividade recente (log de auditoria real) |
| `/hub/usuarios` | `hub.usuarios.tsx` | CRUD de usuários + redefinir senha (admin) |
| `/hub/setores` | `hub.setores.tsx` | CRUD de setores |
| `/hub/acessos` | `hub.acessos.tsx` | Gestão de permissões por usuário |

Layout: `hub.tsx`.

## Rooster Desk (`Real`)

| Rota | Arquivo | Função |
|---|---|---|
| `/desk` | `desk.index.tsx` | Dashboard: contagem por status, SLA médio, tempo médio de resolução |
| `/desk/tickets` | `desk.tickets.tsx` | Lista de chamados |
| `/desk/tickets/:id` | `desk.tickets.$id.tsx` | Detalhe do chamado: conversa, anexo, histórico, transferência |
| `/desk/categories` | `desk.categories.index.tsx` | Lista de categorias |
| `/desk/categories/:id` | `desk.categories.$id.tsx` | Detalhe/subcategorias de uma categoria |
| `/desk/team` | `desk.team.tsx` | Atendentes |

Layout: `desk.tsx`.

## Rooster Rooms (`Real`)

| Rota | Arquivo | Função |
|---|---|---|
| `/rooms` | `rooms.index.tsx` | Dashboard: ocupação do dia, próximas reservas |
| `/rooms/book` | `rooms.book.tsx` | Solicitar reserva (única ou recorrente) |
| `/rooms/reservations` | `rooms.reservations.index.tsx` | Minhas reservas |
| `/rooms/reservations/:id` | `rooms.reservations.$id.tsx` | Detalhe da reserva: conversa, histórico |
| `/rooms/manage` | `rooms.manage.tsx` | Aprovar/recusar/cancelar reservas (equipe) |
| `/rooms/structure` | `rooms.structure.tsx` | Campus, blocos, ambientes |

Layout: `rooms.tsx`.

## Rooster Assets (`Real`)

| Rota | Arquivo | Função |
|---|---|---|
| `/assets` | `assets.index.tsx` | Dashboard: valor por categoria, empréstimos atrasados |
| `/assets/inventory` | `assets.inventory.tsx` | CRUD de patrimônio, categorias, movimentação, empréstimo |

Layout: `assets.tsx`.

## Rooster Finance (`Real`)

| Rota | Arquivo | Função |
|---|---|---|
| `/finance` | `finance.index.tsx` | Dashboard: previsto/recebido/atrasadas/inadimplentes/boletos vencidos, receita por mês, alertas de estoque baixo — tudo via `financeService.getDashboard()`, calculado no backend |
| `/finance/charges` | `finance.charges.tsx` | Cobranças: criar, marcar como paga, negociar, cancelar, exportar CSV |
| `/finance/tuitions` | `finance.tuitions.tsx` | Mesma entidade `Cobranca` filtrada por `tipo=mensalidade`; editar e "Gerar em lote" por competência/serviço/turma |
| `/finance/boletos` | `finance.boletos.tsx` | Emitir boleto (nosso número/linha digitável/PIX gerados internamente) e baixar o PDF |
| `/finance/products` | `finance.products.tsx` | CRUD de produtos |
| `/finance/services` | `finance.services.tsx` | CRUD de serviços |
| `/finance/nfe` | `finance.nfe.tsx` | Emitir nota fiscal (documento interno) e baixar PDF/XML |
| `/finance/reports` | `finance.reports.tsx` | Receita mensal, fluxo de caixa, inadimplência — via `financeService.relatorios`, exportação CSV |
| `/finance/discounts` | `finance.discounts.tsx` | CRUD de descontos + atribuição a um aluno real do Academy |

Layout `finance.tsx` (mantém o gate `financeHasAccess(role)` da Visão de demonstração — a permissão real já é aplicada automaticamente por `AppShell`, ver `08-autorizacao.md`). `finance.manage.tsx`/`finance.settings.tsx` (rotas órfãs, nunca ligadas no menu, a primeira quebrava ao abrir por depender de um `FinanceProvider` que nunca era montado) foram removidas nesta migração, assim como todo `src/mock/database/{tuitions,boletos,charges,payments,financeStudents,products,services,discounts,nfes}.ts` e `finance/store.tsx`. **Boleto/PIX e nota fiscal são simulados 100% internamente** (sem gateway de pagamento nem transmissão à SEFAZ) — decisão de produto, ver `docs/system/02-escopo.md` no backend.

## Rooster Student — misto

| Rota | Arquivo | Dado | Função |
|---|---|---|---|
| `/student` | `student.index.tsx` | Real* | Dashboard: disciplinas, notas e atividades via `studentService`/`learnService`; eventos via `academyService`; cobranças via `financeService.me.getCobrancas()`. Avisos (`NOTICES`) ainda vêm de `student/mock-data.ts` |
| `/student/profile` | `student.profile.tsx` | Real | Perfil acadêmico (`studentService.getMe()`); edição de e-mail pessoal é só local, sem endpoint |
| `/student/disciplines` | `student.disciplines.tsx` | Real | Disciplinas matriculadas (`studentService.getMyEnrollments()`) |
| `/student/activities` | `student.activities.tsx` | Real | Atividades e entregas do aluno (`learnService`) |
| `/student/grades` | `student.grades.tsx` | Real | Boletim por turma (`studentService.getMyGrades()`) |
| `/student/attendance` | `student.attendance.tsx` | Real | Frequência (`studentService.getMyAttendance()`) |
| `/student/history` | `student.history.tsx` | Real | Histórico acadêmico + coeficiente de rendimento (`studentService.getMyHistory()`) |
| `/student/calendar` | `student.calendar.tsx` | Real | Eventos do calendário acadêmico via `academyService`; vencimentos de cobrança via `financeService.me.getCobrancas()` |
| `/student/finance` | `student.finance.tsx` | Real | Cobranças, boleto (baixar), nota fiscal e desconto ativo via `financeService.me.*` — os botões "Baixar boleto"/"Copiar código PIX" (antes decorativos) agora funcionam de verdade |
| `/student/documents` | `student.documents.tsx` | Mock | Fora do escopo desta migração |
| `/student/notifications` | `student.notifications.tsx` | Mock | Fora do escopo desta migração |

Layout: `student.tsx` — resolve o aluno logado uma vez (`studentService.getMe()`) para o cabeçalho e o menu de abas; quando o usuário não tem vínculo de aluno, mostra "Sem vínculo de aluno" em vez de quebrar (ver `10-tratamento-erros.md`).

## Rooster Academy — 100% real

| Rota | Arquivo | Dado | Função |
|---|---|---|---|
| `/academy` | `academy.index.tsx` | Real | Dashboard — role-dependente: coordenação/admin veem o painel institucional completo (8 chamadas via `academyService`); professor vê um "Meu painel" próprio, escopado só às turmas que leciona (`getClasses({minhas:true})` + `getFrequencia`), porque não tem a permissão `academy.manage.acessar` que as chamadas institucionais exigem |
| `/academy/manage` | `academy.manage.tsx` | Real | Gestão acadêmica: abas Disciplinas, Turmas, Professores, **Alunos**, Calendário — todas via `academyService` |
| `/academy/attendance` | `academy.attendance.tsx` | Real | Registro de frequência via `academyService.getFrequencia`/`registrarFrequencia`; turmas listadas com `{minhas:true}` pra professor, todas pra coordenação/admin |
| `/academy/grades` | `academy.grades.tsx` | Real | Composição de nota + lançamento via `academyService.getGradeItemsWithScores`/`setGrade`; itens `origin:"learn"` são somente leitura; mesma regra de `{minhas:true}` da frequência |

Layout: `academy.tsx`.

`academy.manage.tsx` ganhou uma 5ª aba, **Alunos** (`students-tab.tsx`), com o mesmo padrão de CRUD (busca por nome/RA/e-mail, filtro por curso/situação, drawer de detalhe, ativar/desativar, excluir) já usado por Disciplinas/Turmas/Professores/Calendário — as cinco abas agora estão ligadas a `academyService` (ver `04-componentes.md` e `06-integracao-api.md`).

**Correção aplicada** (achado de auditoria — perfis professor/coordenador testados de ponta a ponta): `academy.index.tsx`, `academy.attendance.tsx` e `academy.grades.tsx` chamavam `academyService.getAll()` (lista completa de disciplinas, exige `academy.manage.acessar`) dentro do mesmo `Promise.all` de chamadas que um professor PODE fazer — como `Promise.all` falha por inteiro se uma promise rejeitar, as três telas quebravam por completo para professor, mesmo a parte que ele tinha permissão de ver. Corrigido: `SchoolClass` (tipo retornado por `getClasses()`) passou a trazer `disciplineName`/`disciplineCode`/`disciplineWorkload` embutidos (o backend já inclui `disciplina` na resposta de `/turmas`), eliminando a necessidade da chamada `getAll()` nessas três telas. `academy.attendance.tsx`/`academy.grades.tsx` também passaram a chamar `getClasses({minhas:true})` só para `role === "professor"` — coordenação/admin buscam todas as turmas, já que o backend permite (`exigirDonoOuGestor`) e a chamada `{minhas:true}` sempre 403ava pra coordenação (ela não tem vínculo de `Professor`).

## Rooster Learn (`Real`)

| Rota | Arquivo | Função |
|---|---|---|
| `/learn` | `learn.index.tsx` | Dashboard: estatísticas (professor vê turmas reais via `academyService.getClasses`; aluno vê `learnService.getMyActivities`), lista de atividades, abas Turmas/Relatórios |
| `/learn/classes` | `learn.classes.tsx` | Professor/coordenação: escolhe uma turma real do Academy, cadastra atividades (`learnService.create/update/remove/publish`) e corrige entregas |
| `/learn/activities/:id` | `learn.activities.$id.tsx` | Detalhe de uma atividade: descrição, entregas, correção, notas, feedback, histórico |
| `/learn/student` | `learn.student.tsx` | Área do aluno: atividades por matéria, responder (texto + anexo), ver nota/feedback |

Layout: `learn.tsx`.

Atividades pertencem a uma Turma real do Academy (mesmo id retornado por `academyService.getClasses()`) — não existe mais turma/disciplina paralela só do Learn. O banco de perguntas/questionário do mock antigo (`Question`/`QuestionType`, múltipla escolha, embaralhamento) não tem equivalente no backend real e foi removido destas telas: a entrega do aluno é só texto livre + anexos de arquivo. `academy.grades.tsx` foi migrada nesta atualização e não importa mais nada de `learn/mock-data.ts`/`learn/forms-store.ts` (os tipos antigos do banco de questões continuam existindo nesses dois arquivos, mas hoje sem nenhum consumidor real).

## Rooster Boost — instrutor (`Mock`, dentro do `AppShell`)

`/boost`, `/boost/manage/:id` — arquivos `boost.index.tsx`/`boost.manage.$id.tsx`. Layout `boost.tsx`. Ainda consome `services/mock-api/boost.service.ts` (mock) — diferente do lado aluno abaixo, que já é real.

## Rooster Boost Portal — aluno (`Real`, login público, fora do `AppShell`)

Área pública separada — layout próprio (`boost-portal.tsx`), não usa `AppShell`/sessão do Hub. Sessão independente em `src/services/boost-portal/session.ts`/`client.ts` (chaves de `localStorage` e token JWT próprios, claim `tipo:'boost'`, nunca aceito nas rotas do Hub e vice-versa — ver `docs/security/03-rbac.md` no backend).

| Rota | Arquivo | Função |
|---|---|---|
| `/boost-portal` | `boost-portal.index.tsx` | Catálogo público de cursos publicados — navegável sem login |
| `/boost-portal/entrar` | `boost-portal.entrar.tsx` | Login do Boost (conta própria, não é a mesma do Hub) |
| `/boost-portal/cadastro` | `boost-portal.cadastro.tsx` | Cadastro público (nome/e-mail/senha) |
| `/boost-portal/cursos/:slug` | `boost-portal.cursos.$slug.tsx` | Preview do curso (não matriculado) ou player completo com aulas/materiais/progresso/chat/certificado (matriculado) |
| `/boost-portal/painel` | `boost-portal.painel.tsx` | Minhas matrículas |
| `/boost-portal/painel/:matriculaId` | `boost-portal.painel.$matriculaId.tsx` | Detalhe de uma matrícula |

Ver `docs/frontend/07-autenticacao.md` pra como essa sessão paralela coexiste com a do Hub no mesmo app.

## Outras

| Rota | Arquivo | Função |
|---|---|---|
| `/settings` | `settings.tsx` | Configurações (tema; demais seções são estáticas/placeholder) |
