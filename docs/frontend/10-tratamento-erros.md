# Tratamento de Erros (frontend)

## Erros de chamada à API

Toda chamada por `client.ts` pode lançar `ApiError` (resposta HTTP de erro, com `status` e mensagem do backend) ou
`ApiUnavailableError` (falha de rede, com backend inacessível). As telas tratam os dois casos de forma distinta, em
geral da seguinte maneira:

```ts
.catch((err) => {
  if (err instanceof ApiUnavailableError) setErro("Não foi possível conectar ao servidor...");
  else if (err instanceof ApiError && err.status === 401) setErro("Login ou senha inválidos.");
  else setErro("Não foi possível completar a ação.");
});
```

O padrão repete-se em cada tela; não há componente central de mensagem de erro de API nem interceptor global de
exibição de erros.

### Promessa sem tratamento de rejeição: falha silenciosa (defeito corrigido em setembro de 2026)

Na ausência de interceptor global, `.then(setEstado)` sem `.catch()` produz falha silenciosa: a promessa rejeitada não
possui tratamento, o estado não é atualizado e nenhuma mensagem é exibida. Essa foi a causa de um defeito relatado em
teste: com usuário que possuía apenas a permissão `criar` (sem `acessar`) em `/desk/tickets`, as listas de categoria e
subcategoria do formulário de novo chamado permaneciam vazias, sem aviso, o que impedia a abertura do chamado.
`desk.tickets.tsx` (`TicketsList`) chamava `ticketService.getCategories().then(setCategories)` sem `.catch()`; quando
o backend respondia `403` (causa corrigida separadamente; ver `docs/api/02-endpoints.md`, seção 2.1, no repositório do
backend), a lista permanecia vazia.

A correção abrangeu os dois pontos com a mesma chamada sem tratamento:

- `desk.tickets.tsx`: exibe `toast.error(...)` quando `getCategories()` falha, pois o resultado alimenta o formulário
  de criação, e a falha silenciosa bloquearia a ação do usuário sem explicação;
- `desk.index.tsx`: `.catch(() => setCategories([]))`, sem aviso, pois as categorias alimentam apenas a consulta de
  nome e cor no painel (`categoryName` e `categoryColor`), uso não bloqueante, no mesmo padrão de
  `desk.tickets.$id.tsx`.

A correção não é sistêmica (não há mecanismo central que imponha tratamento a toda promessa); registra-se, portanto,
que telas novas devem tratar essa falha explicitamente, caso a caso, como nos dois exemplos.

## Sessão expirada

Tratada pelo próprio `client.ts`: diante de `401`, o cliente tenta renovar a sessão com o refresh token e repete a
requisição; se a renovação for recusada, a sessão é descartada, `useAuth().authed` passa a `false`, e o `AppShell`
redireciona para `/login` (ver `06-integracao-api.md`). A tela que originou a chamada não precisa tratar esse caso.

## Erros não capturados (nível da aplicação)

- **`__root.tsx`** define `errorComponent` (erro não capturado por error boundary mais específico) e
  `notFoundComponent` (rota inexistente), no nível do roteador.
- **`src/lib/error-capture.ts`** intercepta `console.error` para guardar o último erro, utilizado pelo servidor
  (`server.ts`) para recuperar a causa original quando o servidor interno (h3) intercepta uma exceção e devolve JSON
  genérico de erro 500.
- **`src/lib/error-page.ts`** gera a página HTML estática de erro, utilizada pelo middleware de `start.ts` e por
  `server.ts` quando a resposta indica falha não tratada.
- **`src/lib/lovable-error-reporting.ts`**: telemetria de erros para o editor Lovable (`reportLovableError`), acionada
  no `errorComponent` da rota raiz.

## Ausência de vínculo de aluno (Rooster Student e Learn)

Os dados do portal do aluno provêm de endpoints `/me/*`, que identificam o aluno pelo JWT (ver
`06-integracao-api.md`). Quando o usuário autenticado **não possui** registro de `Aluno` vinculado (caso típico: o
administrador que abre o portal sem matrícula), o backend responde com erro em `GET /me/aluno`, e
`studentService.getMe()` captura o erro e devolve **`undefined`**, deliberadamente, em vez de rejeitar a promessa:

```ts
async getMe(): Promise<StudentProfile | undefined> {
  let aluno: AlunoBack;
  try {
    aluno = await request<AlunoBack>("/me/aluno");
  } catch {
    return undefined;
  }
  // ...
}
```

O tratamento difere do padrão de erros de API descrito acima: não se trata de `ApiError` ou `ApiUnavailableError` a
ser exibido como mensagem de erro, e sim de **estado de dado ausente**, que a tela apresenta como vazio. O padrão
repete-se nas telas de `/student/*` e em `/learn/student` (`learnService.getMyActivities()` e
`studentService.getMyEnrollments()` também recaem em `.catch(() => setNoLink(true))`): a tela exibe `EmptyState` ("Sem
vínculo de aluno"), sem apresentar o fato como falha de rede ou de permissão.

Toda nova tela de dados do próprio usuário (`/me/*`) deve seguir essa forma: `undefined` ou estado vazio para a
ausência de vínculo, e nunca exceção genérica tratada como erro de API. A central de documentos do aluno, que não
depende de vínculo para a listagem de documentos institucionais, exibe estado de indisponibilidade apenas quando a
consulta de documentos falha.

## Estado de indisponibilidade da API

`offlineState` (`services/hub/index.ts`) é estado observável que indica quando a última chamada resultou em
`ApiUnavailableError`, utilizado para exibir aviso de ausência de conexão com o servidor, além do tratamento pontual de
cada `catch`.
