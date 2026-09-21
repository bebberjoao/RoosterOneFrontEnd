import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CalendarClock, CheckCircle2, CircleX, Clock3, MessageCircle, Plus } from "lucide-react";
import { Btn, CrudHeader, CrudToolbar, DataTable, StatCard, TONE, type Column } from "@/components/shared";
import { session } from "@/services/hub/session";
import { StatusBadge } from "@/components/rooster/rooms/badges";
import { STATUS_LABEL, formatDate } from "@/components/rooster/rooms/labels";
import { roomService } from "@/services/mock-api";
import type { Reservation } from "@/mock/database/reservations";
import type { Room } from "@/mock/database/rooms";

export const Route = createFileRoute("/rooms/reservations/")({
  head: () => ({ meta: [{ title: "Minhas reservas — Rooster Rooms" }, { name: "description", content: "Acompanhe solicitações, horários e conversas sobre suas reservas de ambientes." }] }),
  component: MyReservations,
});

function MyReservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Reservation["status"]>("all");

  useEffect(() => {
    const myId = session.usuario?.id;
    Promise.all([roomService.getReservations(), roomService.getAll()]).then(([all, loadedRooms]) => {
      // Filtra pelo id real do usuário logado (responsibleId, vindo do backend) — nunca por nome
      // de exibição. Sem fallback: se não há nenhuma reserva do usuário, a lista fica vazia (não
      // mostra reservas de outra pessoa como se fossem suas).
      setReservations(all.filter((r) => r.responsibleId === myId));
      setRooms(loadedRooms);
    });
  }, []);

  const rows = useMemo(() => reservations.filter((r) => {
    const room = rooms.find((item) => item.id === r.roomId);
    return `${r.code} ${r.event} ${room?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (status === "all" || r.status === status);
  }), [reservations, rooms, search, status]);

  const columns: Column<Reservation>[] = [
    { key: "code", header: "Código", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.code}</span> },
    { key: "event", header: "Reserva", cell: (r) => <div><p className="font-medium">{r.event}</p><p className="text-xs text-muted-foreground">{rooms.find((room) => room.id === r.roomId)?.name ?? "Ambiente"}</p></div> },
    { key: "date", header: "Data e horário", cell: (r) => <div><p className="text-sm">{formatDate(r.date)}</p><p className="text-xs text-muted-foreground">{r.start}–{r.end}</p></div>, sortValue: (r) => r.date },
    { key: "messages", header: "Conversa", cell: (r) => <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" />{r.events.filter((e) => e.kind === "message").length}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return <>
    <CrudHeader title="Minhas reservas" description="Acompanhe suas solicitações, converse com a equipe e peça alterações quando necessário." actions={<Btn variant="solid" onClick={() => navigate({ to: "/rooms/book" })}><Plus className="h-4 w-4" /> Nova reserva</Btn>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total" value={String(reservations.length)} hint="Solicitações registradas" icon={CalendarCheck2} tone={TONE.info} />
      <StatCard label="Em análise" value={String(reservations.filter((r) => r.status === "analise").length)} hint="Aguardando a equipe" icon={CalendarClock} tone={TONE.warn} />
      <StatCard label="Confirmadas" value={String(reservations.filter((r) => r.status === "confirmada").length)} hint="Reservas aprovadas" icon={CheckCircle2} tone={TONE.ok} />
      <StatCard label="Canceladas" value={String(reservations.filter((r) => r.status === "cancelada").length)} hint="Consulte os motivos" icon={CircleX} tone={TONE.danger} />
    </div>
    <div className="mb-3 flex flex-wrap gap-2">{(["all", "analise", "confirmada", "andamento", "finalizada", "cancelada"] as const).map((value) => <button key={value} onClick={() => setStatus(value)} className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${status === value ? "border-foreground bg-foreground text-background" : "bg-card hover:bg-accent"}`}>{value === "all" ? "Todas" : STATUS_LABEL[value]}</button>)}</div>
    <CrudToolbar search={search} onSearch={setSearch} placeholder="Buscar por código, reserva ou ambiente..." />
    <DataTable rows={rows} columns={columns} onRowClick={(reservation) => navigate({ to: "/rooms/reservations/$id", params: { id: reservation.id } })} emptyMessage="Nenhuma reserva encontrada." />
    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> Abra uma reserva para conversar, solicitar alteração ou cancelar.</p>
  </>;
}
