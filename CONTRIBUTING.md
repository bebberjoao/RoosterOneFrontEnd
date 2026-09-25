# Contribuindo — Rooster One (frontend)

Porta de entrada prática. O processo completo é comum aos dois repositórios e está em [`docs/engineering/12-processo-de-desenvolvimento.md`](../RoosterOneBackend-main/docs/engineering/12-processo-de-desenvolvimento.md), no repositório do backend.

## Preparar o ambiente

```bash
npm install
npm run dev                   # Vite escolhe a porta a partir de 8080
git config commit.template .gitmessage
```

Crie um `.env` apontando para o backend:

```
VITE_API_URL=http://localhost:3000
```

Sem a variável, o cliente assume `http://localhost:3000`. Com o backend fora do ar, a interface cai num **modo offline** com dado em memória e exibe um aviso — isso é comportamento deliberado do cliente HTTP, não falha de configuração.

## Ciclo de uma mudança

1. **Entender antes de mudar.** `docs/frontend/` descreve a aplicação como ela é de fato.
2. **Mudar o código.**
3. **Atualizar a documentação impactada no mesmo commit.** Não é opcional.
4. **Verificar:**
   ```bash
   npx tsc --noEmit
   npm run build
   ```
5. **Commitar** no padrão Conventional Commits.

## Commit

```
<tipo>(<escopo>): <assunto no imperativo, minusculo, sem acento, ate 72 caracteres>

<corpo: o porque da mudanca>
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`, `build`, `ci`.
Escopos: `hub`, `desk`, `rooms`, `assets`, `academy`, `learn`, `student`, `finance`, `boost`, `auth`, `ui`, `deps`.

Assunto **sem acento** (convenção do histórico); corpo pode ter acento normalmente.

## Armadilhas conhecidas deste código

Cada item abaixo já causou um defeito real aqui.

- **O perfil (`useRole`) nunca decide o que buscar da API.** Existem três camadas: a permissão real da sessão (`useCan`/`useCanAccess`, única com valor de segurança), o perfil de interface deduzido dessas permissões (`useRole`, só agrupa menu e botões — não há mais seletor manual de "Visão") e os `permissions.ts` por módulo. Cinco telas já usaram o perfil para decidir o que buscar — resultado: 403 do backend quando o perfil não refletia a permissão real.
- **A interface nunca é fronteira de segurança.** Esconder botão é experiência de uso; o backend revalida tudo.
- **Antes de apagar algo por "não ter importador", busque também o import relativo** (`./mock-data`), não só o caminho absoluto. Duas remoções quase quebraram o build por causa disso.
- **Regra de negócio não se replica aqui.** Conflito de horário, capacidade, permissão — envie e trate o erro que a API retornar. Duplicar a regra cria duas fontes de verdade.
- **`services/mock-api/` é nome histórico.** Todos os 9 serviços falam com a API real; nenhum lê dado mockado em runtime.
- Sua mudança invalidou alguma afirmação de ausência na documentação ("ainda é mock", "não tem backend")? É o erro de documentação mais frequente do projeto.

## Padrões de interface

- Estado de carregamento usa esqueleto (`LoadingBlock`/`LoadingCards`), nunca texto "Carregando…".
- Lista vazia usa `EmptyState`, nunca tabela vazia sem explicação.
- Operação de escrita emite toast (`sonner`) de sucesso ou erro.
- Importe componentes compartilhados pelo barril `@/components/shared`, não pelo caminho completo.
- Diálogo e gaveta precisam de rótulo associado e armadilha de foco (já resolvido pelos componentes de `shared/overlays.tsx`).

## Testes

**Não há framework de teste instalado neste repositório** — é a maior lacuna de qualidade do projeto (risco R-06). A rede de segurança atual é `tsc --noEmit` mais o build de produção, que pegam erro de tipo e de importação, mas não erro de comportamento. Toda verificação de interface é manual.

## Onde fica o quê

| Assunto | Documento |
|---|---|
| Arquitetura do frontend | `docs/frontend/01-arquitetura.md` |
| Estrutura de pastas | `docs/frontend/02-estrutura.md` |
| Rotas e telas | `docs/frontend/03-paginas-e-rotas.md` |
| As três camadas de autorização | `docs/frontend/08-autorizacao.md` |
| Integração com a API | `docs/frontend/06-integracao-api.md` |
| Processo, governança e riscos | `docs/engineering/` no repositório do backend |
