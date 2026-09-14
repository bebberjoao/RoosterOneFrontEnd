// Table: calendar_events — array owned here (seed source of truth).
// src/components/rooster/academy/mock-data.ts re-exports EVENTS from this file for compatibility.
import type { CalendarEvent as SrcCalendarEvent } from "@/components/rooster/academy/mock-data";

export type CalendarEvent = SrcCalendarEvent;

const isoOf = (d: Date) => d.toISOString().slice(0, 10);
const shift = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return isoOf(d); };

export const calendarEvents: CalendarEvent[] = [
  { id: "e1", title: "Início do semestre 2026.1", date: "2026-02-09", type: "semestre", audience: "Todos" },
  { id: "e2", title: "Reunião pedagógica", date: shift(1), time: "14:00-16:00", type: "reuniao", audience: "Coordenação e docentes", location: "Auditório" },
  { id: "e3", title: "Prova P1 · Engenharia de Software II", date: shift(6), time: "19:00-21:00", type: "prova", audience: "ENG-SW 3º semestre", location: "Sala 402" },
  { id: "e4", title: "Feriado — Tiradentes", date: "2026-04-21", type: "feriado", audience: "Todos" },
  { id: "e5", title: "Semana Acadêmica de Computação", date: "2026-05-04", end: "2026-05-08", type: "semana", audience: "ENG-SW", location: "Campus Central" },
  { id: "e6", title: "Apresentação de TCC", date: shift(14), time: "09:00-12:00", type: "apresentacao", audience: "Bacharelandos", location: "Auditório" },
  { id: "e7", title: "Encerramento do semestre 2026.1", date: "2026-06-27", type: "semestre", audience: "Todos" },
  { id: "e8", title: "Colação de grau", date: shift(30), type: "institucional", audience: "Formandos" },
  { id: "e9", title: "Aula magna", date: shift(3), time: "20:00-22:00", type: "institucional", audience: "Todos", location: "Auditório" },
  { id: "e10", title: "Prova P1 · Estrutura de Dados", date: shift(8), time: "08:00-10:00", type: "prova", audience: "ENG-SW 2º semestre", location: "Lab. 3" },
];

export const calendarEventById = (id: string) => calendarEvents.find((e) => e.id === id);
