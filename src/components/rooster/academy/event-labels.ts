import type { CalendarEvent } from "@/services/mock-api/academy.service";

export const EVENT_TONE: Record<CalendarEvent["type"], string> = {
  semestre: "oklch(0.55 0.19 265)",
  prova: "oklch(0.65 0.18 25)",
  feriado: "oklch(0.62 0.18 155)",
  reuniao: "oklch(0.6 0.2 305)",
  apresentacao: "oklch(0.68 0.18 40)",
  semana: "oklch(0.68 0.14 195)",
  institucional: "oklch(0.55 0.1 260)",
};

export const EVENT_LABEL: Record<CalendarEvent["type"], string> = {
  semestre: "Semestre",
  prova: "Prova",
  feriado: "Feriado",
  reuniao: "Reunião",
  apresentacao: "Apresentação",
  semana: "Semana acadêmica",
  institucional: "Institucional",
};
