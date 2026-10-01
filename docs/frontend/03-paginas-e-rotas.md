# Páginas e Rotas

Roteamento por arquivo do TanStack Router (`src/routes/`, convenção em `src/routes/README.md`). A URL deriva do nome
do arquivo: `.` separa segmentos, `$id` representa parâmetro dinâmico, `index.tsx` corresponde à rota exata do
prefixo, e o arquivo sem sufixo atua como layout que envolve as rotas filhas com `<Outlet/>`. Revisão de 01/10/2026.

Coluna **Dado**: `API` indica consumo da API do backend; `Exemplo` indica dado estático local, sem persistência.

**Os nove módulos consomem a API do backend.** Hub, Desk, Rooms e Assets foram os primeiros; Academy, Learn, Finance,
Student e Boost (nas duas áreas: gestão, no `AppShell`, e portal do aluno externo, em `boost-portal.*.tsx`, fora dele,
com autenticação própria) foram migrados posteriormente de dados simulados para a API. O único conteúdo de exemplo
remanescente é o quadro de avisos do painel do aluno (`NOTICES`, em `student/mock-data.ts`), por inexistir endpoint
correspondente no backend. Ver `docs/system/02-escopo.md` no repositório do backend.

## Rotas públicas (sem `AppShell` e sem exigência de sessão)

| Rota | Arquivo | Função |
|---|---|---|
| `/login` | `login.tsx` | Login e solicitação de redefinição de senha |
| `/redefinir-senha` | `redefinir-senha.tsx` | Definição de nova senha a partir do token recebido por e-mail |

## `/` — Início

| Rota | Arquivo | Função |
|---|---|---|
| `/` | `index.tsx` | Página inicial: saudação com o nome do usuário, perfil e resumo das notificações não lidas. A navegação entre módulos é realizada pelo menu lateral |
| `/notifications` | `notifications.tsx` | Central de notificações do usuário (todas ou não lidas, busca e marcação como lida), com a mesma lista do ícone da barra superior; a seleção de uma notificação conduz à tela de origem |

## Rooster Hub (`API`)

| Rota | Arquivo | Função |
|---|---|---|
| `/hub` | `hub.index.tsx` | Painel: estatísticas e atividade recente (log de auditoria) |
| `/hub/usuarios` | `hub.usuarios.tsx` | CRUD de usuários e redefinição de senha pelo administrador |
| `/hub/setores` | `hub.setores.tsx` | CRUD de setores |
| `/hub/acessos` | `hub.acessos.tsx` | Gestão de permissões por usuário e relatórios de auditoria e de erros |

Layout: `hub.tsx`.

**Relatórios de auditoria e de erros (`hub.acessos.tsx`, setembro de 2026)**: abaixo do painel de permissões, até dois
cartões independentes, exibidos conforme a permissão do usuário (`useCan("/hub/acessos", "relatorio-auditoria")` e
`"relatorio-erros"`); nenhum depende do outro. Cada cartão apresenta o total do período, uma distribuição resumida
(por módulo e ação, na auditoria; por rota e status, nos erros), os dez registros mais recentes e o botão "Exportar
CSV" (`downloadBlob`, no mesmo padrão de `finance.reports.tsx`). O relatório de erros consulta
`GET /logs-erro/relatorio`, cuja tabela é alimentada exclusivamente pelo filtro global do backend
(`AllExceptionsFilter`); ver `docs/backend/11-tratamento-erros.md` no repositório do backend.

## Rooster Desk (`API`)

| Rota | Arquivo | Função |
|---|---|---|
| `/desk` | `desk.index.tsx` | Painel: contagem por status, SLA médio e tempo médio de resolução |
| `/desk/tickets` | `desk.tickets.tsx` | Lista de chamados |
| `/desk/tickets/:id` | `desk.tickets.$id.tsx` | Detalhe do chamado: conversa, histórico e transferência. Os **anexos são exibidos na conversa** (cartão com nome, tamanho e download, na ordem de envio); como o anexo não possui marcação de interno, o envio e a exibição de anexos ocorrem apenas na aba pública. O SLA (lista, detalhe e painel) é exibido apenas com a permissão `desk.tickets.ver-sla` |
| `/desk/categories` | `desk.categories.index.tsx` | Lista de categorias |
| `/desk/categories/:id` | `desk.categories.$id.tsx` | Detalhe e subcategorias de uma categoria |
| `/desk/team` | `desk.team.tsx` | Atendentes |

Layout: `desk.tsx`.

## Rooster Rooms (`API`)

| Rota | Arquivo | Função |
|---|---|---|
| `/rooms` | `rooms.index.tsx` | Painel: ocupação do dia e próximas reservas |
| `/rooms/book` | `rooms.book.tsx` | Solicitação de reserva (única ou recorrente) |
| `/rooms/reservations` | `rooms.reservations.index.tsx` | Reservas do usuário |
| `/rooms/reservations/:id` | `rooms.reservations.$id.tsx` | Detalhe da reserva: conversa, histórico e turma vinculada, quando houver |
| `/rooms/manage` | `rooms.manage.tsx` | Aprovação, recusa e cancelamento de reservas (equipe) |
| `/rooms/structure` | `rooms.structure.tsx` | Campus, blocos e ambientes, incluindo o editor de dias de funcionamento por ambiente |

Layout: `rooms.tsx`.

**Limite de antecedência e recorrência (`rooms.book.tsx`)**: `useCan("/rooms/book", "prazo-estendido")` determina o
horizonte máximo selecionável no calendário (15 dias sem a permissão e 365 com ela; os dias além do limite permanecem
desabilitados), e `useCan("/rooms/book", "solicitar-recorrente")` habilita o campo "Repetição". Trata-se de
verificações de experiência de uso: o backend aplica os mesmos limites (`RoomsController.assertDentroDoPrazo` e
`createReservaSerie`), de modo que a API recusa a requisição mesmo que a interface seja contornada. Ver
`docs/security/03-rbac.md`, no repositório do backend, quanto ao funcionamento dessas permissões como parâmetros de
regra de negócio.

**Defeitos corrigidos no calendário de disponibilidade (`rooms.book.tsx`, setembro de 2026)**, identificados em
teste manual:

- *Destaque insuficiente do dia selecionado*: o destaque utilizava apenas `border-foreground/30 bg-accent`, de
  contraste insuficiente. Foi reforçado com `border-foreground` (opacidade total), `ring-2 ring-foreground
  ring-offset-1` e número do dia em negrito.
- *Reserva aprovada não exibida*: o calendário apresenta a disponibilidade de **um ambiente por vez** (`roomId`), e
  tanto o contador de reservas por dia (`countByDay`) quanto a lista de horários ocupados (`dayReservations`) filtram
  por `r.roomId === roomId`. O ambiente inicial era sempre o primeiro da lista, de modo que a reserva do usuário em
  outro ambiente não era exibida sem a troca manual do ambiente. A correção, na carga inicial (`reload()`, controlada
  por `useRef` para execução única), seleciona a reserva mais recente e não cancelada do usuário
  (`session.usuario.id === reservation.responsibleId`) e adota o ambiente **e a data** dessa reserva, ajustando o mês
  exibido (`cursor`); na ausência de reserva própria, adota-se o primeiro ambiente da lista.

**Filtro por data (`rooms.manage.tsx`, setembro de 2026)**: a fila de gerenciamento possuía apenas filtros por status
e busca textual. Foi incluído seletor (`dateMode`: todas as datas, dia específico ou período) que exibe um campo de
data (dia) ou dois (`periodStart` e `periodEnd`, com `min` e `max` cruzados para impedir início posterior ao fim),
aplicados na mesma filtragem em memória (`rows`, `useMemo`) da busca e do status. A filtragem é realizada no cliente,
sobre a lista carregada, no padrão do restante da tela; o backend oferece `dataInicio` e `dataFim` em
`GET /reservas` (`FindReservasQueryDto`), disponíveis para migração futura desta tela ou para outros consumidores.

**Dias de funcionamento por ambiente (`rooms.structure.tsx`)**: o modal de criação e edição de ambiente possui
seletor dos dias da semana (segunda a domingo), ao lado do editor de períodos de horário, o que atende tanto à
instituição que não funciona aos sábados quanto a ambiente com exceção própria (por exemplo, manutenção às
segundas-feiras).

**Vínculo com turma (`rooms.book.tsx`, setembro de 2026)**: quando a finalidade da reserva é "aula", o formulário
consulta `academyService.getClasses({ minhas: true })` e exibe o campo opcional "Turma", com as turmas do usuário;
o campo não é exibido quando a lista é vazia (usuário que não é professor ou consulta recusada), e a falha não gera
mensagem de erro. O `turmaId` é enviado em `POST /reservas`, e o backend verifica o vínculo
(`RoomsController.exigirTurmaValida`): turma de outro professor resulta em `403`, independentemente da interface.

## Rooster Assets (`API`)

| Rota | Arquivo | Função |
|---|---|---|
| `/assets` | `assets.index.tsx` | Painel: valor por categoria e empréstimos em atraso |
| `/assets/inventory` | `assets.inventory.tsx` | CRUD de patrimônio e categorias, movimentação e empréstimo |

Layout: `assets.tsx`.

## Rooster Finance (`API`)

| Rota | Arquivo | Função |
|---|---|---|
| `/finance` | `finance.index.tsx` | Painel: previsto, recebido, cobranças em atraso, inadimplentes, boletos vencidos, receita por mês e alertas de estoque baixo, calculados no backend (`financeService.getDashboard()`) |
| `/finance/charges` | `finance.charges.tsx` | Cobranças: criação, marcação como paga, negociação, cancelamento e exportação em CSV |
| `/finance/tuitions` | `finance.tuitions.tsx` | Mesma entidade `Cobranca`, filtrada por `tipo=mensalidade`; edição e geração em lote por competência, serviço e turma |
| `/finance/boletos` | `finance.boletos.tsx` | Emissão de boleto (nosso número, linha digitável e PIX gerados internamente) e download do PDF |
| `/finance/products` | `finance.products.tsx` | CRUD de produtos |
| `/finance/services` | `finance.services.tsx` | CRUD de serviços, com seleção de política de multa e juros |
| `/finance/nfe` | `finance.nfe.tsx` | Emissão de nota fiscal (documento interno) e download do PDF e do XML |
| `/finance/reports` | `finance.reports.tsx` | Receita mensal, fluxo de caixa e inadimplência (`financeService.relatorios`), com exportação em CSV |
| `/finance/discounts` | `finance.discounts.tsx` | CRUD de descontos e atribuição a aluno do Academy |
| `/finance/policies` | `finance.policies.tsx` | CRUD de políticas de multa e juros, definidas pela equipe financeira (setembro de 2026) |

O layout `finance.tsx` mantém a verificação `financeHasAccess(role)` do perfil deduzido das permissões; a permissão
efetiva é aplicada pelo `AppShell` (ver `08-autorizacao.md`). As rotas sem uso `finance.manage.tsx` e
`finance.settings.tsx` (a primeira falhava ao abrir, por depender de `FinanceProvider` nunca montado) foram
removidas na migração, assim como os dados simulados do Finance (`src/mock/database/{tuitions,boletos,charges,
payments,financeStudents,products,services,discounts,nfes}.ts`) e `finance/store.tsx`. **Boleto, PIX e nota fiscal são
simulados internamente**, sem intermediador de pagamento e sem transmissão à SEFAZ, por decisão de produto; ver
`docs/system/02-escopo.md` no repositório do backend.

## Rooster Student (`API`)

| Rota | Arquivo | Dado | Função |
|---|---|---|---|
| `/student` | `student.index.tsx` | API* | Painel: disciplinas, notas e atividades (`studentService` e `learnService`), eventos (`academyService`) e cobranças (`financeService.me.getCobrancas()`). *O quadro de avisos (`NOTICES`) utiliza dados de exemplo de `student/mock-data.ts` |
| `/student/profile` | `student.profile.tsx` | API | Perfil acadêmico (`studentService.getMe()`); a edição do e-mail pessoal é apenas local, sem endpoint |
| `/student/disciplines` | `student.disciplines.tsx` | API | Disciplinas matriculadas (`studentService.getMyEnrollments()`) |
| `/student/activities` | `student.activities.tsx` | API | Atividades e entregas do aluno (`learnService`) |
| `/student/grades` | `student.grades.tsx` | API | Boletim por turma (`studentService.getMyGrades()`) |
| `/student/attendance` | `student.attendance.tsx` | API | Frequência (`studentService.getMyAttendance()`) |
| `/student/history` | `student.history.tsx` | API | Histórico acadêmico e coeficiente de rendimento (`studentService.getMyHistory()`) |
| `/student/calendar` | `student.calendar.tsx` | API | Eventos do calendário acadêmico (`academyService`) e vencimentos de cobrança (`financeService.me.getCobrancas()`) |
| `/student/finance` | `student.finance.tsx` | API | Cobranças, download de boleto, nota fiscal e desconto vigente (`financeService.me.*`) |
| `/student/documents` | `student.documents.tsx` | API | Central de documentos (01/10/2026): documentos institucionais e documentos das disciplinas em que o aluno está matriculado (`academyService.getDocs()`, filtrados pelas disciplinas de `studentService.getMyEnrollments()`), com busca, filtro por origem e download decifrado (`academyService.downloadDoc()`). Substitui a lista de exemplo anterior, que simulava fluxo de envio e análise inexistente no backend |
| `/student/notifications` | `student.notifications.tsx` | API | Mesma central de `/notifications` (`NotificationsList`), com o cabeçalho do portal (`GET /notificacoes/minhas`) |

Layout: `student.tsx`, que identifica o aluno uma única vez (`studentService.getMe()`) para o cabeçalho e o menu de
abas; quando o usuário não possui vínculo de aluno, exibe "Sem vínculo de aluno", sem falha (ver
`10-tratamento-erros.md`).

## Rooster Academy (`API`)

| Rota | Arquivo | Função |
|---|---|---|
| `/academy` | `academy.index.tsx` | Painel conforme o perfil: coordenação e administração visualizam o painel institucional (oito consultas por `academyService`); o professor visualiza painel próprio, restrito às turmas que leciona (`getClasses({minhas:true})` e `getFrequencia`), pois não possui a permissão `academy.manage.acessar` exigida pelas consultas institucionais |
| `/academy/manage` | `academy.manage.tsx` | Gestão acadêmica: abas Disciplinas, Turmas, Professores, Alunos e Calendário, todas por `academyService` |
| `/academy/attendance` | `academy.attendance.tsx` | Registro de frequência (`academyService.getFrequencia` e `registrarFrequencia`); turmas por `{minhas:true}` para o professor e todas para a coordenação e a administração |
| `/academy/grades` | `academy.grades.tsx` | Composição e lançamento de notas (`academyService.getGradeItemsWithScores` e `setGrade`); itens com `origin:"learn"` são somente leitura; mesma regra de turmas da frequência |

Layout: `academy.tsx`.

A aba **Alunos** (`students-tab.tsx`) segue o padrão de CRUD das demais abas (busca por nome, RA ou e-mail, filtro por
curso e situação, painel de detalhe, ativação e exclusão); as cinco abas utilizam `academyService` (ver
`04-componentes.md` e `06-integracao-api.md`).

**Correção aplicada** (auditoria com os perfis de professor e coordenador): `academy.index.tsx`,
`academy.attendance.tsx` e `academy.grades.tsx` invocavam `academyService.getAll()` (lista completa de disciplinas,
que exige `academy.manage.acessar`) no mesmo `Promise.all` de consultas permitidas ao professor; como `Promise.all`
falha integralmente quando uma promessa é rejeitada, as três telas falhavam por completo para o professor. A correção
incluiu `disciplineName`, `disciplineCode` e `disciplineWorkload` no tipo `SchoolClass` (o backend já inclui a
disciplina na resposta de `/turmas`), o que eliminou a chamada a `getAll()` nessas telas. As telas de frequência e de
notas passaram a utilizar `getClasses({minhas:true})` apenas quando `role === "professor"`; a coordenação e a
administração consultam todas as turmas, pois a chamada com `{minhas:true}` resultava sempre em `403` para quem não
possui vínculo de professor.

## Rooster Learn (`API`)

| Rota | Arquivo | Função |
|---|---|---|
| `/learn` | `learn.index.tsx` | Painel: estatísticas (o professor visualiza as turmas por `academyService.getClasses`; o aluno, `learnService.getMyActivities`), lista de atividades e abas Turmas e Relatórios |
| `/learn/classes` | `learn.classes.tsx` | Professor e coordenação: seleção de turma do Academy, cadastro de atividades (`learnService.create`, `update`, `remove` e `publish`) e correção de entregas |
| `/learn/activities/:id` | `learn.activities.$id.tsx` | Detalhe da atividade: descrição, entregas, correção, notas, parecer e histórico |
| `/learn/student` | `learn.student.tsx` | Área do aluno: atividades por disciplina, resposta (texto e anexo) e consulta de nota e parecer |

Layout: `learn.tsx`.

As atividades pertencem a turma do Academy (mesmo identificador devolvido por `academyService.getClasses()`); não há
turma ou disciplina paralela no Learn. O banco de questões do protótipo anterior (`Question` e `QuestionType`, com
múltipla escolha e embaralhamento) não possui equivalente no backend e foi removido destas telas: a entrega do aluno
consiste em texto livre e anexos.

`src/components/rooster/learn/forms-store.ts` é um construtor de formulários mantido exclusivamente no cliente, por
decisão de escopo, sem endpoint no backend, inicializado por `learn/forms-seed.ts` (tipos `ActivityStatus`,
`ActivityType` e `Question` e dados de exemplo). O antigo `learn/mock-data.ts` (229 linhas, em sua maior parte sem
consumidor) foi removido em setembro de 2026; apenas `ACTIVITIES` e `QUESTIONS`, efetivamente utilizados por
`forms-store.ts`, foram preservados em `forms-seed.ts`.

## Rooster Boost: gestão e orientação (`API`, no `AppShell`)

Rotas `/boost`, `/boost/manage/:id`, `/boost/conversas` e `/boost/students` (arquivos `boost.index.tsx`,
`boost.manage.$id.tsx`, `boost.conversas.tsx` e `boost.students.tsx`), com layout `boost.tsx`. Consomem
`services/mock-api/boost.service.ts`, ligado ao `BoostController` e autenticado pelo login do Hub.

**Não há responsável exclusivo por curso (setembro de 2026).** O usuário com a permissão gerencia **qualquer** curso, e
cada aba e botão respeita a ação correspondente por `useCan('/boost/manage', ...)`. O professor participa como
**orientador** vinculado a cursos e utiliza apenas `/boost/conversas`.

**`/boost` (cursos)**: relação de **todos** os cursos, com indicação de situação e o botão **Retirar de publicação /
Publicar** (`gerenciar-cursos`); "Novo curso" e a contagem de alunos (`ver-progresso`) são exibidos conforme a
permissão. **`/boost/manage/:id`** possui as abas Detalhes (`gerenciar-cursos`), Conteúdo (`gerenciar-conteudo`),
**Certificado** (emissão, carga horária e texto com `{aluno}`, `{curso}`, `{cargaHoraria}` e `{data}`, com
pré-visualização; ação `certificado`), **Orientadores** (vínculo e remoção de professores; ação
`vincular-orientadores`) e Alunos (`ver-progresso`, apenas progresso). A configuração do certificado **não** é enviada
na edição genérica do curso (o backend a recusa); somente na criação e pela rota própria.

**`/boost/conversas` (`boost.conversas.tsx`)**: caixa de entrada em duas colunas, com a lista de alunos (curso,
última mensagem, contador de não lidas e busca) e a conversa selecionada. São exibidos apenas os cursos a que o
professor está vinculado. A atualização em tempo real utiliza `use-boost-conversas-socket.ts` (uma conexão para os
avisos da caixa e para a sala da conversa aberta); a abertura da conversa marca como lidas as mensagens do aluno.

**Vídeo hospedado no editor de aula (`content-tab.tsx`, setembro de 2026)**: para aula do tipo vídeo, o modal oferece
duas fontes: *link externo* (YouTube ou Vimeo) ou *envio de arquivo de vídeo* (até 2 GB, nos formatos mp4, webm ou
mov). O envio é disponibilizado apenas para aula **já salva**, que possui identificador para receber o arquivo. Durante
o envio, é exibida barra de progresso, por meio de `uploadFileWithProgress` (XHR), pois `fetch` não expõe de forma
confiável o progresso de envio entre navegadores. A aula com vídeo enviado exibe nome e tamanho, o botão **Carregar
pré-visualização** (que obtém token de 5 minutos e monta o `<video>` apenas mediante solicitação) e **Remover**; o
envio de novo arquivo substitui o anterior. A listagem de aulas identifica as que possuem vídeo hospedado.

`uploadFileWithProgress` **não renova a sessão automaticamente** diante de `401`, ao contrário de `uploadFile`: a
repetição integral de um envio de vários minutos seria mais prejudicial que a simples indicação da falha.

**`/boost/students` (`boost.students.tsx`)**: gestão das contas públicas do portal (`BoostUsuario`): relação com busca,
contagem de matrículas, ativação e desativação e **redefinição de senha**, que abre modal com a senha temporária gerada,
botão de cópia e aviso de que ela **não será exibida novamente**. Destinada apenas ao administrador (item de menu com
`roles: ["admin"]` em `module-config.ts`; permissão `boost.students.*` no catálogo). Não utiliza o `HubCrud` genérico,
pois as ações (ativação e redefinição) não seguem o formato de CRUD por ele pressuposto.

## Portal do Rooster Boost: aluno (`API`, autenticação pública, fora do `AppShell`)

Área pública com layout próprio (`boost-portal.tsx`), sem `AppShell` e sem a sessão do Hub. A sessão é independente
(`src/services/boost-portal/session.ts` e `client.ts`), com chaves de `localStorage` e token JWT próprios (declaração
`tipo:'boost'`), não aceito nas rotas do Hub e vice-versa (ver `docs/security/03-rbac.md` no repositório do backend).

| Rota | Arquivo | Função |
|---|---|---|
| `/boost-portal` | `boost-portal.index.tsx` | Catálogo público dos cursos publicados, navegável sem login |
| `/boost-portal/entrar` | `boost-portal.entrar.tsx` | Login do Boost (conta própria, distinta da conta do Hub) |
| `/boost-portal/cadastro` | `boost-portal.cadastro.tsx` | Cadastro público (nome, e-mail e senha) |
| `/boost-portal/cursos/:slug` | `boost-portal.cursos.$slug.tsx` | Prévia do curso (aluno não matriculado) ou conteúdo completo, com aulas, materiais, progresso, conversa com o orientador e certificado (aluno matriculado) |
| `/boost-portal/painel` | `boost-portal.painel.index.tsx` | Matrículas do aluno (rota `index`; como `painel.tsx` era rota pai sem `<Outlet />`, a página de matrícula não era renderizada, defeito corrigido em setembro de 2026) |
| `/boost-portal/painel/:matriculaId` | `boost-portal.painel.$matriculaId.tsx` | Detalhe da matrícula, com o reprodutor do curso |
| `/boost-portal/verificar` | `boost-portal.verificar.tsx` | Verificação pública de certificado, sem login |

Ver `07-autenticacao.md` quanto à coexistência dessa sessão com a do Hub na mesma aplicação.

**Reprodutor de vídeo hospedado (`boost-portal.painel.$matriculaId.tsx`, setembro de 2026)**: a aula possui três fontes
possíveis, avaliadas nesta ordem: **vídeo hospedado** (`hostedVideo`), vídeo incorporado externo (YouTube ou Vimeo) e
link. O vídeo hospedado tem precedência porque os dois campos podem coexistir no banco (o envio não apaga o link
anterior).

Como o elemento `<video>` não envia o cabeçalho `Authorization`, o reprodutor solicita **token de transmissão de 5
minutos** (`GET /boost/aulas/:id/stream-token`, com autenticação regular) a cada troca de aula e monta a URL com
`?token=`. O token não é reaproveitado entre aulas, por ser de curta duração e restrito a uma aula. O `<video>` recebe
`key={aulaAtiva.id}`, para ser recriado na troca de aula sem herdar a posição da anterior.

Registro do progresso:

- **Retomada**: em `onLoadedMetadata`, uma vez por aula (`posicaoAplicadaRef`), a reprodução é posicionada em
  `posicaoSeg`, se contida na duração.
- **Envio do progresso**: como `onTimeUpdate` é disparado várias vezes por segundo, há limitação de
  aproximadamente 8 segundos entre envios (`ultimoReporteRef`); `onPause` e `onEnded` enviam imediatamente
  (`forcar`). As falhas são silenciosas, por decisão de projeto, para não interromper a reprodução.
- **Conclusão**: o cliente informa apenas posição e percentual; **a conclusão da aula** (limiar de 90%) é determinada
  pelo backend. Quando a resposta contém `concluida: true`, a matrícula é recarregada para refletir o progresso e o
  certificado.

O botão "Marcar como concluída" permanece disponível, pois aulas de texto, PDF e link não possuem posição de vídeo.

**Verificação de certificado** (`boost-portal.verificar.tsx`): visível na navegação para todos, autenticados ou não,
pois quem confere um certificado (empregador ou outra instituição) em geral não possui conta. A tela distingue três
resultados: certificado autêntico, certificado não encontrado e **falha de comunicação**, esta com a indicação expressa
de que não significa documento inválido.

## Outras rotas

| Rota | Arquivo | Função |
|---|---|---|
| `/settings` | `settings.tsx` | Configurações: tema e, para usuários com `hub.configuracoes.acessar`, a seção "E-mail" (estado do SMTP e envio de mensagem de teste, por `configuracoesService`); as demais seções são informativas |
