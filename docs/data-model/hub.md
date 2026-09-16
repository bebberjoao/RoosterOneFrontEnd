# Modelo de dados — Rooster Hub

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O Rooster Hub é o módulo de **identidade e controle de acesso** da
plataforma: cadastra usuários, setores, módulos do sistema,
permissões e as associações entre eles (RBAC), além de registrar
notificações, sessões de login e trilha de auditoria.

Diferente dos demais módulos mockados em `src/mock/database`, o Hub já possui
uma camada de serviço própria (`src/services/hub`) preparada para consumir a
API NestJS real via `request()` (`src/services/hub/client.ts`), com
`seed.ts` servindo apenas de dado de fallback quando a API está indisponível
(`offlineState`). É a origem de verdade de `usuarios` e `setores` consumidos
por outros módulos (Rooms, Assets, Desk, etc.).

## 2. Diagrama de relacionamentos

```text
┌───────────┐        ┌────────────┐        ┌───────────┐
│  modulos  │        │  usuarios  │        │  setores  │
└─────┬─────┘        └──────┬─────┘        └─────┬─────┘
      │ 1:N                 │ N:M               │ N:M
      ▼                     ▼                     ▼
┌────────────┐   ┌──────────────────────┐  ┌──────────────────────┐
│ permissoes │   │ usuarios_permissoes  │  │  usuarios_setores    │
└─────┬──────┘   │ usuarioId, permId    │  │ usuarioId, setorId   │
      │ N:M      └──────────────────────┘  └──────────────────────┘
      └──────────────────▲
                 (autorização direta usuário → permissão)

usuarios ──1:N──▶ notificacoes
usuarios ──1:N──▶ sessoes
usuarios ──1:N──▶ logs_auditoria
```

## 3. Tabelas

Tipos TS de referência: `src/services/hub/types.ts`. Seed de fallback:
`src/services/hub/seed.ts`.

### 3.1 `usuarios` — tipo TS `Usuario`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `nome` | text | não | — | Nome completo |
| `email` | text | não | — | E-mail (UNIQUE) |
| `senha_hash` | text | sim | — | Hash da senha |
| `cpf` | text | sim | — | CPF (UNIQUE quando informado) |
| `telefone` | text | sim | — | Telefone de contato |
| `ativo` | boolean | não | `true` | Usuário ativo |
| `ultimo_login` | timestamptz | sim | — | Último login |
| `criado_em` / `atualizado_em` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (email)`; `unique (cpf)` (parcial, `where cpf is not null`).

### 3.2 `setores` — tipo TS `Setor`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `nome` | text | não | — | Nome do setor (UNIQUE) |
| `descricao` | text | sim | — | Descrição |
| `ativo` | boolean | não | `true` | Setor ativo |
| `criado_em` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (nome)`.

### 3.4 `modulos` — tipo TS `Modulo`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `nome` | text | não | — | Nome do módulo (ex.: "Rooster Assets") (UNIQUE) |
| `rota` | text | sim | — | Rota base no frontend |
| `icone` | text | sim | — | Nome do ícone (lucide) |
| `ativo` | boolean | não | `true` | Módulo habilitado |
| `criado_em` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (nome)`.

### 3.5 `permissoes` — tipo TS `Permissao`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `modulo_id` | uuid | sim | — | FK → `modulos(id)` `on delete set null` |
| `nome` | text | não | — | Identificador da permissão (ex.: `usuarios.criar`) (UNIQUE) |
| `descricao` | text | sim | — | Descrição |
| `recurso` | text | sim | — | Recurso alvo (ex.: `usuarios`) |
| `acao` | text | sim | — | Ação (`read`, `create`, `update`, `delete`, `manage`) |
| `criado_em` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (nome)`. Índice: `idx_permissoes_modulo(modulo_id)`.

### 3.7 `usuarios_setores` — tipo TS `UsuarioSetor`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `usuario_id` | uuid | não | — | FK → `usuarios(id)` `on delete cascade` |
| `setor_id` | uuid | não | — | FK → `setores(id)` `on delete cascade` |
| `criado_em` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (usuario_id, setor_id)`.

### 3.9 `notificacoes` — tipo TS `Notificacao`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `usuario_id` | uuid | sim | — | FK → `usuarios(id)` `on delete cascade`; `null` = broadcast |
| `titulo` | text | sim | — | Título |
| `mensagem` | text | sim | — | Corpo da notificação |
| `lida` | boolean | não | `false` | Marcada como lida |
| `criado_em` | timestamptz | não | `now()` | Auditoria |

Índice: `idx_notificacoes_usuario(usuario_id)`.

### 3.10 `sessoes` — tipo TS `Sessao`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `usuario_id` | uuid | sim | — | FK → `usuarios(id)` `on delete cascade` |
| `refresh_token` | text | sim | — | Token de renovação (hash) |
| `ip` | text | sim | — | IP de origem |
| `navegador` | text | sim | — | User-agent resumido |
| `expira_em` | timestamptz | sim | — | Expiração |
| `revogada` | boolean | não | `false` | Sessão revogada |
| `criado_em` | timestamptz | não | `now()` | Auditoria |

Índice: `idx_sessoes_usuario(usuario_id)`.

### 3.11 `logs_auditoria` — tipo TS `LogAuditoria`

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `usuario_id` | uuid | sim | — | FK → `usuarios(id)` `on delete set null` |
| `modulo` | text | sim | — | Nome do módulo de origem |
| `acao` | text | sim | — | Ação executada (`create`, `update`, `delete`, ...) |
| `entidade` | text | sim | — | Nome da entidade afetada |
| `entidade_id` | text | sim | — | Id do registro afetado |
| `ip` | text | sim | — | IP de origem |
| `navegador` | text | sim | — | User-agent resumido |
| `criado_em` | timestamptz | não | `now()` | Auditoria |

Índices: `idx_logs_usuario(usuario_id)`, `idx_logs_entidade(entidade, entidade_id)`.

## 4. Enums

O schema do Hub não usa `enum` do Postgres: `acao` (em `permissoes` e
`logs_auditoria`) é texto livre para permitir novos verbos sem migração, mas
por convenção deve usar os valores:

```text
'read' | 'create' | 'update' | 'delete' | 'manage'
```

## 5. Regras de negócio

1. `email` e `cpf` (quando informado) de `usuarios` são únicos.
2. Um usuário pode pertencer a múltiplos setores (`usuarios_setores`); a UI usa o
   primeiro setor encontrado como setor "principal" (ver `hub-directory.ts`). O
   vínculo é gerenciado exclusivamente na tela `/hub/setores`.
3. Permissões efetivas de um usuário = linhas de `usuarios_permissoes` do próprio
   usuário (chave `modulo.tela.acao` em `permissoes`). Não existe perfil/papel
   intermediário; setor não concede permissão.
4. Excluir um `modulo` não deve remover as `permissoes` associadas
   (`on delete set null`) para preservar o histórico de auditoria.
5. Excluir um `usuario` cascateia nas tabelas de associação
   (`usuarios_setores`, `usuarios_permissoes`).
6. `sessoes.revogada = true` ou `expira_em` no passado invalidam o
   `refresh_token` imediatamente.
7. Toda operação de escrita (`create`/`update`/`remove`) feita por um
   `HubResource` deveria gerar uma linha em `logs_auditoria` no backend real.
8. Enquanto a API estiver indisponível (`ApiUnavailableError`), o frontend
   opera em memória sobre o seed (`offlineState.offline = true`) e a
   persistência não é garantida entre sessões.

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts` e com os
`path` configurados em `src/services/hub/index.ts`.

| Recurso | Base | Operações |
|---|---|---|
| Usuários | `/usuarios` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Setores | `/setores` | idem |
| Módulos | `/modulos` | idem |
| Permissões | `/permissoes` | idem |
| Usuário × Setor | `/usuarios-setores` | `GET`, `POST`, `DELETE /:id` |
| Usuário × Permissão | `/usuarios-permissoes` | `GET`, `POST`, `DELETE /:id` |
| Notificações | `/notificacoes` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Sessões | `/sessoes` | `GET`, `GET /:id`, `DELETE /:id` |
| Logs de auditoria | `/logs-auditoria` | `GET`, `GET /:id` |

## 7. Mapa frontend → banco

| Frontend | Tabela mock (fallback) | Tabela física |
|---|---|---|
| `Usuario` | `src/services/hub/seed.ts` (`seedUsuarios`) | `usuarios` |
| `Setor` | `src/services/hub/seed.ts` (`seedSetores`) | `setores` |
| `Modulo` | `src/services/hub/seed.ts` (`seedModulos`) | `modulos` |
| `Permissao` | `src/services/hub/seed.ts` (`seedPermissoes`) | `permissoes` |
| `UsuarioSetor` | `src/services/hub/seed.ts` (`seedUsuariosSetores`) | `usuarios_setores` |
| `UsuarioPermissao` | `src/services/hub/seed.ts` (`seedUsuariosPermissoes`) | `usuarios_permissoes` |
| `Notificacao` | `src/services/hub/seed.ts` (`seedNotificacoes`) | `notificacoes` |
| `Sessao` | `src/services/hub/seed.ts` (`seedSessoes`) | `sessoes` |
| `LogAuditoria` | `src/services/hub/seed.ts` (`seedLogs`) | `logs_auditoria` |
| `*Service` | `src/services/hub/index.ts` (`createResource`) | consumidor dos endpoints acima |
