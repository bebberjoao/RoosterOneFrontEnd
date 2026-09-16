# Rooster Hub — tabelas (lista simples)

Versão resumida de [hub.md](./hub.md), em formato `campo tipo`, para uso direto
na criação das entidades do backend (Prisma/NestJS). Tipos aqui são tipos de
aplicação (TS), não SQL. Tipos TS de referência: `src/services/hub/types.ts`.
Consumo de API centralizado em `src/services/hub/index.ts` (+ `client.ts`).

---

## usuarios

```
id            string      (uuid, PK)
nome          string
email         string      (único)
senhaHash     string?
cpf           string?     (único quando informado)
telefone      string?
ativo         boolean     (default true)
ultimoLogin   datetime?
criadoEm      datetime
atualizadoEm  datetime
```

## setores

```
id          string    (uuid, PK)
nome        string    (único)
descricao   string?
ativo       boolean   (default true)
criadoEm    datetime
```

## modulos

```
id          string    (uuid, PK)
nome        string    (único)
rota        string?
icone       string?
ativo       boolean   (default true)
criadoEm    datetime
```

## permissoes

```
id          string    (uuid, PK)
moduloId    string?   (FK -> modulos.id, set null)
nome        string    (único, ex.: "usuarios.criar")
descricao   string?
recurso     string?
acao        string?   ('read'|'create'|'update'|'delete'|'manage')
criadoEm    datetime
```

## usuarios_setores

```
id          string    (uuid, PK)
usuarioId   string    (FK -> usuarios.id, cascade)
setorId     string    (FK -> setores.id, cascade)
criadoEm    datetime
```
Único: `(usuarioId, setorId)`. Relação N:N preservada; gerenciada apenas na tela `/hub/setores`.

## notificacoes

```
id          string    (uuid, PK)
usuarioId   string?   (FK -> usuarios.id, cascade; null = broadcast)
titulo      string?
mensagem    string?
lida        boolean   (default false)
criadoEm    datetime
```

## sessoes

```
id             string   (uuid, PK)
usuarioId      string?  (FK -> usuarios.id, cascade)
refreshToken   string?  (hash)
ip             string?
navegador      string?
expiraEm       datetime?
revogada       boolean  (default false)
criadoEm       datetime
```

## logs_auditoria

```
id            string   (uuid, PK)
usuarioId     string?  (FK -> usuarios.id, set null)
modulo        string?
acao          string?
entidade      string?
entidadeId    string?
ip            string?
navegador     string?
criadoEm      datetime
```

## usuarios_permissoes

```
id            string   (uuid, PK)
usuarioId     string   (FK -> usuarios.id, cascade)
permissaoId   string   (FK -> permissoes.id, cascade)
criadoEm      datetime
```

Único: `(usuarioId, permissaoId)`.

Permissão concedida diretamente a um usuário pela tela `/hub/acessos`. O campo
`permissoes.nome` guarda a chave canônica `modulo.tela.acao`
(ex.: `rooms.rooms-manage.aprovar`), definida em
`src/components/rooster/hub/permission-catalog.ts`.


---

## Removidas (remoção de perfis)

`perfis`, `usuarios_perfis` e `perfis_permissoes` foram retiradas do modelo.
A autorização é exclusivamente `usuarios_permissoes` + `permissoes`.
Ver `alteracoes/remocao-perfis-setores/README.md`.
