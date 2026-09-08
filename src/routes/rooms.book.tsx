import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CrudHeader, SectionCard, EmptyState, Btn, Field, TextInput, TextArea, SelectInput } from "@/components/shared";
import { roomService } from "@/services/mock-api";
import type { Room } from "@/mock/database/rooms";
import type { Reservation } from "@/mock/database/reservations";
import type { Campus } from "@/mock/database/campuses";
import { SpaceStatusBadge } from "@/components/rooster/rooms/badges";
import {
  SPACE_TYPE_LABEL, RESOURCE_LABEL, formatDate, isoOf, hourToMinutes, findConflicts, roomSlots,
} from "@/components/rooster/rooms/labels";
import { useRole } from "@/components/rooster/role-context";
import {
  ChevronLeft, ChevronRight, Search, CalendarDays, CheckCircle2, AlertTriangle, DoorOpen, Users, MessageSquare, Send,
} from "lucide-react";

export const Route = createFileRoute("/rooms/book")({
  head: () => ({
    meta: [
      { title: "Reservar ambiente — Rooster Rooms" },
      { name: "description", content: "Escolha a sala, veja a disponibilidade no calendário e envie sua solicitação de reserva." },
      { property: "og:title", content: "Reservar ambiente — Rooster Rooms" },
      { property: "og:description", content: "Escolha a sala, veja a disponibilidade no calendário e envie sua solicitação de reserva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookRoomPage,
});

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const EXTRAS = ["Projetor", "Notebook", "Microfone", "Caixa de som", "Cabo HDMI", "Água/café", "Limpeza extra", "Suporte técnico"];

function monthMatrix(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(start.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function BookRoomPage() {
  const { role } = useRole();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [campusId, setCampusId] = useState("all");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [cursor, setCursor] = useState(new Date());
  const [date, setDate] = useState(isoOf(new Date()));
  const [tab, setTab] = useState<"detalhes" | "mensagem">("detalhes");
  const [sent, setSent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    event: "",
    purpose: "aula",
    start: "08:00",
    end: "10:00",
    participants: 20,
    message: "",
    extras: [] as string[],
  });

  function reload() {
    Promise.all([roomService.getAll(), roomService.getCampuses(), roomService.getReservations()]).then(([r, c, res]) => {
      setRooms(r);
      setCampuses(c);
      setReservations(res);
      setRoomId((prev) => prev ?? r[0]?.id ?? null);
      setLoading(false);
    });
  }
  useEffect(reload, []);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((r) => {
        if (campusId !== "all" && r.campusId !== campusId) return false;
        if (q && !`${r.name} ${r.code} ${SPACE_TYPE_LABEL[r.type]}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [rooms, campusId, q],
  );

  const room = rooms.find((r) => r.id === roomId) ?? null;
  const dayReservations = useMemo(
    () => reservations.filter((r) => r.spaceId === roomId && r.date === date && r.status !== "cancelada").sort((a, b) => a.start.localeCompare(b.start)),
    [reservations, roomId, date],
  );

  // Períodos de horário cadastrados no ambiente (Estrutura física), já sem os que estão reservados.
  const allSlots = useMemo(() => (room ? roomSlots(room) : []), [room]);
  const freeSlots = useMemo(
    () =>
      allSlots.filter(
        (s) => !dayReservations.some((r) => Math.max(hourToMinutes(s.start), hourToMinutes(r.start)) < Math.min(hourToMinutes(s.end), hourToMinutes(r.end))),
      ),
    [allSlots, dayReservations],
  );
  const slotOptions = useMemo(() => freeSlots.map((s) => ({ value: `${s.start}-${s.end}`, label: s.label })), [freeSlots]);
  const slotValue = freeSlots.some((s) => s.start === form.start && s.end === form.end) ? `${form.start}-${form.end}` : "";

  // Ao trocar de sala ou dia, mantém apenas seleções ainda válidas.
  useEffect(() => {
    if (!freeSlots.length) return;
    if (!slotValue) setForm((f) => ({ ...f, start: freeSlots[0].start, end: freeSlots[0].end }));
  }, [freeSlots, slotValue]);

  const conflicts = room ? findConflicts(reservations, room.id, date, form.start, form.end) : [];
  const invalidTime = hourToMinutes(form.end) <= hourToMinutes(form.start);
  const overCapacity = !!room && form.participants > room.capacity;
  const canSubmit = !!room && !!form.event.trim() && !!slotValue && !invalidTime && !overCapacity && conflicts.length === 0 && !saving;

  const cells = useMemo(() => monthMatrix(cursor), [cursor]);
  const countByDay = useMemo(() => {
    const map = new Map<string, number>();
    reservations
      .filter((r) => r.spaceId === roomId && r.status !== "cancelada")
      .forEach((r) => map.set(r.date, (map.get(r.date) ?? 0) + 1));
    return map;
  }, [reservations, roomId]);

  async function submit() {
    if (!room || !canSubmit) return;
    setSaving(true);
    const notes = [form.message.trim(), form.extras.length ? `Equipamentos extras: ${form.extras.join(", ")}` : ""]
      .filter(Boolean)
      .join(" | ");
    const created = await roomService.createReservation({
      code: `RS-${Date.now().toString().slice(-6)}`,
      spaceId: room.id,
      roomId: room.id,
      responsible: role === "professor" ? "Professor(a)" : "Usuário Rooster",
      sector: "Solicitação via portal",
      event: form.event.trim(),
      purpose: form.purpose,
      date,
      start: form.start,
      end: form.end,
      participants: Number(form.participants) || 1,
      status: "analise",
      recurrence: "unica",
      notes,
    });
    setSaving(false);
    setSent(created.code);
    setForm((f) => ({ ...f, event: "", message: "", extras: [] }));
    reload();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando ambientes...</p>;

  return (
    <>
      <CrudHeader
        title="Reservar ambiente"
        description="Escolha a sala, confira a disponibilidade no calendário e envie sua solicitação para análise."
      />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Aba lateral: seleção de sala */}
        <aside className="rounded-2xl border bg-card p-3">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar sala, código ou tipo"
              className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <SelectInput
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            options={[{ value: "all", label: "Todos os campus" }, ...campuses.map((c) => ({ value: c.id, label: c.name }))]}
          />

          <ul className="mt-3 max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
            {filteredRooms.length === 0 ? (
              <li><EmptyState icon={DoorOpen} title="Nenhum ambiente encontrado" /></li>
            ) : (
              filteredRooms.map((r) => {
                const active = r.id === roomId;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => { setRoomId(r.id); setSent(null); }}
                      className={`w-full rounded-xl border p-2.5 text-left transition-colors ${active ? "border-foreground/30 bg-accent" : "hover:bg-accent/60"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <SpaceStatusBadge status={r.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {SPACE_TYPE_LABEL[r.type]} · {r.capacity} lugares · {r.code}
                      </p>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <div className="space-y-4">
          {/* Calendário */}
          <SectionCard
            title={room ? `Disponibilidade · ${room.name}` : "Disponibilidade"}
            description="Clique em um dia para ver os horários já ocupados e solicitar o seu."
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium capitalize">
                {cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => { const d = new Date(); setCursor(d); setDate(isoOf(d)); }} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent">
                  <CalendarDays className="h-4 w-4" /> Hoje
                </button>
                <div className="inline-flex items-center rounded-lg border">
                  <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
              {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const iso = isoOf(d);
                const outside = d.getMonth() !== cursor.getMonth();
                const selected = iso === date;
                const isToday = iso === isoOf(new Date());
                const n = countByDay.get(iso) ?? 0;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => { setDate(iso); setSent(null); }}
                    className={`flex h-16 flex-col items-start rounded-xl border p-1.5 text-left transition-colors ${
                      selected ? "border-foreground/40 bg-accent" : "hover:bg-accent/60"
                    } ${outside ? "opacity-40" : ""}`}
                  >
                    <span className={`text-xs tabular-nums ${isToday ? "font-semibold" : ""}`}>{d.getDate()}</span>
                    {n > 0 && (
                      <span className="mt-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {n} reserva{n > 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Formulário */}
          <SectionCard title={`Solicitação · ${formatDate(date)}`} description={room ? `${SPACE_TYPE_LABEL[room.type]} · capacidade ${room.capacity}` : undefined}>
            <div className="mb-3 flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1">
              {([["detalhes", "Detalhes"], ["mensagem", "Mensagem e equipamentos"]] as const).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTab(v)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === v ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {v === "mensagem" ? <MessageSquare className="h-3.5 w-3.5" /> : null}
                  {label}
                </button>
              ))}
            </div>

            {tab === "detalhes" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Título do evento">
                  <TextInput value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} placeholder="Ex.: Aula prática de Redes" />
                </Field>
                <Field label="Finalidade">
                  <SelectInput
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    options={[
                      { value: "aula", label: "Aula" },
                      { value: "reuniao", label: "Reunião" },
                      { value: "evento", label: "Evento" },
                      { value: "estudo", label: "Estudo em grupo" },
                      { value: "outro", label: "Outro" },
                    ]}
                  />
                </Field>
                <Field
                  label="Horário"
                  className="sm:col-span-2"
                  hint={room ? `Períodos cadastrados para ${room.name} (${room.openingHours}). Horários já reservados ficam indisponíveis.` : undefined}
                >
                  <SelectInput
                    value={slotValue}
                    placeholder={slotOptions.length ? "Selecione um período" : "Nenhum período disponível"}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split("-");
                      if (start && end) setForm({ ...form, start, end });
                    }}
                    options={slotOptions}
                  />
                </Field>
                <Field label="Participantes">
                  <TextInput type="number" value={String(form.participants)} onChange={(e) => setForm({ ...form, participants: Number(e.target.value) })} />
                </Field>
                <div className="rounded-xl border bg-background/40 p-3 text-xs text-muted-foreground sm:col-span-2">
                  <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground"><Users className="h-3.5 w-3.5" /> Horários ocupados</p>
                  {allSlots.length > 0 && freeSlots.length === 0 && (
                    <p className="mb-1 text-destructive">Todos os períodos deste dia já estão reservados.</p>
                  )}
                  {dayReservations.length === 0 ? (
                    <p>Nenhuma reserva neste dia.</p>
                  ) : (
                    <ul className="space-y-0.5 tabular-nums">
                      {dayReservations.map((r) => <li key={r.id}>{r.start}–{r.end} · {r.event}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Mensagem para o setor de reservas" hint="Observações, necessidades especiais ou justificativa da solicitação.">
                  <TextArea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    placeholder="Ex.: Precisarei da sala montada em formato de U e de acesso 15 minutos antes."
                  />
                </Field>
                <div>
                  <p className="mb-1.5 text-xs font-medium">Equipamentos extras</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXTRAS.map((x) => {
                      const on = form.extras.includes(x);
                      return (
                        <button
                          key={x}
                          type="button"
                          onClick={() => setForm({ ...form, extras: on ? form.extras.filter((e) => e !== x) : [...form.extras, x] })}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${on ? "bg-foreground text-background" : "hover:bg-accent"}`}
                        >
                          {x}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {room && room.resources.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Já disponível na sala: {room.resources.map((r) => RESOURCE_LABEL[r]).join(", ")}.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {invalidTime && (
                <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> O horário de término deve ser maior que o de início.</p>
              )}
              {overCapacity && room && (
                <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Capacidade máxima do ambiente: {room.capacity} pessoas.</p>
              )}
              {conflicts.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" /> Conflito com {conflicts[0].event} ({conflicts[0].start}–{conflicts[0].end}).
                </p>
              )}
              {conflicts.length === 0 && !invalidTime && !overCapacity && form.event.trim() && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Horário livre para este ambiente.</p>
              )}
              {sent && (
                <p className="flex items-center gap-1.5 rounded-xl border bg-background/40 p-2.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Solicitação <span className="font-mono">{sent}</span> enviada e aguardando análise do setor de reservas.
                </p>
              )}
              <div className="flex justify-end">
                <Btn variant="solid" disabled={!canSubmit} onClick={submit}>
                  <Send className="h-4 w-4" /> Enviar solicitação
                </Btn>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
