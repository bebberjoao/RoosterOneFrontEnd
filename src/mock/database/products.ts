// Table: products — moved from rooster/finance/mock-data.ts (PRODUCTS).
export type Product = {
  id: string; code: string; name: string; category: string; description: string;
  price: number; stock: number; minStock: number; unit: string; cover: string;
  active: boolean; updatedAt: string;
};

export const products: Product[] = [
  { id: "p1", code: "LIV-001", name: "Apostila de Cálculo I", category: "Livros", description: "Material didático oficial da disciplina.", price: 89.9, stock: 42, minStock: 20, unit: "un", cover: "oklch(0.62 0.18 155)", active: true, updatedAt: "2026-07-10" },
  { id: "p2", code: "UNI-014", name: "Uniforme oficial — Camiseta", category: "Uniformes", description: "Malha piquê com bordado institucional.", price: 79.0, stock: 128, minStock: 40, unit: "un", cover: "oklch(0.6 0.18 260)", active: true, updatedAt: "2026-07-14" },
  { id: "p3", code: "MAT-208", name: "Kit laboratório Química", category: "Kits", description: "Vidrarias, EPI e reagentes básicos.", price: 245.0, stock: 12, minStock: 15, unit: "kit", cover: "oklch(0.68 0.14 195)", active: true, updatedAt: "2026-07-01" },
  { id: "p4", code: "CRA-100", name: "Crachá institucional", category: "Crachás", description: "Personalizado com QR Code de acesso.", price: 25.0, stock: 320, minStock: 100, unit: "un", cover: "oklch(0.72 0.16 90)", active: true, updatedAt: "2026-07-18" },
  { id: "p5", code: "LIV-042", name: "Livro — Direito Constitucional", category: "Livros", description: "Edição 2026 revisada.", price: 189.0, stock: 8, minStock: 10, unit: "un", cover: "oklch(0.55 0.19 265)", active: true, updatedAt: "2026-06-20" },
  { id: "p6", code: "EQU-071", name: "Jaleco Medicina", category: "Uniformes", description: "Jaleco branco em oxford.", price: 149.0, stock: 34, minStock: 20, unit: "un", cover: "oklch(0.68 0.18 40)", active: true, updatedAt: "2026-07-05" },
  { id: "p7", code: "MAT-311", name: "Bloco A4 Rooster", category: "Materiais", description: "Bloco de anotações 100 folhas.", price: 18.5, stock: 540, minStock: 200, unit: "un", cover: "oklch(0.6 0.2 305)", active: true, updatedAt: "2026-07-20" },
  { id: "p8", code: "EQU-090", name: "Kit Robótica Educacional", category: "Equipamentos", description: "Kit com controladora, sensores e motores.", price: 899.0, stock: 6, minStock: 5, unit: "kit", cover: "oklch(0.55 0.1 260)", active: false, updatedAt: "2026-05-10" },
];

export const productById = (id: string) => products.find((p) => p.id === id);
