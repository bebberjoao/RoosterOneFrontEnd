# Integração com o backend (NestJS + Prisma + PostgreSQL)

## Estado atual

Hub, Desk, Rooms e Assets estão ligados ao backend real: login via
`POST /auth/login`, JWT enviado em toda chamada (`src/services/hub/client.ts`),
RBAC checado no servidor (não só escondido na UI). Academy, Learn, Finance,
Boost e Student continuam em `src/services/mock-api/*` sobre
`src/mock/database/*` — o backend não tem tabelas nem endpoints para eles
ainda (ver `docs/modulos-backend.md`).

## 1. Configuração

`VITE_API_URL` define a base da API (padrão `http://localhost:3000`, sem
prefixo `/api`). Sem o backend disponível, o Hub cai automaticamente para o
seed em memória (`src/services/hub/seed.ts`) e mostra o aviso de "modo
offline" — mas só em falha de rede; um 401/403 é erro de verdade, não
offline (ver `ApiUnavailableError` vs `ApiError` em `client.ts`).

## 2. Autenticação

`src/services/hub/session.ts` guarda o token JWT retornado pelo login
(persistido em `localStorage` só para sobreviver a um F5). Todo `request()`
de `client.ts` anexa `Authorization: Bearer <token>`; um `401` limpa a sessão
automaticamente (`session.clear()`), refletindo em toda tela via
`auth-context.tsx`.

## 3. Assinatura padrão dos serviços

Todo serviço em `src/services/mock-api/` expõe a mesma superfície,
independente de estar em mock ou já ligado ao backend:

```ts
getAll(filters?: Partial<Record<keyof T, unknown>>): Promise<T[]>
getById(id: string): Promise<T | undefined>
create(dto: Omit<T, "id">): Promise<T>
update(id: string, dto: Partial<T>): Promise<T>
remove(id: string): Promise<void>
```

As telas não sabem (nem precisam saber) se estão falando com o backend real
ou com o mock.

## 4. Tradução de campos (PT ↔ EN)

Os tipos de tela nasceram em inglês/camelCase (`Asset`, `Room`,
`Reservation`, `Ticket`...); o backend usa DTOs em português. A tradução
acontece **na fronteira do serviço**, nunca na UI, via `mapResource()`
(`src/services/hub/mapped-resource.ts`) — um wrapper genérico sobre
`createResource` que recebe `toFront`/`toBack` e devolve o mesmo
`HubResource<T>` de sempre. Ver `asset.service.ts` e `room.service.ts` para
exemplos diretos; `ticket.service.ts` faz a tradução manualmente (o modelo
do Desk diverge mais do backend — ver seção 6).

## 5. Modo offline (padrão do Hub)

`src/services/hub/index.ts` implementa `withFallback`: tenta o endpoint real
e, em caso de `ApiUnavailableError` (falha de rede), cai para o seed em
memória e sinaliza `offlineState` (a UI exibe um banner). `mapResource` herda
esse comportamento automaticamente, porque só embrulha `createResource`.

## 6. Limitações conhecidas (backend não tem tabela para isso)

- **Rooms**: conversa da reserva (mensagens), motivo de cancelamento e quem
  decidiu não têm tabela no backend — só o `status`/`data`/`horário` atual.
  Essas informações ficam só no navegador (documentado no topo de
  `room.service.ts`); o que muda de verdade a disponibilidade da sala
  (status, data, horário) vai para a API real.
- **Desk**: o chamado no backend é relacional (usuário/técnico por id,
  categoria/subcategoria/prioridade/status por FK); o mock guardava tudo
  embutido (timeline única de eventos). A conversa é real
  (`/chamados/:id/mensagens`); mudanças de status/prioridade/categoria não
  viram uma linha do tempo ao vir do servidor. SLA é calculado no cliente a
  partir de `categoria.slaHoras` + `criadoEm` (documentado no topo de
  `ticket.service.ts`).
- **Desk**: atribuir atendente a uma subcategoria resolve o nome do atendente
  contra `/chamados-atendentes` (usuários reais) — funciona, mas depende de
  nomes não colidirem entre si; não há seletor de usuário por id na tela.
- **Rooms/Desk**: "Transferir chamado" e "gerar períodos" de uma sala não
  têm UI ligada a nenhum endpoint ainda.

## 7. Checklist por módulo

| Módulo | Endpoint existe | Serviço migrado | Erros tratados | Tabela mock removida |
| --- | --- | --- | --- | --- |
| Hub | ✅ | ✅ | ✅ | seed continua como fallback offline (não removida — é o modo offline) |
| Desk | ✅ | ✅ | ✅ | não |
| Rooms | ✅ | ✅ | ✅ | não |
| Assets | ✅ | ✅ | ✅ | não |
| Academy, Learn, Finance, Boost, Student | ❌ | — | — | — |

As tabelas mock de Hub/Desk/Rooms/Assets em `src/mock/database/` **não**
foram removidas de propósito — são o dado inicial (`initial`) do
`createResource`, usado como fallback quando a API está fora do ar. Só
remova depois de decidir abrir mão desse fallback.
