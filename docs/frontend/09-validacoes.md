# Validações (frontend)

## Ausência de `react-hook-form` e `zod`

Nenhuma tela utiliza essas bibliotecas; a única referência a `react-hook-form` e `zodResolver` em `src/` era
`components/ui/form.tsx`, componente base (padrão shadcn) não instanciado por nenhuma tela. Foram removidos em
setembro de 2026 (`react-hook-form`, `zod`, `@hookform/resolvers` e `date-fns` do `package.json`, além de
`components/ui/form.tsx`). Toda validação de formulário é manual.

## Padrão de validação manual: `HubCrud`

`src/components/rooster/hub/crud-panel.tsx`. Cada tela de CRUD declara uma lista de `HubField<T>`:

```ts
{ name: "email", label: "E-mail", type: "email", required: true, validate: isEmail }
```

`validate` é função síncrona `(value: string) => string | undefined`, que devolve a mensagem de erro ou `undefined`
quando o valor é válido. As funções reutilizáveis estão em `services/hub/validation.ts` (`isEmail`, `isCpf` e
`len(min, max, label)`). A validação é executada no envio do formulário (e não a cada tecla), campo a campo, antes da
chamada a `create` ou `update` do serviço.

## Regras de negócio validadas no backend

Regras como conflito de horário de reserva, capacidade do ambiente e permissão sobre recurso **não são verificadas
antes do envio**: o frontend envia a requisição e trata o erro devolvido pela API (`ApiError` com a mensagem do
backend). Não há duplicação de regra de negócio no cliente.

## Formulários fora do `HubCrud`

Telas específicas (por exemplo, `rooms.book.tsx`, formulário de reserva) realizam validação própria com `useState` por
campo e verificações condicionais no componente (`invalidTime`, `overCapacity` e `invalidRepeatUntil`, calculados a
cada renderização a partir do estado do formulário), sem função compartilhada.

As telas de Academy (gestão), Learn e Student seguem o mesmo padrão manual, com verificação apenas no momento de
salvar e sem `HubCrud`:

- **Alunos e professores (`academy.manage.tsx`)**: `students-tab.tsx` e `teachers-tab.tsx` exigem, no cadastro,
  `usuarioId` preenchido (usuário do Hub selecionado no `UserPicker`; ver `04-componentes.md`) e, para alunos, RA
  (`ra.trim()`) e curso (`courseId`). A verificação consiste em uma única condição antes da chamada a
  `academyService.createStudent` ou `createTeacher`, com mensagem de erro geral ("Selecione um usuário, informe o RA e
  o curso."), e não por campo.
- **Cadastro de atividade (`learn.classes.tsx` e `learn.activities.$id.tsx`)**: exige apenas título não vazio
  (`title.trim()`); os demais campos (peso, nota máxima e prazo) possuem valor padrão.
- **Entrega de atividade pelo aluno (`AnswerModal`, em `learn/submission-modals.tsx`)**: na atividade sem questões,
  não há validação no cliente que exija texto ou anexo; o backend aceita `texto` opcional (`EnviarEntregaDto`), e os
  anexos são enviados em requisições separadas após a criação da entrega. Na atividade com questões, o envio é
  bloqueado enquanto houver questão obrigatória sem resposta (`answerMissing`, em `questions-utils.ts`), com
  destaque das questões e mensagem que as enumera; a verificação equivalente do backend (RN049) permanece a
  autoritativa, exceto para a questão de envio de arquivo, cuja obrigatoriedade é verificada apenas no cliente, por
  ser o arquivo enviado após o registro da entrega.
- **Questão (`QuestionFormModal`, em `learn/questions.tsx`)**: enunciado obrigatório, valor maior que zero e, nas
  objetivas, alternativas com texto e quantidade de corretas conforme o tipo (mesmas regras do backend, RN048);
  imagem de apoio de até 5 MB.
- **Correção por questão (`QuestionGradeForm`)**: exige pontuação entre zero e o valor de cada questão.
- **Correção de entrega (`GradePanel` e `GradeForm`, no Learn)**: exige apenas que `nota` seja número válido
  (verificação `Number.isNaN`); a nota máxima é exibida como indicação ("máx. X"), mas o limite é aplicado pelo
  backend, que recusa valor superior com `400`.
