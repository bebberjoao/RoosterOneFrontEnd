# Modelo de dados — Rooster Finance

Documento de referência do padrão descrito em [README.md](./README.md).

## 1. Visão geral

O módulo controla o **financeiro acadêmico**: catálogo de produtos e serviços
vendáveis, cobranças geradas para alunos (mensalidades, matrícula, taxas,
produtos e serviços), os instrumentos de cobrança (boletos), os documentos
fiscais emitidos (NFS-e/NF-e) e os descontos/bolsas aplicáveis.

Dependências externas: `alunos` (Rooster Academy) para o vínculo de matrícula
e curso do estudante cobrado. Enquanto a integração com o Academy não existe,
o financeiro mantém sua própria tabela mínima de estudantes (`finance_students`).

## 2. Diagrama de relacionamentos

```text
┌───────────────┐        ┌────────────────────┐
│   products    │        │      services       │
└───────────────┘        └────────────────────┘
   (catálogo, sem FK direta para cobranças — venda registrada via `charges.kind`)

┌────────────────────┐
│  finance_students   │───▶ alunos (Academy) [student_id], quando integrado
└──────────┬──────────┘
           │ 1:N
   ┌───────▼────────┐        ┌──────────────┐
   │    charges      │───┐   │  discounts    │ (aplicado por regra de negócio,
   │ (mensalidades e  │   │   │ (bolsas/descontos) sem FK direta — beneficiários
   │  cobranças gerais)│   │   └──────────────┘  contados por relatório)
   └───────┬─────────┘   │
           │ 1:1 (por cobrança)
   ┌───────▼─────────┐   │
   │    payments      │◀──┘ (payments.chargeId → charges.id)
   │  (boletos como    │
   │  instrumento de    │
   │  pagamento)         │
   └───────┬─────────┘
           │ 1:N (opcional, quando pago/prestado)
   ┌───────▼─────────┐
   │      nfes         │───▶ finance_students [student_id]
   └────────────────────┘

payments é hoje um espelho de `boletos` (mock), acrescido de `charge_id`;
em produção `boletos` e `payments` podem ser a mesma tabela física.
```

## 3. Tabelas

### 3.1 `finance_students` — tipo TS `Student` (`src/mock/database/financeStudents.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `student_id` | uuid | sim | — | FK → `alunos(id)` (Academy), quando integrado |
| `name` | text | não | — | Nome do estudante (fallback pré-integração) |
| `email` | text | não | — | E-mail |
| `course` | text | não | — | Curso |
| `klass` | text | não | — | Turma |
| `registration` | text | não | — | Matrícula (UNIQUE) |
| `initials` | text | não | — | Iniciais para avatar |
| `scholarship` | text | sim | — | Descrição textual da bolsa vigente |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (registration)`.

### 3.2 `products` — tipo TS `Product` (`src/mock/database/products.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `code` | text | não | — | Código do produto (UNIQUE) |
| `name` | text | não | — | Nome |
| `category` | text | não | — | Categoria (ver §4 lista sugerida) |
| `description` | text | sim | — | Descrição |
| `price` | numeric(12,2) | não | `0` | Preço unitário |
| `stock` | integer | não | `0` | Estoque atual |
| `min_stock` | integer | não | `0` | Estoque mínimo (gera alerta) |
| `unit` | text | não | `'un'` | Unidade de medida |
| `cover` | text | sim | — | Cor/token de capa |
| `active` | boolean | não | `true` | Produto ativo para venda |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`; `check (price >= 0)`; `check (stock >= 0)`.

### 3.3 `services` — tipo TS `Service` (`src/mock/database/services.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome do serviço |
| `description` | text | sim | — | Descrição |
| `price` | numeric(12,2) | não | `0` | Preço/valor de referência |
| `category` | text | não | — | Categoria (Mensalidade, Matrícula, Taxa, Certificado, Evento, ...) |
| `frequency` | `service_freq` | não | `'unico'` | Periodicidade de cobrança |
| `active` | boolean | não | `true` | Serviço ativo |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `check (price >= 0)`.

### 3.4 `charges` — tipo TS `Tuition`/`Charge` (`src/mock/database/charges.ts`)

Unifica mensalidades (`tuitions`) e cobranças avulsas (`charges`) do mock em
uma única tabela física, com `kind = 'mensalidade'` cobrindo o caso de
mensalidade e as colunas de composição de valor.

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `student_id` | uuid | não | — | FK → `finance_students(id)` `on delete restrict` |
| `description` | text | não | — | Descrição da cobrança |
| `kind` | `charge_kind` | não | `'mensalidade'` | Natureza da cobrança |
| `competence` | text | sim | — | Competência `AAAA-MM` (mensalidades) |
| `installment` | text | sim | — | Parcela, ex.: `3/12` |
| `due_date` | date | não | — | Vencimento |
| `value` | numeric(12,2) | não | — | Valor bruto |
| `discount` | numeric(12,2) | não | `0` | Desconto aplicado |
| `fine` | numeric(12,2) | não | `0` | Multa por atraso |
| `interest` | numeric(12,2) | não | `0` | Juros por atraso |
| `paid` | numeric(12,2) | não | `0` | Valor efetivamente pago |
| `paid_at` | date | sim | — | Data do pagamento |
| `status` | `charge_status` | não | `'aberto'` | Situação da cobrança |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `check (value >= 0)`; `check (due_date is not null)`;
`unique (student_id, competence, installment)` quando `kind = 'mensalidade'`
(constraint parcial).
Índices: `idx_charges_student(student_id)`, `idx_charges_status(status)`,
`idx_charges_due_date(due_date)`.

### 3.5 `payments` — tipo TS `Boleto` (`src/mock/database/boletos.ts`, `src/mock/database/payments.ts`)

Representa o instrumento de cobrança (hoje boleto) vinculado a uma `charge`.

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `charge_id` | uuid | não | — | FK → `charges(id)` `on delete cascade` |
| `student_id` | uuid | não | — | FK → `finance_students(id)` (redundante, desempenho) |
| `code` | text | não | — | Linha digitável (UNIQUE) |
| `our_number` | text | não | — | Nosso número |
| `description` | text | não | — | Descrição |
| `due_date` | date | não | — | Vencimento |
| `value` | numeric(12,2) | não | — | Valor do boleto |
| `status` | `boleto_status` | não | `'emitido'` | Situação do boleto |
| `emitted_at` | date | não | — | Data de emissão |
| `paid_at` | date | sim | — | Data de pagamento |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (code)`; `check (value >= 0)`.
Índices: `idx_payments_charge(charge_id)`, `idx_payments_student(student_id)`,
`idx_payments_status(status)`.

### 3.6 `nfes` — tipo TS `Nfe` (`src/mock/database/nfes.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `number` | text | não | — | Número do documento fiscal (UNIQUE) |
| `type` | `nfe_type` | não | — | Serviço ou produto |
| `student_id` | uuid | não | — | FK → `finance_students(id)` |
| `payment_id` | uuid | sim | — | FK → `payments(id)`, quando emitida a partir de um boleto pago |
| `description` | text | não | — | Descrição |
| `value` | numeric(12,2) | não | — | Valor do documento |
| `issued_at` | date | não | — | Data de emissão |
| `status` | `nfe_status` | não | `'processando'` | Situação junto à prefeitura/SEFAZ |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `unique (number)`; `check (value >= 0)`.

### 3.7 `discounts` — tipo TS `Discount` (`src/mock/database/discounts.ts`)

| Coluna | Tipo SQL | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | uuid | não | `gen_random_uuid()` | PK |
| `name` | text | não | — | Nome da bolsa/desconto |
| `kind` | `discount_kind` | não | — | Tipo |
| `value` | numeric(8,2) | não | — | Valor do benefício |
| `unit` | `discount_unit` | não | — | Percentual ou valor fixo |
| `reason` | text | sim | — | Motivo/justificativa |
| `responsible` | text | não | — | Setor/pessoa responsável |
| `validity` | text | não | — | Período de vigência (texto até migrar p/ `valid_from`/`valid_to`) |
| `active` | boolean | não | `true` | Desconto ativo |
| `beneficiaries` | integer | não | `0` | Nº de beneficiários (cache; recalculável) |
| `created_at` / `updated_at` | timestamptz | não | `now()` | Auditoria |

Constraints: `check (value >= 0)`.

## 4. Enums

```sql
create type service_freq as enum ('unico','mensal','anual','semestral');

create type charge_kind as enum
  ('mensalidade','matricula','taxa','produto','servico','evento');

create type charge_status as enum
  ('pago','aberto','atrasado','cancelado','negociado');

create type boleto_status as enum
  ('emitido','pago','vencido','cancelado','processando');

create type nfe_type as enum ('servico','produto');

create type nfe_status as enum
  ('emitida','cancelada','processando','rejeitada');

create type discount_kind as enum
  ('bolsa-integral','bolsa-parcial','desc-percent','desc-fixo','convenio','promocao');

create type discount_unit as enum ('percent','fixo');
```

Os valores devem permanecer idênticos aos literais TS em
`src/components/rooster/finance/mock-data.ts`.

## 5. Regras de negócio

1. `charges.paid` nunca excede `value - discount + fine + interest`.
2. Ao gerar mensalidade, se `finance_students.scholarship` indicar bolsa, o
   `discount` correspondente deve ser calculado e persistido na cobrança.
3. `status = 'atrasado'` só é atribuído quando `due_date < hoje` e não houve
   pagamento; nesse momento `fine` (2%) e `interest` (1%) são aplicados sobre
   `value - discount`.
4. `status = 'negociado'` suspende a cobrança de multa/juros até nova data
   combinada (registrar em auditoria, fora do escopo desta tabela).
5. Transições válidas de `charges.status`: `aberto → pago | atrasado | negociado | cancelado`;
   `atrasado → pago | negociado | cancelado`; `negociado → pago | cancelado`.
   `pago` e `cancelado` são terminais.
6. Um `payment` (boleto) só pode ser emitido para uma `charge` em aberto;
   `payments.value` deve ser igual ao saldo devedor da cobrança no momento da emissão.
7. Cancelar um `payment` não cancela a `charge` associada — a cobrança volta a
   aceitar novo boleto.
8. NFS-e (`type = 'servico'`) só pode ser emitida após `payments.status = 'pago'`;
   NF-e (`type = 'produto'`) é emitida na venda do produto, sem depender de boleto.
9. `products.stock` é decrementado na venda (emissão de NF-e de produto) e
   nunca fica negativo; abaixo de `min_stock` deve disparar alerta (ver `ALERTS`).
10. `discounts.beneficiaries` é um cache; o valor real é a contagem de
    estudantes com bolsa/desconto ativo aplicado — recalcular periodicamente.
11. `code` de produto, boleto e número de NF-e são únicos.

## 6. Endpoints REST previstos

Devem coincidir com `MOCK_ENDPOINT_MAP` em `src/mock/index.ts`.

| Recurso | Base | Operações |
|---|---|---|
| Produtos | `/produtos` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Serviços | `/servicos` | idem |
| Cobranças | `/cobrancas` | idem + filtro `?alunoId=&status=&kind=` |
| Mensalidades | `/mensalidades` | `GET`, `GET /:id`, `PATCH /:id` (subconjunto de cobranças com `kind='mensalidade'`) |
| Pagamentos | `/pagamentos` | idem + `PATCH /:id/status`, filtro `?cobrancaId=&alunoId=&status=` |
| NFS-e/NF-e | `/notas-fiscais` | `GET`, `GET /:id`, `POST`, `PATCH /:id/status` |
| Descontos/bolsas | `/descontos` | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Estudantes (financeiro) | `/financeiro/alunos` | `GET`, `GET /:id` |

> `MOCK_ENDPOINT_MAP` hoje registra apenas `products`, `services`, `charges`,
> `tuitions` e `payments`; `notas-fiscais`, `descontos` e `financeiro/alunos`
> devem ser acrescentados ao mapa quando o backend estiver pronto.

## 7. Mapa frontend → banco

| Frontend | Tabela mock | Tabela física |
|---|---|---|
| `Student` | `src/mock/database/financeStudents.ts` | `finance_students` |
| `Product` | `src/mock/database/products.ts` | `products` |
| `Service` | `src/mock/database/services.ts` | `services` |
| `Tuition` / `Charge` | `src/mock/database/charges.ts` | `charges` |
| `Boleto` | `src/mock/database/boletos.ts`, `src/mock/database/payments.ts` | `payments` |
| `Nfe` | `src/mock/database/nfes.ts` | `nfes` |
| `Discount` | `src/mock/database/discounts.ts` | `discounts` |
| `REVENUE_BY_MONTH`, `CASHFLOW`, `DEFAULT_RATE`, `ALERTS` | `src/components/rooster/finance/mock-data.ts` | agregações calculadas sobre `charges`/`payments`/`products` (não persistidas como tabela própria) |
