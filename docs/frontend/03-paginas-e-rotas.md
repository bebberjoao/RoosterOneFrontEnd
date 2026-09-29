# Páginas e Rotas

Roteamento por arquivo do TanStack Router (`src/routes/`, convenção em `src/routes/README.md`). URL derivada do nome do arquivo (`.` = segmento de rota, `$id` = parâmetro dinâmico, `index.tsx` = rota exata do prefixo, `*.tsx` sem sufixo = layout que envolve os filhos com `<Outlet/>`).

Coluna **Dado**: `Real` = a tela consome API real do backend; `Mock` = consome só `src/mock/database/*` (ou um `*/mock-data.ts` local) estático, sem persistência real.

**Todos os 9 módulos são `Real` hoje.** Hub/Desk/Rooms/Assets já eram; Academy, Learn, Finance, Student e Boost (os dois lados — instrutor dentro do `AppShell` e aluno externo em `boost-portal.*.tsx`, fora dele, com login público próprio) foram migrados de mock para API real. As únicas telas do portal do aluno que ainda exibem dado de exemplo local são avisos/documentos/notificações (`student/mock-data.ts`), por não existir endpoint correspondente no backend. Ver `docs/system/02-escopo.md` no repo do backend.

## Públicas (sem `AppShell`, sem exigir sessão)

| Rota | Arquivo | Função |
|---|---|---|
| `/login` | `login.tsx` | Login + solicitar redefinição de senha |
| `/redefinir-senha` | `redefinir-senha.tsx` | Define nova senha a partir do token recebido por e-mail |

## `/` — Início

| Rota | Arquivo | Dado |
|---|---|---|
| `/` | `index.tsx` | Início: boas-vindas com o nome do usuário logado, perfil e resumo de notificações não lidas. Os antigos "atalhos rápidos" para os módulos foram removidos — a navegação é o menu lateral |
| `/notifications` | `notifications.tsx` | Central de notificações do usuário logado (todas / não lidas, busca, marcar como lida) — a mesma lista do sino da barra superior |

## Rooster Hub (`Real`)

| Rota | Arquivo | Função |
|---|---|---|
| `/hub` | `hub.index.tsx` | Dashboard: estatísticas + atividade recente (log de auditoria real) |
| `/hub/usuarios` | `hub.usuarios.tsx` | CRUD de usuários + redefinir senha (admin) |
| `/hub/setores` | `hub.setores.tsx` | CRUD de setores |
| `/hub/acessos` | `hub.acessos.tsx` | Gestão de permissões por usuário + relatório de auditoria e de erros |

Layout: `hub.tsx`.

**Relatórios de auditoria e de erros (`hub.acessos.tsx`, setembro/2026)**: abaixo do painel de permissões, até dois cartões independentes — cada um só aparece se o usuário logado tem a respectiva ação (`useCan("/hub/acessos", "relatorio-auditoria")`/`"relatorio-erros"`), nenhum dos dois exige a outra. Cada cartão mostra o total do período, uma quebra pequena (por módulo/ação na auditoria, por rota/status no de erros), os 10 mais recentes e um botão "Exportar CSV" (`downloadBlob`, mesmo padrão de `finance.reports.tsx`). O de erros lê `GET /logs-erro/relatorio` — a tabela é alimentada só pelo filtro global do backend (`AllExceptionsFilter`), nunca por uma tela; ver `docs/backend/11-tratamento-erros.md` no repo backend.

## Rooster Desk (`Real`)

| Rota | Arquivo | Função |
|---|---|---|
| `/desk` | `desk.index.tsx` | Dashboard: contagem por status, SLA médio, tempo médio de resolução |
| `/desk/tickets` | `desk.tickets.tsx` | Lista de chamados |
| `/desk/tickets/:id` | `desk.tickets.$id.tsx` | Detalhe do chamado: conversa, histórico, transferência. Os **anexos aparecem dentro da conversa** (cartão com nome, tamanho e download, na ordem em que foram enviados) — não há mais o cartão "Anexos" na barra lateral; como o anexo não tem marca de "interno", o botão Anexar e os anexos existem só na aba pública. O campo SLA (lista, detalhe, painel do Desk) só aparece com a permissão `desk.tickets.ver-sla` |
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
| `/rooms/structure` | `rooms.structure.tsx` | Campus, blocos, ambientes — inclui o editor de dias de funcionamento por ambiente |

Layout: `rooms.tsx`.

**Limite de antecedência e recorrência (`rooms.book.tsx`)**: `useCan("/rooms/book", "prazo-estendido")` decide o horizonte máximo de data selecionável no calendário (15 dias sem a permissão real, 365 com ela — dias fora do limite ficam desabilitados no grid) e `useCan("/rooms/book", "solicitar-recorrente")` habilita/desabilita o campo "Repetição" do formulário. As duas são checagens de UX — o backend sempre reforça os mesmos dois limites (`RoomsController.assertDentroDoPrazo`/`createReservaSerie`), então mesmo burlando a UI a API recusa. Ver `docs/security/03-rbac.md` (repo backend) pra como essas duas permissões funcionam como "regulador", não só liga/desliga.

**Bugs corrigidos no calendário de disponibilidade (`rooms.book.tsx`, setembro/2026)**, encontrados em teste manual pelo usuário:

- *Dia selecionado pouco visível*: o destaque do dia selecionado no grid (`className` do `<button>` de cada célula) usava só `border-foreground/30 bg-accent`, contraste fraco demais pra perceber qual dia estava ativo. Reforçado para `border-foreground` (opacidade cheia) + `ring-2 ring-foreground ring-offset-1` + número do dia em negrito quando selecionado.
- *Reserva aprovada "sumia" da tela*: o calendário mostra a disponibilidade de **uma sala por vez** (`roomId` no estado) — tanto o contador "N reservas" de cada dia (`countByDay`) quanto a lista "Horários ocupados" abaixo do formulário (`dayReservations`) filtram estritamente por `r.roomId === roomId`. A sala padrão ao carregar a página era sempre `rooms[0]` (a primeira da lista, essencialmente arbitrária) — se a reserva do próprio usuário fosse em outra sala, ela nunca aparecia sem o usuário trocar manualmente de sala no seletor lateral. Era exatamente o cenário testado: solicitante cria reserva → admin aprova → solicitante loga de novo e não vê a própria reserva confirmada. Corrigido: no carregamento inicial (`reload()`, controlado por um `useRef` pra rodar só uma vez — recargas seguintes, como depois de enviar uma nova solicitação, não devem trocar a sala/data que o usuário já está vendo), busca a reserva mais recente do usuário logado (`session.usuario.id === reservation.responsibleId`, não cancelada) e usa a sala **e a data** dela como padrão, inclusive ajustando o mês exibido (`cursor`) pra que o dia selecionado apareça no grid; só cai na primeira sala da lista quando o usuário não tem nenhuma reserva própria.

**Filtro por data (`rooms.manage.tsx`, setembro/2026)**: pedido do usuário — a fila de "Gerenciar reservas" só tinha filtro por status/busca livre, sem forma de restringir a um dia ou período específico. Adicionado um `Select` (`dateMode`: "Todas as datas" / "Um dia específico" / "Um período") que revela um `TextInput type="date"` (modo dia) ou dois (`periodStart`/`periodEnd`, modo período, com `min`/`max` cruzados pra impedir início depois do fim) e entra na mesma função de filtro em memória (`rows`, `useMemo`) já usada por busca e status. É filtro 100% client-side sobre a lista já carregada, no mesmo padrão do restante da tela (e do inventário de Assets) — o backend já ganhou suporte a `dataInicio`/`dataFim` em `GET /reservas` (`FindReservasQueryDto`, repo backend, ver `docs/api/02-endpoints.md`), mas essa tela especificamente não foi migrada pra usar o filtro no servidor; o DTO fica disponível para essa migração futura ou outros consumidores.

**Dias de funcionamento por ambiente (`rooms.structure.tsx`)**: o `RoomModal` (criar/editar ambiente) tem um seletor de dias da semana (seg–dom) ao lado do editor de períodos de horário — antes só existia exibição somente-leitura desse dado (`diasFuncionamento`/`weekdays`), sem forma de editar pela UI. Serve tanto pra instituição que não funciona aos sábados (todas as salas sem "sáb") quanto pra uma sala específica com uma exceção própria (ex.: em manutenção às segundas).

**Vínculo com Turma (`rooms.book.tsx`, setembro/2026)**: quando a finalidade da reserva é "aula", o formulário busca `academyService.getClasses({ minhas: true })` (a mesma rota que já existia pra "minhas turmas" no Academy) e mostra um campo opcional "Turma" com as turmas do usuário logado — some por completo se a lista vier vazia (usuário não é professor, ou a chamada é recusada) e a falha é engolida silenciosamente, não é um erro de tela. `turmaId` vai junto no `POST /reservas`; o backend reforça a posse (`RoomsController.exigirTurmaValida`, ver `docs/security/03-rbac.md` no repo backend) — quem manda uma turma alheia recebe `403` independente do que a UI mostrou. O detalhe da reserva (`rooms.reservations.$id.tsx`) exibe a turma vinculada, se houver.

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
| `/finance/policies` | `finance.policies.tsx` | CRUD de políticas de multa/juros, criadas pelo próprio financeiro (setembro/2026); seletor de política também aparece no formulário de `finance.services.tsx` |

Layout `finance.tsx` (mantém o gate `financeHasAccess(role)` do perfil deduzido das permissões — a permissão real já é aplicada automaticamente por `AppShell`, ver `08-autorizacao.md`). `finance.manage.tsx`/`finance.settings.tsx` (rotas órfãs, nunca ligadas no menu, a primeira quebrava ao abrir por depender de um `FinanceProvider` que nunca era montado) foram removidas nesta migração, assim como todo `src/mock/database/{tuitions,boletos,charges,payments,financeStudents,products,services,discounts,nfes}.ts` e `finance/store.tsx`. **Boleto/PIX e nota fiscal são simulados 100% internamente** (sem gateway de pagamento nem transmissão à SEFAZ) — decisão de produto, ver `docs/system/02-escopo.md` no backend.

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
| `/student/notifications` | `student.notifications.tsx` | Real | Mesma central de `/notifications` (`NotificationsList`), com o cabeçalho do portal — dados de `GET /notificacoes/minhas` |

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

Atividades pertencem a uma Turma real do Academy (mesmo id retornado por `academyService.getClasses()`) — não existe mais turma/disciplina paralela só do Learn. O banco de perguntas/questionário do mock antigo (`Question`/`QuestionType`, múltipla escolha, embaralhamento) não tem equivalente no backend real e foi removido destas telas: a entrega do aluno é só texto livre + anexos de arquivo. `academy.grades.tsx` não importa nada de `learn/`.

`src/components/rooster/learn/forms-store.ts` é um construtor de formulários (estilo Google Forms) ainda 100% local/client-side por decisão de escopo — não tem endpoint real no backend. Ele é semeado a partir de `learn/forms-seed.ts` (tipos `ActivityStatus`/`ActivityType`/`Question` + dados de exemplo). O antigo `learn/mock-data.ts` (229 linhas, a maior parte sem nenhum consumidor real — turmas/disciplinas/alunos paralelos ao Academy, labels duplicados) foi removido na limpeza de código morto de setembro/2026; só os dois exports que `forms-store.ts` de fato usava (`ACTIVITIES`, `QUESTIONS`) sobreviveram, movidos para `forms-seed.ts`.

## Rooster Boost — gestão e orientação (`Real`, dentro do `AppShell`)

`/boost`, `/boost/manage/:id`, `/boost/conversas`, `/boost/students` — arquivos `boost.index.tsx`/`boost.manage.$id.tsx`/`boost.conversas.tsx`/`boost.students.tsx`. Layout `boost.tsx`. Consome `services/mock-api/boost.service.ts`, ligado ao backend real (`BoostController`), autenticado pelo login do Hub.

**Não existe mais "dono" do curso (setembro/2026).** Quem tem a permissão gerencia **qualquer** curso; cada aba e botão respeita a sua ação com `useCan('/boost/manage', ...)`. O professor entra como **orientador** vinculado a cursos e só usa `/boost/conversas`.

**`/boost` — Cursos.** Lista **todos** os cursos com badge de situação e o botão **Tirar do ar / Publicar** (`gerenciar-cursos`); "Novo curso" e a contagem de alunos (`ver-progresso`) só aparecem com a permissão. **`/boost/manage/:id`** tem as abas Detalhes (`gerenciar-cursos`), Conteúdo (`gerenciar-conteudo`), **Certificado** (chave "emite certificado", carga horária e texto com `{aluno}`/`{curso}`/`{cargaHoraria}`/`{data}` e pré-visualização; ação `certificado`), **Orientadores** (vincular/remover professores; ação `vincular-orientadores`) e Alunos (`ver-progresso`, só progresso — o chat saiu daqui). O certificado **não** é enviado no PATCH genérico do curso (o backend o rejeita); só na criação e pela rota própria.

**`/boost/conversas` — Conversas (`boost.conversas.tsx`).** Caixa de entrada em duas colunas: lista de alunos (curso, última mensagem, contador de não lidas, busca) e a conversa. Só aparecem os cursos a que o professor está vinculado. Tempo real por `use-boost-conversas-socket.ts` (uma conexão: avisos da caixa + sala da conversa aberta); abrir a conversa marca as mensagens do aluno como lidas.

**Vídeo hospedado no editor de aula (`content-tab.tsx`, setembro/2026).** Para aula do tipo "Vídeo", o modal de edição oferece duas fontes: *Link externo* (YouTube/Vimeo, comportamento original) ou *Enviar arquivo de vídeo* (até 2GB — mp4, webm ou mov). O envio só fica disponível para aula **já salva**, porque precisa de um id para receber o arquivo. Durante o envio há barra de progresso — usa `uploadFileWithProgress` (XHR), não `fetch`, porque `fetch` não expõe progresso de **upload** de forma confiável entre navegadores, e num arquivo de minutos essa barra é essencial. Aula com vídeo enviado mostra nome/tamanho, botão **Carregar prévia** (busca um token de 5 min e monta o `<video>` — só quando o instrutor pede, não a cada abertura do modal) e **Remover**; enviar outro arquivo substitui o anterior. A listagem de aulas marca as que têm vídeo hospedado.

`uploadFileWithProgress` **não renova a sessão automaticamente** num `401`, diferente de `uploadFile`: um upload de minutos que falhasse por expiração e recomeçasse do zero seria pior do que só avisar.

**`/boost/students` — alunos externos (`boost.students.tsx`).** Painel de gestão das contas públicas do portal (`BoostUsuario`): listagem com busca, contagem de matrículas, ativar/desativar e **redefinir senha** — esta abre um modal com a senha temporária gerada e um botão de copiar, com aviso explícito de que ela **não é mostrada de novo**. Só para admin (item de menu com `roles: ["admin"]` em `module-config.ts`; permissão `boost.students.*` no catálogo). Não usa o `HubCrud` genérico: as ações aqui (toggle + reset) não têm o formato de CRUD que aquele componente assume.

## Rooster Boost Portal — aluno (`Real`, login público, fora do `AppShell`)

Área pública separada — layout próprio (`boost-portal.tsx`), não usa `AppShell`/sessão do Hub. Sessão independente em `src/services/boost-portal/session.ts`/`client.ts` (chaves de `localStorage` e token JWT próprios, claim `tipo:'boost'`, nunca aceito nas rotas do Hub e vice-versa — ver `docs/security/03-rbac.md` no backend).

| Rota | Arquivo | Função |
|---|---|---|
| `/boost-portal` | `boost-portal.index.tsx` | Catálogo público de cursos publicados — navegável sem login |
| `/boost-portal/entrar` | `boost-portal.entrar.tsx` | Login do Boost (conta própria, não é a mesma do Hub) |
| `/boost-portal/cadastro` | `boost-portal.cadastro.tsx` | Cadastro público (nome/e-mail/senha) |
| `/boost-portal/cursos/:slug` | `boost-portal.cursos.$slug.tsx` | Preview do curso (não matriculado) ou player completo com aulas/materiais/progresso/conversa com o orientador/certificado (matriculado) |
| `/boost-portal/painel` | `boost-portal.painel.index.tsx` | Minhas matrículas (rota `index`: como `painel.tsx` era pai sem `<Outlet />`, o player abaixo nunca renderizava — corrigido em setembro/2026) |
| `/boost-portal/painel/:matriculaId` | `boost-portal.painel.$matriculaId.tsx` | Detalhe de uma matrícula — player do curso |
| `/boost-portal/verificar` | `boost-portal.verificar.tsx` | Conferência pública de certificado, sem login |

Ver `docs/frontend/07-autenticacao.md` pra como essa sessão paralela coexiste com a do Hub no mesmo app.

**Player de vídeo hospedado (`boost-portal.painel.$matriculaId.tsx`, setembro/2026).** A aula tem três fontes possíveis, testadas nesta ordem: **vídeo hospedado** (`hostedVideo`), embed externo (YouTube/Vimeo) e link. Vídeo hospedado ganha precedência porque, no banco, os dois campos podem coexistir (o upload não apaga o link antigo).

Como a tag `<video>` não anexa o cabeçalho `Authorization`, o player pede um **token de stream de 5 minutos** (`GET /boost/aulas/:id/stream-token`, autenticado normalmente) sempre que a aula ativa muda, e monta a URL com `?token=`. Não se reaproveita entre aulas — é curto e escopado a uma aula. O `<video>` leva `key={aulaAtiva.id}` para remontar limpo ao trocar de aula, sem herdar `currentTime` da anterior.

Progresso real:
- **Retomar de onde parou** — em `onLoadedMetadata`, uma vez por aula (`posicaoAplicadaRef`), posiciona em `posicaoSeg` se estiver dentro da duração.
- **Reportar** — `onTimeUpdate` dispara várias vezes por segundo, então há um throttle de ~8s (`ultimoReporteRef`); `onPause` e `onEnded` reportam na hora (`forcar`). Falhas são silenciosas de propósito: um erro pontual a cada poucos segundos não pode interromper quem está assistindo.
- **Completar** — o cliente só reporta posição/percentual; **quem decide** que a aula está concluída (limiar de 90%) é o backend. Quando ele responde `concluida: true`, a matrícula é recarregada para refletir progresso e certificado.

O botão "Marcar como concluída" continua existindo: aulas de texto, PDF e link não têm posição de vídeo, e ele serve de reforço para as de vídeo.

**Conferir certificado** (`boost-portal.verificar.tsx`) fica visível na navegação para todos, logado ou não — quem confere um certificado (empregador, outra instituição) normalmente não tem conta. A tela distingue três respostas: autêntico, não encontrado e **falha de comunicação**, esta última dizendo explicitamente que não significa documento inválido.

## Outras

| Rota | Arquivo | Função |
|---|---|---|
| `/settings` | `settings.tsx` | Configurações (tema; demais seções são estáticas/placeholder) |
