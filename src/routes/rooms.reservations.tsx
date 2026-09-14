import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  CrudHeader, CrudToolbar, TabBar, DataTable, type Column,
  Drawer, Btn, Field, TextInput, TextArea, SelectInput, Select,
} from "@/components/shared";
import { roomService } from "@/services/mock-api";
import type { Room } from "@/mock/database/rooms";
import type { Reservation } from "@/mock/database/reservations";
import type { Campus } from "@/mock/database/campuses";
import { StatusBadge } from "@/components/rooster/rooms/badges";
import {
  STATUS_LABEL, STATUS_TONE, formatDate, isoOf, startOfWeek, hourToMinutes, findConflicts,
} from "@/components/rooster/rooms/labels";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, AlertTriangle, CheckCircle2, Check, X } from "lucide-react";

export const Route = createFileRoute("/rooms/reservations")({
  component: ReservationsPage,
});

const HOURS = Array.from({ length: 16 }, (_, i) => 7 + i);

function ReservationsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"agenda" | "lista">("agenda");
  const [view, setView] = useState<"dia" | "semana" | "mes" | "timeline">("semana");
  const [cursor, setCursor] = useState(new Date());
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Reservation["status"]>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function reload() {
    Promise.all([roomService.getAll(), roomService.getReservations(), roomService.getCampuses()]).then(([r, res, c]) => {
      setRooms(r);
      setReservations(res);
      setCampuses(c);
      setLoading(false);
    });
  }
  useEffect(reload, []);

  const roomById = (id: string) => rooms.find((r) => r.id === id);

  const [acting, setActing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function decide(id: string, next: Reservation["status"]) {
    setActing(id);
    setActionError(null);
    try {
      await roomService.updateReservationStatus(id, next);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Não foi possível atualizar a reserva.");
    } finally {
      setActing(null);
    }
  }

  const filteredList = useMemo(
    () =>
      reservations.filter((r) => {
        if (status !== "all" && r.status !== status) return false;
        const s = roomById(r.spaceId);
        if (!s) return false;
        if (q && !`${r.event} ${r.responsible} ${r.code} ${s.name}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [reservations, rooms, status, q],
  );

  const shift = (dir: number) => {
    const d = new Date(cursor);
    if (view === "dia") d.setDate(d.getDate() + dir);
    else if (view === "semana" || view === "timeline") d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  const label = useMemo(() => {
    if (view === "mes") return cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (view === "dia") return cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const start = startOfWeek(cursor);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
  }, [cursor, view]);

  const columns: Column<Reservation>[] = [
    { key: "code", header: "Código", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.code}</span> },
    { key: "event", header: "Evento", cell: (r) => <span className="font-medium">{r.event}</span>, sortValue: (r) => r.event },
    { key: "room", header: "Ambiente", cell: (r) => roomById(r.spaceId)?.name ?? "—" },
    { key: "responsible", header: "Responsável", cell: (r) => r.responsible },
    { key: "date", header: "Data", cell: (r) => <span className="tabular-nums text-xs">{formatDate(r.date)}</span>, sortValue: (r) => r.date },
    { key: "time", header: "Horário", cell: (r) => <span className="tabular-nums text-xs">{r.start}–{r.end}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "acoes",
      header: "Ações",
      cell: (r) =>
        r.status === "analise" ? (
          <div className="flex gap-1.5">
            <Btn
              variant="solid"
              className="px-2 py-1 text-xs"
              disabled={acting === r.id}
              onClick={() => decide(r.id, "confirmada")}
            >
              <Check className="h-3.5 w-3.5" /> Aprovar
            </Btn>
            <Btn
              className="px-2 py-1 text-xs"
              disabled={acting === r.id}
              onClick={() => decide(r.id, "cancelada")}
            >
              <X className="h-3.5 w-3.5" /> Recusar
            </Btn>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  if (loading) return <p className="text-sm text-muted-foreground">Carregando reservas...</p>;

  return (
    <>
      <CrudHeader
        title="Reservas"
        description="Agenda geral e lista de todas as reservas de ambientes, com criação validada em tempo real."
        actions={
          <Btn variant="solid" onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4" /> Nova reserva
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TabBar tabs={[{ value: "agenda", label: "Agenda" }, { value: "lista", label: "Lista" }]} value={tab} onChange={(v) => setTab(v as typeof tab)} />
        {tab === "agenda" && (
          <div className="flex items-center gap-2">
            <button onClick={() => setCursor(new Date())} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent">
              <CalendarDays className="h-4 w-4" /> Hoje
            </button>
            <div className="inline-flex items-center rounded-lg border bg-card">
              <button onClick={() => shift(-1)} className="p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => shift(1)} className="p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {tab === "agenda" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TabBar
                tabs={[
                  { value: "dia", label: "Dia" },
                  { value: "semana", label: "Semana" },
                  { value: "mes", label: "Mês" },
                  { value: "timeline", label: "Timeline" },
                ]}
                value={view}
                onChange={(v) => setView(v as typeof view)}
              />
              <span className="text-sm font-medium capitalize">{label}</span>
            </div>
            <Legend />
          </div>

          {view === "semana" && <WeekView cursor={cursor} data={reservations} roomById={roomById} />}
          {view === "dia" && <DayView cursor={cursor} data={reservations} roomById={roomById} />}
          {view === "mes" && <MonthView cursor={cursor} data={reservations} />}
          {view === "timeline" && <TimelineView cursor={cursor} data={reservations} rooms={rooms} />}
        </>
      ) : (
        <>
          <CrudToolbar
            search={q}
            onSearch={setQ}
            placeholder="Buscar por evento, código, responsável ou ambiente..."
            filters={
              <Select
                value={status}
                onChange={(v) => setStatus(v as typeof status)}
                options={[
                  { value: "all", label: "Todos os status" },
                  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
                ]}
              />
            }
          />
          {actionError && (
            <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> {actionError}
            </p>
          )}
          <DataTable rows={filteredList} columns={columns} />
        </>
      )}

      <NewReservationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rooms={rooms}
        campuses={campuses}
        reservations={reservations}
        onCreated={reload}
      />
    </>
  );
}

function Legend() {
  const items: Reservation["status"][] = ["confirmada", "andamento", "analise", "finalizada", "cancelada"];
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      {items.map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_TONE[s] }} />
          {STATUS_LABEL[s]}
        </span>
      ))}
    </div>
  );
}

function WeekView({ cursor, data, roomById }: { cursor: Date; data: Reservation[]; roomById: (id: string) => Room | undefined }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const rowH = 44;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
        <div className="border-b border-r bg-muted/30" />
        {days.map((d) => {
          const today = isoOf(d) === isoOf(new Date());
          return (
            <div key={d.toISOString()} className={"border-b px-2 py-2 text-center text-xs " + (today ? "bg-primary/5" : "")}>
              <div className="uppercase text-muted-foreground">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
              <div className={"text-lg font-semibold tabular-nums " + (today ? "text-primary" : "")}>{d.getDate().toString().padStart(2, "0")}</div>
            </div>
          );
        })}
        {HOURS.map((h) => (
          <Fragment key={`row-${h}`}>
            <div className="border-r px-2 py-1 text-right text-[10px] tabular-nums text-muted-foreground" style={{ height: rowH }}>{h.toString().padStart(2, "0")}:00</div>
            {days.map((d) => <div key={`c-${h}-${d.toISOString()}`} className="relative border-b border-r border-border/40" style={{ height: rowH }} />)}
          </Fragment>
        ))}
      </div>
      <div className="relative -mt-[calc(16*44px)]" style={{ height: HOURS.length * rowH, pointerEvents: "none" }}>
        <div className="grid h-full" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          <div />
          {days.map((d) => {
            const iso = isoOf(d);
            const dayRes = data.filter((r) => r.date === iso);
            return (
              <div key={d.toISOString()} className="relative">
                {dayRes.map((r) => {
                  const top = ((hourToMinutes(r.start) - HOURS[0] * 60) / 60) * rowH;
                  const h = ((hourToMinutes(r.end) - hourToMinutes(r.start)) / 60) * rowH;
                  const s = roomById(r.spaceId);
                  const tone = STATUS_TONE[r.status];
                  return (
                    <div key={r.id} className="absolute left-1 right-1 overflow-hidden rounded-md border px-2 py-1 text-[10px] shadow-sm"
                      style={{ top: Math.max(0, top), height: Math.max(20, h - 2), borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`, backgroundColor: `color-mix(in oklab, ${tone} 14%, var(--card))`, color: tone, pointerEvents: "auto" }}>
                      <div className="truncate font-semibold text-foreground">{r.event}</div>
                      <div className="truncate">{r.start}–{r.end} · {s?.name}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayView({ cursor, data, roomById }: { cursor: Date; data: Reservation[]; roomById: (id: string) => Room | undefined }) {
  const iso = isoOf(cursor);
  const dayRes = data.filter((r) => r.date === iso).sort((a, b) => a.start.localeCompare(b.start));
  const rowH = 56;
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-5 py-3 text-sm font-semibold capitalize">{cursor.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
      <div className="grid" style={{ gridTemplateColumns: "80px 1fr" }}>
        {HOURS.map((h) => {
          const hourRes = dayRes.filter((r) => hourToMinutes(r.start) >= h * 60 && hourToMinutes(r.start) < (h + 1) * 60);
          return (
            <Fragment key={`day-row-${h}`}>
              <div className="border-r border-b px-3 py-2 text-right text-xs tabular-nums text-muted-foreground" style={{ height: rowH }}>{h.toString().padStart(2, "0")}:00</div>
              <div className="relative border-b" style={{ height: rowH }}>
                <div className="flex h-full flex-wrap gap-2 p-1.5">
                  {hourRes.map((r) => {
                    const s = roomById(r.spaceId);
                    const tone = STATUS_TONE[r.status];
                    return (
                      <div key={r.id} className="flex-1 overflow-hidden rounded-md border px-2 py-1 text-xs" style={{ minWidth: 200, borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`, backgroundColor: `color-mix(in oklab, ${tone} 14%, var(--card))` }}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{r.event}</span>
                          <span className="tabular-nums text-muted-foreground">{r.start}–{r.end}</span>
                        </div>
                        <div className="truncate text-muted-foreground">{s?.name} · {r.responsible}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ cursor, data }: { cursor: Date; data: Reservation[] }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const heads = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/30">{heads.map((h) => <div key={h} className="px-2 py-2 text-center text-xs uppercase text-muted-foreground">{h}</div>)}</div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const iso = isoOf(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = iso === isoOf(new Date());
          const dayRes = data.filter((r) => r.date === iso);
          return (
            <div key={iso} className={"min-h-[110px] border-b border-r border-border/40 p-1.5 " + (inMonth ? "" : "bg-muted/20 text-muted-foreground")}>
              <div className="flex items-center justify-between px-1">
                <span className={"text-xs tabular-nums " + (isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold" : "")}>{d.getDate()}</span>
                {dayRes.length > 0 && <span className="text-[10px] tabular-nums text-muted-foreground">{dayRes.length}</span>}
              </div>
              <div className="mt-1 space-y-1">
                {dayRes.slice(0, 3).map((r) => {
                  const tone = STATUS_TONE[r.status];
                  return <div key={r.id} className="truncate rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: `color-mix(in oklab, ${tone} 14%, transparent)`, color: tone }}><span className="tabular-nums">{r.start}</span> {r.event}</div>;
                })}
                {dayRes.length > 3 && <div className="px-1 text-[10px] text-muted-foreground">+{dayRes.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineView({ cursor, data, rooms }: { cursor: Date; data: Reservation[]; rooms: Room[] }) {
  const iso = isoOf(cursor);
  const rowH = 44;
  const minH = HOURS[0] * 60;
  const maxH = (HOURS[HOURS.length - 1] + 1) * 60;
  const totalMin = maxH - minH;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="min-w-[1100px]">
        <div className="grid border-b bg-muted/30 text-[10px] tabular-nums text-muted-foreground" style={{ gridTemplateColumns: "220px 1fr" }}>
          <div className="px-3 py-2 font-medium text-foreground">Ambiente</div>
          <div className="relative"><div className="flex">{HOURS.map((h) => <div key={h} className="flex-1 border-l border-border/40 px-1 py-2">{h.toString().padStart(2, "0")}h</div>)}</div></div>
        </div>
        {rooms.slice(0, 12).map((s) => {
          const rs = data.filter((r) => r.spaceId === s.id && r.date === iso);
          return (
            <div key={s.id} className="grid border-b" style={{ gridTemplateColumns: "220px 1fr", height: rowH }}>
              <div className="border-r px-3 py-2 text-xs">
                <div className="truncate font-medium">{s.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">{s.code}</div>
              </div>
              <div className="relative">
                {HOURS.map((h) => <div key={h} className="absolute inset-y-0 border-l border-border/30" style={{ left: `${((h - HOURS[0]) / HOURS.length) * 100}%` }} />)}
                {rs.map((r) => {
                  const left = ((hourToMinutes(r.start) - minH) / totalMin) * 100;
                  const width = ((hourToMinutes(r.end) - hourToMinutes(r.start)) / totalMin) * 100;
                  const tone = STATUS_TONE[r.status];
                  return (
                    <div key={r.id} className="absolute top-1 bottom-1 overflow-hidden rounded-md border px-2 text-[10px]"
                      style={{ left: `${left}%`, width: `${width}%`, borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`, backgroundColor: `color-mix(in oklab, ${tone} 18%, var(--card))`, color: tone }}>
                      <div className="truncate leading-5 font-semibold text-foreground">{r.event}</div>
                      <div className="truncate leading-3">{r.start}–{r.end} · {r.responsible}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewReservationDrawer({
  open,
  onClose,
  rooms,
  campuses,
  reservations,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  campuses: Campus[];
  reservations: Reservation[];
  onCreated: () => void;
}) {
  const today = isoOf(new Date());
  const [campusId, setCampusId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");
  const [participants, setParticipants] = useState(20);
  const [responsible, setResponsible] = useState("");
  const [sector, setSector] = useState("");
  const [event, setEvent] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setCampusId(""); setRoomId(""); setDate(today); setStart("08:00"); setEnd("10:00");
      setParticipants(20); setResponsible(""); setSector(""); setEvent(""); setNotes("");
    }
  }, [open]);

  const chosen = rooms.find((r) => r.id === roomId);
  const conf = roomId ? findConflicts(reservations, roomId, date, start, end) : [];
  const overCapacity = chosen ? participants > chosen.capacity : false;
  const startBeforeEnd = hourToMinutes(start) < hourToMinutes(end);
  const canSubmit = chosen && event && responsible && startBeforeEnd && !overCapacity && conf.length === 0;

  async function save() {
    if (!canSubmit || !chosen) return;
    await roomService.createReservation({
      code: `RES-${Date.now().toString().slice(-6)}`,
      roomId: chosen.id,
      spaceId: chosen.id,
      responsible,
      sector,
      event,
      purpose: event,
      date,
      start,
      end,
      participants,
      status: "analise",
      recurrence: "unica",
      notes,
    });
    onCreated();
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} title="Nova reserva" subtitle="Validação de conflitos em tempo real" actions={
      <>
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn variant="solid" onClick={save} className={!canSubmit ? "pointer-events-none opacity-40" : ""}>Salvar reserva</Btn>
      </>
    }>
      <div className="space-y-4">
        <Field label="Campus">
          <SelectInput value={campusId} onChange={(e) => { setCampusId(e.target.value); setRoomId(""); }} options={[{ value: "", label: "Todos os campus" }, ...campuses.map((c) => ({ value: c.id, label: c.name }))]} />
        </Field>
        <Field label="Ambiente" required>
          <SelectInput value={roomId} onChange={(e) => setRoomId(e.target.value)} options={[{ value: "", label: "Selecione um ambiente" }, ...rooms.filter((r) => !campusId || r.campusId === campusId).map((r) => ({ value: r.id, label: `${r.name} (cap. ${r.capacity})` }))]} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Data"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Início"><TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Fim"><TextInput type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
        <Field label="Participantes"><TextInput type="number" value={participants} onChange={(e) => setParticipants(Number(e.target.value))} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsável" required><TextInput value={responsible} onChange={(e) => setResponsible(e.target.value)} /></Field>
          <Field label="Setor"><TextInput value={sector} onChange={(e) => setSector(e.target.value)} /></Field>
        </div>
        <Field label="Evento" required><TextInput value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Ex.: Aula de Cálculo II" /></Field>
        <Field label="Observações"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></Field>

        <div className="rounded-xl border bg-card p-3">
          <p className="mb-2 text-xs font-semibold">Validação</p>
          <ul className="space-y-1.5 text-xs">
            <ValidationItem ok={!!chosen} label="Ambiente selecionado" />
            <ValidationItem ok={!!event} label="Evento informado" />
            <ValidationItem ok={startBeforeEnd} label="Horário inicial anterior ao final" />
            <ValidationItem ok={!overCapacity} label={`Dentro da capacidade (${chosen?.capacity ?? "—"})`} />
            <ValidationItem ok={conf.length === 0} label="Sem conflitos de horário" />
          </ul>
          {conf.length > 0 && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{conf.length} conflito(s): {conf.slice(0, 2).map((c) => `${c.start}–${c.end}`).join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function ValidationItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 className={"h-3.5 w-3.5 " + (ok ? "text-emerald-500" : "text-muted-foreground")} />
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}
