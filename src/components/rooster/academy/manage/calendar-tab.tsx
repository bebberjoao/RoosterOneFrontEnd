import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { academyService } from "@/services/mock-api";
import type { CalendarEvent } from "@/mock/database/calendarEvents";
import type { Term, Discipline } from "@/mock/database/disciplines";
import type { SchoolClass } from "@/mock/database/classes";
import { EVENT_TONE, EVENT_LABEL } from "@/components/rooster/academy/mock-data";
import {
  TabBar, Btn, Drawer, Modal, ConfirmDialog, Field, TextInput, SelectInput, SectionCard,
} from "@/components/shared";
import { EventTypeBadge } from "@/components/rooster/academy/badges";
import { academyCan } from "@/components/rooster/academy/permissions";
import { useRole } from "@/components/rooster/role-context";

const today = new Date().toISOString().slice(0, 10);

type DraftEvent = { title: string; date: string; end: string; time: string; type: CalendarEvent["type"]; audience: string; location: string };
const EMPTY_EVENT: DraftEvent = { title: "", date: today, end: "", time: "", type: "reuniao", audience: "Todos", location: "" };

type DraftTerm = { name: string; startDate: string; endDate: string; active: boolean };
const EMPTY_TERM: DraftTerm = { name: "", startDate: today, endDate: today, active: false };

function pad(n: number) { return n.toString().padStart(2, "0"); }
function iso(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export function CalendarTab() {
  const { role } = useRole();
  const canManage = academyCan(role, "manageCalendar");
  const canTerms = academyCan(role, "manageTerms");

  const [section, setSection] = useState("calendario");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [refresh, setRefresh] = useState(0);

  const [modalEvent, setModalEvent] = useState(false);
  const [draftEvent, setDraftEvent] = useState<DraftEvent>(EMPTY_EVENT);

  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [editingTerm, setEditingTerm] = useState(false);
  const [modalTerm, setModalTerm] = useState(false);
  const [draftTerm, setDraftTerm] = useState<DraftTerm>(EMPTY_TERM);
  const [confirmDeleteTerm, setConfirmDeleteTerm] = useState(false);

  useEffect(() => {
    academyService.getCalendarEvents().then(setEvents);
    academyService.getTerms().then(setTerms);
    academyService.getAll().then(setDisciplines);
    academyService.getClasses().then(setClasses);
  }, [refresh]);

  const move = (delta: number) => { const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d); };
  const title = useMemo(() => cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), [cursor]);

  function eventsOn(day: string) {
    return events.filter((e) => (e.end ? day >= e.date && day <= e.end : e.date === day));
  }

  async function saveEvent() {
    await academyService.createCalendarEvent({ ...draftEvent, end: draftEvent.end || undefined, time: draftEvent.time || undefined });
    setModalEvent(false);
    setDraftEvent(EMPTY_EVENT);
    setRefresh((r) => r + 1);
  }

  function openNewTerm() { setDraftTerm(EMPTY_TERM); setModalTerm(true); }
  async function saveNewTerm() { await academyService.createTerm(draftTerm); setModalTerm(false); setRefresh((r) => r + 1); }
  function startEditTerm(t: Term) { setDraftTerm({ name: t.name, startDate: t.startDate, endDate: t.endDate, active: t.active }); setEditingTerm(true); }
  async function saveEditTerm() {
    if (!selectedTerm) return;
    const updated = await academyService.updateTerm(selectedTerm.id, draftTerm);
    if (updated) setSelectedTerm(updated);
    setEditingTerm(false);
    setRefresh((r) => r + 1);
  }
  async function doDeleteTerm() {
    if (!selectedTerm) return;
    await academyService.removeTerm(selectedTerm.id);
    setSelectedTerm(null);
    setRefresh((r) => r + 1);
  }

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-4">
      <TabBar
        value={section}
        onChange={setSection}
        tabs={[{ value: "calendario", label: "Calendário acadêmico" }, { value: "periodos", label: "Períodos letivos" }]}
      />

      {section === "calendario" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <Btn onClick={() => setCursor(new Date())}>Hoje</Btn>
              <div className="flex items-center rounded-lg border">
                <button onClick={() => move(-1)} className="rounded-l-lg p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => move(1)} className="rounded-r-lg p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="ml-1 text-sm font-medium capitalize">{title}</div>
            </div>
            {canManage && <Btn variant="solid" onClick={() => setModalEvent(true)}><Plus className="h-4 w-4" /> Novo evento</Btn>}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="rounded-2xl border bg-card p-4">
              <div className="grid grid-cols-7 border-b pb-1 text-[11px] uppercase text-muted-foreground">
                {WD.map((w) => <div key={w} className="px-2">{w}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border/60">
                {days.map((d, i) => {
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const evs = eventsOn(iso(d));
                  const isToday = iso(d) === today;
                  return (
                    <div key={i} className={`min-h-[88px] bg-card p-1.5 text-[11px] ${inMonth ? "" : "opacity-45"}`}>
                      <div className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${isToday ? "bg-foreground text-background font-semibold" : "text-muted-foreground"}`}>{d.getDate()}</div>
                      <div className="space-y-1">
                        {evs.slice(0, 3).map((e) => (
                          <div key={e.id} className="truncate rounded px-1.5 py-0.5" style={{ background: `color-mix(in oklab, ${EVENT_TONE[e.type]} 16%, transparent)`, color: EVENT_TONE[e.type] }}>{e.title}</div>
                        ))}
                        {evs.length > 3 && <div className="text-[10px] text-muted-foreground">+{evs.length - 3} mais</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-2xl border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4" /> Próximos eventos</div>
              <ul className="space-y-2">
                {[...events].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-start gap-3 rounded-lg border bg-background/40 p-2.5">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: EVENT_TONE[e.type] }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{e.title}</div>
                      <div className="text-[11px] text-muted-foreground">{e.date} {e.time ? `· ${e.time}` : ""}</div>
                    </div>
                  </li>
                ))}
                {events.length === 0 && <li className="text-sm text-muted-foreground">Nenhum evento cadastrado.</li>}
              </ul>
              <div className="mt-5 border-t pt-3">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Legenda</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(EVENT_LABEL).map((k) => (
                    <EventTypeBadge key={k} tone={EVENT_TONE[k as CalendarEvent["type"]]} label={EVENT_LABEL[k as CalendarEvent["type"]]} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {section === "periodos" && (
        <div>
          <div className="mb-4 flex justify-end">
            {canTerms && <Btn variant="solid" onClick={openNewTerm}><Plus className="h-4 w-4" /> Novo período</Btn>}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {terms.map((t) => {
              const disc = disciplines.filter((d) => d.termId === t.id).length;
              const klasses = classes.filter((k) => k.termId === t.id).length;
              return (
                <button key={t.id} onClick={() => { setSelectedTerm(t); setEditingTerm(false); }} className={`rounded-2xl border bg-card p-5 text-left shadow-sm hover:bg-accent/30 ${t.active ? "border-foreground/30" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarRange className="h-5 w-5" /></div>
                      <div>
                        <div className="text-lg font-semibold">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground">{t.startDate} → {t.endDate}</div>
                      </div>
                    </div>
                    {t.active && (<span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Em vigor</span>)}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border bg-background/40 p-2"><div className="text-lg font-semibold">{disc}</div><div className="text-[10px] text-muted-foreground">Disciplinas</div></div>
                    <div className="rounded-lg border bg-background/40 p-2"><div className="text-lg font-semibold">{klasses}</div><div className="text-[10px] text-muted-foreground">Turmas</div></div>
                  </div>
                </button>
              );
            })}
            {terms.length === 0 && <div className="col-span-full rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">Nenhum período letivo cadastrado.</div>}
          </div>
        </div>
      )}

      <Modal open={modalEvent} onClose={() => setModalEvent(false)} title="Novo evento" description="Cadastre um evento no calendário acadêmico." footer={<><Btn onClick={() => setModalEvent(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveEvent}>Salvar</Btn></>}>
        <div className="space-y-3">
          <Field label="Título"><TextInput value={draftEvent.title} onChange={(e) => setDraftEvent({ ...draftEvent, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data"><TextInput type="date" value={draftEvent.date} onChange={(e) => setDraftEvent({ ...draftEvent, date: e.target.value })} /></Field>
            <Field label="Horário"><TextInput value={draftEvent.time} onChange={(e) => setDraftEvent({ ...draftEvent, time: e.target.value })} placeholder="19:00-22:00" /></Field>
          </div>
          <Field label="Tipo"><SelectInput value={draftEvent.type} onChange={(e) => setDraftEvent({ ...draftEvent, type: e.target.value as CalendarEvent["type"] })} options={Object.keys(EVENT_LABEL).map((k) => ({ value: k, label: EVENT_LABEL[k as CalendarEvent["type"]] }))} /></Field>
          <Field label="Público"><TextInput value={draftEvent.audience} onChange={(e) => setDraftEvent({ ...draftEvent, audience: e.target.value })} /></Field>
        </div>
      </Modal>

      <Drawer
        open={!!selectedTerm}
        onClose={() => { setSelectedTerm(null); setEditingTerm(false); }}
        title={selectedTerm?.name ?? ""}
        actions={canTerms && selectedTerm ? (
          editingTerm ? (
            <>
              <Btn onClick={() => setEditingTerm(false)}>Cancelar</Btn>
              <Btn variant="solid" onClick={saveEditTerm}>Salvar</Btn>
            </>
          ) : (
            <>
              <Btn onClick={() => setConfirmDeleteTerm(true)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> Excluir</Btn>
              <Btn variant="solid" onClick={() => startEditTerm(selectedTerm)}><Pencil className="h-3.5 w-3.5" /> Editar</Btn>
            </>
          )
        ) : undefined}
      >
        {selectedTerm && !editingTerm && (
          <SectionCard title="Detalhes do período">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[11px] text-muted-foreground">Início</dt><dd>{selectedTerm.startDate}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Término</dt><dd>{selectedTerm.endDate}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Situação</dt><dd>{selectedTerm.active ? "Em vigor" : "Encerrado"}</dd></div>
            </dl>
          </SectionCard>
        )}
        {selectedTerm && editingTerm && <TermForm draft={draftTerm} setDraft={setDraftTerm} />}
      </Drawer>

      <Modal open={modalTerm} onClose={() => setModalTerm(false)} title="Novo período letivo" footer={<><Btn onClick={() => setModalTerm(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNewTerm}>Salvar</Btn></>}>
        <TermForm draft={draftTerm} setDraft={setDraftTerm} />
      </Modal>

      <ConfirmDialog open={confirmDeleteTerm} onClose={() => setConfirmDeleteTerm(false)} onConfirm={doDeleteTerm} title="Excluir período letivo" description="Disciplinas e turmas vinculadas não serão excluídas." />
    </div>
  );
}

function TermForm({ draft, setDraft }: { draft: DraftTerm; setDraft: (d: DraftTerm) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Nome"><TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="2025.2" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início"><TextInput type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field>
        <Field label="Término"><TextInput type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></Field>
      </div>
      <Field label="Situação"><SelectInput value={draft.active ? "1" : "0"} onChange={(e) => setDraft({ ...draft, active: e.target.value === "1" })} options={[{ value: "1", label: "Em vigor" }, { value: "0", label: "Encerrado" }]} /></Field>
    </div>
  );
}
