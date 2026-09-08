// Table: assets — seed movido de rooster/assets/mock-data.ts (INITIAL_ASSETS). FK: categoryId, roomId (locationId).
import { SECTORS } from "@/mock/database/assetSectors";

export type AssetStatus = "disponivel" | "em-uso" | "emprestado" | "manutencao" | "baixado";
export type AssetCondition = "novo" | "bom" | "regular" | "ruim" | "inservivel";

export type Asset = {
  id: string;
  name: string;
  tag: string; // número de patrimônio
  categoryId: string;
  brand: string;
  model: string;
  serial: string;
  /** Rooms: id do espaço físico (futuro). */
  locationId?: string;
  location: string;
  sector: string;
  /** Hub: id do usuário responsável (futuro). */
  ownerUserId?: string;
  owner: string;
  status: AssetStatus;
  condition: AssetCondition;
  acquiredAt: string; // ISO date
  value: number;
  notes?: string;
  photo?: string;
  /** Desk: chamado de manutenção vinculado (futuro). */
  maintenanceTicketId?: string;
  createdAt: string;
};

export const STATUS_META: Record<AssetStatus, { label: string; tone: string }> = {
  disponivel: { label: "Disponível", tone: "oklch(0.62 0.18 155)" },
  "em-uso": { label: "Em uso", tone: "oklch(0.55 0.19 265)" },
  emprestado: { label: "Emprestado", tone: "oklch(0.68 0.14 195)" },
  manutencao: { label: "Em manutenção", tone: "oklch(0.72 0.14 90)" },
  baixado: { label: "Baixado", tone: "oklch(0.65 0.05 260)" },
};

export const CONDITION_META: Record<AssetCondition, { label: string; tone: string }> = {
  novo: { label: "Novo", tone: "oklch(0.62 0.18 155)" },
  bom: { label: "Bom", tone: "oklch(0.68 0.14 195)" },
  regular: { label: "Regular", tone: "oklch(0.72 0.14 90)" },
  ruim: { label: "Ruim", tone: "oklch(0.68 0.18 40)" },
  inservivel: { label: "Inservível", tone: "oklch(0.65 0.18 25)" },
};

/** Futuro: substituído por espaços do Rooster Rooms. */
export const LOCATIONS = [
  "Campus Central · Bloco A · Sala 101",
  "Campus Central · Bloco A · Lab. Info 1",
  "Campus Central · Bloco B · Sala 204",
  "Campus Central · Bloco B · Lab. Química",
  "Campus Central · Bloco C · Biblioteca",
  "Campus Norte · Bloco D · Sala 12",
  "Campus Norte · Bloco D · Auditório",
  "Depósito · Almoxarifado",
];

function asset(a: Omit<Asset, "createdAt"> & { createdAt?: string }): Asset {
  return { createdAt: a.createdAt ?? a.acquiredAt, ...a } as Asset;
}

export const assets: Asset[] = [
  asset({ id: "a-001", name: "Desktop Dell OptiPlex 7090", tag: "PAT-000101", categoryId: "cat-comp", brand: "Dell", model: "OptiPlex 7090", serial: "DL7090-88213", location: LOCATIONS[1], sector: "Laboratório de Informática", owner: "Bruno Alves", status: "em-uso", condition: "bom", acquiredAt: "2023-03-14", value: 5890, notes: "Estação do professor.", createdAt: "2023-03-16" }),
  asset({ id: "a-002", name: "Notebook Lenovo ThinkPad E14", tag: "PAT-000102", categoryId: "cat-note", brand: "Lenovo", model: "ThinkPad E14 Gen4", serial: "LN14-77120", location: LOCATIONS[5], sector: "Coordenação de Engenharia", owner: "Camila Souza", status: "emprestado", condition: "bom", acquiredAt: "2024-01-22", value: 4790, createdAt: "2024-01-25" }),
  asset({ id: "a-003", name: "Monitor LG 24\" IPS", tag: "PAT-000103", categoryId: "cat-mon", brand: "LG", model: "24MK430H", serial: "LG24-31007", location: LOCATIONS[0], sector: "Secretaria Acadêmica", owner: "Marina Ribeiro", status: "em-uso", condition: "regular", acquiredAt: "2021-08-02", value: 890, createdAt: "2021-08-05" }),
  asset({ id: "a-004", name: "Projetor Epson PowerLite", tag: "PAT-000104", categoryId: "cat-proj", brand: "Epson", model: "PowerLite X49", serial: "EP49-55321", location: LOCATIONS[6], sector: "Infraestrutura de TI", owner: "Diego Martins", status: "manutencao", condition: "ruim", acquiredAt: "2020-05-11", value: 3200, notes: "Lâmpada com falha intermitente.", createdAt: "2020-05-14" }),
  asset({ id: "a-005", name: "Impressora HP LaserJet Pro", tag: "PAT-000105", categoryId: "cat-imp", brand: "HP", model: "M428fdw", serial: "HP428-90210", location: LOCATIONS[4], sector: "Biblioteca", owner: "Helena Duarte", status: "disponivel", condition: "bom", acquiredAt: "2022-11-09", value: 2790, createdAt: "2022-11-12" }),
  asset({ id: "a-006", name: "Microscópio Binocular", tag: "PAT-000106", categoryId: "cat-lab", brand: "Bioptika", model: "BIO-200", serial: "BP200-11045", location: LOCATIONS[3], sector: "Laboratório de Química", owner: "Fábio Nogueira", status: "em-uso", condition: "bom", acquiredAt: "2023-07-19", value: 6400, createdAt: "2023-07-21" }),
  asset({ id: "a-007", name: "Switch Cisco 24 portas", tag: "PAT-000107", categoryId: "cat-rede", brand: "Cisco", model: "CBS350-24T", serial: "CS24-66710", location: LOCATIONS[7], sector: "Infraestrutura de TI", owner: "Diego Martins", status: "disponivel", condition: "novo", acquiredAt: "2025-02-03", value: 4150, createdAt: "2025-02-05" }),
  asset({ id: "a-008", name: "Cadeira Ergonômica Presidente", tag: "PAT-000108", categoryId: "cat-mob", brand: "Flexform", model: "Ergo Pro", serial: "FF-EP-2210", location: LOCATIONS[2], sector: "Diretoria", owner: "Marina Ribeiro", status: "em-uso", condition: "bom", acquiredAt: "2024-06-27", value: 1890, createdAt: "2024-06-29" }),
  asset({ id: "a-009", name: "Desktop HP ProDesk 400", tag: "PAT-000109", categoryId: "cat-comp", brand: "HP", model: "ProDesk 400 G7", serial: "HP400-42188", location: LOCATIONS[1], sector: "Laboratório de Informática", owner: "Bruno Alves", status: "baixado", condition: "inservivel", acquiredAt: "2017-09-15", value: 3100, notes: "Baixa aprovada em inventário 2025.", createdAt: "2017-09-18" }),
  asset({ id: "a-010", name: "Notebook Acer Aspire 5", tag: "PAT-000110", categoryId: "cat-note", brand: "Acer", model: "Aspire 5 A515", serial: "AC515-73390", location: LOCATIONS[7], sector: "Infraestrutura de TI", owner: "Diego Martins", status: "disponivel", condition: "regular", acquiredAt: "2022-04-08", value: 3390, createdAt: "2022-04-10" }),
  asset({ id: "a-011", name: "Monitor Samsung 27\" Curvo", tag: "PAT-000111", categoryId: "cat-mon", brand: "Samsung", model: "LC27F390", serial: "SS27-10298", location: LOCATIONS[0], sector: "Secretaria Acadêmica", owner: "Marina Ribeiro", status: "disponivel", condition: "bom", acquiredAt: "2024-10-01", value: 1290, createdAt: "2024-10-03" }),
  asset({ id: "a-012", name: "Access Point Ubiquiti U6", tag: "PAT-000112", categoryId: "cat-rede", brand: "Ubiquiti", model: "UniFi U6 Lite", serial: "UB6L-55401", location: LOCATIONS[4], sector: "Infraestrutura de TI", owner: "Diego Martins", status: "em-uso", condition: "novo", acquiredAt: "2025-05-16", value: 890, createdAt: "2025-05-18" }),
  asset({ id: "a-013", name: "Bancada de Química Inox", tag: "PAT-000113", categoryId: "cat-lab", brand: "Labor", model: "BQ-3000", serial: "LB3000-00871", location: LOCATIONS[3], sector: "Laboratório de Química", owner: "Fábio Nogueira", status: "em-uso", condition: "regular", acquiredAt: "2019-02-25", value: 8900, createdAt: "2019-02-28" }),
  asset({ id: "a-014", name: "Projetor BenQ MX550", tag: "PAT-000114", categoryId: "cat-proj", brand: "BenQ", model: "MX550", serial: "BQ550-33019", location: LOCATIONS[2], sector: "Manutenção", owner: "Bruno Alves", status: "manutencao", condition: "ruim", acquiredAt: "2021-01-30", value: 2450, createdAt: "2021-02-02" }),
  asset({ id: "a-015", name: "Armário de Aço 4 Portas", tag: "PAT-000115", categoryId: "cat-mob", brand: "Pandin", model: "AC-400", serial: "PD400-99123", location: LOCATIONS[7], sector: "Almoxarifado", owner: "Helena Duarte", status: "disponivel", condition: "bom", acquiredAt: "2023-12-12", value: 1450, createdAt: "2023-12-14" }),
  asset({ id: "a-016", name: "Notebook Dell Latitude 3520", tag: "PAT-000116", categoryId: "cat-note", brand: "Dell", model: "Latitude 3520", serial: "DL3520-71624", location: LOCATIONS[5], sector: "Diretoria", owner: "Marina Ribeiro", status: "emprestado", condition: "bom", acquiredAt: "2024-08-20", value: 5290, createdAt: "2024-08-22" }),
];

export const assetById = (id: string) => assets.find((a) => a.id === id);
export const assetsByCategory = (categoryId: string) => assets.filter((a) => a.categoryId === categoryId);
