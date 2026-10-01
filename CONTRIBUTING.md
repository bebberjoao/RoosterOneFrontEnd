# Contribuição — Rooster One (frontend)

Orientações práticas de contribuição. O processo completo é comum aos dois repositórios e está descrito em
[`docs/engineering/12-processo-de-desenvolvimento.md`](../RoosterOneBackend-main/docs/engineering/12-processo-de-desenvolvimento.md),
no repositório do backend.

## Preparação do ambiente

```bash
npm install
cp .env.example .env          # VITE_API_URL apontando para o backend
npm run dev                   # o Vite seleciona porta a partir de 8080
git config commit.template .gitmessage
```

Conteúdo mínimo do `.env`:

```
VITE_API_URL=http://localhost:3000
```

Na ausência da variável, o cliente adota `http://localhost:3000`. O valor deve conter apenas o endereço do servidor,
sem o prefixo `/v1`, aplicado automaticamente. Com o backend indisponível, a interface exibe aviso de ausência de
conexão, comportamento deliberado do cliente HTTP, e não falha de configuração. Toda variável iniciada por `VITE_` é
incorporada ao pacote distribuído e, portanto, pública.

## Ciclo de uma alteração

1. **Compreensão prévia.** `docs/frontend/` descreve a aplicação vigente.
2. **Alteração do código.**
3. **Atualização da documentação impactada no mesmo commit**, em registro técnico-formal, inclusive do Manual do
   Usuário quando a alteração afetar telas. A etapa é obrigatória.
4. **Verificação:**
   ```bash
   npx tsc --noEmit
   npm test
   npm run build
   ```
5. **Commit** no padrão Conventional Commits.

## Commit

```
<tipo>(<escopo>): <assunto no imperativo, em minusculas, sem acento, ate 72 caracteres>

<corpo: a motivacao da mudanca>
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`, `build` e `ci`.
Escopos: `hub`, `desk`, `rooms`, `assets`, `academy`, `learn`, `student`, `finance`, `boost`, `auth`, `ui` e `deps`.

O assunto é redigido **sem acentuação** (convenção do histórico); o corpo admite acentuação.

## Falhas recorrentes do projeto

Cada item abaixo já originou defeito no projeto.

- **O perfil (`useRole`) não determina quais dados buscar na API.** Há três camadas: a permissão efetiva da sessão
  (`useCan` e `useCanAccess`, a única com valor de segurança na interface), o perfil deduzido dessas permissões
  (`useRole`, que apenas organiza menus e botões) e os arquivos `permissions.ts` por módulo. Cinco telas já utilizaram
  o perfil para decidir a busca de dados, com resposta `403` do backend quando o perfil não correspondia à permissão.
- **A interface não constitui fronteira de segurança.** A ocultação de botões atende à experiência de uso; o backend
  revalida todas as operações.
- **Antes de remover artefato considerado sem importador, deve-se buscar também a importação relativa**
  (`./mock-data`), e não apenas o caminho absoluto. Duas remoções quase comprometeram o build por essa razão.
- **Regras de negócio não são replicadas no frontend.** Conflito de horário, capacidade e permissões são verificados
  pelo backend; a requisição é enviada, e o erro devolvido é tratado. A duplicação criaria duas fontes de verdade.
- **Promessas devem tratar a rejeição.** `.then()` sem `.catch()` produz falha silenciosa (ver
  `docs/frontend/10-tratamento-erros.md`).
- **`services/mock-api/` é denominação histórica.** Os nove serviços comunicam-se com a API, e nenhum utiliza dados
  simulados em execução.
- A alteração pode invalidar afirmação de ausência na documentação ("ainda é simulado", "não tem backend"), que é o
  erro de documentação mais frequente do projeto.

## Padrões de interface

- O estado de carregamento utiliza esqueleto (`LoadingBlock` ou `LoadingCards`), e nunca o texto "Carregando…".
- A lista vazia utiliza `EmptyState`, e nunca tabela vazia sem explicação.
- Operações de escrita emitem aviso (`sonner`) de sucesso ou de erro.
- Os componentes compartilhados são importados por `@/components/shared`, e não pelo caminho completo.
- Diálogos e painéis laterais exigem rótulo associado e retenção de foco (atendidos pelos componentes de
  `shared/overlays.tsx`).
- Datas, horários, números, percentuais e valores monetários são exibidos pelas funções de `src/lib/formatacao.ts`
  (datas em dd/mm/aaaa e vírgula decimal), e nunca por `toLocaleString`, `toFixed` ou `toISOString` diretamente
  (ver `docs/frontend/11-guia-desenvolvedor.md`).

## Testes

```bash
npm test     # Vitest e Testing Library: 81 testes em 7 arquivos
```

A suíte cobre lógica pura, o cliente HTTP, componentes compartilhados e acessibilidade, e é executada pelo pipeline de
integração contínua. Não há teste de jornada completa em navegador (Playwright ou Cypress); a verificação das telas
permanece manual, com o backend em execução (risco R-06 em `docs/engineering/13-governanca.md`, no repositório do
backend).

## Localização dos assuntos

| Assunto | Documento |
|---|---|
| Arquitetura do frontend | `docs/frontend/01-arquitetura.md` |
| Estrutura de diretórios | `docs/frontend/02-estrutura.md` |
| Rotas e telas | `docs/frontend/03-paginas-e-rotas.md` |
| Camadas de autorização | `docs/frontend/08-autorizacao.md` |
| Integração com a API | `docs/frontend/06-integracao-api.md` |
| Processo, governança e riscos | `docs/engineering/`, no repositório do backend |
