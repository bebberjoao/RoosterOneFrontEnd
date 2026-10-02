# Autenticação (frontend)

## `auth-context.tsx` (`useAuth()`)

Provider de sessão, montado na rota raiz (`__root.tsx`). Expõe:

- `authed: boolean`, `ready: boolean` (evita a exibição momentânea de conteúdo antes da restauração da sessão a
  partir do `localStorage`) e `usuario: SessionUser | null`;
- `login(email, senha)`: `POST /auth/login`; em caso de sucesso, grava na sessão o access token, o refresh token, o
  usuário e as permissões efetivas;
- `logout()`: comunica o servidor (`POST /auth/logout`, com o refresh token, sem aguardar a resposta) e executa
  `session.clear()`;
- `requestPasswordReset(email)`: `POST /auth/esqueci-senha`;
- `resetPassword(token, novaSenha)`: `POST /auth/redefinir-senha`.

## Sessão (`services/hub/session.ts`)

Access token, refresh token, usuário e permissões são persistidos em `localStorage` (chaves `rooster.session.token`,
`rooster.session.refresh`, `rooster.session.usuario` e `rooster.session.permissoes`) e restaurados na montagem do
provider (`session.restore()`).

A sessão é **renovada automaticamente**: quando o access token expira (8 horas, definido no backend), a requisição
seguinte recebe `401`, e o cliente HTTP utiliza o refresh token (`POST /auth/refresh`) para obter novo par de tokens e
repetir a requisição; a sessão é descartada apenas quando a renovação é recusada (refresh token revogado ou expirado,
inclusive após troca de senha ou desativação do usuário), e a interface redireciona então para `/login`. O
funcionamento detalhado está em `06-integracao-api.md`.

## Proteção de rota

Realizada no `AppShell` (`app-shell.tsx`), e não em cada rota: se `ready && !authed`, há redirecionamento para
`/login`. Todas as rotas que utilizam o `AppShell` são protegidas da mesma forma; não há guard por rota, como no
backend. Ficam fora dessa proteção `login.tsx`, `redefinir-senha.tsx` e as rotas do portal do Boost, que possuem
sessão própria.

## Tela de login (`login.tsx`)

Formulário de e-mail e senha que invoca `login()`; distingue erro de credencial (`ApiError` com `status === 401`) de
backend indisponível (`ApiUnavailableError`), com mensagem específica para cada caso. A mesma tela possui um segundo
formulário (alternado por estado local, sem rota própria) para a solicitação de redefinição de senha.

## Tela de redefinição de senha (`redefinir-senha.tsx`)

Rota pública que lê o `token` da query string (`?token=...`) e apresenta formulário de nova senha e confirmação,
invocando `resetPassword(token, novaSenha)`. Trata `ApiError` (token inválido ou expirado) com a exibição da mensagem
do backend.

## Segunda sessão, paralela e independente: portal do Rooster Boost

Todo o conteúdo acima refere-se à sessão do **Hub**. O portal do Boost (`/boost-portal/*`, para alunos externos e para
os alunos da instituição) possui sessão **completamente separada**, que não importa nenhum elemento do Hub e não é considerada
pelo `AppShell` nem pelo `RequireAccess`:

| | Hub | Portal do Boost |
|---|---|---|
| Provider | `auth-context.tsx` (`useAuth()`) | `services/boost-portal/auth-context.tsx` (`useBoostAuth()`) |
| Sessão e armazenamento | `services/hub/session.ts` | `services/boost-portal/session.ts` |
| Chaves de `localStorage` | `rooster.session.*` | `rooster.boost.session.token` e `rooster.boost.session.usuario`, distintas por decisão de projeto, para que não haja colisão com as do Hub mesmo com as duas sessões abertas |
| Login | `POST /auth/login` | `POST /boost/login` (conta do portal) ou `POST /boost/login-institucional` (aluno da instituição, com e-mail e senha do Hub; o token devolvido é do portal) |
| Cadastro | inexistente (o usuário é criado no Hub) | `POST /boost/cadastro`, público |
| Recuperação de senha | `POST /auth/esqueci-senha` e `POST /auth/redefinir-senha` (`/redefinir-senha`) | `POST /boost/esqueci-senha` e `POST /boost/redefinir-senha` (`/boost-portal/esqueci-senha` e `/boost-portal/redefinir-senha`), apenas para conta externa |
| Declaração do JWT | sem `tipo` | `tipo: 'boost'`; o backend recusa esse token nas rotas do Hub, e vice-versa (ver `docs/security/03-rbac.md` no repositório do backend) |
| Cliente HTTP | `services/hub/client.ts` (`request`, `ApiError` e `ApiUnavailableError`) | `services/boost-portal/client.ts` (`request`, `BoostApiError` e `BoostApiUnavailableError`), com implementação análoga, sem chamada recíproca |
| Proteção de rota | o `AppShell` redireciona para `/login` | layout próprio (`boost-portal.tsx`), fora do `AppShell`; cada rota que exige login decide localmente com `useBoostAuth().authed` |

Não há ponto de acoplamento entre as duas sessões no frontend: o usuário pode estar autenticado no Hub e no portal do
Boost simultaneamente, no mesmo navegador, sem interferência entre elas. O único ponto do sistema em que os dois tipos
de token se encontram é o WebSocket das conversas do Boost (`BoostChatGateway`, no backend), que aceita ambos no
handshake.
