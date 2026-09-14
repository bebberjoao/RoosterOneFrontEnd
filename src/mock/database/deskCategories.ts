// Table: desk_categories (+ desk_subcategories, desk_agents) — seed do Rooster Desk.
// Origem: tickets.ts (CATEGORIES). FK: subcategory.categoryId -> deskCategory.id.
import { CATEGORIES as SRC } from "@/mock/database/tickets";

export type DeskSubcategory = { id: string; name: string; slaHours: number; assignees: string[] };
export type DeskCategory = {
  id: string;
  name: string;
  sector: string;
  owner: string;
  slaHours: number;
  subcategories: DeskSubcategory[];
};

/** Setores que podem manter categorias de chamados. */
export const deskSectors = ["TI", "Suporte", "Audiovisual", "Acadêmico", "Financeiro", "Manutenção"];

/** Atendentes disponíveis para atribuição por subcategoria. */
export const deskAgents = [
  "Bruno Alves", "Camila Souza", "Diego Martins", "Elisa Ferreira",
  "Fábio Nogueira", "Gustavo Lima", "Helena Duarte", "Igor Ramos",
  "Juliana Prado", "Kleber Antunes", "Larissa Monteiro", "Marcelo Tavares",
  "Natália Bezerra", "Otávio Siqueira", "Paula Rezende", "Quésia Farias",
  "Rafael Cardoso", "Simone Vasconcelos", "Thiago Barroso", "Ursula Andrade",
  "Vinícius Peixoto", "Wagner Coelho", "Xênia Moraes", "Yuri Bastos",
  "Zilda Carvalho", "André Bittencourt", "Beatriz Salgado", "Caio Nunes",
  "Daniela Rocha", "Eduardo Pacheco", "Fernanda Klein", "Gabriel Teixeira",
  "Isabela Fontes", "João Vitor Amaral", "Karina Lopes", "Leandro Assis",
];

/** Cargos possíveis do atendente (usado nos filtros da tela Atendentes). */
export const deskAgentRoles = ["Atendente", "Analista", "Especialista", "Supervisor"];

export type DeskAgent = {
  id: string;
  name: string;
  email: string;
  sector: string;
  role: string;
  active: boolean;
};

/** Diretório de atendentes: setor, cargo e status usados nos filtros. */
export const deskAgentDirectory: DeskAgent[] = deskAgents.map((name, i) => ({
  id: `agent-${i + 1}`,
  name,
  email: `${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, ".")}@rooster.edu`,
  sector: deskSectors[i % deskSectors.length],
  role: deskAgentRoles[i % deskAgentRoles.length],
  active: i % 11 !== 0,
}));

export const deskAgentByName = (name: string) => deskAgentDirectory.find((a) => a.name === name);

export const deskCategories: DeskCategory[] = SRC.map((c, i) => ({
  id: c.id,
  name: c.name,
  sector: deskSectors[i % deskSectors.length],
  owner: c.owner,
  slaHours: c.slaHours,
  subcategories: c.subcategories.map((s, j) => ({
    id: `${c.id}-${j}`,
    name: s,
    slaHours: c.slaHours,
    assignees: [deskAgents[(i + j) % deskAgents.length]],
  })),
}));

export const deskCategoryById = (id: string) => deskCategories.find((c) => c.id === id);
