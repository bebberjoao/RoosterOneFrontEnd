export type SpaceType =
  | "sala"
  | "lab"
  | "lab-info"
  | "auditorio"
  | "biblioteca"
  | "reuniao"
  | "ginasio"
  | "quadra"
  | "anfiteatro"
  | "multiuso"
  | "estudio"
  | "outro";

export type ReservationStatus =
  | "confirmada"
  | "analise"
  | "cancelada"
  | "finalizada"
  | "andamento";

export type SpaceStatus = "disponivel" | "em-uso" | "manutencao" | "bloqueado";

export type ReservationEvent =
  | { id: string; kind: "message"; author: string; role: "solicitante" | "gestor"; at: string; body: string }
  | { id: string; kind: "status"; author: string; at: string; from: ReservationStatus; to: ReservationStatus; reason?: string }
  | { id: string; kind: "schedule"; author: string; at: string; from: string; to: string; reason?: string };

export type Campus = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  manager: string;
  active: boolean;
  notes?: string;
  color: string;
};

export type Block = {
  id: string;
  name: string;
  code: string;
  campusId: string;
  floors: number;
  manager: string;
  active: boolean;
};

export type Resource =
  | "projetor"
  | "smart-tv"
  | "computadores"
  | "notebook"
  | "som"
  | "microfone"
  | "ar"
  | "internet"
  | "lousa-digital"
  | "lousa"
  | "impressora"
  | "bancadas"
  | "lab-equip";

export type Space = {
  id: string;
  name: string;
  code: string;
  campusId: string;
  blockId: string;
  floor: number;
  number: string;
  type: SpaceType;
  capacity: number;
  area: number;
  description: string;
  cover: string;
  gallery: string[];
  resources: Resource[];
  status: SpaceStatus;
  openingHours: string;
  weekdays: string[];
  /** Períodos de horário reserváveis, ex.: "07:00-08:00". Se ausente, são gerados a partir de openingHours. */
  slots?: string[];
  /** Duração padrão (min) usada para gerar os períodos quando `slots` não está definido. */
  slotMinutes?: number;
};

export type Reservation = {
  id: string;
  code: string;
  spaceId: string;
  /** Id real do usuário dono da reserva (JWT no backend) — use para checar "é minha reserva?", nunca `responsible` (nome exibido, não confiável para identidade). */
  responsibleId?: string;
  responsible: string;
  sector: string;
  event: string;
  purpose: string;
  date: string; // yyyy-mm-dd
  start: string; // HH:MM
  end: string; // HH:MM
  participants: number;
  status: ReservationStatus;
  recurrence?: "diaria" | "semanal" | "mensal" | "unica";
  notes?: string;
  events: ReservationEvent[];
  cancellationReason?: string;
  decidedBy?: string;
};

export const SPACE_TYPE_LABEL: Record<SpaceType, string> = {
  sala: "Sala de Aula",
  lab: "Laboratório",
  "lab-info": "Lab. de Informática",
  auditorio: "Auditório",
  biblioteca: "Biblioteca",
  reuniao: "Sala de Reunião",
  ginasio: "Ginásio",
  quadra: "Quadra",
  anfiteatro: "Anfiteatro",
  multiuso: "Sala Multiuso",
  estudio: "Estúdio",
  outro: "Outro",
};

export const SPACE_TYPE_TONE: Record<SpaceType, string> = {
  sala: "oklch(0.6 0.18 260)",
  lab: "oklch(0.62 0.18 155)",
  "lab-info": "oklch(0.55 0.19 265)",
  auditorio: "oklch(0.68 0.18 40)",
  biblioteca: "oklch(0.72 0.14 90)",
  reuniao: "oklch(0.68 0.14 195)",
  ginasio: "oklch(0.6 0.22 25)",
  quadra: "oklch(0.7 0.16 145)",
  anfiteatro: "oklch(0.6 0.2 305)",
  multiuso: "oklch(0.6 0.02 260)",
  estudio: "oklch(0.65 0.18 25)",
  outro: "oklch(0.55 0.02 260)",
};

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmada: "Confirmada",
  analise: "Em análise",
  cancelada: "Cancelada",
  finalizada: "Finalizada",
  andamento: "Em andamento",
};

export const STATUS_TONE: Record<ReservationStatus, string> = {
  confirmada: "oklch(0.62 0.18 155)",
  analise: "oklch(0.72 0.14 90)",
  cancelada: "oklch(0.6 0.22 25)",
  finalizada: "oklch(0.6 0.02 260)",
  andamento: "oklch(0.55 0.19 265)",
};

export const SPACE_STATUS_LABEL: Record<SpaceStatus, string> = {
  disponivel: "Disponível",
  "em-uso": "Em uso",
  manutencao: "Manutenção",
  bloqueado: "Bloqueado",
};

export const SPACE_STATUS_TONE: Record<SpaceStatus, string> = {
  disponivel: "oklch(0.62 0.18 155)",
  "em-uso": "oklch(0.55 0.19 265)",
  manutencao: "oklch(0.72 0.14 90)",
  bloqueado: "oklch(0.6 0.22 25)",
};

export const RESOURCE_LABEL: Record<Resource, string> = {
  projetor: "Projetor",
  "smart-tv": "Smart TV",
  computadores: "Computadores",
  notebook: "Notebook",
  som: "Sistema de som",
  microfone: "Microfone",
  ar: "Ar-condicionado",
  internet: "Internet",
  "lousa-digital": "Lousa digital",
  lousa: "Lousa",
  impressora: "Impressora",
  bancadas: "Bancadas",
  "lab-equip": "Equip. laboratoriais",
};

export const CAMPUSES: Campus[] = [
  { id: "cp1", name: "Campus Central", code: "CEN", address: "Av. Universitária, 1200", city: "Curitiba", state: "PR", zip: "80.000-000", manager: "Marina Ribeiro", active: true, color: "oklch(0.55 0.19 265)", notes: "Sede administrativa e acadêmica." },
  { id: "cp2", name: "Campus Tecnológico", code: "TEC", address: "Rua da Inovação, 340", city: "Curitiba", state: "PR", zip: "81.500-000", manager: "Bruno Alves", active: true, color: "oklch(0.6 0.18 260)", notes: "Laboratórios de engenharia e computação." },
  { id: "cp3", name: "Campus Saúde", code: "SDE", address: "Av. das Clínicas, 55", city: "Curitiba", state: "PR", zip: "82.100-000", manager: "Camila Souza", active: true, color: "oklch(0.62 0.18 155)", notes: "Clínicas escola e laboratórios de biomédicas." },
  { id: "cp4", name: "Campus Extensão", code: "EXT", address: "Rua Cultura, 20", city: "Pinhais", state: "PR", zip: "83.320-000", manager: "Júlia Castro", active: false, color: "oklch(0.68 0.18 40)", notes: "Em reforma até 09/2026." },
];

export const BLOCKS: Block[] = [
  { id: "bl1", name: "Bloco A — Administrativo", code: "A", campusId: "cp1", floors: 4, manager: "Marina Ribeiro", active: true },
  { id: "bl2", name: "Bloco B — Aulas Gerais", code: "B", campusId: "cp1", floors: 3, manager: "Camila Souza", active: true },
  { id: "bl3", name: "Bloco C — Auditórios", code: "C", campusId: "cp1", floors: 2, manager: "Helena Duarte", active: true },
  { id: "bl4", name: "Bloco T1 — Engenharia", code: "T1", campusId: "cp2", floors: 3, manager: "Diego Martins", active: true },
  { id: "bl5", name: "Bloco T2 — Computação", code: "T2", campusId: "cp2", floors: 4, manager: "Bruno Alves", active: true },
  { id: "bl6", name: "Bloco S — Clínicas", code: "S", campusId: "cp3", floors: 2, manager: "Camila Souza", active: true },
  { id: "bl7", name: "Bloco S2 — Laboratórios", code: "S2", campusId: "cp3", floors: 3, manager: "Fábio Nogueira", active: true },
];

const COVERS = [
  "linear-gradient(135deg, oklch(0.6 0.18 260), oklch(0.68 0.18 305))",
  "linear-gradient(135deg, oklch(0.68 0.18 40), oklch(0.72 0.16 90))",
  "linear-gradient(135deg, oklch(0.62 0.18 155), oklch(0.7 0.16 195))",
  "linear-gradient(135deg, oklch(0.55 0.19 265), oklch(0.6 0.22 305))",
  "linear-gradient(135deg, oklch(0.6 0.22 25), oklch(0.68 0.18 40))",
  "linear-gradient(135deg, oklch(0.7 0.16 145), oklch(0.72 0.14 195))",
];

type SpaceSeed = Omit<Space, "cover" | "gallery">;

const SPACE_SEED: SpaceSeed[] = [
  { id: "sp1", name: "Sala 201", code: "CEN-B-201", campusId: "cp1", blockId: "bl2", floor: 2, number: "201", type: "sala", capacity: 45, area: 62, description: "Sala de aula ampla com iluminação natural.", resources: ["projetor", "ar", "internet", "lousa"], status: "disponivel", openingHours: "07:00 – 22:30", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp2", name: "Sala 305", code: "CEN-B-305", campusId: "cp1", blockId: "bl2", floor: 3, number: "305", type: "sala", capacity: 60, area: 74, description: "Sala com layout flexível.", resources: ["projetor", "ar", "internet", "lousa", "microfone"], status: "em-uso", openingHours: "07:00 – 22:30", weekdays: ["seg", "ter", "qua", "qui", "sex", "sab"] },
  { id: "sp3", name: "Auditório Machado", code: "CEN-C-AUD1", campusId: "cp1", blockId: "bl3", floor: 1, number: "AUD1", type: "auditorio", capacity: 220, area: 340, description: "Auditório principal para eventos institucionais.", resources: ["projetor", "som", "microfone", "ar", "internet"], status: "disponivel", openingHours: "08:00 – 22:00", weekdays: ["seg", "ter", "qua", "qui", "sex", "sab"] },
  { id: "sp4", name: "Sala de Reunião Vega", code: "CEN-A-402", campusId: "cp1", blockId: "bl1", floor: 4, number: "402", type: "reuniao", capacity: 12, area: 24, description: "Reuniões executivas com Smart TV.", resources: ["smart-tv", "ar", "internet"], status: "disponivel", openingHours: "07:00 – 21:00", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp5", name: "Biblioteca Central", code: "CEN-A-BIB", campusId: "cp1", blockId: "bl1", floor: 1, number: "BIB", type: "biblioteca", capacity: 180, area: 420, description: "Biblioteca com salas de estudo em grupo.", resources: ["ar", "internet", "computadores", "impressora"], status: "disponivel", openingHours: "07:00 – 22:30", weekdays: ["seg", "ter", "qua", "qui", "sex", "sab"] },
  { id: "sp6", name: "Lab. Informática 1", code: "TEC-T2-LI1", campusId: "cp2", blockId: "bl5", floor: 1, number: "LI1", type: "lab-info", capacity: 32, area: 68, description: "40 estações de trabalho com desenvolvimento web.", resources: ["computadores", "projetor", "ar", "internet", "lousa-digital"], status: "em-uso", openingHours: "07:00 – 22:00", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp7", name: "Lab. Informática 2", code: "TEC-T2-LI2", campusId: "cp2", blockId: "bl5", floor: 1, number: "LI2", type: "lab-info", capacity: 32, area: 68, description: "Lab. focado em análise de dados.", resources: ["computadores", "projetor", "ar", "internet"], status: "manutencao", openingHours: "07:00 – 22:00", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp8", name: "Lab. Redes", code: "TEC-T2-LR", campusId: "cp2", blockId: "bl5", floor: 2, number: "LR", type: "lab", capacity: 24, area: 55, description: "Bancadas de redes e cabeamento estruturado.", resources: ["bancadas", "computadores", "ar", "internet", "projetor"], status: "disponivel", openingHours: "08:00 – 21:00", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp9", name: "Lab. Eletrônica", code: "TEC-T1-LE", campusId: "cp2", blockId: "bl4", floor: 2, number: "LE", type: "lab", capacity: 20, area: 60, description: "Bancadas de eletrônica analógica e digital.", resources: ["bancadas", "lab-equip", "internet"], status: "disponivel", openingHours: "08:00 – 21:00", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp10", name: "Estúdio Multimídia", code: "TEC-T1-EST", campusId: "cp2", blockId: "bl4", floor: 3, number: "EST", type: "estudio", capacity: 8, area: 32, description: "Gravação de vídeo e áudio para EAD.", resources: ["som", "microfone", "smart-tv", "internet", "ar"], status: "disponivel", openingHours: "09:00 – 20:00", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp11", name: "Clínica 1 — Fisioterapia", code: "SDE-S-CL1", campusId: "cp3", blockId: "bl6", floor: 1, number: "CL1", type: "multiuso", capacity: 20, area: 80, description: "Atendimento supervisionado de fisioterapia.", resources: ["ar", "internet", "lab-equip"], status: "em-uso", openingHours: "08:00 – 18:00", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp12", name: "Lab. Anatomia", code: "SDE-S2-LA", campusId: "cp3", blockId: "bl7", floor: 1, number: "LA", type: "lab", capacity: 30, area: 90, description: "Laboratório de anatomia humana.", resources: ["lab-equip", "ar", "internet", "projetor"], status: "disponivel", openingHours: "08:00 – 20:00", weekdays: ["seg", "ter", "qua", "qui", "sex"] },
  { id: "sp13", name: "Anfiteatro Saúde", code: "SDE-S-ANF", campusId: "cp3", blockId: "bl6", floor: 1, number: "ANF", type: "anfiteatro", capacity: 120, area: 200, description: "Anfiteatro para aulas magnas e defesas.", resources: ["projetor", "som", "microfone", "ar", "internet"], status: "disponivel", openingHours: "08:00 – 22:00", weekdays: ["seg", "ter", "qua", "qui", "sex", "sab"] },
  { id: "sp14", name: "Ginásio Poliesportivo", code: "CEN-C-GIN", campusId: "cp1", blockId: "bl3", floor: 1, number: "GIN", type: "ginasio", capacity: 500, area: 1200, description: "Ginásio para eventos esportivos.", resources: ["som", "internet"], status: "disponivel", openingHours: "07:00 – 22:00", weekdays: ["seg", "ter", "qua", "qui", "sex", "sab"] },
  { id: "sp15", name: "Quadra Externa", code: "CEN-C-QD1", campusId: "cp1", blockId: "bl3", floor: 0, number: "QD1", type: "quadra", capacity: 80, area: 800, description: "Quadra externa poliesportiva.", resources: [], status: "disponivel", openingHours: "07:00 – 22:00", weekdays: ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] },
  { id: "sp16", name: "Sala Multiuso Alfa", code: "CEN-B-M01", campusId: "cp1", blockId: "bl2", floor: 1, number: "M01", type: "multiuso", capacity: 40, area: 70, description: "Sala com mobiliário modular.", resources: ["projetor", "ar", "internet", "smart-tv"], status: "disponivel", openingHours: "07:00 – 22:00", weekdays: ["seg", "ter", "qua", "qui", "sex", "sab"] },
];

export const SPACES: Space[] = SPACE_SEED.map((s, i) => ({
  ...s,
  cover: COVERS[i % COVERS.length],
  gallery: [COVERS[(i + 1) % COVERS.length], COVERS[(i + 2) % COVERS.length], COVERS[(i + 3) % COVERS.length]],
}));

const RESPONSIBLES = [
  { name: "Ana Prado", sector: "Engenharia" },
  { name: "Helena Duarte", sector: "Letras" },
  { name: "Bruno Alves", sector: "TI" },
  { name: "Camila Souza", sector: "Acadêmico" },
  { name: "Diego Martins", sector: "Engenharia" },
  { name: "Fábio Nogueira", sector: "Financeiro" },
  { name: "Marina Ribeiro", sector: "Direção" },
  { name: "Júlia Castro", sector: "Extensão" },
  { name: "Elisa Ferreira", sector: "Direito" },
];

const EVENTS = [
  "Aula regular",
  "Defesa de TCC",
  "Reunião de colegiado",
  "Palestra institucional",
  "Prova aplicada",
  "Grupo de estudos",
  "Treinamento interno",
  "Evento de extensão",
  "Semana acadêmica",
  "Oficina prática",
];

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const STATUSES: ReservationStatus[] = ["confirmada", "analise", "confirmada", "confirmada", "finalizada", "andamento", "confirmada", "cancelada"];

function mkReservation(i: number, dayOffset: number, hour: number, dur: number, spaceIdx: number): Reservation {
  const r = RESPONSIBLES[i % RESPONSIBLES.length];
  const s = SPACES[spaceIdx % SPACES.length];
  const status = STATUSES[i % STATUSES.length];
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() + Math.min(dayOffset - 2, -1));
  createdAt.setHours(9 + (i % 4), 15, 0, 0);
  const events: ReservationEvent[] = [{
    id: `rev-${dayOffset}-${i}-created`, kind: "message", author: r.name, role: "solicitante",
    at: createdAt.toISOString(),
    body: i % 3 === 0 ? "Preciso que o projetor seja testado antes do início. Obrigado!" : "Solicitação enviada para análise da equipe de reservas.",
  }];
  if (status !== "analise") {
    const answeredAt = new Date(createdAt);
    answeredAt.setHours(answeredAt.getHours() + 3);
    events.push({
      id: `rev-${dayOffset}-${i}-reply`, kind: "message", author: "Equipe de Reservas", role: "gestor",
      at: answeredAt.toISOString(),
      body: status === "cancelada" ? "A solicitação foi revisada. Consulte o motivo no histórico." : "Olá! Conferimos a disponibilidade e sua solicitação está registrada.",
    });
  }
  return {
    id: `r${dayOffset}-${i}-${spaceIdx}`,
    code: `RES-2026-${(1000 + i * 7 + dayOffset * 13 + spaceIdx).toString().slice(-4)}`,
    spaceId: s.id,
    responsible: r.name,
    sector: r.sector,
    event: EVENTS[i % EVENTS.length],
    purpose: EVENTS[i % EVENTS.length],
    date: todayISO(dayOffset),
    start: `${pad(hour)}:00`,
    end: `${pad(hour + dur)}:00`,
    participants: 8 + ((i * 5 + spaceIdx * 3) % Math.max(1, s.capacity - 8)),
    status,
    recurrence: i % 5 === 0 ? "semanal" : "unica",
    notes: i % 3 === 0 ? "Precisa de projetor testado 30 min antes." : undefined,
    events,
    cancellationReason: status === "cancelada" ? "Ambiente indisponível para manutenção preventiva." : undefined,
    decidedBy: status === "analise" ? undefined : "Equipe de Reservas",
  };
}

const RES: Reservation[] = [];
let counter = 0;
for (let d = -4; d <= 10; d++) {
  for (let sIdx = 0; sIdx < SPACES.length; sIdx++) {
    const perDay = ((sIdx + Math.abs(d)) % 3) + 1;
    let hour = 7 + (sIdx % 3);
    for (let k = 0; k < perDay; k++) {
      const dur = 1 + ((counter + k) % 3);
      if (hour + dur > 22) break;
      RES.push(mkReservation(counter, d, hour, dur, sIdx));
      hour += dur + 1;
      counter++;
    }
  }
}

export const RESERVATIONS: Reservation[] = RES;

export const RESERVATIONS_PER_MONTH = [
  { m: "Jan", v: 214 },
  { m: "Fev", v: 268 },
  { m: "Mar", v: 342 },
  { m: "Abr", v: 310 },
  { m: "Mai", v: 388 },
  { m: "Jun", v: 421 },
  { m: "Jul", v: 462 },
];

export const PEAK_HOURS = [
  { h: "07h", v: 12 },
  { h: "08h", v: 34 },
  { h: "09h", v: 58 },
  { h: "10h", v: 62 },
  { h: "11h", v: 41 },
  { h: "13h", v: 28 },
  { h: "14h", v: 55 },
  { h: "15h", v: 68 },
  { h: "16h", v: 60 },
  { h: "17h", v: 44 },
  { h: "19h", v: 71 },
  { h: "20h", v: 78 },
  { h: "21h", v: 52 },
];

export function campusById(id: string) {
  return CAMPUSES.find((c) => c.id === id);
}
export function blockById(id: string) {
  return BLOCKS.find((b) => b.id === id);
}
export function spaceById(id: string) {
  return SPACES.find((s) => s.id === id);
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatWeekday(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long" });
}

export function startOfWeek(base: Date) {
  const d = new Date(base);
  const day = d.getDay(); // 0 sun .. 6 sat
  const diff = (day + 6) % 7; // monday-first
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function hourToMinutes(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export const WEEKDAY_LABEL: Record<string, string> = {
  seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom",
};

export function conflicts(spaceId: string, date: string, start: string, end: string, ignoreId?: string) {
  const s = hourToMinutes(start);
  const e = hourToMinutes(end);
  return RESERVATIONS.filter(
    (r) =>
      r.id !== ignoreId &&
      r.spaceId === spaceId &&
      r.date === date &&
      r.status !== "cancelada" &&
      Math.max(s, hourToMinutes(r.start)) < Math.min(e, hourToMinutes(r.end)),
  );
}