# Integração com a API

## Cliente HTTP central (`src/services/hub/client.ts`)

Três funções exportadas, todas passando por um helper privado `send()` compartilhado:

- **`request<T>(path, { method, body, signal })`** — JSON padrão. Anexa `Authorization: Bearer <token>` automaticamente (lido de `session.ts`) quando há sessão.
- **`uploadFile<T>(path, formData)`** — multipart, sem `Content-Type` manual (o browser define o boundary sozinho). Usado para upload de anexo de chamado (Desk), documento acadêmico (`academyService.createDoc`, `POST /documentos-academicos`) e anexo de entrega (`learnService.uploadAttachment`, `POST /entregas/:id/anexos`).
- **`requestBlob(path)`** — baixa um recurso protegido como `Blob`. Necessário porque um `<a href>` puro não carrega o header `Authorization` — o download real é feito via `fetch` autenticado e depois um `URL.createObjectURL` disparando o download no navegador.

`API_URL` vem de `VITE_API_URL`, com fallback `http://localhost:3000`.

### Prefixo de versão (`/v1`)

A API é versionada por URI: toda rota de negócio existe **apenas** sob `/v1` — sem o prefixo, a resposta é `404` (comprovado por teste e2e no backend). O prefixo é aplicado dentro de `send()`, via a constante `API_VERSION_PREFIX`, e **não** faz parte de `API_URL`. A separação é intencional: `API_URL` também é a base usada para abrir os gateways WebSocket (`io(\`${API_URL}/desk\`)`, `io(\`${API_URL}/boost\`)`), e namespace de Socket.IO não é versionado. Embutir `/v1` em `API_URL` quebraria o chat.

Por isso `VITE_API_URL` deve conter só o host, nunca o `/v1`.

> Isso foi uma regressão real, corrigida em setembro/2026: quando o versionamento entrou no backend, o cliente continuou chamando `/usuarios` em vez de `/v1/usuarios`, o que faria toda rota de negócio responder `404`. A suíte e2e do backend não pegou porque foi atualizada junto com o versionamento; o que faltava era a ponta do frontend. O mesmo ajuste foi aplicado ao cliente do portal Boost (`src/services/boost-portal/client.ts`).

### Tratamento de erro

- **`ApiError`** — resposta HTTP não-2xx; carrega `status` e a mensagem vinda do backend (`message` do corpo, incluindo o caso de array de mensagens do `ValidationPipe`, que é unido com `", "`).
- **`ApiUnavailableError`** — falha de rede (backend fora do ar, sem resposta HTTP nenhuma) — tratado como um erro diferente de `ApiError`, para a UI poder mostrar "sem conexão" em vez de um erro genérico.
- **`401` tenta renovar antes de derrubar a sessão** — ver abaixo. Só quando a renovação não é possível (ou é recusada) o `send()` chama `session.clear()`, que é o que faz o app voltar para a tela de login sozinho.

### Renovação automática de sessão

O access token expira em 8h. Desde setembro/2026 o login também devolve um `refreshToken` (30 dias), guardado na sessão, e o cliente renova sozinho:

1. Uma chamada volta `401`.
2. Se há refresh token, o cliente chama `POST /auth/refresh`, grava o par novo e **repete a requisição original** — o usuário não percebe nada.
3. Se a renovação é **recusada** pelo servidor, a sessão é limpa e o app volta ao login.
4. Se a renovação falha por **rede**, a sessão é preservada e só a chamada falha. Backend fora do ar não é o mesmo que sessão inválida; deslogar aqui faria o usuário perder o login por uma oscilação de conexão.

Chamadas simultâneas compartilham **uma única** renovação (`renovacaoEmVoo`). Sem isso, como o refresh token é rotacionado a cada uso, a primeira renovação invalidaria o token e as demais tentariam renovar com um token já revogado — derrubando a sessão exatamente no momento em que ela acabou de ser salva.

`logout()` avisa o servidor (`POST /auth/logout`, que revoga a sessão) sem esperar a resposta: do ponto de vista do usuário, sair é local e imediato.

## Padrão de serviço por módulo (`src/services/mock-api/*.service.ts`)

Apesar do nome da pasta, **todos os 9 módulos** falam com a API real — o nome é histórico (o projeto nasceu com tudo mockado e foi migrado módulo a módulo). Nenhum service dessa pasta lê dado mockado em runtime.

- **`mapResource<TFront, TBack>()`** (`services/hub/mapped-resource.ts`) — cria um `HubResource<TFront>` (`list/get/create/update/remove`) a partir de um recurso do backend, com duas funções de tradução (`toFront`/`toBack`) para os nomes de campo PT (backend) → EN (tela) e vice-versa. É o padrão usado por Assets e Rooms, que têm muita diferença de nome de campo, e também por parte de `academy.service.ts` (`cursoResource`, `periodoResource`, `eventoResource`).
- **`createResource<T>()`** (`services/hub/index.ts`) — versão sem tradução, usada quando os nomes já batem ou a tela lida direto com o formato do backend.
- Alguns endpoints não cabem no contrato genérico `HubResource` (respostas transacionais, ex.: `POST /patrimonio-movimentacoes` devolve `{ movimentacao, patrimonio }`, não uma linha "achatada"; ou recursos com filtros de query string, como `/disciplinas?cursoId=`) — nesses casos o service chama `request()`/`uploadFile()`/`requestBlob()` diretamente, sem passar pelo `mapResource`/`createResource` genérico. É o caso predominante em `academy.service.ts`, `learn.service.ts` e `student.service.ts` (ver abaixo).

## `academyService`, `learnService`, `studentService` (Rooster Academy/Learn/Student)

`src/services/mock-api/academy.service.ts`, `learn.service.ts` e `student.service.ts` — mesmo cliente HTTP (`request`/`uploadFile`/`requestBlob` de `services/hub/client.ts`), sem mecanismo de integração novo. Todos os três seguem o padrão **tipo "front" / tipo "\*Back"**: um tipo `*Back` espelha o DTO em português retornado pelo Prisma/NestJS (ex.: `DisciplinaBack`, `AtividadeBack`, `AlunoBack`), e uma função `xToFront()`/`xToDto()` por entidade traduz para o tipo "front" em inglês/camelCase que as telas já conheciam do mock antigo — a tela nunca vê o formato do backend diretamente.

- **`academyService`** — cursos, períodos letivos, disciplinas, professores, alunos, turmas, matrículas, frequência, itens avaliativos/notas, eventos de calendário, documentos acadêmicos. `createTeacher`/`createStudent` recebem um `usuarioId` de um `Usuario` já existente no Hub (nunca criam um novo usuário) — ver `UserPicker` em `04-componentes.md`.
- **`learnService`** — atividades (`Atividade`) e entregas (`Entrega`) de uma turma real do Academy (mesmo `classId`/`turmaId`). Não existe mais uma turma/disciplina paralela só do Learn.
- **`studentService`** — portal do aluno ("meus dados"), descrito na seção `/me/*` abaixo.

### Gotcha: campos numéricos do Prisma `Decimal` chegam como `string`

`peso`, `notaMaxima`, `nota` (Learn) e `média`/`nota` de notas (Student) são `Decimal` no Prisma — o Nest serializa esses campos como **string**, não como `number`. `learn.service.ts` e `student.service.ts` têm cada um um helper `num()` (`(v: number | string | null | undefined) => number | null`, ou `=> number` com fallback `0` em `learn.service.ts`) que converte com segurança antes de expor o valor no tipo "front". Qualquer tela nova que consuma esses campos direto de `request()` sem passar por um desses services precisa aplicar a mesma conversão — não assumir que o JSON já veio como `number`.

### Identidade do portal do aluno: sempre resolvida no servidor (`/me/*`)

Todo endpoint de "meus dados" do portal do aluno (`/me/aluno`, `/me/turmas`, `/me/frequencia`, `/me/notas`, `/me/historico`, e em Learn `/me/atividades`, `/me/entregas`) **nunca recebe um id de aluno** — o backend lê o aluno a partir do JWT da sessão. `studentService.getMe()` chama `GET /me/aluno` e:

- se o backend responder normalmente, devolve o `StudentProfile`;
- se der erro (usuário sem vínculo de `Aluno` — ex.: um admin abrindo o portal do aluno sem estar matriculado), o `catch` devolve **`undefined`**, não relança o erro.

Esse é o padrão a seguir em qualquer tela futura de "meus dados": tratar a ausência de vínculo como um estado de UI (`EmptyState`), não como uma falha de rede. Ver o detalhamento do padrão de erro em `10-tratamento-erros.md`.

### `situacao` do histórico/matrícula é derivada no cliente

O backend não expõe uma flag pronta de aprovado/reprovado por matrícula — `student.service.ts` calcula isso em `situacaoFromMatricula(status, media)`:

```ts
if (status === "concluida") return media !== null && media >= 6 ? "aprovado" : "reprovado";
if (status === "cancelada") return "reprovado-falta";
if (status === "trancada") return "trancado";
return "cursando";
```

Usada tanto em `getMyEnrollments()` (disciplinas do semestre atual) quanto em `getMyHistory()` (histórico completo) — a mesma regra, aplicada a dados diferentes (`matricula.status` vs. `historico.status`).

## Sessão (`src/services/hub/session.ts`)

Token JWT e dados do usuário logado ficam em `localStorage`. `getApiToken()` expõe o token para consumidores fora do `client.ts` (ex.: `use-ticket-socket.ts`, para autenticar o WebSocket).

## WebSocket

`use-ticket-socket.ts` conecta via `socket.io-client` ao mesmo backend, namespace `/desk`, autenticando com o token da sessão — canal de push, não substitui nenhuma chamada REST (a mensagem em si sempre é enviada por `POST /chamados/:id/mensagens`; o socket só avisa quando uma nova mensagem chegou de outro usuário).
