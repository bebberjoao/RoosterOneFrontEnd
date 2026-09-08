# Guia de integração com o backend (NestJS + Prisma + PostgreSQL)

## 1. Configuração

`VITE_API_URL` define a base da API. A aplicação não possui fallback de dados:
sem uma API disponível, as telas exibem seus estados de erro ou vazio.

## 2. Assinatura padrão dos serviços

Todo serviço em `src/services/mock-api/` expõe a mesma superfície:

```ts
getAll(filters?: Partial<Record<keyof T, unknown>>): Promise<T[]>
getById(id: string): Promise<T | undefined>
create(dto: Omit<T, "id">): Promise<T>
update(id: string, dto: Partial<T>): Promise<T>
remove(id: string): Promise<void>
```

Para integrar, substitua o corpo por chamadas HTTP mantendo a assinatura. As
telas não mudam.

```ts
// antes (mock)
getAll: async (f) => delay(applyFilters(db.tickets, f)),
// depois (REST)
getAll: (f) => http.get<Ticket[]>("/chamados", { query: f }),
```

## 3. Indisponibilidade da API

`src/services/hub/index.ts` chama exclusivamente os endpoints REST e sinaliza
`offlineState` quando a API não responde. Nenhum registro é criado ou exibido
localmente para substituir a resposta do backend.

## 4. Mapa de endpoints

Definido em `MOCK_ENDPOINT_MAP` (`src/mock/index.ts`). É a fonte de verdade do
contrato REST esperado.

O backend implementado e documentado atualmente cobre o Hub, Desk, Rooms e
Assets. A matriz de cobertura, incluindo os módulos ainda pendentes, fica em
`backend/docs/contrato-frontend.md`. O Swagger do backend está disponível em
`/api/docs` durante a execução local.

No Desk, use as rotas `/chamados`, `/chamados-categorias`,
`/chamados-subcategorias`, `/chamados-prioridades` e `/chamados-status`.
Operações de chamado protegido enviam o identificador do usuário em
`x-user-id`.

### Escopo setorial e atribuição

As categorias retornadas pelo Desk já vêm filtradas pelo setor do usuário. O
`setorId` da categoria define o setor responsável pelo ticket; o setor de quem
abriu o chamado não altera esse direcionamento. Coordenadores só podem criar e
editar categorias/subcategorias do próprio setor e associar atendentes desse
setor por `PATCH /chamados-subcategorias/:id/atendentes`. Atendentes podem
assumir chamados compatíveis por `PATCH /chamados/:id/atribuir`.

Rooms expõe `/campus`, `/blocos`, `/ambientes`, `/ambientes/estrutura` e
`/reservas`. Assets expõe `/patrimonio-categorias`, `/patrimonio-setores`,
`/patrimonio` e `/patrimonio-movimentacoes`. Os serviços legados dessas telas
ainda usam tipos em camelCase; é necessário adaptar os payloads para os DTOs
REST em português antes de considerar a integração funcional completa.

## 5. Checklist por recurso

- [x] Endpoint existe no NestJS com os mesmos campos do tipo TS (Hub e Desk)
- [ ] Serviço migrado para HTTP mantendo assinatura
- [ ] Tela não importa arrays de `src/mock` nem `mock-data.ts`
- [ ] Erros tratados (401/403/404/422) e validações espelhadas
- [ ] Tabela mock correspondente removida de `src/mock/database`
- [ ] Entrada removida do `MOCK_ENDPOINT_MAP` apenas quando 100% migrada