# Rooster Hub

## Objetivo do módulo

O Rooster Hub é o núcleo de identidade e acesso da plataforma Rooster One. Concentra o cadastro de usuários, setores institucionais, módulos contratados, permissões, sessões ativas e a trilha de auditoria de todo o ecossistema. Serve como base para os demais módulos (por exemplo, Rooster Desk) no que diz respeito a autenticação, autorização e rastreabilidade de ações.

Todas as telas consomem a camada de serviços `src/services/hub/*`, que fala com a API real do backend NestJS (via `VITE_API_URL`) e cai automaticamente para dados locais de demonstração (`seed.ts`) quando a API está indisponível — nesse caso a UI exibe um aviso de "modo offline" (`OfflineBanner`).

## Rotas

Arquivo de layout: `src/routes/hub.tsx` — define a rota `/hub` e envolve as subrotas com `AppShell` (menu/navegação geral da aplicação) via `<Outlet />`.

| Rota | Arquivo | Componente | Descrição |
|---|---|---|---|
| `/hub` | `src/routes/hub.index.tsx` | `HubDashboard` | Painel geral com indicadores, atalhos e atividade recente. |
| `/hub/usuarios` | `src/routes/hub.usuarios.tsx` | `UsuariosPage` | Cadastro de usuários (somente dados próprios da conta). |
| `/hub/setores` | `src/routes/hub.setores.tsx` | `SetoresPage` | Cadastro de setores e gestão dos usuários de cada setor. |
| `/hub/acessos` | `src/routes/hub.acessos.tsx` | `AcessosPage` | Permissões individuais por usuário e catálogo de permissões. |
| `/hub/modulos` | `src/routes/hub.modulos.tsx` | `ModulosPage` | Módulos contratados e catálogo de permissões. |
| `/hub/auditoria` | `src/routes/hub.auditoria.tsx` | `AuditoriaPage` | Sessões ativas, notificações e logs de auditoria. |

## Telas

### `/hub` — Painel do Rooster Hub (`HubDashboard`)

Carrega todos os recursos do Hub via `useResource` (usuários, setores, módulos, permissões, sessões, logs de auditoria, notificações) e apresenta:
- Cartões de estatísticas (`StatCard`): total de usuários (com ativos), permissões individuais concedidas (com total de permissões catalogadas), setores (com módulos ativos), sessões ativas (com notificações não lidas).
- Grade de atalhos (`Link`) para as demais telas do módulo (Usuários, Setores, Acessos e permissões).
- "Atividade recente": últimos 6 registros de `logsAuditoriaService`, mostrando avatar/iniciais do usuário, ação (create/update/delete), módulo, entidade e data.
- "Notificações": últimas 5 notificações (`notificacoesService`), com indicação de não lidas, e link para a tela de auditoria.

### `/hub/usuarios` — Usuários (`UsuariosPage`)

Tela única de CRUD (`HubCrud`) sobre `usuariosService`, responsável apenas pelos dados próprios do usuário. Colunas: nome/e-mail (com avatar), CPF formatado, telefone, situação (ativo/inativo), último login. Busca por nome, e-mail ou CPF.

Não existem mais abas de perfil ou de setor nesta tela: o vínculo com setores é feito em `/hub/setores` e as permissões em `/hub/acessos`.

Campos do formulário de usuário: nome (obrigatório, 3-120 caracteres), e-mail (obrigatório, validado), senha (`senhaHash`, obrigatória apenas na criação, mínimo 6 caracteres), CPF (11 dígitos), telefone, ativo (booleano).

### `/hub/acessos` — Acessos e permissões (`AcessosPage`)

Tela única (`UserPermissionsPanel`) — fluxo Usuário → Módulo → Tela →
   Ações. Lista de usuários com busca (nome/e-mail), lista de módulos com contador e
   `ProgressBar` ("x de y permissões"), cartões por tela com contador, expandir/recolher,
   busca por tela, "Marcar módulo"/"Limpar" e `Checkbox` por operação.
   A ação **Acessar** governa a tela: sem ela, as demais ficam desmarcadas e bloqueadas.
   Botões "Salvar permissões" e "Descartar", com indicador de alterações não salvas e
   mensagens de sucesso/erro.
O catálogo de permissões não é editável pela interface: as chaves `modulo.tela.acao` são criadas automaticamente em `permissoesService` conforme o uso.

Catálogo de telas e ações: `src/components/rooster/hub/permission-catalog.ts`
(chave canônica `modulo.tela.acao`). Autorização em tempo real:
`src/components/rooster/hub/permission-context.tsx` (`PermissionProvider`,
`useCanAccess`, `useCan`, `RequireAccess`), aplicada em `app-shell.tsx` (bloqueio de
tela) e `app-sidebar.tsx` (menu). Persistência: `usuariosPermissoesService`
(`/usuarios-permissoes`) — vínculo direto usuário↔permissão, sem perfil intermediário.
Sem permissões próprias cadastradas, vale a matriz padrão de demonstração dos módulos. Detalhes e instruções de importação:
`alteracoes/acessos-e-permissoes/README.md`.

### `/hub/setores` — Setores (`SetoresPage`)

CRUD sobre `setoresService`. Campos: nome (obrigatório, 3-80), descrição, ativo. Coluna "Usuários" mostra a quantidade de vínculos em `usuariosSetoresService`.

**Usuários do setor** (`SetorUsuariosModal`): o ícone de pessoas na linha (ou o próprio contador) abre um `Modal` com busca por nome/e-mail e um `Checkbox` por usuário. O painel mostra "N no setor", sinaliza "Alterações não salvas" e grava em lote via `usuariosSetoresService.create` / `.remove`. O vínculo é N:N (um usuário pode estar em vários setores), como já previa a tabela `usuarios_setores`; a gestão ocorre exclusivamente aqui.

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
- Instâncias exportadas: `usuariosService` (`/usuarios`), `setoresService` (`/setores`), `modulosService` (`/modulos`), `permissoesService` (`/permissoes`), `usuariosSetoresService` (`/usuarios-setores`), `usuariosPermissoesService` (`/usuarios-permissoes`), `notificacoesService` (`/notificacoes`), `sessoesService` (`/sessoes`), `logsAuditoriaService` (`/logs-auditoria`).
- Atalhos: `createUsuarioSetor(usuarioId, setorId)`, `removeUsuarioSetor(vinculoId)`, `createUsuarioPermissao(usuarioId, permissaoId)`.

### `types.ts`

Interfaces espelhando o schema Prisma/DTOs do backend: `Usuario`, `Setor`, `Modulo`, `Permissao`, `UsuarioSetor`, `UsuarioPermissao`, `Notificacao`, `Sessao`, `LogAuditoria`.

### `validation.ts`

Funções de validação de formulário espelhando os DTOs (class-validator) do backend: `len(v, min, max, label)`, `required(v, label)`, `isEmail(v)`, `isCpf(v)`, `isIso(v)`, `firstError(...checks)`.

### `seed.ts`

Dados de demonstração usados como fallback offline para cada recurso (não documentado campo a campo aqui; ver o arquivo para os valores semente).

## Estado

- Estado de dados: cada tela usa `useResource(service)` por recurso, mantendo `rows`/`loading`/`error` em `useState` local, com recarga (`reload`) e mutações otimistas (`create`/`update`/`remove`) que atualizam o array em memória sem novo `list()`.
- Estado de UI dos CRUDs (`HubCrud`): busca (`query`), item em edição (`editing`), modo de criação (`creating`), valores de formulário (`form`), erros de validação (`errors`), estado de salvamento (`saving`), item marcado para exclusão (`toRemove`).
- Estado global simples: `offlineState` (fora do React, padrão observer/`useSyncExternalStore`) sinaliza se o módulo está operando com a API real ou com dados locais.
- Estado de navegação por abas: `useState` de string (`tab`) em `AcessosPage`; estado de setor aberto (`setorAberto`) em `SetoresPage`.

## Tabela de botões e ações

| Botão/Ação | Local | O que faz | Serviço chamado |
|---|---|---|---|
| Atalhos de card (Usuários, Setores, Acessos e permissões) | `/hub` (Painel) | Navega para a subrota correspondente | Nenhum (navegação via `Link`) |
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

Observações:
- O vínculo usuário↔setor é gerenciado em lote pelo modal "Usuários do setor" em `/hub/setores`.
- Na aba "Sessões" a criação é desabilitada (`canCreate={false}`); apenas edição e exclusão.
- Na aba "Auditoria" (logs) criação, edição e exclusão estão todas desabilitadas — tela somente leitura.


## Arquitetura de autorização (após a remoção de perfis)

Anterior: `Usuário → Perfil → Permissões`.
Atual: `Usuário → Setor` (organização) e `Usuário → Permissões individuais` (autorização).

Setor **não** concede permissão: serve apenas para organizar as pessoas por área.
Detalhes, migração de dados e instruções de importação:
`alteracoes/remocao-perfis-setores/README.md`.
