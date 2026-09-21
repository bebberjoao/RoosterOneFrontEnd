# Validações (Frontend)

## Sem `react-hook-form`/`zod` em uso real

Ambas as bibliotecas estão instaladas (`package.json`), mas a única referência a `react-hook-form`/`zodResolver` em todo `src/` está em `components/ui/form.tsx` — um componente base (padrão shadcn) que **nenhuma tela do projeto instancia**. Toda validação de formulário real é manual.

## Padrão de validação manual — `HubCrud`

`src/components/rooster/hub/crud-panel.tsx`. Cada tela de CRUD declara um array de `HubField<T>`:

```ts
{ name: "email", label: "E-mail", type: "email", required: true, validate: isEmail }
```

`validate` é uma função síncrona `(value: string) => string | undefined` — retorna a mensagem de erro ou `undefined` se válido. Helpers reutilizáveis em `services/hub/validation.ts` (`isEmail`, `isCpf`, `len(min, max, label)`). A validação roda no submit do formulário (não em tempo real por tecla), campo a campo, antes de chamar `create`/`update` do service.

## Validação de negócio feita no backend, não replicada no frontend

Regras como conflito de horário de reserva, capacidade do ambiente, ou permissão sobre um recurso **não são checadas antes do envio** — o frontend manda a requisição e trata o erro que a API retornar (`ApiError` com a mensagem do backend). Não há duplicação de regra de negócio no cliente.

## Formulários fora do `HubCrud`

Telas mais específicas (ex.: `rooms.book.tsx`, o formulário de reserva) fazem validação própria com `useState` por campo e checagem condicional direta no componente (ex.: `invalidTime`, `overCapacity`, `invalidRepeatUntil` calculados a cada render a partir do estado do formulário), sem um helper compartilhado.

As telas de Academy (gestão), Learn e Student seguem o mesmo padrão manual — checagem só no clique de salvar, sem `HubCrud`:

- **Alunos e Professores (`academy.manage.tsx`)** — `students-tab.tsx`/`teachers-tab.tsx` exigem, no cadastro: `usuarioId` preenchido (ou seja, um usuário do Hub escolhido no `UserPicker` — ver `04-componentes.md`), e para Alunos também RA (`ra.trim()`) e curso (`courseId`) não vazios. A checagem é um `if` único antes de chamar `academyService.createStudent`/`createTeacher`, que seta uma mensagem de erro genérica ("Selecione um usuário, informe o RA e o curso.") em vez de erro por campo.
- **Cadastro de atividade (`learn.classes.tsx`, `learn.activities.$id.tsx`)** — exige apenas título não vazio (`title.trim()`); os demais campos (peso, nota máxima, prazo) têm valor padrão e não bloqueiam o salvamento.
- **Entrega de atividade pelo aluno (`learn.student.tsx`, `AnswerModal`)** — não há validação client-side de "texto ou anexo obrigatório": a tela permite enviar com texto vazio e nenhum anexo (o backend não expõe um DTO que exija um dos dois — `CreateAtividadeDto`/`EnviarEntregaDto` aceitam `texto` opcional; anexos são enviados em requisições separadas após criar a entrega). Não identificado no código analisado: uma regra de "pelo menos um dos dois" — nem no frontend, nem confirmada no backend a partir daqui.
- **Correção de entrega (`GradePanel`/`GradeForm` em Learn)** — exige só que `nota` seja um número válido (`Number.isNaN` check); não há checagem client-side contra `maxGrade` (o campo mostra "máx. X" como dica visual, mas não impede enviar um valor maior).
