# Componentes

## Componentes genéricos (`src/components/shared/`)

Reexportados por `index.ts` (importação única por `@/components/shared`) e utilizados por qualquer módulo:

- **`primitives.tsx`**: `Chip`, `StatusChip`, `StatCard`, `SectionCard`, `Avatar`, `EmptyState`, `Btn`, `Table`,
  `Pagination` e `LoadingCards`.
- **`data-table.tsx`**: `DataTable` genérica, com ordenação, paginação e estado vazio.
- **`crud-page.tsx`**: `CrudHeader`, `CrudToolbar` e `Breadcrumbs`.
- **`overlays.tsx`**: `Modal`, `Drawer` e `ConfirmDialog`.
- **`form.tsx`**: `Field`, `TextInput`, `TextArea`, `SelectInput` e `FileUpload`.
- **`dropdown.tsx`**: `PopoverSelect`, base de `SelectInput` e `Select`. Não se trata de `<select>` HTML nativo, e sim
  de botão que abre um painel de opções, aspecto relevante para a automação de testes de interface. O painel, aberto
  em portal, recebe o atributo `data-camada-flutuante`, para que o roteiro guiado não o escureça nem o bloqueie.

**Marcadores dos roteiros guiados.** `Btn`, `Field` e `SectionCard` aceitam a propriedade opcional `tour`, gravada
como atributo `data-tour`, que identifica o elemento nos roteiros do assistente; as abas do `TabBar` recebem
automaticamente `data-tour="aba-<valor>"`, e o `HubCrud`, `crud-novo`, `crud-salvar` e `campo-<nome do campo>`.
Elementos que não utilizam esses componentes recebem o atributo `data-tour` diretamente.

## `HubCrud`: componente central de CRUD

`src/components/rooster/hub/crud-panel.tsx`. As telas de CRUD (usuários, setores, categorias, patrimônio, ambientes
etc.) consistem, essencialmente, em `<HubCrud service={...} fields={[...]} columns={[...]} />`, que realiza a
listagem por `service.list()`, o modal de criação e edição com validação por campo (`HubField.validate`), a
confirmação de exclusão e a coluna de ações extensível pela propriedade `rowExtra` (utilizada, por exemplo, no botão
de redefinição de senha da tela de usuários).

`service` é sempre um `HubResource<T>`, com o mesmo contrato (`list`, `get`, `create`, `update` e `remove`) de
`src/services/hub/index.ts` e de `mapped-resource.ts`, o que permite que a mesma tela genérica atenda a entidades
distintas.

## Componentes de domínio (`src/components/rooster/<modulo>/`)

Cada um dos nove módulos possui pasta própria, com rótulos, formulários e estados específicos do domínio (por exemplo,
`desk/categories-store.ts`, `assets/store.tsx` e `rooms/labels.ts`). Não seguem contrato genérico e são específicos
das telas que os utilizam.

### `src/components/rooster/academy/manage/`: abas da gestão acadêmica

As cinco abas de `academy.manage.tsx` (`disciplines-tab.tsx`, `classes-tab.tsx`, `teachers-tab.tsx`,
`students-tab.tsx` e `calendar-tab.tsx`) utilizam `academyService` (listagem, criação, edição e exclusão pela API, com
`useState` e `useEffect` e contador `refresh` para recarga após alteração; ver `05-estado-e-hooks.md`). A aba
`students-tab.tsx` realiza o CRUD de `Aluno` (busca por nome, RA ou e-mail, filtro por curso e situação, painel de
detalhe, ativação e exclusão), no mesmo leiaute de `teachers-tab.tsx`.

### `UserPicker` (`academy/manage/user-picker.tsx`): vínculo de usuário existente do Hub

Componente reutilizável das abas **Alunos** e **Professores** no cadastro de `Aluno` ou `Professor`. Em vez de
formulário de novo usuário, realiza busca na lista de usuários do Hub (`usuariosService.list()`, `GET /usuarios`) por
nome ou e-mail e devolve o `usuarioId` selecionado: a tela não cria `Usuario`, apenas vincula usuário existente ao
cadastro acadêmico (`createStudent` e `createTeacher` exigem `usuarioId`). Após a seleção, exibe cartão com avatar,
nome e e-mail e o botão "Trocar"; na edição de registro existente, o campo é bloqueado (`lockUser`), pois o vínculo
`usuarioId` não pode ser alterado após a criação, apenas por exclusão e novo cadastro. É o componente de referência
para futuras telas que necessitem do mesmo tipo de vínculo (por exemplo, coordenador ou atendente).

### `src/components/rooster/learn/`: questões e entregas

`questions.tsx` reúne o editor de questões do professor (`QuestionsEditor` e o modal de cadastro), o campo de resposta
do aluno por tipo de questão (`QuestionAnswerInput`), a exibição do resultado com gabarito e pontuação
(`QuestionResult`, que aceita um campo de pontuação opcional para a correção) e a imagem de apoio (`QuestionImage`,
obtida como `Blob` e exibida por URL de objeto, revogada ao desmontar). As funções auxiliares (`salvarArquivo`,
`emptyAnswer` e `answerMissing`) ficam em `questions-utils.ts`, para preservar o recarregamento rápido do Vite.
`submission-modals.tsx` contém `AnswerModal` e `ReviewModal`, utilizados tanto por `/learn/student` quanto por
`/student/activities`.

### `src/components/rooster/assistente/`: assistente de dúvidas e roteiros guiados

- **`AssistenteChat`** (`assistente-chat.tsx`): botão flutuante e painel de conversa (`role="dialog"`, com a
  conversa em `role="log"`). Envia a dúvida com a rota atual, exibe as sugestões de tarefas permitidas e apresenta a
  resposta em cartão: módulo, título, usuários, resumo, procedimento, "Mais detalhes" (observações), "Abrir a tela"
  (quando a rota é acessível ao usuário, verificada por `canAccessRoute`) e "Mostrar na tela" (quando a resposta
  traz roteiro com `permitido: true` e há etapas definidas no frontend); sem a permissão, orienta a solicitá-la. Fica
  oculto durante um roteiro.
- **`AssistenteProvider`** (`assistente-context.tsx`): estado da conversa e chamadas à API, com descarte das
  respostas que chegam após "Nova conversa" ou após o encerramento da sessão.
- **`TourProvider` e `useTour`** (`tour.tsx`): motor dos roteiros. A cada quadro de animação, localiza os elementos do
  passo (`[data-tour="<alvo>"]`) e desenha, em portal, uma máscara SVG que escurece a tela, com recortes sobre esses
  elementos e sobre as camadas flutuantes abertas a partir deles, um contorno de destaque e a legenda (título, o que
  fazer, "Por quê", passo atual e botões), posicionada à direita, à esquerda, abaixo ou acima do conjunto destacado.
  A máscara não intercepta o mouse, de modo que a rolagem permanece livre; os cliques fora do destaque são
  descartados na fase de captura. Nos passos `clicar`, o clique no elemento (ou em `avancaEm`) avança o roteiro;
  nos passos `preencher` e `observar`, o botão "Próximo". O passo navega até a sua `rota`, rola o elemento para a
  área visível (descontada a barra superior, por `scroll-margin-top`), dá foco ao controle e, se o elemento não
  aparecer, exibe a orientação `seAusente` sem bloquear cliques, prosseguindo quando o elemento surgir; passos
  `opcional` ausentes são pulados. A tecla Esc encerra o roteiro sem fechar o formulário aberto.
- **`roteiros.ts`**: etapas dos 15 roteiros, com os mesmos identificadores do backend.

## Componentes de estrutura (`src/components/rooster/*.tsx`, fora de subpastas)

`app-shell.tsx`, `app-sidebar.tsx`, `app-topbar.tsx` e `page-header.tsx`: layout autenticado, menu lateral, barra
superior e cabeçalho padrão de página. Ver `01-arquitetura.md` quanto à sua articulação com a rota raiz.

## `src/components/ui/`: primitivos Radix/shadcn

Componentes de baixo nível (button, dialog, table, sidebar etc.), no padrão shadcn, que servem de base aos
componentes de `shared/` e, na maioria dos casos, não são utilizados diretamente pelas telas.
