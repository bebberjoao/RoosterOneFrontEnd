import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CalendarClock, CheckCircle2, CircleX, Clock3, MessageCircle, Reply, XCircle } from "lucide-react";
import { Btn, CrudHeader, CrudToolbar, DataTable, Field, Modal, StatCard, TextArea, TONE, type Column } from "@/components/shared";
import { useRole, ROLE_META } from "@/components/rooster/role-context";
import { StatusBadge } from "@/components/rooster/rooms/badges";
import { STATUS_LABEL, formatDate } from "@/components/rooster/rooms/labels";
import { roomService } from "@/services/mock-api";
import type { Reservation } from "@/mock/database/reservations";
import type { Room } from "@/mock/database/rooms";

export const Route = createFileRoute("/rooms/manage")({
  head: () => ({ meta: [
    { title: "Gerenciar reservas — Rooster Rooms" },
    { name: "description", content: "Fila operacional para responder solicitantes, aprovar e cancelar reservas de ambientes." },
  ] }),
  component: ManageReservations,
});

function ManageReservations() {
  const navigate = useNavigate();
  const { role } = useRole();
  const person = ROLE_META[role].person;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Reservation["status"]>("all");
  const [dialog, setDialog] = useState<{ kind: "reply" | "cancel"; item: Reservation } | null>(null);
  const [text, setText] = useState("");

  const reload = () => Promise.all([roomService.getReservations(), roomService.getAll()]).then(([all, loadedRooms]) => {
    setReservations(all);
    setRooms(loadedRooms);
  });
  useEffect(() => { void reload(); }, []);

  const rows = useMemo(() => reservations.filter((r) => {
    const room = rooms.find((item) => item.id === r.roomId);
    return `${r.code} ${r.event} ${r.responsible} ${room?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (status === "all" || r.status === status);
  }), [reservations, rooms, search, status]);

  async function confirmDialog() {
    if (!dialog || !text.trim()) return;
    if (dialog.kind === "reply") await roomService.addReservationMessage(dialog.item.id, { body: text.trim() });
    else await roomService.changeReservationStatus(dialog.item.id, "cancelada", person.name, text.trim());
    setDialog(null); setText("");
    await reload();
  }

  async function approve(item: Reservation) {
    await roomService.changeReservationStatus(item.id, "confirmada", person.name);
    await reload();
  }

  const columns: Column<Reservation>[] = [
    { key: "code", header: "Código", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.code}</span> },
    { key: "event", header: "Reserva", cell: (r) => <div><p className="font-medium">{r.event}</p><p className="text-xs text-muted-foreground">{rooms.find((room) => room.id === r.roomId)?.name ?? "Ambiente"}</p></div> },
    { key: "responsible", header: "Solicitante", cell: (r) => <div><p className="text-sm">{r.responsible}</p><p className="text-xs text-muted-foreground">{r.sector}</p></div> },
    { key: "date", header: "Data e horário", cell: (r) => <div><p className="text-sm">{formatDate(r.date)}</p><p className="text-xs text-muted-foreground">{r.start}–{r.end}</p></div>, sortValue: (r) => r.date },
    { key: "messages", header: "Conversa", cell: (r) => <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" />{r.events.filter((e) => e.kind === "message").length}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions", header: "Ações", cell: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {r.status === "analise" && <Btn onClick={() => void approve(r)}><CheckCircle2 className="h-4 w-4" /> Aprovar</Btn>}
          <Btn onClick={() => { setDialog({ kind: "reply", item: r }); setText(""); }}><Reply className="h-4 w-4" /> Responder</Btn>
          {r.status !== "cancelada" && <Btn className="text-destructive" onClick={() => { setDialog({ kind: "cancel", item: r }); setText(""); }}><XCircle className="h-4 w-4" /> Cancelar</Btn>}
        </div>
      ),
    },
  ];

  return <>
    <CrudHeader title="Gerenciar reservas" description="Analise as solicitações, responda os solicitantes e cancele reservas informando o motivo." />
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total" value={String(reservations.length)} hint="Solicitações registradas" icon={CalendarCheck2} tone={TONE.info} />
      <StatCard label="Em análise" value={String(reservations.filter((r) => r.status === "analise").length)} hint="Aguardando decisão" icon={CalendarClock} tone={TONE.warn} />
      <StatCard label="Confirmadas" value={String(reservations.filter((r) => r.status === "confirmada").length)} hint="Reservas aprovadas" icon={CheckCircle2} tone={TONE.ok} />
      <StatCard label="Canceladas" value={String(reservations.filter((r) => r.status === "cancelada").length)} hint="Com motivo registrado" icon={CircleX} tone={TONE.danger} />
    </div>
    <div className="mb-3 flex flex-wrap gap-2">{(["all", "analise", "confirmada", "andamento", "finalizada", "cancelada"] as const).map((value) => <button key={value} onClick={() => setStatus(value)} className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${status === value ? "border-foreground bg-foreground text-background" : "bg-card hover:bg-accent"}`}>{value === "all" ? "Todas" : STATUS_LABEL[value]}</button>)}</div>
    <CrudToolbar search={search} onSearch={setSearch} placeholder="Buscar por código, reserva, solicitante ou ambiente..." />
    <DataTable rows={rows} columns={columns} onRowClick={(reservation) => navigate({ to: "/rooms/reservations/$id", params: { id: reservation.id } })} emptyMessage="Nenhuma reserva encontrada." />
    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> Abra uma reserva para ver a conversa completa e o histórico.</p>

    <Modal
      open={!!dialog}
      onClose={() => setDialog(null)}
      title={dialog?.kind === "cancel" ? "Cancelar reserva" : "Responder solicitante"}
      footer={<><Btn onClick={() => setDialog(null)}>Voltar</Btn><Btn variant="solid" disabled={!text.trim()} className={dialog?.kind === "cancel" ? "bg-destructive text-destructive-foreground" : ""} onClick={confirmDialog}>{dialog?.kind === "cancel" ? "Confirmar cancelamento" : "Enviar resposta"}</Btn></>}
    >
      <Field label={dialog?.kind === "cancel" ? "Motivo do cancelamento" : "Mensagem"}>
        <TextArea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={dialog?.kind === "cancel" ? "Informe o motivo para manter o solicitante atualizado..." : "Escreva a resposta para o solicitante..."} />
      </Field>
    </Modal>
  </>;
}
