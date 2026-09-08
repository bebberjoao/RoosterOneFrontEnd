// Table: asset_categories — seed movido de rooster/assets/mock-data.ts (INITIAL_CATEGORIES).
export type AssetCategory = {
  id: string;
  name: string;
  description?: string;
  tone: string;
  system?: boolean;
};

export const assetCategories: AssetCategory[] = [
  { id: "cat-comp", name: "Computadores", description: "Desktops e estações de trabalho", tone: "oklch(0.55 0.19 265)", system: true },
  { id: "cat-note", name: "Notebooks", description: "Portáteis institucionais", tone: "oklch(0.68 0.14 195)", system: true },
  { id: "cat-mon", name: "Monitores", description: "Monitores e displays", tone: "oklch(0.6 0.2 305)" },
  { id: "cat-proj", name: "Projetores", description: "Projetores e telas", tone: "oklch(0.68 0.18 40)" },
  { id: "cat-imp", name: "Impressoras", description: "Impressoras e multifuncionais", tone: "oklch(0.72 0.14 90)" },
  { id: "cat-lab", name: "Equipamentos de laboratório", description: "Instrumentos e bancadas", tone: "oklch(0.62 0.18 155)" },
  { id: "cat-mob", name: "Mobiliário", description: "Mesas, cadeiras e armários", tone: "oklch(0.55 0.1 260)" },
  { id: "cat-rede", name: "Equipamentos de rede", description: "Switches, roteadores e APs", tone: "oklch(0.65 0.18 25)" },
  { id: "cat-out", name: "Outros", description: "Itens diversos", tone: "oklch(0.65 0.05 260)" },
];

export const assetCategoryById = (id: string) => assetCategories.find((c) => c.id === id);
