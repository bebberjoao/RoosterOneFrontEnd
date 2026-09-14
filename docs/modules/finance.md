# Rooster Finance

## Objetivo do módulo

ERP financeiro da instituição: mensalidades, cobranças, boletos, notas fiscais, produtos, serviços, descontos/bolsas, relatórios e configurações. Possui controle de acesso por papel (`role`) e uma visão dedicada para o papel "aluno"/"institucional" (extrato pessoal). O módulo tem duas camadas de telas: (1) rotas independentes mais antigas (`charges`, `tuitions`, `boletos`, `nfe`, `products`, `services`, `discounts`, `reports`, `settings`) que leem dados estáticos de mock diretamente, com botões majoritariamente ilustrativos (sem ação real); e (2) a rota `manage`, mais recente, que usa a store `useFinance` com CRUD funcional e persistência em memória via `financeService`.

## Rotas

| Rota | Arquivo | Componente | Descrição |
|---|---|---|---|
| `/finance` | `src/routes/finance.tsx` | `FinanceLayout` | Layout raiz: verifica `financeHasAccess`, envolve subrotas com `AppShell`. Sem acesso, mostra "Acesso restrito". |
| `/finance/` | `src/routes/finance.index.tsx` | `FinanceDashboard` | Painel com KPIs, gráfico de receita por mês, mensalidades recentes, últimos pagamentos e próximos vencimentos. Para papéis `aluno`/`institucional`, renderiza `StudentFinanceView` (extrato pessoal). |
| `/finance/manage` | `src/routes/finance.manage.tsx` | `FinanceManage` | Tela unificada com abas: Cobranças, Produtos, Serviços, Relatórios, Configurações — conectada à store `useFinance` com CRUD real. |
| `/finance/tuitions` | `src/routes/finance.tuitions.tsx` | `Tuitions` | Listagem de mensalidades (dados estáticos `TUITIONS`), com busca e filtros por competência/status. |
| `/finance/charges` | `src/routes/finance.charges.tsx` | `Charges` | Listagem de cobranças (dados estáticos `CHARGES`), busca e filtro por status. |
| `/finance/boletos` | `src/routes/finance.boletos.tsx` | `Boletos` | Listagem de boletos (dados estáticos `BOLETOS`), busca, filtro por status, ações de reemissão/PDF (ilustrativas). |
| `/finance/nfe` | `src/routes/finance.nfe.tsx` | `Nfes` | Listagem de notas fiscais (dados estáticos `NFES`), abas Serviço/Produto. |
| `/finance/products` | `src/routes/finance.products.tsx` | `Products` | Catálogo de produtos (dados estáticos `PRODUCTS`) em cards, com busca/filtro por categoria. |
| `/finance/services` | `src/routes/finance.services.tsx` | `Services` | Catálogo de serviços (dados estáticos `SERVICES`) em cards, com busca. |
| `/finance/discounts` | `src/routes/finance.discounts.tsx` | `Discounts` | Cards de regras de desconto/bolsa (dados estáticos `DISCOUNTS`). |
| `/finance/reports` | `src/routes/finance.reports.tsx` | `Reports` | Relatórios com gráficos (receita mensal, inadimplência, fluxo de caixa) a partir de dados estáticos. |
| `/finance/settings` | `src/routes/finance.settings.tsx` | `FinanceSettings` | Cards de configuração (dados da instituição, integração bancária/fiscal, regras padrão, notificações) — apenas apresentacionais. |

Observação: existe também `src/routes/student.finance.tsx`, fora do escopo deste documento (rota de outro módulo/área do aluno).

## Telas e componentes

### FinanceLayout (`/finance`)
- Usa `AppShell`, `useRole`, `financeHasAccess` (permissões), `PageHeader`.

### FinanceDashboard (`/finance/`)
- Usa `StatCard`, `SectionCard`, `TONE`, `Breadcrumbs`, `CrudHeader` (de `@/components/shared`).
- Usa `ChargeStatusBadge`, `BoletoStatusBadge`, `Avatar` (de `@/components/rooster/finance/badges`).
- Usa dados estáticos de `@/components/rooster/finance/mock-data`: `TUITIONS`, `BOLETOS`, `STUDENTS`, `studentById`, `brl`, `fmtDate`, `sum`, `REVENUE_BY_MONTH`.
- Usa `recharts` (`AreaChart`) para o gráfico de receita.
- Contém `StudentFinanceView`, subcomponente exibido para `role === "aluno" | "institucional"`, mostrando total pago, valor pendente, próximo vencimento e tabela de mensalidades do aluno.

### FinanceManage (`/finance/manage`)
- Usa `CrudHeader`, `CrudToolbar`, `Breadcrumbs`, `DataTable`, `Drawer`, `Modal`, `TabBar`, `Btn`, `Select`, `EmptyState`, `Field`, `TextInput`, `TextArea`, `SelectInput`, `SectionCard`, `StatCard`, `TONE`, `ConfirmDialog` (de `@/components/shared`).
- Usa `useRole`, `financeCan` (permissões) para decidir quais abas exibir (`canSeeTab`).
- Consome `useFinance()` (store) em cada aba.
- Abas internas, cada uma um subcomponente:
  - `ChargesTab`: tabela de mensalidades (`tuitions` da store) com drawer de detalhes contendo sub-abas Detalhes/Boleto/Nota Fiscal/Descontos/Histórico.
  - `ProductsTab`: CRUD de produtos com `ProductForm` (modal).
  - `ServicesTab`: CRUD de serviços com `ServiceForm` (modal).
  - `ReportsTab`: KPIs e gráficos de receita/inadimplência a partir de `tuitions` da store e constantes estáticas (`REVENUE_BY_MONTH`, `DEFAULT_RATE`, `ALERTS`).
  - `SettingsTab`: cards apresentacionais (sem ação).

### Demais rotas standalone (tuitions, charges, boletos, nfe, products, services, discounts, reports, settings)
- Usam `PageHeader` (de `@/components/rooster/page-header`) e badges de `@/components/rooster/finance/badges`.
- Consomem exclusivamente dados estáticos de `@/components/rooster/finance/mock-data` (`TUITIONS`, `CHARGES`, `BOLETOS`, `NFES`, `PRODUCTS`, `SERVICES`, `DISCOUNTS`, `REVENUE_BY_MONTH`, `DEFAULT_RATE`, `CASHFLOW`), filtrados/pesquisados apenas em memória local (`useState`/`useMemo`), sem chamadas a serviços.
- A maioria dos botões de ação (Nova cobrança, Emitir boleto, Nova regra, Exportar, Remessa, etc.) não possui `onClick` implementado — são elementos de interface ilustrativos indicando funcionalidade planejada.

## Serviços e funções usadas

Serviço: `financeService` em `src/services/mock-api/finance.service.ts` (mock local em memória, com `delay()`).

| Função | Assinatura | Uso |
|---|---|---|
| `getAll` | `(filters?) => Promise<Charge[]>` | Não usado diretamente nas telas documentadas (entidade `Charge` primária) |
| `getById` | `(id: string) => Promise<Charge \| undefined>` | Não usado |
| `create` | `(dto: Omit<Charge, "id">) => Promise<Charge>` | Não usado |
| `update` | `(id, dto: Partial<Charge>) => Promise<Charge \| undefined>` | Não usado |
| `remove` | `(id: string) => Promise<boolean>` | Não usado |
| `search` | `(query: string) => Promise<Charge[]>` | Não usado |
| `getTuitions` | `(filters?) => Promise<Tuition[]>` | Carregado pelo `FinanceProvider` ao montar |
| `updateTuition` | `(id, dto: Partial<Tuition>) => Promise<Tuition \| undefined>` | Usado em `ChargesTab` (marcar como pago / cancelar / negociar) |
| `getProducts` | `(filters?) => Promise<Product[]>` | Carregado pelo `FinanceProvider` |
| `createProduct` | `(dto: Omit<Product, "id">) => Promise<Product>` | `ProductsTab` / `ProductForm` |
| `updateProduct` | `(id, dto: Partial<Product>) => Promise<Product \| undefined>` | `ProductsTab` / `ProductForm` |
| `removeProduct` | `(id: string) => Promise<boolean>` | `ProductsTab` (exclusão) |
| `getServices` | `(filters?) => Promise<Service[]>` | Carregado pelo `FinanceProvider` |
| `createService` | `(dto: Omit<Service, "id">) => Promise<Service>` | `ServicesTab` / `ServiceForm` |
| `updateService` | `(id, dto: Partial<Service>) => Promise<Service \| undefined>` | `ServicesTab` / `ServiceForm` |
| `removeService` | `(id: string) => Promise<boolean>` | `ServicesTab` (exclusão) |
| `getPayments` | `(filters?) => Promise<Payment[]>` | Carregado pelo `FinanceProvider` |
| `emitPayment` | `(dto: Omit<Payment, "id">) => Promise<Payment>` | Emissão de boleto (`emitBoleto` na store), usado na aba "Boleto" do drawer de cobrança |
| `updatePayment` | `(id, dto: Partial<Payment>) => Promise<Payment \| undefined>` | Marcar boleto como pago (`markPaymentPaid`) |

Store de contexto: `FinanceProvider`/`useFinance` em `src/components/rooster/finance/store.tsx`, expõe: `tuitions`, `products`, `services`, `payments`, `nfes`, `discounts`, `loading`, `updateTuition`, `createProduct`, `updateProduct`, `deleteProduct`, `createService`, `updateService`, `deleteService`, `paymentsOf`, `emitBoleto`, `markPaymentPaid`, `emitNfe`, `createDiscount`, `updateDiscount`, `deleteDiscount`.
Observação: `nfes` e `discounts` são inicializados a partir de constantes estáticas (`NFES`, `DISCOUNTS` em `mock-data.ts`) e manipulados apenas em memória local da store (sem chamada a `financeService`), diferente de `tuitions`/`products`/`services`/`payments`, que usam o serviço mock.

Permissões: `src/components/rooster/finance/permissions.ts`, função `financeCan(role, perm)` com `perm` em `"viewDashboard" | "manageCharges" | "manageProducts" | "manageServices" | "manageNfe" | "manageDiscounts" | "viewReports" | "manageSettings" | "viewOwnFinance"`, e `financeHasAccess(role)`. Matriz: `admin` e `financeiro` têm quase todas as permissões de gestão; `coordenador` tem `viewDashboard`/`viewReports`; `aluno` e `institucional` têm apenas `viewOwnFinance`; `professor` e `tecnico` não têm acesso.

Fonte de dados mock: `src/components/rooster/finance/mock-data.ts` (constantes `TUITIONS`, `CHARGES`, `BOLETOS`, `NFES`, `PRODUCTS`, `SERVICES`, `DISCOUNTS`, `STUDENTS`, `REVENUE_BY_MONTH`, `DEFAULT_RATE`, `CASHFLOW`, `ALERTS`, `PRODUCT_CATEGORIES`, `FREQ_LABEL`, funções `studentById`, `brl`, `fmtDate`, `sum`); e `src/mock/database/charges.ts`, `products.ts`, `services.ts`, `payments.ts` (usados pelo `financeService`).

## Estado

- `/finance/manage` usa estado global via `FinanceProvider` (contexto React), carregado uma vez e atualizado localmente após cada mutação.
- As demais rotas standalone (`tuitions`, `charges`, `boletos`, `nfe`, `products`, `services`, `discounts`, `reports`, `settings`) não usam a store; mantêm apenas estado local de UI (busca/filtros/abas) via `useState`, lendo diretamente das constantes estáticas de `mock-data.ts`.

## Tabela de botões e ações

| Label | Local | O que faz | Serviço chamado |
|---|---|---|---|
| Gerenciar financeiro | `FinanceDashboard` (header, link) | Navega para `/finance/manage` | — |
| 2ª via | `StudentFinanceView`, tabela de mensalidades do aluno | Botão presente na linha da tabela, sem `onClick` implementado (ilustrativo) | — |
| Gerar em lote | `Tuitions` (`/finance/tuitions`, header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Individual | `Tuitions` (header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Exportar | `Charges` (`/finance/charges`, header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Nova cobrança | `Charges` (header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Remessa | `Boletos` (`/finance/boletos`, header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Emitir boleto | `Boletos` (header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Reemitir | `Boletos`, ação por linha | Botão sem `onClick` implementado (ilustrativo) | — |
| PDF (download) | `Boletos`, ação por linha | Botão sem `onClick` implementado (ilustrativo) | — |
| Exportar XML | `Nfes` (`/finance/nfe`, header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Emitir nota | `Nfes` (header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Baixar / Visualizar | `Nfes`, ação por linha | Botões sem `onClick` implementado (ilustrativos) | — |
| Novo produto | `Products` (`/finance/products`, header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Novo serviço | `Services` (`/finance/services`, header) | Botão sem `onClick` implementado (ilustrativo) | — |
| Nova regra | `Discounts` (`/finance/discounts`, header) | Botão sem `onClick` implementado (ilustrativo) | — |
| PDF / Excel | `Reports` (`/finance/reports`, header) | Botões sem `onClick` implementado (ilustrativos) | — |
| Filtros (Curso, Turma, Período, etc.) | `Reports` | Botões sem `onClick` implementado (ilustrativos) | — |
| Cards de configuração | `FinanceSettings` (`/finance/settings`) e aba Configurações de `FinanceManage` | Botões sem `onClick` implementado (ilustrativos) | — |
| Linha da tabela de cobranças (clique) | `FinanceManage`, `ChargesTab` | Abre `Drawer` de detalhes da mensalidade (`openDrawer`) | — |
| Marcar como pago | `FinanceManage`, `ChargesTab`, aba Detalhes (visível se `canEdit`) | Atualiza a mensalidade para status "pago" com valor e data de pagamento | `financeService.updateTuition` (via `updateTuition`) |
| Cancelar cobrança | `FinanceManage`, `ChargesTab`, aba Detalhes (visível se `canEdit`) | Atualiza status da mensalidade para "cancelado" | `financeService.updateTuition` (via `updateTuition`) |
| Negociar | `FinanceManage`, `ChargesTab`, aba Detalhes (visível se `canEdit` e status "atrasado") | Atualiza status da mensalidade para "negociado" | `financeService.updateTuition` (via `updateTuition`) |
| Marcar pago (boleto) | `FinanceManage`, `ChargesTab`, aba Boleto (visível se `canEdit`) | Marca o boleto/pagamento como pago | `financeService.updatePayment` (via `markPaymentPaid`) |
| Emitir novo boleto | `FinanceManage`, `ChargesTab`, aba Boleto (visível se `canEdit`) | Emite um novo boleto para a mensalidade selecionada | `financeService.emitPayment` (via `emitBoleto`) |
| Emitir nota fiscal | `FinanceManage`, `ChargesTab`, aba Nota Fiscal (visível se `canEdit`) | Cria uma NFS-e local para a mensalidade selecionada | Não chama serviço; apenas atualiza estado local da store (`emitNfe`) |
| Novo produto | `FinanceManage`, `ProductsTab` (header, visível se `canCreate`) | Abre `ProductForm` em modo criação | — |
| Linha da tabela de produtos (clique) | `FinanceManage`, `ProductsTab` (se `canCreate`) | Abre `ProductForm` em modo edição | — |
| Salvar (ProductForm) | `ProductForm` | Cria ou atualiza o produto | `financeService.createProduct` / `updateProduct` (via `createProduct`/`updateProduct`) |
| Excluir (ConfirmDialog de produto) | `FinanceManage`, `ProductsTab` | Remove o produto selecionado | `financeService.removeProduct` (via `deleteProduct`) |
| Novo serviço | `FinanceManage`, `ServicesTab` (header, visível se `canCreate`) | Abre `ServiceForm` em modo criação | — |
| Linha da tabela de serviços (clique) | `FinanceManage`, `ServicesTab` (se `canCreate`) | Abre `ServiceForm` em modo edição | — |
| Salvar (ServiceForm) | `ServiceForm` | Cria ou atualiza o serviço | `financeService.createService` / `updateService` (via `createService`/`updateService`) |
| Excluir (ConfirmDialog de serviço) | `FinanceManage`, `ServicesTab` | Remove o serviço selecionado | `financeService.removeService` (via `deleteService`) |
