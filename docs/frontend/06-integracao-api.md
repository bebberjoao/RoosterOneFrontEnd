# Integração com a API

## Cliente HTTP central (`src/services/hub/client.ts`)

Funções exportadas, que utilizam o auxiliar privado `send()`:

- **`request<T>(path, { method, body, signal })`**: requisição JSON. Inclui `Authorization: Bearer <token>`
  automaticamente (lido de `session.ts`) quando há sessão.
- **`uploadFile<T>(path, formData)`**: envio multipart, sem `Content-Type` manual (o navegador define o delimitador).
  Utilizado no envio de anexo de chamado (Desk), de documento acadêmico (`academyService.createDoc`,
  `POST /documentos-academicos`) e de anexo de entrega (`learnService.uploadAttachment`, `POST /entregas/:id/anexos`).
- **`uploadFileWithProgress<T>(path, formData, onProgress)`**: envio multipart por XHR, com progresso (vídeo do
  Boost); não renova a sessão automaticamente diante de `401`.
- **`requestBlob(path)`**: obtém recurso protegido como `Blob`. Necessário porque o elemento `<a href>` não envia o
  cabeçalho `Authorization`: o download é realizado por `fetch` autenticado, seguido de `URL.createObjectURL`, que
  aciona o download no navegador.

`API_URL` provém de `VITE_API_URL`, com valor padrão `http://localhost:3000`.

### Prefixo de versão (`/v1`)

A API é versionada por URI: toda rota de negócio existe **apenas** sob `/v1`, e a requisição sem o prefixo resulta em
`404` (comprovado por teste e2e no backend). O prefixo é aplicado em `send()`, pela constante `API_VERSION_PREFIX`, e
**não** integra `API_URL`. A separação é intencional: `API_URL` é também a base dos gateways WebSocket
(`io(\`${API_URL}/desk\`)` e `io(\`${API_URL}/boost\`)`), e o namespace do Socket.IO não é versionado; a inclusão de
`/v1` em `API_URL` comprometeria a comunicação em tempo real.

Por essa razão, `VITE_API_URL` deve conter apenas o endereço do servidor, sem `/v1`.

> Regressão corrigida em setembro de 2026: com a introdução do versionamento no backend, o cliente permaneceu
> chamando `/usuarios` em vez de `/v1/usuarios`, o que faria todas as rotas de negócio responderem `404`. A suíte e2e
> do backend não detectou a falha, por ter sido atualizada com o versionamento; a lacuna estava no frontend. O mesmo
> ajuste foi aplicado ao cliente do portal do Boost (`src/services/boost-portal/client.ts`).

### Tratamento de erros

- **`ApiError`**: resposta HTTP fora da faixa 2xx; contém `status` e a mensagem do backend (`message` do corpo,
  inclusive a lista de mensagens do `ValidationPipe`, unida por `", "`).
- **`ApiUnavailableError`**: falha de rede (backend inacessível, sem resposta HTTP), tratada separadamente de
  `ApiError`, para que a interface informe a ausência de conexão em vez de erro genérico.
- **`401` com tentativa de renovação antes do encerramento da sessão** (ver abaixo). Somente quando a renovação não é
  possível ou é recusada, `send()` executa `session.clear()`, o que retorna a aplicação à tela de login.

### Renovação automática de sessão

O access token expira em 8 horas. O login devolve também um `refreshToken` (30 dias), armazenado na sessão, e o
cliente realiza a renovação automaticamente:

1. uma requisição recebe `401`;
2. havendo refresh token, o cliente chama `POST /auth/refresh`, grava o novo par e **repete a requisição original**,
   de forma transparente ao usuário;
3. se a renovação for **recusada** pelo servidor, a sessão é descartada, e a aplicação retorna ao login;
4. se a renovação falhar por **erro de rede**, a sessão é preservada, e apenas a requisição falha: a
   indisponibilidade do backend não caracteriza sessão inválida, e o encerramento nesse caso faria o usuário perder a
   sessão por instabilidade de conexão.

Requisições simultâneas compartilham **uma única** renovação (`renovacaoEmVoo`). Como o refresh token é rotacionado a
cada uso, a falta desse compartilhamento faria a primeira renovação invalidar o token, e as demais tentariam renovar
com token já revogado, encerrando a sessão.

`logout()` comunica o servidor (`POST /auth/logout`, que revoga a sessão) sem aguardar a resposta: para o usuário, a
saída é local e imediata.

## Padrão de serviço por módulo (`src/services/mock-api/*.service.ts`)

Apesar do nome do diretório, **os nove módulos** comunicam-se com a API; a denominação é histórica (o projeto foi
iniciado com dados simulados e migrado módulo a módulo). Nenhum serviço desse diretório utiliza dados simulados em
execução.

- **`mapResource<TFront, TBack>()`** (`services/hub/mapped-resource.ts`): cria um `HubResource<TFront>` (`list`,
  `get`, `create`, `update` e `remove`) a partir de recurso do backend, com duas funções de conversão (`toFront` e
  `toBack`) entre a nomenclatura do backend, em português, e a das telas. Utilizado por Assets e Rooms, com grande
  diferença de nomes de campos, e por parte de `academy.service.ts` (`cursoResource`, `periodoResource` e
  `eventoResource`).
- **`createResource<T>()`** (`services/hub/index.ts`): versão sem conversão, utilizada quando os nomes coincidem ou a
  tela utiliza diretamente o formato do backend.
- Endpoints fora do contrato genérico `HubResource` (respostas transacionais, como `POST /patrimonio-movimentacoes`,
  que devolve `{ movimentacao, patrimonio }`, ou recursos com filtros de consulta, como `/disciplinas?cursoId=`) são
  acessados diretamente por `request()`, `uploadFile()` ou `requestBlob()`. É o caso predominante em
  `academy.service.ts`, `learn.service.ts` e `student.service.ts`.

## `academyService`, `learnService` e `studentService` (Academy, Learn e Student)

`src/services/mock-api/academy.service.ts`, `learn.service.ts` e `student.service.ts` utilizam o mesmo cliente HTTP e
seguem o padrão **tipo de tela / tipo `*Back`**: o tipo `*Back` corresponde ao DTO em português devolvido pelo backend
(por exemplo, `DisciplinaBack`, `AtividadeBack` e `AlunoBack`), e uma função `xToFront()` ou `xToDto()` por entidade
realiza a conversão para o tipo utilizado pelas telas, que não manipulam o formato do backend diretamente.

- **`academyService`**: cursos, períodos letivos, disciplinas, professores, alunos, turmas, matrículas, frequência,
  itens avaliativos e notas, eventos de calendário e documentos acadêmicos (listagem, envio, exclusão e download).
  `createTeacher` e `createStudent` recebem o `usuarioId` de `Usuario` existente no Hub, sem criar usuário (ver
  `UserPicker` em `04-componentes.md`).
- **`learnService`**: atividades (`Atividade`) e entregas (`Entrega`) de turma do Academy (mesmo `classId`/`turmaId`).
- **`studentService`**: dados do portal do aluno (seção `/me/*` abaixo); as matrículas expõem `disciplineId`, utilizado
  pela central de documentos para filtrar os documentos das disciplinas do aluno.

### Campos `Decimal` do Prisma recebidos como texto

`peso`, `notaMaxima`, `nota` (Learn) e `media`/`nota` (Student) são `Decimal` no Prisma, serializados pelo NestJS
como **texto**, e não como `number`. `learn.service.ts` e `student.service.ts` possuem o auxiliar `num()`, que realiza
a conversão segura antes da exposição do valor. Toda tela nova que consuma esses campos diretamente por `request()`
deve aplicar a mesma conversão.

### Identificação do aluno no servidor (`/me/*`)

Os endpoints de dados do aluno (`/me/aluno`, `/me/turmas`, `/me/frequencia`, `/me/notas`, `/me/historico` e, no
Learn, `/me/atividades` e `/me/entregas`) **não recebem identificador de aluno**: o backend identifica o aluno pelo JWT.
`studentService.getMe()` chama `GET /me/aluno` e:

- em caso de sucesso, devolve o `StudentProfile`;
- em caso de erro (usuário sem vínculo de `Aluno`, como o administrador que abre o portal sem matrícula), o `catch`
  devolve **`undefined`**, sem propagar o erro.

É o padrão a adotar em futuras telas de dados do próprio usuário: a ausência de vínculo é tratada como estado de
interface (`EmptyState`), e não como falha de rede. Ver `10-tratamento-erros.md`.

### Situação derivada no cliente

O backend não fornece indicador de aprovação por matrícula; `student.service.ts` o determina em
`situacaoFromMatricula(status, media)`:

```ts
if (status === "concluida") return media !== null && media >= 6 ? "aprovado" : "reprovado";
if (status === "cancelada") return "reprovado-falta";
if (status === "trancada") return "trancado";
return "cursando";
```

A regra é utilizada em `getMyEnrollments()` (disciplinas do período corrente) e em `getMyHistory()` (histórico
completo), sobre dados distintos (`matricula.status` e `historico.status`).

## Sessão (`src/services/hub/session.ts`)

O access token, o refresh token, os dados do usuário e as permissões efetivas são armazenados em `localStorage`.
`getApiToken()` expõe o token a consumidores externos a `client.ts` (por exemplo, `use-ticket-socket.ts`, para
autenticar o WebSocket).

## WebSocket

`use-ticket-socket.ts`, `use-boost-conversas-socket.ts` e `use-boost-portal-socket.ts` conectam-se por
`socket.io-client` ao backend (namespaces `/desk` e `/boost`), autenticados pelo token da sessão correspondente.
Constituem canal de aviso e não substituem chamadas REST: a mensagem é sempre enviada por REST (por exemplo,
`POST /chamados/:id/mensagens`), e o socket apenas informa a chegada de nova mensagem de outro usuário.
