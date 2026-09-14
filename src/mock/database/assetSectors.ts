// Table: asset_sectors — seed movido de rooster/assets/mock-data.ts (INITIAL_SECTORS).
export type AssetSector = {
  id: string;
  name: string;
  description?: string;
  manager?: string;
};

export const SECTORS = [
  "Infraestrutura de TI",
  "Secretaria Acadêmica",
  "Biblioteca",
  "Laboratório de Química",
  "Laboratório de Informática",
  "Coordenação de Engenharia",
  "Diretoria",
  "Manutenção",
];

export const PEOPLE = [
  "Marina Ribeiro",
  "Bruno Alves",
  "Diego Martins",
  "Camila Souza",
  "Helena Duarte",
  "Fábio Nogueira",
];

/** Setores cadastrados (nível 1 da navegação de Patrimônios). */
export const assetSectors: AssetSector[] = SECTORS.map((name, i) => ({
  id: `sec-${String(i + 1).padStart(3, "0")}`,
  name,
  description: `Setor responsável por bens de ${name.toLowerCase()}.`,
  manager: PEOPLE[i % PEOPLE.length],
}));

/** Identificador virtual para patrimônios sem setor cadastrado. */
export const UNASSIGNED_SECTOR_ID = "sec-none";

export const assetSectorById = (id: string) => assetSectors.find((s) => s.id === id);
export const assetSectorByName = (name: string) => assetSectors.find((s) => s.name === name);
