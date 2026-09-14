# Rooster Assets — tabelas (lista simples)

Versão resumida de [assets.md](./assets.md), em formato `campo tipo`, para uso
direto na criação das entidades do backend (Prisma/NestJS). Tipos aqui são
tipos de aplicação (TS), não SQL. Seeds: `src/mock/database/assets.ts`,
`assetCategories.ts`, `assetSectors.ts`, `assetMovements.ts`. Consumo de API
centralizado em `src/services/mock-api/asset.service.ts`.

---

## asset_categories

```
id            string    (uuid, PK)
name          string    (único)
description   string?
tone          string
system        boolean   (default false)
createdAt     datetime
updatedAt     datetime
```

## asset_sectors

```
id            string    (uuid, PK)
name          string    (único)
description   string?
manager       string?   (futuro: managerId -> usuarios.id)
createdAt     datetime
updatedAt     datetime
```
`UNASSIGNED_SECTOR_ID` (`sec-none`) é virtual: representa `sectorId is null`.
Ao integrar com o Hub, tende a ser substituída por `setores`.

## assets

```
id                    string    (uuid, PK)
name                  string
tag                   string    (único)
categoryId            string    (FK -> asset_categories.id)
brand                 string
model                 string
serial                string?
locationId            string?   (FK -> rooms.id — Rooster Rooms)
location              string
sectorId              string?   (FK -> asset_sectors.id / setores.id)
sector                string
ownerUserId           string?   (FK -> usuarios.id — Hub)
owner                 string
status                enum AssetStatus     (default "disponivel")
condition             enum AssetCondition  (default "bom")
acquiredAt            date
value                 number    (decimal 12,2; >= 0)
notes                 string?
photo                 string?
maintenanceTicketId   string?   (FK -> tickets.id — Rooster Desk)
createdAt             datetime
updatedAt             datetime
```

## asset_movements

```
id        string      (uuid, PK)
assetId   string      (FK -> assets.id, cascade)
type      enum MovementType
from      string?
to        string?
user      string
date      datetime
notes     string?
```

## Enums

```
AssetStatus      disponivel | em-uso | emprestado | manutencao | baixado
AssetCondition   novo | bom | regular | ruim | inservivel
MovementType     setor | sala | emprestimo | devolucao | manutencao
```
