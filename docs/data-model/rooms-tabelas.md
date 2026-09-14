# Rooster Rooms — tabelas (lista simples)

Versão resumida de [rooms.md](./rooms.md), em formato `campo tipo`, para uso
direto na criação das entidades do backend (Prisma/NestJS). Tipos aqui são
tipos de aplicação (TS), não SQL. Todas as tabelas têm `id`, `createdAt` e
`updatedAt`.

---

## campuses

```
id          string      (uuid, PK)
name        string
code        string      (único)
address     string?
city        string?
state       string?     (UF, 2 letras)
zip         string?
manager     string?
active      boolean     (default true)
notes       string?
color       string
createdAt   datetime
updatedAt   datetime
```

## blocks

```
id          string      (uuid, PK)
campusId    string      (FK -> campuses.id, cascade)
name        string
code        string      (único por campus)
floors      number      (int, default 1)
manager     string?
active      boolean     (default true)
createdAt   datetime
updatedAt   datetime
```

## rooms  (ambientes / salas)

```
id            string    (uuid, PK)
campusId      string    (FK -> campuses.id)
blockId       string    (FK -> blocks.id, cascade)
name          string
code          string    (único)
floor         number    (int)
number        string?
type          enum SpaceType
capacity      number    (int)
area          number?   (decimal m²)
description   string?
cover         string?
gallery       string[]
status        enum SpaceStatus  (default "disponivel")
openingHours  string    (ex.: "07:00 – 22:30")
weekdays      string[]  ("seg","ter","qua","qui","sex","sab","dom")
slotMinutes   number    (int, default 60)
createdAt     datetime
updatedAt     datetime
```

## room_slots  (períodos reserváveis do ambiente)

```
id          string      (uuid, PK)
roomId      string      (FK -> rooms.id, cascade)
startTime   time        (ex.: "07:00")
endTime     time        (ex.: "08:00")
weekday     number?     (0–6; null = todos os dias)
active      boolean     (default true)
```
Único: `(roomId, weekday, startTime, endTime)`.

## room_resources  (recursos do ambiente)

```
roomId      string      (FK -> rooms.id, cascade)
resource    enum RoomResource
```
PK composta `(roomId, resource)`.

## reservations

```
id            string    (uuid, PK)
code          string    (único, ex.: "RES-2026-0142")
roomId        string    (FK -> rooms.id, restrict)
responsibleId string?   (FK -> usuarios.id — Hub)
responsible   string    (nome, fallback pré-Hub)
sectorId      string?   (FK -> setores.id — Hub)
sector        string?
event         string
purpose       string?
date          date      (yyyy-mm-dd)
startTime     time      (HH:MM)
endTime       time      (HH:MM)
participants  number    (int)
status        enum ReservationStatus  (default "analise")
recurrence    enum ReservationRecurrence  (default "unica")
notes         string?
decidedBy     string?   (FK -> usuarios.id)
decidedAt     datetime?
createdAt     datetime
updatedAt     datetime
```

## reservation_equipment  (equipamentos extras pedidos na reserva)

```
reservationId string    (FK -> reservations.id, cascade)
item          string
quantity      number    (int, default 1)
assetId       string?   (FK -> assets.id — Rooster Assets)
```
PK composta `(reservationId, item)`.

---

## Enums

```
SpaceType             = sala | lab | lab-info | auditorio | biblioteca | reuniao |
                        ginasio | quadra | anfiteatro | multiuso | estudio | outro
SpaceStatus           = disponivel | em-uso | manutencao | bloqueado
ReservationStatus     = confirmada | analise | cancelada | finalizada | andamento
ReservationRecurrence = unica | diaria | semanal | mensal
RoomResource          = projetor | smart-tv | computadores | notebook | som |
                        microfone | ar | internet | lousa-digital | lousa |
                        impressora | bancadas | lab-equip
```

---

## Relações (resumo)

```
campuses 1 ──── N blocks            (blocks.campusId,  on delete cascade)
blocks   1 ──── N rooms             (rooms.blockId,    on delete cascade)
campuses 1 ──── N rooms             (rooms.campusId,   denormalizado p/ filtro)
rooms    1 ──── N room_slots        (on delete cascade)
rooms    1 ──── N room_resources    (on delete cascade)
rooms    1 ──── N reservations      (on delete restrict)
reservations 1 ─ N reservation_equipment (on delete cascade)

reservations N ─ 1 usuarios (Hub)   [responsibleId, decidedBy]
reservations N ─ 1 setores  (Hub)   [sectorId]
reservation_equipment N ─ 1 assets  (Rooster Assets) [assetId]
```

Regra crítica: não pode haver duas `reservations` do mesmo `roomId` com
intervalos sobrepostos na mesma `date` quando `status` for `confirmada` ou
`andamento` (ver constraint de exclusão em [rooms.md §3.6](./rooms.md)).
