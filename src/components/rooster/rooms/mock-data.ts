// Tipos do domínio Rooster Rooms. Dados reais vêm sempre de `@/services/mock-api`
// (`roomService`, ligado ao backend); rótulos/tons/helpers de apresentação ficam em `labels.ts`.

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
  /** Turma vinculada (só faz sentido quando purpose === "aula") — o professor dono da turma escolhe ao criar a reserva. */
  turmaId?: string;
  turma?: { id: string; code: string; disciplineName?: string };
};
