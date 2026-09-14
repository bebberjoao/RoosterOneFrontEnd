# Rooster Desk — tabelas (lista simples)

Versão resumida de [desk.md](./desk.md), em formato `campo tipo`, para uso
direto na criação das entidades do backend (Prisma/NestJS). Tipos aqui são
tipos de aplicação (TS), não SQL. Seeds: `src/mock/database/tickets.ts` e
`src/mock/database/deskCategories.ts`. Consumo de API centralizado em
`src/services/mock-api/ticket.service.ts` e
`src/services/mock-api/desk-category.service.ts`.

---

## desk_categories

```
id          string    (uuid, PK)
name        string    (único)
sector      string    (futuro: sectorId -> setores.id)
owner       string    (futuro: ownerId -> usuarios.id)
slaHours    number    (int)
createdAt   datetime
updatedAt   datetime
```

## desk_subcategories

```
id          string    (uuid, PK)
categoryId  string    (FK -> desk_categories.id, cascade)
name        string
slaHours    number    (int)
```
Único: `(categoryId, name)`.

## desk_subcategory_assignees

```
subcategoryId  string  (FK -> desk_subcategories.id, cascade)
agentId        string  (FK -> desk_agents.id, cascade)
```
PK composta `(subcategoryId, agentId)`.

## desk_agents

```
id          string    (uuid, PK)
name        string
email       string    (único)
sector      string
role        string    ('Atendente'|'Analista'|'Especialista'|'Supervisor')
active      boolean   (default true)
createdAt   datetime
updatedAt   datetime
```

## tickets

```
id                string    (uuid, PK)
number            string    (único, ex.: "#4820")
title             string
categoryId        string    (FK -> desk_categories.id, restrict)
subcategoryId     string?   (FK -> desk_subcategories.id)
requesterId       string?   (FK -> usuarios.id — Hub)
requesterName     string
requesterRole     string?
requesterSector   string?
assigneeId        string?   (FK -> desk_agents.id)
priority          enum TicketPriority   (default "media")
status            enum TicketStatus     (default "aberto")
slaPercent        number    (int 0–100, default 100)
slaDeadline       datetime
openedAt          datetime
description       string
tags              string[]
createdAt         datetime
updatedAt         datetime
```

## ticket_events

```
id            string    (uuid, PK)
ticketId      string    (FK -> tickets.id, cascade)
kind          enum TicketEventKind
author        string    (futuro: authorId -> usuarios.id)
role          string?
body          string?
internal      boolean   (default false)
attachments   string[]
fromValue     string?
toValue       string?
at            datetime
```

## Enums

```
TicketStatus      aberto | em-andamento | aguardando | resolvido | fechado
TicketPriority    baixa | media | alta | critica
TicketEventKind   message | status | priority | assign | category | create
```
