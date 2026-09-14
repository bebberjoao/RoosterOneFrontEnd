import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Clock3, MessageCircle, Send, UserRound, XCircle } from "lucide-react";
import { Breadcrumbs, Btn, Field, Modal, TextArea } from "@/components/shared";
import { useRole, ROLE_META } from "@/components/rooster/role-context";
import { StatusBadge } from "@/components/rooster/rooms/badges";
import { STATUS_LABEL, formatDate, roomSlots, hourToMinutes } from "@/components/rooster/rooms/labels";
import { roomService } from "@/services/mock-api";
import type { Reservation } from "@/mock/database/reservations";
import type { ReservationEvent } from "@/components/rooster/rooms/mock-data";
import type { Room } from "@/mock/database/rooms";


export const Route = createFileRoute("/rooms/reservations/$id")({
  head: () => ({ meta: [
    { title: "Detalhe da reserva — Rooster Rooms" },
    { name: "description", content: "Conversa, histórico, alteração de horário e cancelamento de uma reserva de ambiente." },
    { property: "og:title", content: "Detalhe da reserva — Rooster Rooms" },
    { property: "og:description", content: "Conversa, histórico, alteração de horário e cancelamento de uma reserva de ambiente." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ReservationDetail,
});
const MANAGERS = ["admin", "tecnico", "institucional", "coordenador"];

function ReservationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const manager = MANAGERS.includes(role);
  const person = ROLE_META[role].person;
  const [reservation, setReservation] = useState<Reservation>();
  const [room, setRoom] = useState<Room>();
  const [reply, setReply] = useState("");
  const [dialog, setDialog] = useState<"schedule" | "cancel" | null>(null);
  const [date, setDate] = useState(""); const [start, setStart] = useState(""); const [end, setEnd] = useState(""); const [reason, setReason] = useState("");
  const [cursor, setCursor] = useState(() => new Date());
  const [roomReservations, setRoomReservations] = useState<Reservation[]>([]);
  const reload = () => roomService.getReservationById(id).then(async (item) => {
    setReservation(item);
    setRoom(item ? await roomService.getById(item.roomId) : undefined);
    setRoomReservations(item ? (await roomService.getReservations()).filter((r) => r.roomId === item.roomId) : []);
  });
  useEffect(() => { void reload(); }, [id]);
  const sortedEvents = useMemo(() => [...(reservation?.events ?? [])].sort((a, b) => a.at.localeCompare(b.at)), [reservation]);
  const slots = useMemo(() => {
    if (!room) return [];
    const busy = roomReservations.filter((r) => r.id !== id && r.date === date && r.status !== "cancelada");
    return roomSlots(room).map((s) => ({
      ...s,
      free: !busy.some((r) => Math.max(hourToMinutes(s.start), hourToMinutes(r.start)) < Math.min(hourToMinutes(s.end), hourToMinutes(r.end))),
    }));
  }, [room, roomReservations, date, id]);
  if (!reservation) return <p className="text-sm text-muted-foreground">Carregando reserva...</p>;


  async function send() { if (!reply.trim()) return; await roomService.addReservationMessage(id, { author: person.name, role: manager ? "gestor" : "solicitante", body: reply.trim() }); setReply(""); reload(); }
  async function changeStatus(status: Reservation["status"], message?: string) { await roomService.changeReservationStatus(id, status, person.name, message); setDialog(null); setReason(""); reload(); }
  async function changeSchedule() { if (!date || !start || !end) return; await roomService.changeReservationSchedule(id, date, start, end, person.name, reason || undefined); setDialog(null); setReason(""); reload(); }

  return <>
    <Breadcrumbs items={[{ label: "Rooster Rooms" }, { label: manager ? "Gerenciar reservas" : "Minhas reservas", onClick: () => navigate({ to: manager ? "/rooms/manage" : "/rooms/reservations" }) }, { label: reservation.code }]} />
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold tracking-tight">{reservation.event}</h1><p className="mt-1 text-xs text-muted-foreground">{reservation.code} · solicitado por {reservation.responsible}</p></div>
      <div className="flex flex-wrap gap-2">
        {manager && reservation.status === "analise" && <Btn onClick={() => changeStatus("confirmada")}><CheckCircle2 className="h-4 w-4" /> Aprovar</Btn>}
        {reservation.status !== "cancelada" && reservation.status !== "finalizada" && <Btn onClick={() => { setDate(reservation.date); setStart(reservation.start); setEnd(reservation.end); setCursor(new Date(reservation.date + "T00:00:00")); setDialog("schedule"); }}><CalendarClock className="h-4 w-4" /> {manager ? "Alterar horário" : "Solicitar alteração"}</Btn>}
        {reservation.status !== "cancelada" && <Btn onClick={() => setDialog("cancel")} className="text-destructive"><XCircle className="h-4 w-4" /> Cancelar</Btn>}
      </div>
    </div>
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <SideCard title="Detalhes"><Info label="Status"><StatusBadge status={reservation.status} /></Info><Info label="Ambiente"><p className="text-sm font-medium">{room?.name ?? "Ambiente"}</p><p className="text-xs text-muted-foreground">{room?.code}</p></Info><Info label="Data e horário"><p className="text-sm">{formatDate(reservation.date)}</p><p className="text-xs text-muted-foreground">{reservation.start}–{reservation.end}</p></Info><Info label="Participantes"><p className="text-sm">{reservation.participants} pessoas</p></Info></SideCard>
        <SideCard title="Solicitante"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><UserRound className="h-4 w-4" /></span><div><p className="text-sm font-medium">{reservation.responsible}</p><p className="text-xs text-muted-foreground">{reservation.sector}</p></div></div></SideCard>
        {reservation.cancellationReason && <SideCard title="Motivo do cancelamento"><p className="text-sm text-muted-foreground">{reservation.cancellationReason}</p></SideCard>}
      </aside>
      <section className="overflow-hidden rounded-xl border bg-card">
        <header className="flex items-center gap-2 border-b px-5 py-4"><MessageCircle className="h-4 w-4" /><h2 className="text-sm font-semibold">Conversa e histórico</h2></header>
        <div className="max-h-[560px] space-y-5 overflow-y-auto p-5">{sortedEvents.map((event) => <Timeline key={event.id} event={event} />)}</div>
        <div className="border-t p-4"><TextArea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={manager ? "Responder ao solicitante..." : "Envie uma mensagem para a equipe de reservas..."} rows={4} /><div className="mt-2 flex justify-end"><Btn variant="solid" onClick={send} disabled={!reply.trim()}><Send className="h-4 w-4" /> Enviar mensagem</Btn></div></div>
      </section>
    </div>
    <Modal open={dialog === "schedule"} onClose={() => setDialog(null)} title={manager ? "Alterar data e horário" : "Solicitar alteração de horário"} footer={<><Btn onClick={() => setDialog(null)}>Voltar</Btn><Btn variant="solid" disabled={!slots.some((s) => s.free && s.start === start && s.end === end)} onClick={changeSchedule}>Confirmar alteração</Btn></>}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Field label="Data">
          <MiniCalendar cursor={cursor} setCursor={setCursor} value={date} onSelect={(iso) => { setDate(iso); setStart(""); setEnd(""); }} />
        </Field>
        <Field label={`Horários disponíveis · ${formatDate(date)}`}>
          {slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum período cadastrado para este ambiente.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => {
                const active = s.start === start && s.end === end;
                return (
                  <button key={s.label} type="button" disabled={!s.free} onClick={() => { setStart(s.start); setEnd(s.end); }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active ? "border-transparent bg-foreground text-background" : s.free ? "hover:bg-accent" : "cursor-not-allowed opacity-40 line-through"}`}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
          {slots.length > 0 && !slots.some((s) => s.free) && <p className="mt-2 text-xs text-muted-foreground">Todos os períodos deste dia já estão reservados.</p>}
        </Field>
      </div>
      <Field label="Justificativa"><TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explique o motivo da alteração..." /></Field>
    </Modal>
    <Modal open={dialog === "cancel"} onClose={() => setDialog(null)} title="Cancelar reserva" footer={<><Btn onClick={() => setDialog(null)}>Voltar</Btn><Btn variant="solid" className="bg-destructive text-destructive-foreground" disabled={!reason.trim()} onClick={() => changeStatus("cancelada", reason)}>Confirmar cancelamento</Btn></>}><Field label="Motivo do cancelamento"><TextArea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Informe o motivo para manter o solicitante atualizado..." /></Field></Modal>
  </>;
}

function SideCard({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-xl border bg-card p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3><div className="space-y-3">{children}</div></section>; }
function Info({ label, children }: { label: string; children: ReactNode }) { return <div><p className="mb-1 text-xs text-muted-foreground">{label}</p>{children}</div>; }

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
function isoOf(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function MiniCalendar({ cursor, setCursor, value, onSelect }: { cursor: Date; setCursor: (d: Date) => void; value: string; onSelect: (iso: string) => void }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const startDay = new Date(first); startDay.setDate(1 - offset);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(startDay); d.setDate(startDay.getDate() + i); return d; });
  const today = isoOf(new Date());
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-full p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-medium capitalize">{cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-full p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-medium uppercase text-muted-foreground">{WEEKDAYS.map((d, i) => <span key={i} className="py-1">{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d) => {
          const iso = isoOf(d);
          const outside = d.getMonth() !== cursor.getMonth();
          const selected = iso === value;
          return (
            <button key={iso} type="button" onClick={() => onSelect(iso)}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs tabular-nums transition-colors ${selected ? "bg-foreground font-semibold text-background" : iso === today ? "border border-foreground/30 hover:bg-accent" : "hover:bg-accent"} ${outside ? "text-muted-foreground/50" : ""}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function Timeline({ event }: { event: ReservationEvent }) {
  const when = new Date(event.at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  if (event.kind === "message") { const initials = event.author.split(" ").map((part) => part[0]).slice(0, 2).join(""); return <div className="flex gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${event.role === "gestor" ? "bg-primary/10 text-primary" : "bg-muted"}`}>{initials}</span><div className="flex-1"><div className="flex items-center gap-2 text-xs"><span className="font-medium">{event.author}</span><span className="text-muted-foreground">{event.role === "gestor" ? "Equipe de Reservas" : "Solicitante"}</span><span className="ml-auto text-muted-foreground">{when}</span></div><p className="mt-1 rounded-lg bg-muted/40 p-3 text-sm">{event.body}</p></div></div>; }
  const text = event.kind === "status" ? `alterou o status de ${STATUS_LABEL[event.from]} para ${STATUS_LABEL[event.to]}` : `alterou o horário de ${event.from} para ${event.to}`;
  return <div className="flex items-start gap-3 text-xs text-muted-foreground"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"><Clock3 className="h-3.5 w-3.5" /></span><div className="flex-1"><p><strong className="text-foreground">{event.author}</strong> {text}</p>{event.reason && <p className="mt-1">Motivo: {event.reason}</p>}</div><span>{when}</span></div>;
}
