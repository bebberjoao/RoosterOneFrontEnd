// Table: services — moved from rooster/finance/mock-data.ts (SERVICES).
export type ServiceFreq = "unico" | "mensal" | "anual" | "semestral";
export type Service = {
  id: string; name: string; description: string; price: number;
  category: string; frequency: ServiceFreq; active: boolean; updatedAt: string;
};

export const services: Service[] = [
  { id: "sv1", name: "Mensalidade — Graduação", description: "Mensalidade padrão dos cursos de graduação.", price: 1250.0, category: "Mensalidade", frequency: "mensal", active: true, updatedAt: "2026-01-05" },
  { id: "sv2", name: "Mensalidade — Pós-graduação", description: "Cursos lato sensu.", price: 890.0, category: "Mensalidade", frequency: "mensal", active: true, updatedAt: "2026-01-05" },
  { id: "sv3", name: "Matrícula", description: "Taxa de matrícula anual.", price: 480.0, category: "Matrícula", frequency: "anual", active: true, updatedAt: "2026-01-05" },
  { id: "sv4", name: "Rematrícula", description: "Taxa de rematrícula semestral.", price: 240.0, category: "Matrícula", frequency: "semestral", active: true, updatedAt: "2026-01-05" },
  { id: "sv5", name: "2ª via de documento", description: "Emissão de segunda via de documentos.", price: 45.0, category: "Taxa", frequency: "unico", active: true, updatedAt: "2026-02-14" },
  { id: "sv6", name: "Emissão de certificado", description: "Certificado impresso ou digital.", price: 65.0, category: "Certificado", frequency: "unico", active: true, updatedAt: "2026-03-01" },
  { id: "sv7", name: "Taxa de biblioteca", description: "Renovação anual.", price: 60.0, category: "Taxa", frequency: "anual", active: true, updatedAt: "2026-01-10" },
  { id: "sv8", name: "Inscrição em evento", description: "Congressos e workshops institucionais.", price: 120.0, category: "Evento", frequency: "unico", active: true, updatedAt: "2026-04-22" },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);
