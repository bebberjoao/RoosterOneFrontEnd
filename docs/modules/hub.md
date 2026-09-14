# Rooster Hub

## Objetivo do módulo

O Rooster Hub é o núcleo de identidade e acesso da plataforma Rooster One. Concentra o cadastro de usuários, perfis de acesso, setores institucionais, módulos contratados, permissões, sessões ativas e a trilha de auditoria de todo o ecossistema. Serve como base para os demais módulos (por exemplo, Rooster Desk) no que diz respeito a autenticação, autorização e rastreabilidade de ações.

Todas as telas consomem a camada de serviços `src/services/hub/*`, que fala com a API real do backend NestJS (via `VITE_API_URL`) e cai automaticamente para dados locais de demonstração (`seed.ts`) quando a API está indisponível — nesse caso a UI exibe um aviso de "modo offline" (`OfflineBanner`).

## Rotas

Arquivo de layout: `src/routes/hub.tsx` — define a rota `/hub` e envolve as subrotas com `AppShell` (menu/navegação geral da aplicação) via `<Outlet />`.

| Rota | Arquivo | Componente | Descrição |
|---|---|---|---|
| `/hub` | `src/routes/hub.index.tsx` | `HubDashboard` | Painel geral com indicadores, atalhos e atividade recente. |
| `/hub/usuarios` | `src/routes/hub.usuarios.tsx` | `UsuariosPage` | Cadastro de usuários e vínculos com perfis e setores. |
| `/hub/perfis` | `src/routes/hub.perfis.tsx` | `PerfisPage` | Perfis de acesso e matriz de permissões por perfil. |
| `/hub/setores` | `src/routes/hub.setores.tsx` | `SetoresPage` | Cadastro de setores institucionais. |
| `/hub/modulos` | `src/routes/hub.modulos.tsx` | `ModulosPage` | Módulos contratados e catálogo de permissões. |
| `/hub/auditoria` | `src/routes/hub.auditoria.tsx` | `AuditoriaPage` | Sessões ativas, notificações e logs de auditoria. |

## Telas

### `/hub` — Painel do Rooster Hub (`HubDashboard`)

Carrega todos os recursos do Hub via `useResource` (usuários, perfis, setores, módulos, permissões, sessões, logs de auditoria, notificações) e apresenta:
- Cartões de estatísticas (`StatCard`): total de usuários (com ativos), perfis de acesso (com total de permissões), setores (com módulos ativos), sessões ativas (com notificações não lidas).
- Grade de atalhos (`Link`) para as demais telas do módulo (Usuários, Perfis e permissões, Setores, Módulos, Sessões e auditoria).
- "Atividade recente": últimos 6 registros de `logsAuditoriaService`, mostrando avatar/iniciais do usuário, ação (create/update/delete), módulo, entidade e data.
- "Notificações": últimas 5 notificações (`notificacoesService`), com indicação de não lidas, e link para a tela de auditoria.

### `/hub/usuarios` — Usuários (`UsuariosPage`)

Três abas (`TabBar`):
1. **Usuários** — CRUD completo (`HubCrud`) sobre `usuariosService`. Colunas: nome/e-mail (com avatar), CPF formatado, telefone, situação (ativo/inativo), último login. Busca por nome, e-mail ou CPF.
2. **Perfis por usuário** — CRUD (sem edição) sobre `usuariosPerfisService`, vínculo usuário↔perfil.
3. **Setores por usuário** — CRUD (sem edição) sobre `usuariosSetoresService`, vínculo usuário↔setor.

Campos do formulário de usuário: nome (obrigatório, 3-120 caracteres), e-mail (obrigatório, validado), senha (`senhaHash`, obrigatória apenas na criação, mínimo 6 caracteres), CPF (11 dígitos), telefone, ativo (booleano).

### `/hub/perfis` — Perfis de acesso (`PerfisPage`)

Duas abas:
1. **Perfis** — CRUD sobre `perfisService`. Campos: nome (obrigatório, 3-80), descrição, ativo. Coluna mostra quantidade de permissões vinculadas (via `perfisPermissoesService`).
2. **Permissões por perfil** — CRUD (sem edição) sobre `perfisPermissoesService`, vínculo perfil↔permissão.

### `/hub/setores` — Setores (`SetoresPage`)

CRUD único sobre `setoresService`. Campos: nome (obrigatório, 3-80), descrição, ativo. Coluna "Usuários" mostra quantidade de vínculos em `usuariosSetoresService`.

### `/hub/modulos` — Módulos e permissões (`ModulosPage`)

Duas abas:
1. **Módulos** — CRUD sobre `modulosService`. Campos: nome (obrigatório, 3-80), rota (ex.: `/desk`), ícone (nome lucide-react), ativo. Coluna mostra quantidade de permissões do módulo.
2. **Permissões** — CRUD sobre `permissoesService`. Campos: nome (obrigatório, padrão `recurso.acao`), módulo (select), recurso, ação, descrição.

### `/hub/auditoria` — Sessões e auditoria (`AuditoriaPage`)

Três abas:
1. **Sessões** — CRUD (sem criação) sobre `sessoesService`. Campos editáveis: usuário, IP, navegador, data de expiração (ISO), revogada. Coluna "Situação" calcula Ativa/Expirada/Revogada.
2. **Notificações** — CRUD sobre `notificacoesService`. Campos: usuário (opcional, vazio = todos), título (obrigatório, 3-120), mensagem (obrigatória), lida.
3. **Auditoria** — Listagem somente leitura (sem criar/editar/excluir) de `logsAuditoriaService`, paginada em 15 itens, com colunas data, usuário, módulo, ação, entidade, IP.

## Componentes

- `src/components/rooster/hub/crud-panel.tsx`
  - `HubField<T>` — descreve um campo de formulário (`name`, `label`, `type`, `required`, `options`, `hint`, `createOnly`, `validate`).
  - `OfflineBanner()` — exibe aviso quando a API do Hub está indisponível (usa `useApiOffline`).
  - `HubCrud<T>(props)` — componente genérico de CRUD: toolbar de busca, botão Atualizar, botão Novo (opcional), tabela (`DataTable`) com colunas customizadas mais coluna de ações (editar/excluir), modal de criação/edição (`Modal`) com campos gerados a partir de `HubField[]`, e diálogo de confirmação de exclusão (`ConfirmDialog`). Suporta `canCreate`, `canEdit`, `canDelete`, `pageSize`, `emptyMessage`, `rowExtra`.
- `src/components/rooster/hub/use-hub.ts`
  - `useApiOffline()` — hook que assina `offlineState` e retorna se a última chamada usou fallback local.
  - `useResource<T>(service: HubResource<T>)` — hook que carrega `list()` no mount e expõe `{ rows, loading, error, reload, create, update, remove }`, atualizando o estado local otimisticamente após cada operação.
- `src/components/rooster/hub/format.ts` — utilitários de formatação: `fmtDate`, `fmtDateTime`, `fmtCpf`, `initials`.

## Serviços (`src/services/hub/`)

### `client.ts`
- `API_URL` — lido de `VITE_API_URL`, padrão `http://localhost:3000`.
- `ApiUnavailableError` — erro de rede/conexão (dispara fallback offline).
- `ApiError` — erro de resposta HTTP não-ok (com `status` e mensagem da API).
- `request<T>(path, init?: { method?, body?, signal? }): Promise<T>` — wrapper de `fetch` que serializa/desserializa JSON e lança os erros acima.

### `index.ts`
- `HubResource<T>` — contrato `{ path, list(), get(id), create(dto), update(id, dto), remove(id) }`.
- `offlineState` — store observável (`offline: boolean`, `subscribe(listener)`, `set(v)`) que sinaliza modo offline à UI.
- `createResource<T>(path, prefix, initial)` — fábrica de recursos: tenta a chamada real via `request`; em caso de `ApiUnavailableError`, ativa `offlineState` e opera sobre uma cópia local em memória seedada por `seed.ts`.
- Instâncias exportadas: `usuariosService` (`/usuarios`), `setoresService` (`/setores`), `perfisService` (`/perfis`), `modulosService` (`/modulos`), `permissoesService` (`/permissoes`), `usuariosPerfisService` (`/usuarios-perfis`), `usuariosSetoresService` (`/usuarios-setores`), `perfisPermissoesService` (`/perfis-permissoes`), `notificacoesService` (`/notificacoes`), `sessoesService` (`/sessoes`), `logsAuditoriaService` (`/logs-auditoria`).
- Atalhos: `createUsuarioPerfil(usuarioId, perfilId)`, `createUsuarioSetor(usuarioId, setorId)`, `createPerfilPermissao(perfilId, permissaoId)`.

### `types.ts`

Interfaces espelhando o schema Prisma/DTOs do backend: `Usuario`, `Setor`, `Perfil`, `Modulo`, `Permissao`, `UsuarioPerfil`, `UsuarioSetor`, `PerfilPermissao`, `Notificacao`, `Sessao`, `LogAuditoria`.

### `validation.ts`

Funções de validação de formulário espelhando os DTOs (class-validator) do backend: `len(v, min, max, label)`, `required(v, label)`, `isEmail(v)`, `isCpf(v)`, `isIso(v)`, `firstError(...checks)`.

### `seed.ts`

Dados de demonstração usados como fallback offline para cada recurso (não documentado campo a campo aqui; ver o arquivo para os valores semente).

## Estado

- Estado de dados: cada tela usa `useResource(service)` por recurso, mantendo `rows`/`loading`/`error` em `useState` local, com recarga (`reload`) e mutações otimistas (`create`/`update`/`remove`) que atualizam o array em memória sem novo `list()`.
- Estado de UI dos CRUDs (`HubCrud`): busca (`query`), item em edição (`editing`), modo de criação (`creating`), valores de formulário (`form`), erros de validação (`errors`), estado de salvamento (`saving`), item marcado para exclusão (`toRemove`).
- Estado global simples: `offlineState` (fora do React, padrão observer/`useSyncExternalStore`) sinaliza se o módulo está operando com a API real ou com dados locais.
- Estado de navegação por abas: `useState` de string (`tab`) em `AuditoriaPage`, `ModulosPage`, `PerfisPage`, `UsuariosPage`.

## Tabela de botões e ações

| Botão/Ação | Local | O que faz | Serviço chamado |
|---|---|---|---|
| Atalhos de card (Usuários, Perfis e permissões, Setores, Módulos, Sessões e auditoria) | `/hub` (Painel) | Navega para a subrota correspondente | Nenhum (navegação via `Link`) |
| "Ver sessões e auditoria" | `/hub` (Painel, card Notificações) | Navega para `/hub/auditoria` | Nenhum (navegação) |
| "Atualizar" | Toolbar do `HubCrud` (todas as telas de CRUD) | Recarrega a lista do recurso atual | `service.list()` |
| "Novo" | Toolbar do `HubCrud` (quando `canCreate`) | Abre modal de criação em branco | Nenhum até salvar |
| "Salvar" (modal de criação) | Modal do `HubCrud` | Valida campos e cria o registro | `service.create(dto)` |
| "Salvar" (modal de edição) | Modal do `HubCrud` | Valida campos alterados e atualiza o registro | `service.update(id, dto)` |
| "Cancelar" (modal) | Modal do `HubCrud` | Fecha o modal sem salvar | Nenhum |
| Ícone de editar (lápis) | Linha da tabela, `HubCrud` (quando `canEdit`) | Abre modal de edição pré-preenchido com os dados da linha | Nenhum até salvar |
| Ícone de excluir (lixeira) | Linha da tabela, `HubCrud` (quando `canDelete`) | Abre diálogo de confirmação de exclusão | Nenhum até confirmar |
| "Excluir" / confirmação do `ConfirmDialog` | Diálogo de confirmação, `HubCrud` | Remove definitivamente o registro | `service.remove(id)` |
| Campo de busca da toolbar | Todas as telas de CRUD | Filtra as linhas exibidas localmente (client-side) | Nenhum (filtro em memória sobre `rows`) |
| Abas (`TabBar`) | `/hub/usuarios`, `/hub/perfis`, `/hub/modulos`, `/hub/auditoria` | Alterna qual recurso/CRUD é exibido na tela | Nenhum (troca de estado local `tab`) |

Observações:
- Nas telas de vínculo (usuários↔perfis, usuários↔setores, perfis↔permissões) a edição é desabilitada (`canEdit={false}`); apenas criação e exclusão do vínculo estão disponíveis.
- Na aba "Sessões" a criação é desabilitada (`canCreate={false}`); apenas edição e exclusão.
- Na aba "Auditoria" (logs) criação, edição e exclusão estão todas desabilitadas — tela somente leitura.
