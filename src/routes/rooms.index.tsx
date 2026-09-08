import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CrudHeader, StatCard, SectionCard, EmptyState, TONE } from "@/components/shared";
import { roomService } from "@/services/mock-api";
import type { Room } from "@/mock/database/rooms";
import type { Reservation } from "@/mock/database/reservations";
import type { Campus } from "@/mock/database/campuses";
import type { Block } from "@/mock/database/blocks";
import { StatusBadge, SpaceStatusBadge } from "@/components/rooster/rooms/badges";
import { SPACE_TYPE_TONE, formatDate, isoOf } from "@/components/rooster/rooms/labels";
import {
  DoorOpen, CalendarDays, CalendarRange, CheckCircle2, Activity,
  Clock3, XCircle, ArrowUpRight, AlertTriangle, Inbox,
} from "lucide-react";

export const Route = createFileRoute("/rooms/")({
  component: RoomsDashboard,
});

function RoomsDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      roomService.getAll(),
      roomService.getReservations(),
      roomService.getCampuses(),
      roomService.getBlocks(),
    ]).then(([r, res, c, b]) => {
      setRooms(r);
      setReservations(res);
      setCampuses(c);
      setBlocks(b);
    }).catch(() => {
      setRooms([]);
      setReservations([]);
      setCampuses([]);
      setBlocks([]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando painel...</p>;
  }

  const roomById = (id: string) => rooms.find((r) => r.id === id);
  const campusById = (id: string) => campuses.find((c) => c.id === id);
  const blockById = (id: string) => blocks.find((b) => b.id === id);

  const today = isoOf(new Date());
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const weekIso = isoOf(endOfWeek);

  const todayRes = reservations.filter((r) => r.date === today && r.status !== "cancelada");
  const weekRes = reservations.filter((r) => r.date >= today && r.date <= weekIso && r.status !== "cancelada");
  const available = rooms.filter((s) => s.status === "disponivel").length;
  const inUse = rooms.filter((s) => s.status === "em-uso").length;
  const pending = reservations.filter((r) => r.status === "analise").length;
  const canceled = reservations.filter((r) => r.status === "cancelada").length;

  const STATS = [
    { label: "Total de ambientes", value: rooms.length.toString(), hint: `${campuses.length} campus · ${blocks.length} blocos`, icon: DoorOpen, tone: TONE.info },
    { label: "Reservas do dia", value: todayRes.length.toString(), hint: "atualizadas em tempo real", icon: CalendarDays, tone: TONE.info },
    { label: "Reservas na semana", value: weekRes.length.toString(), hint: "próximos 7 dias", icon: CalendarRange, tone: TONE.ok },
    { label: "Disponíveis", value: available.toString(), hint: "prontos para uso", icon: CheckCircle2, tone: TONE.cyan },
    { label: "Em uso agora", value: inUse.toString(), hint: "ocupação ativa", icon: Activity, tone: TONE.orange },
    { label: "Aguardando aprovação", value: pending.toString(), hint: "requer ação", icon: Clock3, tone: TONE.warn },
    { label: "Cancelamentos", value: canceled.toString(), hint: "no período", icon: XCircle, tone: TONE.danger },
  ];

  const upcoming = [...reservations]
    .filter((r) => r.date >= today && r.status !== "cancelada")
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 6);

  const todayAgenda = [...todayRes].sort((a, b) => a.start.localeCompare(b.start)).slice(0, 6);
  const unavailable = rooms.filter((s) => s.status === "manutencao" || s.status === "bloqueado");

  return (
    <>
      <CrudHeader
        title="Rooster Rooms — Visão geral"
        description="Ocupação, reservas e disponibilidade de todos os ambientes da instituição."
        actions={
          <Link
            to="/rooms/reservations"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Nova reserva <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
        {STATS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} icon={s.icon} tone={s.tone} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Próximas reservas"
          className="lg:col-span-2 !p-0"
          action={<Link to="/rooms/reservations" className="text-xs font-medium text-muted-foreground hover:text-foreground">Ver todas</Link>}
        >
          {upcoming.length === 0 ? (
            <EmptyState icon={Inbox} title="Nenhuma reserva futura" />
          ) : (
            <ul className="divide-y">
              {upcoming.map((r) => {
                const s = roomById(r.spaceId);
                if (!s) return null;
                return (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex w-16 flex-none flex-col items-center rounded-md border bg-card p-1.5 text-center">
                      <span className="text-[10px] uppercase text-muted-foreground">{formatDate(r.date).split(" ")[1]}</span>
                      <span className="text-lg font-semibold tabular-nums leading-none">{r.date.slice(-2)}</span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{r.start}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.event}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span style={{ color: SPACE_TYPE_TONE[s.type] }}>●</span>
                        <span className="truncate">{s.name} · {campusById(s.campusId)?.code}/{blockById(s.blockId)?.code}</span>
                        <span>·</span>
                        <span>{r.responsible}</span>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Agenda do dia"
          className="!p-0"
          action={<Link to="/rooms/reservations" className="text-xs font-medium text-muted-foreground hover:text-foreground">Abrir agenda</Link>}
        >
          <ul className="divide-y">
            {todayAgenda.length === 0 ? (
              <li className="px-5 py-6 text-center text-xs text-muted-foreground">Nenhuma reserva confirmada para hoje.</li>
            ) : (
              todayAgenda.map((r) => {
                const s = roomById(r.spaceId);
                return (
                  <li key={r.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs tabular-nums font-medium">{r.start} – {r.end}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="mt-1 truncate text-sm">{r.event}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.name} · {r.responsible}</div>
                  </li>
                );
              })
            )}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="Ambientes indisponíveis"
          description={`${unavailable.length} ambientes em manutenção ou bloqueados`}
          className="!p-0"
        >
          {unavailable.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Todos os ambientes disponíveis" />
          ) : (
            <ul className="divide-y">
              {unavailable.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="h-9 w-14 flex-none rounded-md" style={{ background: s.cover }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {campusById(s.campusId)?.name} · {blockById(s.blockId)?.name}
                    </div>
                  </div>
                  <SpaceStatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
