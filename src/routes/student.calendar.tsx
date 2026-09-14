import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, Chip, TONE } from "@/components/rooster/student/ui";
import { EVENTS, ACTIVITIES, RESERVATIONS, CHARGES, DISCIPLINES, disciplineById, formatDate, today } from "@/components/rooster/student/mock-data";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/student/calendar")({ component: StudentCalendar });

type Item = { id: string; title: string; date: string; time?: string; source: "academico" | "atividade" | "reserva" | "financeiro" | "aula"; tone: string };

function pad(n: number) { return n.toString().padStart(2, "0"); }
function iso(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

const SOURCE_LABEL: Record<Item["source"], string> = {
  academico: "Acadêmico",
  atividade: "Entregas",
  reserva: "Reservas",
  financeiro: "Financeiro",
  aula: "Aulas",
};

function buildItems(): Item[] {
  const items: Item[] = [
    ...EVENTS.map((e) => ({ id: `e-${e.id}`, title: e.title, date: e.date, time: e.time, source: "academico" as const, tone: TONE.info })),
    ...ACTIVITIES.map((a) => ({ id: `a-${a.id}`, title: `Entrega: ${a.title}`, date: a.due, source: "atividade" as const, tone: TONE.purple })),
    ...RESERVATIONS.filter((r) => r.status !== "cancelada").map((r) => ({ id: `r-${r.id}`, title: `${r.space} — ${r.purpose}`, date: r.date, time: r.time, source: "reserva" as const, tone: TONE.cyan })),
    ...CHARGES.filter((c) => c.status !== "pago").map((c) => ({ id: `c-${c.id}`, title: `Vencimento: ${c.description}`, date: c.due, source: "financeiro" as const, tone: TONE.ok })),
  ];
  return items;
}

function StudentCalendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<"month" | "agenda">("month");
  const [sources, setSources] = useState<Item["source"][]>(["academico", "atividade", "reserva", "financeiro"]);

  const items = useMemo(() => buildItems().filter((i) => sources.includes(i.source)), [sources]);
  const onDay = (d: string) => items.filter((i) => i.date === d);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const agenda = [...items].filter((i) => i.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  const toggle = (s: Item["source"]) =>
    setSources((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Academy, Learn, Rooms e Finance"
        title="Calendário acadêmico"
        description="Provas, entregas, aulas, eventos institucionais, reservas e vencimentos em uma única visão."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date())} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">Hoje</button>
          <div className="flex items-center rounded-lg border">
            <button onClick={() => { const d = new Date(cursor); d.setMonth(d.getMonth() - 1); setCursor(d); }} className="rounded-l-lg p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => { const d = new Date(cursor); d.setMonth(d.getMonth() + 1); setCursor(d); }} className="rounded-r-lg p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <span className="ml-1 text-sm font-medium capitalize">{cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(SOURCE_LABEL) as Item["source"][]).filter((s) => s !== "aula").map((s) => (
            <button key={s} onClick={() => toggle(s)} className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${sources.includes(s) ? "bg-foreground text-background" : "border hover:bg-accent"}`}>
              {SOURCE_LABEL[s]}
            </button>
          ))}
          <div className="ml-2 flex overflow-hidden rounded-lg border text-xs">
            <button onClick={() => setView("month")} className={`px-3 py-1.5 ${view === "month" ? "bg-foreground text-background" : "hover:bg-accent"}`}>Mês</button>
            <button onClick={() => setView("agenda")} className={`px-3 py-1.5 ${view === "agenda" ? "bg-foreground text-background" : "hover:bg-accent"}`}>Agenda</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border bg-card p-4">
          {view === "month" ? (
            <div>
              <div className="grid grid-cols-7 border-b pb-1 text-[11px] uppercase text-muted-foreground">
                {WD.map((w) => <div key={w} className="px-2">{w}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border/60">
                {days.map((d, i) => {
                  const key = iso(d);
                  const evs = onDay(key);
                  const inMonth = d.getMonth() === cursor.getMonth();
                  return (
                    <div key={i} className={`min-h-[96px] bg-card p-1.5 text-[11px] ${inMonth ? "" : "opacity-45"}`}>
                      <div className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${key === today ? "bg-foreground font-semibold text-background" : "text-muted-foreground"}`}>{d.getDate()}</div>
                      <div className="space-y-1">
                        {evs.slice(0, 3).map((e) => (
                          <div key={e.id} className="truncate rounded px-1.5 py-0.5" style={{ background: `color-mix(in oklab, ${e.tone} 16%, transparent)`, color: e.tone }}>{e.title}</div>
                        ))}
                        {evs.length > 3 ? <p className="text-[10px] text-muted-foreground">+{evs.length - 3} mais</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {agenda.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span className="h-8 w-1 rounded-full" style={{ background: e.tone }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(e.date)} {e.time ? `· ${e.time}` : ""}</p>
                  </div>
                  <Chip tone={e.tone}>{SOURCE_LABEL[e.source]}</Chip>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <SectionCard title="Próximos compromissos">
            <ul className="space-y-2">
              {agenda.slice(0, 8).map((e) => (
                <li key={e.id} className="flex items-start gap-3 rounded-xl border bg-background/40 p-2.5">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(e.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Minha grade semanal" description="Aulas fixas do semestre">
            <ul className="space-y-2">
              {DISCIPLINES.map((d) => (
                <li key={d.id} className="rounded-xl border bg-background/40 p-2.5">
                  <p className="text-sm">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">{d.schedule} · {d.room}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </aside>
      </div>
    </>
  );
}
