# Tratamento de Erros (Frontend)

## Erro de chamada de API

Toda chamada via `client.ts` pode lançar `ApiError` (resposta HTTP de erro, com `status` e mensagem do backend) ou `ApiUnavailableError` (falha de rede — backend inacessível). As telas tratam os dois de forma diferente, tipicamente:

```ts
.catch((err) => {
  if (err instanceof ApiUnavailableError) setErro("Não foi possível conectar ao servidor...");
  else if (err instanceof ApiError && err.status === 401) setErro("Login ou senha inválidos.");
  else setErro("Não foi possível completar a ação.");
});
```

Esse padrão se repete tela a tela — não há um componente central de "mensagem de erro de API" nem um interceptor global de exibição de erro.

## Sessão expirada

Tratado dentro do próprio `client.ts`: um 401 limpa a sessão automaticamente (ver `06-integracao-api.md`), o que faz `useAuth().authed` virar `false` e `AppShell` redirecionar para `/login` sozinho — a tela que originou a chamada não precisa tratar esse caso especificamente.

## Erro não capturado (nível de aplicação)

- **`__root.tsx`** define `errorComponent` (erro não pego por nenhum boundary mais específico) e `notFoundComponent` (rota inexistente), no nível do router.
- **`src/lib/error-capture.ts`** faz monkey-patch de `console.error` para guardar o último erro real "fora de banda", usado pelo servidor (`server.ts`) para recuperar a causa original quando o runtime interno (h3) engole uma exceção e devolve um JSON genérico de erro 500.
- **`src/lib/error-page.ts`** gera uma página HTML estática de fallback, usada tanto pelo middleware de `start.ts` quanto pelo `server.ts` quando a resposta indica falha não tratada.
- **`src/lib/lovable-error-reporting.ts`** — telemetria de erro enviada ao editor Lovable (`reportLovableError`), disparada no `errorComponent` do root.

## Ausência de vínculo de aluno — forma diferente de `ApiError` (Rooster Student/Learn)

Todo dado "meu" do portal do aluno vem de um endpoint `/me/*` que resolve o aluno pelo JWT (ver `06-integracao-api.md`). Quando o usuário autenticado **não tem** um registro de `Aluno` vinculado — o caso típico é um admin usando o seletor de "Visão" (`role-context.tsx`) para pré-visualizar o portal do aluno sem estar matriculado — o backend responde com erro em `GET /me/aluno`, e `studentService.getMe()` captura esse erro e devolve **`undefined`**, deliberadamente, em vez de deixar a `Promise` rejeitar:

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

Isso é intencional e diferente do padrão de "Erro de chamada de API" acima: não é um `ApiError`/`ApiUnavailableError` para a tela tratar com mensagem de erro — é um **estado de dado ausente**, que a tela deve tratar como vazio, não como falha. O padrão se repete nas telas de `/student/*` e em `/learn/student` (`learnService.getMyActivities()`/`getMyEnrollments()` também caem no `.catch(() => setNoLink(true))`): a tela renderiza um `EmptyState` ("Sem vínculo de aluno") em vez de propagar o erro para o usuário como se fosse uma falha de rede ou permissão.

Qualquer tela nova de "meus dados" (`/me/*`) que vier a ser criada deve seguir essa mesma forma — `undefined`/estado vazio para "sem vínculo", nunca um `throw` genérico tratado como erro de API.

## Estado "offline" / API indisponível

`offlineState` (`services/hub/index.ts`) é um estado observável que sinaliza quando a última chamada caiu em `ApiUnavailableError` — usado para mostrar um aviso de "sem conexão com o servidor" na interface, além do tratamento pontual de cada `catch`.
