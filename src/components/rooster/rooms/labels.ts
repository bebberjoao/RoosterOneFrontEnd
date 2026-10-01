// Presentation-only label/tone dictionaries and date helpers for Rooster Rooms.
// Domain data itself is only read through `@/services/mock-api`.
import type { Room } from "@/mock/database/rooms";
import type { Reservation } from "@/mock/database/reservations";
import { fmtData, soData } from "@/lib/formatacao";

export type SpaceType = Room["type"];
export type SpaceStatus = Room["status"];
export type ReservationStatus = Reservation["status"];
export type Resource = Room["resources"][number];

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

export const WEEKDAY_LABEL: Record<string, string> = {
  seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom",
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfWeek(base: Date) {
  const d = new Date(base);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function hourToMinutes(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function formatDate(iso: string) {
  return fmtData(iso);
}

export function formatWeekday(iso: string) {
  const d = new Date(soData(iso) + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long" });
}

/** Detects time-overlap conflicts for a room, given an already-loaded reservations list. */
export function findConflicts(
  reservations: Reservation[],
  roomId: string,
  date: string,
  start: string,
  end: string,
  ignoreId?: string,
) {
  const s = hourToMinutes(start);
  const e = hourToMinutes(end);
  return reservations.filter(
    (r) =>
      r.id !== ignoreId &&
      r.roomId === roomId &&
      r.date === date &&
      r.status !== "cancelada" &&
      Math.max(s, hourToMinutes(r.start)) < Math.min(e, hourToMinutes(r.end)),
  );
}

/* ---------------- Períodos de horário (slots) ---------------- */

export type TimeSlot = { start: string; end: string; label: string };

/** Extrai o intervalo de funcionamento ("07:00 – 22:30") em minutos. */
export function parseOpeningHours(openingHours?: string): { start: string; end: string } {
  const found = (openingHours ?? "").match(/\d{1,2}:\d{2}/g);
  if (found && found.length >= 2) return { start: found[0].padStart(5, "0"), end: found[1].padStart(5, "0") };
  return { start: "07:00", end: "22:00" };
}

function minutesToHour(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Gera períodos sequenciais dentro de um intervalo. */
export function buildSlots(start: string, end: string, minutes = 60): TimeSlot[] {
  const s = hourToMinutes(start);
  const e = hourToMinutes(end);
  const step = Math.max(15, minutes || 60);
  const out: TimeSlot[] = [];
  for (let t = s; t + step <= e; t += step) {
    const a = minutesToHour(t);
    const b = minutesToHour(t + step);
    out.push({ start: a, end: b, label: `${a} - ${b}` });
  }
  return out;
}

/** Períodos reserváveis de um ambiente (cadastrados na Estrutura física ou derivados do funcionamento). */
export function roomSlots(room: Pick<Room, "openingHours" | "slots" | "slotMinutes">): TimeSlot[] {
  if (room.slots?.length) {
    return room.slots
      .map((raw) => {
        const parts = raw.match(/\d{1,2}:\d{2}/g);
        if (!parts || parts.length < 2) return null;
        const [a, b] = parts;
        return { start: a, end: b, label: `${a} - ${b}` };
      })
      .filter((x): x is TimeSlot => !!x)
      .sort((a, b) => a.start.localeCompare(b.start));
  }
  const { start, end } = parseOpeningHours(room.openingHours);
  return buildSlots(start, end, room.slotMinutes ?? 60);
}
