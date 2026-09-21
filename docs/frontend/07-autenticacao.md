# Autenticação (Frontend)

## `auth-context.tsx` (`useAuth()`)

Provider real de sessão, montado no root (`__root.tsx`). Expõe:

- `authed: boolean`, `ready: boolean` (evita "flash" de conteúdo antes da sessão carregar do `localStorage`), `usuario: SessionUser | null`.
- `login(email, senha)` → `POST /auth/login`; em sucesso, `session.set(accessToken, usuario)`.
- `logout()` → `session.clear()`.
- `requestPasswordReset(email)` → `POST /auth/esqueci-senha`.
- `resetPassword(token, novaSenha)` → `POST /auth/redefinir-senha`.

## Sessão (`services/hub/session.ts`)

Token e usuário persistidos em `localStorage`. Restaurados na montagem do provider (`session.restore()`). Não há renovação automática — quando o JWT expira (8h, definido no backend), a próxima chamada à API retorna 401, o `client.ts` limpa a sessão, e a UI reage (rota protegida redireciona para `/login`).

## Proteção de rota

Feita em `AppShell` (`app-shell.tsx`), não por rota individual: se `ready && !authed`, redireciona para `/login`. Toda rota que usa `AppShell` fica protegida por igual — não há guard rota a rota como no backend. As únicas rotas fora desse guard são `login.tsx` e `redefinir-senha.tsx`.

## Tela de login (`login.tsx`)

Formulário de e-mail/senha chamando `login()`; distingue erro de credencial (`ApiError` com `status === 401`) de backend fora do ar (`ApiUnavailableError`), com mensagem diferente para cada caso. A mesma tela tem um segundo formulário (alternado por estado local, não é outra rota) para solicitar redefinição de senha.

## Tela de redefinição de senha (`redefinir-senha.tsx`)

Rota pública, lê o `token` da query string (`?token=...`), formulário de nova senha + confirmação, chama `resetPassword(token, novaSenha)`. Trata `ApiError` (token inválido/expirado) mostrando a mensagem vinda do backend.

## Segunda sessão, paralela e independente: Rooster Boost Portal

Tudo acima é a sessão do **Hub**. O portal público do Boost (`/boost-portal/*`, alunos externos sem conta no Hub) tem uma sessão **completamente separada**, que nunca importa nada do Hub e nunca é vista pelo `AppShell`/`RequireAccess` do Hub:

| | Hub | Boost Portal |
|---|---|---|
| Provider | `auth-context.tsx` (`useAuth()`) | `services/boost-portal/auth-context.tsx` (`useBoostAuth()`) |
| Sessão/storage | `services/hub/session.ts` | `services/boost-portal/session.ts` |
| Chaves de `localStorage` | próprias do Hub | `rooster.boost.session.token` / `rooster.boost.session.usuario` — deliberadamente diferentes, pra nunca colidir com as do Hub mesmo com as duas sessões abertas na mesma aba |
| Login | `POST /auth/login` | `POST /boost/login` |
| Cadastro | não existe (usuário é criado pelo Hub) | `POST /boost/cadastro`, público |
| Claim do JWT | sem `tipo` (ou implícito Hub) | `tipo: 'boost'` — o backend rejeita esse token em qualquer rota do Hub, e vice-versa (ver `docs/security/03-rbac.md` no backend) |
| Cliente HTTP | `services/hub/client.ts` (`request`/`ApiError`/`ApiUnavailableError`) | `services/boost-portal/client.ts` (`request`/`BoostApiError`/`BoostApiUnavailableError`) — implementação espelhada, mas um cliente nunca chama o outro |
| Proteção de rota | `AppShell` redireciona pra `/login` | Layout próprio (`boost-portal.tsx`), fora do `AppShell` — cada rota que exige login decide localmente com `useBoostAuth().authed` |

Não existe nenhum ponto de acoplamento entre as duas sessões no frontend — um usuário pode estar logado no Hub e no Boost Portal ao mesmo tempo, no mesmo navegador, sem um afetar o outro. O único lugar do sistema onde os dois tipos de token se encontram é o WebSocket do chat de curso (`BoostChatGateway`, backend), que aceita ambos no handshake.
