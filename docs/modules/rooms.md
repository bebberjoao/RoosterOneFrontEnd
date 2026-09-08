# Rooster Rooms

## Objetivo do módulo

Gestão de campus, blocos, ambientes (salas, laboratórios, auditórios etc.) e das reservas desses ambientes. Oferece um painel de indicadores, agenda/calendário de reservas com validação de conflitos em tempo real, e uma visão em árvore da estrutura física (campus > bloco > ambiente) com CRUD de cada nível.

Controle de papel por item de menu (`SubItem.roles` em `module-config.ts`): `/rooms/book` é visível a todos os perfis do módulo; `/rooms/reservations` e `/rooms/structure` somente para `admin`, `tecnico`, `institucional` e `coordenador` (setor gestor de reservas).

## Rotas

| Rota | Arquivo | Componente | Descrição |
|---|---|---|---|
| `/rooms` | `src/routes/rooms.tsx` | `RoomsLayout` (inline) | Layout raiz do módulo, envolve as subrotas com `AppShell` e define `Outlet`. |
| `/rooms/` | `src/routes/rooms.index.tsx` | `RoomsDashboard` | Dashboard com estatísticas, próximas reservas, agenda do dia e ambientes indisponíveis. |
| `/rooms/book` | `src/routes/rooms.book.tsx` | `BookRoomPage` | Tela de solicitação de reserva para usuários finais (professores, alunos etc.): aba lateral de seleção de sala, calendário mensal de disponibilidade e abas "Detalhes" / "Mensagem e equipamentos". Cria reservas com status `analise`. |
| `/rooms/reservations` | `src/routes/rooms.reservations.tsx` | `ReservationsPage` | Agenda (dia/semana/mês/timeline) e lista de reservas — uso restrito ao setor gestor de reservas (`admin`, `tecnico`, `institucional`, `coordenador`). |
| `/rooms/structure` | `src/routes/rooms.structure.tsx` | `StructurePage` | Árvore de campus/blocos/ambientes com detalhes e CRUD de cada nível. |

## Telas e componentes

### RoomsDashboard (`/rooms/`)
- Usa `CrudHeader`, `StatCard`, `SectionCard`, `EmptyState` (de `@/components/shared`).
- Usa `StatusBadge`, `SpaceStatusBadge` (de `@/components/rooster/rooms/badges`).
- Usa helpers de `@/components/rooster/rooms/labels` (`SPACE_TYPE_TONE`, `formatDate`, `isoOf`).
- Estado local: `rooms`, `reservations`, `campuses`, `blocks`, `loading` (via `useState`/`useEffect`, carregados uma vez ao montar).
- Seções: cartões de estatística (7 KPIs), lista "Próximas reservas", lista "Agenda do dia", lista "Ambientes indisponíveis".

### ReservationsPage (`/rooms/reservations`)
- Usa `CrudHeader`, `CrudToolbar`, `TabBar`, `DataTable`, `Drawer`, `Btn`, `Field`, `TextInput`, `TextArea`, `SelectInput`, `Select` (de `@/components/shared`).
- Usa `StatusBadge` (badges) e helpers de labels (`STATUS_LABEL`, `STATUS_TONE`, `formatDate`, `isoOf`, `startOfWeek`, `hourToMinutes`, `findConflicts`).
- Estado local: `rooms`, `reservations`, `campuses`, `loading`, `tab` (agenda/lista), `view` (dia/semana/mês/timeline), `cursor` (data de referência), `q` (busca), `status` (filtro), `drawerOpen`.
- Subcomponentes internos: `Legend`, `WeekView`, `DayView`, `MonthView`, `TimelineView`, `NewReservationDrawer`.
- `NewReservationDrawer` contém formulário de criação com validação em tempo real (conflitos, capacidade, horário) antes de habilitar o botão de salvar.

### StructurePage (`/rooms/structure`)
- Usa `CrudHeader`, `TreeView`, `SectionCard`, `EmptyState`, `Btn`, `Modal`, `ConfirmDialog`, `Field`, `TextInput`, `TextArea`, `SelectInput` (de `@/components/shared`).
- Usa `SpaceStatusBadge`, `TypeBadge` (badges) e labels (`SPACE_TYPE_LABEL`, `RESOURCE_LABEL`, `WEEKDAY_LABEL`, `formatDate`, `isoOf`).
- Estado local: `campuses`, `blocks`, `rooms`, `reservations`, `loading`, `selection` (item selecionado na árvore), `campusModal`, `blockModal`, `roomModal`, `confirmDelete`.
- Subcomponentes internos: `InfoRow`, `RoomDetail`, `CampusModal`, `BlockModal`, `RoomModal`.

## Serviços e funções usadas

Serviço: `roomService` em `src/services/mock-api/room.service.ts` (mock local em memória, com `delay()` simulando latência).

| Função | Assinatura | Uso |
|---|---|---|
| `getAll` | `(filters?) => Promise<Room[]>` | Lista ambientes |
| `getById` | `(id: string) => Promise<Room \| undefined>` | Não usado diretamente nas telas documentadas |
| `create` | `(dto: Omit<Room, "id">) => Promise<Room>` | Criar ambiente (RoomModal) |
| `update` | `(id: string, dto: Partial<Room>) => Promise<Room \| undefined>` | Editar ambiente (RoomModal) |
| `remove` | `(id: string) => Promise<boolean>` | Excluir ambiente |
| `search` | `(query: string) => Promise<Room[]>` | Não usado nas telas documentadas |
| `getStructureTree` | `() => Promise<...>` | Não usado (as telas montam a árvore manualmente a partir de `getAll`/`getCampuses`/`getBlocks`) |
| `getReservations` | `(filters?) => Promise<Reservation[]>` | Lista reservas |
| `createReservation` | `(dto: Omit<Reservation, "id">) => Promise<Reservation>` | Nova reserva |
| `updateReservation` | `(id, dto: Partial<Reservation>) => Promise<Reservation \| undefined>` | Não usado nas telas atuais |
| `removeReservation` | `(id: string) => Promise<boolean>` | Não usado nas telas atuais |
| `getCampuses` | `() => Promise<Campus[]>` | Lista campus |
| `createCampus` | `(dto: Omit<Campus, "id">) => Promise<Campus>` | Novo campus (CampusModal) |
| `updateCampus` | `(id, dto: Partial<Campus>) => Promise<Campus \| undefined>` | Editar campus |
| `removeCampus` | `(id: string) => Promise<boolean>` | Excluir campus |
| `getBlocks` | `() => Promise<Block[]>` | Lista blocos |
| `createBlock` | `(dto: Omit<Block, "id">) => Promise<Block>` | Novo bloco (BlockModal) |
| `updateBlock` | `(id, dto: Partial<Block>) => Promise<Block \| undefined>` | Editar bloco |
| `removeBlock` | `(id: string) => Promise<boolean>` | Excluir bloco |

Fontes de dados mock: `src/mock/database/rooms.ts`, `reservations.ts`, `campuses.ts`, `blocks.ts`.

Funções auxiliares de `src/components/rooster/rooms/labels.ts`: `formatDate`, `isoOf`, `startOfWeek`, `hourToMinutes`, `findConflicts`, além dos dicionários `STATUS_LABEL`, `STATUS_TONE`, `SPACE_TYPE_LABEL`, `SPACE_TYPE_TONE`, `RESOURCE_LABEL`, `WEEKDAY_LABEL`.

## Estado

Cada rota gerencia seu próprio estado local com `useState`/`useEffect`, sem store/contexto global compartilhado (diferente de Assets e Finance). Os dados são recarregados via função `reload()` após qualquer mutação (criação/edição/exclusão).

## Tabela de botões e ações

| Label | Local | O que faz | Serviço chamado |
|---|---|---|---|
| Nova reserva | `RoomsDashboard` (header, link) | Navega para `/rooms/reservations` | — (navegação, `Link`) |
| Ver todas | `RoomsDashboard`, seção "Próximas reservas" | Navega para `/rooms/reservations` | — |
| Abrir agenda | `RoomsDashboard`, seção "Agenda do dia" | Navega para `/rooms/reservations` | — |
| Nova reserva | `ReservationsPage` (header) | Abre `NewReservationDrawer` | — |
| Hoje | `ReservationsPage`, barra de navegação de datas | Define `cursor` para a data atual | — |
| Seta esquerda/direita | `ReservationsPage`, barra de navegação | Desloca `cursor` conforme a `view` ativa (dia/semana/mês) | — |
| Abas Agenda/Lista | `ReservationsPage` (`TabBar`) | Alterna `tab` entre agenda e lista | — |
| Abas Dia/Semana/Mês/Timeline | `ReservationsPage` (`TabBar`) | Alterna `view` do calendário | — |
| Salvar reserva | `NewReservationDrawer` | Valida formulário e chama `createReservation`, depois `reload()` e fecha o drawer | `roomService.createReservation` |
| Cancelar | `NewReservationDrawer` | Fecha o drawer sem salvar | — |
| Novo campus | `StructurePage` (header) | Abre `CampusModal` em modo criação | — |
| Novo bloco | `StructurePage`, detalhe do campus selecionado | Abre `BlockModal` pré-preenchido com o campus | — |
| Editar (campus) | `StructurePage`, detalhe do campus | Abre `CampusModal` em modo edição | — |
| Excluir (campus) | `StructurePage`, detalhe do campus | Abre `ConfirmDialog`; ao confirmar remove o campus | `roomService.removeCampus` |
| Novo ambiente | `StructurePage`, detalhe do bloco | Abre `RoomModal` pré-preenchido com campus/bloco | — |
| Editar (bloco) | `StructurePage`, detalhe do bloco | Abre `BlockModal` em modo edição | — |
| Excluir (bloco) | `StructurePage`, detalhe do bloco | Abre `ConfirmDialog`; ao confirmar remove o bloco | `roomService.removeBlock` |
| Editar (ambiente) | `StructurePage`, `RoomDetail` | Abre `RoomModal` em modo edição | — |
| Excluir (ambiente) | `StructurePage`, `RoomDetail` | Abre `ConfirmDialog`; ao confirmar remove o ambiente | `roomService.remove` |
| Salvar (CampusModal) | `CampusModal` | Valida nome/código e chama `createCampus` ou `updateCampus`, depois `reload()` | `roomService.createCampus` / `roomService.updateCampus` |
| Salvar (BlockModal) | `BlockModal` | Valida nome/código/campus e chama `createBlock` ou `updateBlock`, depois `reload()` | `roomService.createBlock` / `roomService.updateBlock` |
| Salvar (RoomModal) | `RoomModal` | Valida nome/código/campus/bloco e chama `create` ou `update`, depois `reload()` | `roomService.create` / `roomService.update` |
| Excluir (ConfirmDialog genérico) | `StructurePage` | Executa a exclusão de acordo com `confirmDelete.kind` (campus/block/room) | `roomService.removeCampus` / `removeBlock` / `remove` |

## Modelo de dados

Tabelas, enums, constraints e relacionamentos do módulo: [../data-model/rooms.md](../data-model/rooms.md) — documento de referência do padrão de modelagem para os demais módulos. Lista simples de campos por tabela: [../data-model/rooms-tabelas.md](../data-model/rooms-tabelas.md).
