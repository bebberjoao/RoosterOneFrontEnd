// Table: discounts — moved from rooster/finance/mock-data.ts (DISCOUNTS). Bolsas e descontos.
export type Discount = {
  id: string; name: string;
  kind: "bolsa-integral" | "bolsa-parcial" | "desc-percent" | "desc-fixo" | "convenio" | "promocao";
  value: number; unit: "percent" | "fixo"; reason: string; responsible: string;
  validity: string; active: boolean; beneficiaries: number;
};

export const discounts: Discount[] = [
  { id: "d1", name: "Bolsa Mérito 50%", kind: "bolsa-parcial", value: 50, unit: "percent", reason: "Alto desempenho acadêmico", responsible: "Coord. Acadêmica", validity: "2026-01-01 → 2026-12-31", active: true, beneficiaries: 34 },
  { id: "d2", name: "Bolsa Integral Prouni", kind: "bolsa-integral", value: 100, unit: "percent", reason: "Programa federal", responsible: "Financeiro", validity: "2026-01-01 → 2026-12-31", active: true, beneficiaries: 12 },
  { id: "d3", name: "Convênio Empresarial A", kind: "convenio", value: 20, unit: "percent", reason: "Convênio corporativo", responsible: "Marketing", validity: "2026-01-01 → 2026-12-31", active: true, beneficiaries: 58 },
  { id: "d4", name: "Promoção Rematrícula", kind: "promocao", value: 15, unit: "percent", reason: "Campanha de retenção", responsible: "Direção", validity: "2026-06-01 → 2026-08-31", active: true, beneficiaries: 210 },
  { id: "d5", name: "Desconto Pontualidade", kind: "desc-percent", value: 5, unit: "percent", reason: "Pagamento até dia 5", responsible: "Financeiro", validity: "Contínuo", active: true, beneficiaries: 640 },
  { id: "d6", name: "Desconto Fixo Funcionário", kind: "desc-fixo", value: 200, unit: "fixo", reason: "Benefício aos funcionários", responsible: "RH", validity: "Contínuo", active: true, beneficiaries: 22 },
];

export const discountById = (id: string) => discounts.find((d) => d.id === id);
