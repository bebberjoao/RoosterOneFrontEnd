// Table: tickets — seed movido de rooster/desk/mock-data.ts (TICKETS/CATEGORIES). FK: categoryId (category).

export type TicketStatus = "aberto" | "atendimento" | "pendente" | "resolvido" | "encerrado";
export type TicketPriority = "baixa" | "media" | "alta" | "critica";

export type TicketCategory = {
  id: string;
  name: string;
  color: string; // oklch
  icon: string;
  slaHours: number;
  owner: string;
  subcategories: string[];
};

export type TicketEvent =
  | { kind: "message"; author: string; role: "solicitante" | "tecnico" | "coordenador"; at: string; body: string; internal?: boolean; attachments?: string[] }
  | { kind: "status"; at: string; author: string; from: TicketStatus; to: TicketStatus }
  | { kind: "priority"; at: string; author: string; from: TicketPriority; to: TicketPriority }
  | { kind: "assign"; at: string; author: string; to: string }
  | { kind: "category"; at: string; author: string; to: string };

/** Formato "cru" do seed, antes de normalizar `category` -> `categoryId`. */
type TicketSeed = {
  id: string;
  number: string;
  title: string;
  category: string;
  subcategory: string;
  requester: { name: string; role: string; sector: string };
  assignee: { name: string; role: string } | null;
  priority: TicketPriority;
  status: TicketStatus;
  slaPercent: number; // 0-100 (remaining)
  slaDeadline: string;
  openedAt: string;
  updatedAt: string;
  description: string;
  tags: string[];
  favorite?: boolean;
  events: TicketEvent[];
};

export type Ticket = Omit<TicketSeed, "category"> & { categoryId: string };

export const CATEGORIES: TicketCategory[] = [
  { id: "ti", name: "Infraestrutura de TI", color: "oklch(0.6 0.18 260)", icon: "Server", slaHours: 8, owner: "Bruno Alves", subcategories: ["Rede", "Servidores", "Cloud"] },
  { id: "sup", name: "Suporte ao usuário", color: "oklch(0.65 0.18 25)", icon: "LifeBuoy", slaHours: 4, owner: "Camila Souza", subcategories: ["Login", "E-mail", "Impressora"] },
  { id: "av", name: "Audiovisual", color: "oklch(0.72 0.16 90)", icon: "Projector", slaHours: 2, owner: "Diego Martins", subcategories: ["Projetores", "Áudio", "Videoconferência"] },
  { id: "aca", name: "Sistema acadêmico", color: "oklch(0.7 0.16 145)", icon: "GraduationCap", slaHours: 12, owner: "Elisa Ferreira", subcategories: ["Notas", "Matrícula", "Portal aluno"] },
  { id: "fin", name: "Financeiro", color: "oklch(0.62 0.18 155)", icon: "Wallet", slaHours: 24, owner: "Fábio Nogueira", subcategories: ["Boletos", "Reembolsos"] },
  { id: "inf", name: "Infraestrutura predial", color: "oklch(0.55 0.1 260)", icon: "Building", slaHours: 24, owner: "Gustavo Lima", subcategories: ["Elétrica", "Hidráulica", "Ar-condicionado"] },
];

const NAMES = [
  ["Ana Prado", "Aluna", "Engenharia"],
  ["Bruno Alves", "Técnico", "TI"],
  ["Camila Souza", "Coordenadora", "Acadêmico"],
  ["Diego Martins", "Professor", "Computação"],
  ["Elisa Ferreira", "Aluna", "Direito"],
  ["Fábio Nogueira", "Servidor", "Financeiro"],
  ["Gustavo Lima", "Técnico", "Manutenção"],
  ["Helena Duarte", "Professora", "Letras"],
  ["Igor Ramos", "Aluno", "Medicina"],
  ["Júlia Castro", "Coordenadora", "Extensão"],
];

const TITLES = [
  "Projetor da sala 204 não liga",
  "Erro ao lançar notas no portal",
  "Wi-Fi instável no bloco B",
  "Impressora do setor financeiro travada",
  "Solicitar acesso ao sistema acadêmico",
  "Ar-condicionado do auditório com ruído",
  "Boleto duplicado em maio/2026",
  "Reset de senha do e-mail institucional",
  "Câmera da sala híbrida sem imagem",
  "Matrícula não aparece no portal do aluno",
  "Chave da sala 312 emperrada",
  "Videoconferência com eco recorrente",
  "Servidor de arquivos fora do ar",
  "Portal do aluno lento pela manhã",
  "Reembolso de disciplina cancelada",
];

const STATUSES: TicketStatus[] = ["aberto", "atendimento", "pendente", "resolvido", "encerrado"];
const PRIOS: TicketPriority[] = ["baixa", "media", "alta", "critica"];

function iso(daysAgo: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const TICKETS: TicketSeed[] = TITLES.map((title, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length];
  const req = NAMES[i % NAMES.length];
  const tech = NAMES[(i + 3) % NAMES.length];
  const status = STATUSES[i % STATUSES.length];
  const priority = PRIOS[i % PRIOS.length];
  const sla = [92, 78, 61, 44, 33, 21, 12, 8, 55, 70, 88, 46, 27, 82, 66][i];
  return {
    id: `tk-${1000 + i}`,
    number: `#${(4820 + i).toString()}`,
    title,
    category: cat.id,
    subcategory: cat.subcategories[i % cat.subcategories.length],
    requester: { name: req[0], role: req[1], sector: req[2] },
    assignee: status === "aberto" ? null : { name: tech[0], role: tech[1] },
    priority,
    status,
    slaPercent: sla,
    slaDeadline: iso(-(i % 5), 18),
    openedAt: iso(i % 12, 9 + (i % 6)),
    updatedAt: iso((i % 12) - 1 < 0 ? 0 : (i % 12) - 1, 14),
    description:
      "Descrição resumida do incidente reportado pelo solicitante. Inclui contexto, horários envolvidos e impacto percebido na operação.",
    tags: i % 3 === 0 ? ["recorrente"] : i % 4 === 0 ? ["vip"] : [],
    favorite: i % 5 === 0,
    events: [
      { kind: "message", author: req[0], role: "solicitante", at: iso(i % 12, 9), body: "Olá, estou com o seguinte problema descrito acima. Poderiam verificar assim que possível?" },
      { kind: "assign", author: "Sistema", at: iso(i % 12, 10), to: tech[0] },
      { kind: "status", author: tech[0], at: iso(i % 12, 11), from: "aberto", to: "atendimento" },
      { kind: "message", author: tech[0], role: "tecnico", at: iso(i % 12, 12), body: "Olá! Estou verificando o caso. Já iniciei o diagnóstico e retorno em breve com uma posição." },
      { kind: "message", author: tech[0], role: "tecnico", at: iso(Math.max(0, (i % 12) - 1), 15), body: "Anotação interna: peça de reposição solicitada ao fornecedor.", internal: true },
    ],
  };
});

export const ticketCategories: TicketCategory[] = CATEGORIES;
export const tickets: Ticket[] = TICKETS.map(({ category, ...rest }) => ({ ...rest, categoryId: category }));

export const ticketById = (id: string) => tickets.find((t) => t.id === id);
export const ticketsByCategory = (categoryId: string) => tickets.filter((t) => t.categoryId === categoryId);
