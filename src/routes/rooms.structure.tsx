import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CrudHeader,
  SectionCard, EmptyState, Btn, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, LoadingCards,
} from "@/components/shared";
import { roomService } from "@/services/mock-api";
import type { Room } from "@/mock/database/rooms";
import type { Campus } from "@/mock/database/campuses";
import type { Block } from "@/mock/database/blocks";
import type { Reservation } from "@/mock/database/reservations";
import { SpaceStatusBadge, TypeBadge } from "@/components/rooster/rooms/badges";
import {
  SPACE_TYPE_LABEL, RESOURCE_LABEL, WEEKDAY_LABEL, formatDate, isoOf,
  roomSlots, buildSlots, parseOpeningHours,
} from "@/components/rooster/rooms/labels";
import {
  Building2, Layers, DoorOpen, Plus, Pencil, Trash2, MapPin, User,
  Users, Ruler, Clock, CalendarDays, ChevronRight, X,
} from "lucide-react";

export const Route = createFileRoute("/rooms/structure")({
  component: StructurePage,
});

function StructurePage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Navegação em níveis: campus -> blocos -> ambientes -> detalhe do ambiente
  const [campusId, setCampusId] = useState<string | null>(null);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [campusModal, setCampusModal] = useState<{ open: boolean; editing?: Campus }>({ open: false });
  const [blockModal, setBlockModal] = useState<{ open: boolean; editing?: Block; campusId?: string }>({ open: false });
  const [roomModal, setRoomModal] = useState<{ open: boolean; editing?: Room; campusId?: string; blockId?: string }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "campus" | "block" | "room"; id: string } | null>(null);

  function reload() {
    Promise.all([roomService.getCampuses(), roomService.getBlocks(), roomService.getAll(), roomService.getReservations()]).then(
      ([c, b, r, res]) => {
        setCampuses(c);
        setBlocks(b);
        setRooms(r);
        setReservations(res);
        setLoading(false);
      },
    );
  }
  useEffect(reload, []);

  const campus = campuses.find((c) => c.id === campusId) ?? null;
  const block = blocks.find((b) => b.id === blockId) ?? null;
  const room = rooms.find((r) => r.id === roomId) ?? null;

  const level: "campus" | "blocks" | "rooms" | "room" = room ? "room" : block ? "rooms" : campus ? "blocks" : "campus";
  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.kind === "campus") { await roomService.removeCampus(confirmDelete.id); setCampusId(null); setBlockId(null); setRoomId(null); }
      if (confirmDelete.kind === "block") { await roomService.removeBlock(confirmDelete.id); setBlockId(null); setRoomId(null); }
      if (confirmDelete.kind === "room") { await roomService.remove(confirmDelete.id); setRoomId(null); }
      setConfirmDelete(null);
      reload();
      const label = confirmDelete.kind === "campus" ? "Campus excluído com sucesso" : confirmDelete.kind === "block" ? "Bloco excluído com sucesso" : "Ambiente excluído com sucesso";
      toast.success(label);
    } catch (err) {
      setConfirmDelete(null);
      toast.error(err instanceof Error ? err.message : "Falha ao excluir item");
    }
  }

  if (loading) return <LoadingCards />;

  return (
    <>
      <CrudHeader
        title="Estrutura física"
        description="Navegue por campus, blocos e ambientes. Clique em um card para abrir o próximo nível."
        actions={
          level === "campus" ? (
            <Btn variant="solid" onClick={() => setCampusModal({ open: true })}><Plus className="h-4 w-4" /> Novo campus</Btn>
          ) : level === "blocks" && campus ? (
            <Btn variant="solid" onClick={() => setBlockModal({ open: true, campusId: campus.id })}><Plus className="h-4 w-4" /> Novo bloco</Btn>
          ) : level === "rooms" && block ? (
            <Btn variant="solid" onClick={() => setRoomModal({ open: true, campusId: block.campusId, blockId: block.id })}><Plus className="h-4 w-4" /> Novo ambiente</Btn>
          ) : undefined
        }
      />

      {/* Trilha de navegação */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <Crumb active={level === "campus"} onClick={() => { setCampusId(null); setBlockId(null); setRoomId(null); }}>
          <Building2 className="h-3.5 w-3.5" /> Campus
        </Crumb>
        {campus && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Crumb active={level === "blocks"} onClick={() => { setBlockId(null); setRoomId(null); }}>
              <Layers className="h-3.5 w-3.5" /> {campus.name}
            </Crumb>
          </>
        )}
        {block && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Crumb active={level === "rooms"} onClick={() => setRoomId(null)}>
              <DoorOpen className="h-3.5 w-3.5" /> {block.name}
            </Crumb>
          </>
        )}
        {room && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Crumb active onClick={() => undefined}>{room.name}</Crumb>
          </>
        )}
      </div>

      {level !== "room" && (
        <div className="mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={level === "campus" ? "Buscar campus" : level === "blocks" ? "Buscar bloco" : "Buscar ambiente"}
            className="w-full max-w-sm rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      )}

      {level === "campus" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {campuses.filter((c) => match(`${c.name} ${c.code} ${c.city}`)).map((c) => (
            <NavCard
              key={c.id}
              icon={Building2}
              title={c.name}
              subtitle={`${c.code} · ${c.city}/${c.state}`}
              meta={`${blocks.filter((b) => b.campusId === c.id).length} blocos · ${rooms.filter((r) => r.campusId === c.id).length} ambientes`}
              onOpen={() => setCampusId(c.id)}
              onEdit={() => setCampusModal({ open: true, editing: c })}
              onDelete={() => setConfirmDelete({ kind: "campus", id: c.id })}
            />
          ))}
          {campuses.length === 0 && <EmptyState icon={Building2} title="Nenhum campus cadastrado" />}
        </div>
      )}

      {level === "blocks" && campus && (
        <>
          <SectionCard title={campus.name} description={`Código ${campus.code}`} className="mb-4">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <InfoRow icon={MapPin} label="Endereço" value={`${campus.address} · ${campus.city}/${campus.state}`} />
              <InfoRow icon={User} label="Responsável" value={campus.manager} />
            </div>
            {campus.notes && <p className="mt-3 text-xs text-muted-foreground">{campus.notes}</p>}
          </SectionCard>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {blocks.filter((b) => b.campusId === campus.id && match(`${b.name} ${b.code}`)).map((b) => (
              <NavCard
                key={b.id}
                icon={Layers}
                title={b.name}
                subtitle={`Código ${b.code} · ${b.floors} andares`}
                meta={`${rooms.filter((r) => r.blockId === b.id).length} ambientes · ${b.manager}`}
                onOpen={() => setBlockId(b.id)}
                onEdit={() => setBlockModal({ open: true, editing: b, campusId: b.campusId })}
                onDelete={() => setConfirmDelete({ kind: "block", id: b.id })}
              />
            ))}
            {blocks.filter((b) => b.campusId === campus.id).length === 0 && (
              <EmptyState icon={Layers} title="Nenhum bloco neste campus" />
            )}
          </div>
        </>
      )}

      {level === "rooms" && block && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rooms.filter((r) => r.blockId === block.id && match(`${r.name} ${r.code}`)).map((r) => (
            <NavCard
              key={r.id}
              icon={DoorOpen}
              title={r.name}
              subtitle={`${r.code} · ${SPACE_TYPE_LABEL[r.type]}`}
              meta={`Cap. ${r.capacity} · ${r.openingHours} · ${roomSlots(r).length} períodos`}
              badge={<SpaceStatusBadge status={r.status} />}
              onOpen={() => setRoomId(r.id)}
              onEdit={() => setRoomModal({ open: true, editing: r, campusId: r.campusId, blockId: r.blockId })}
              onDelete={() => setConfirmDelete({ kind: "room", id: r.id })}
            />
          ))}
          {rooms.filter((r) => r.blockId === block.id).length === 0 && (
            <EmptyState icon={DoorOpen} title="Nenhum ambiente neste bloco" />
          )}
        </div>
      )}

      {level === "room" && room && (
        <RoomDetail
          room={room}
          reservations={reservations.filter((r) => r.roomId === room.id)}
          onEdit={() => setRoomModal({ open: true, editing: room, campusId: room.campusId, blockId: room.blockId })}
          onDelete={() => setConfirmDelete({ kind: "room", id: room.id })}
        />
      )}

      <CampusModal
        state={campusModal}
        onClose={() => setCampusModal({ open: false })}
        onSaved={reload}
      />
      <BlockModal
        state={blockModal}
        campuses={campuses}
        onClose={() => setBlockModal({ open: false })}
        onSaved={reload}
      />
      <RoomModal
        state={roomModal}
        campuses={campuses}
        blocks={blocks}
        onClose={() => setRoomModal({ open: false })}
        onSaved={reload}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Excluir item"
        description="Esta ação removerá o registro e não poderá ser desfeita."
      />
    </>
  );
}

function Crumb({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function NavCard({
  icon: Icon,
  title,
  subtitle,
  meta,
  badge,
  onOpen,
  onEdit,
  onDelete,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  meta: string;
  badge?: React.ReactNode;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/25">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border bg-background">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {badge}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{meta}</p>
      </button>
      <div className="mt-3 flex items-center justify-between border-t pt-2.5">
        <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          Abrir <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <div className="flex gap-1">
          <button type="button" onClick={onEdit} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onDelete} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1 text-[11px] uppercase text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function RoomDetail({
  room,
  reservations,
  onEdit,
  onDelete,
}: {
  room: Room;
  reservations: Reservation[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const today = isoOf(new Date());
  const upcoming = reservations
    .filter((r) => r.date >= today && r.status !== "cancelada")
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 8);

  return (
    <SectionCard
      title={room.name}
      description={`${room.code} · ${SPACE_TYPE_LABEL[room.type]}`}
      action={
        <div className="flex gap-2">
          <Btn onClick={onEdit}><Pencil className="h-4 w-4" /> Editar</Btn>
          <Btn onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4" /> Excluir</Btn>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={room.type} />
        <SpaceStatusBadge status={room.status} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Cap. {room.capacity}</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Ruler className="h-3.5 w-3.5" /> {room.area} m²</span>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{room.description}</p>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <InfoRow icon={Clock} label="Horário de funcionamento" value={room.openingHours} />
        <InfoRow icon={CalendarDays} label="Dias de funcionamento" value={room.weekdays.map((w) => WEEKDAY_LABEL[w] ?? w).join(" · ")} />
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Períodos reserváveis</p>
        <div className="flex flex-wrap gap-1.5">
          {roomSlots(room).map((s) => (
            <span key={s.label} className="rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">{s.label}</span>
          ))}
        </div>
      </div>

      {room.resources.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Equipamentos e recursos</p>
          <div className="flex flex-wrap gap-1.5">
            {room.resources.map((r) => (
              <span key={r} className="rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">{RESOURCE_LABEL[r]}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 border-t pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Próximas reservas neste ambiente</p>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nenhuma reserva futura para este ambiente" />
        ) : (
          <ul className="divide-y rounded-lg border">
            {upcoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="tabular-nums text-muted-foreground">{formatDate(r.date)}</span>
                <span className="tabular-nums">{r.start}–{r.end}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{r.event}</span>
                <span className="text-muted-foreground">{r.responsible}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}

function CampusModal({
  state,
  onClose,
  onSaved,
}: {
  state: { open: boolean; editing?: Campus };
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = state.editing;
  const [form, setForm] = useState<Partial<Campus>>({});
  useEffect(() => {
    setForm(editing ?? { active: true, color: "oklch(0.55 0.19 265)" });
  }, [editing, state.open]);

  async function save() {
    if (!form.name || !form.code) return;
    try {
      if (editing) await roomService.updateCampus(editing.id, form);
      else await roomService.createCampus(form as Omit<Campus, "id">);
      onSaved();
      onClose();
      toast.success(editing ? "Campus atualizado com sucesso" : "Campus criado com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar campus");
    }
  }

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={editing ? "Editar campus" : "Novo campus"}
      footer={<Btn variant="solid" onClick={save}>Salvar</Btn>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nome" required><TextInput value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Código" required><TextInput value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
        <Field label="Cidade"><TextInput value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="UF"><TextInput value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
        <Field label="Endereço" className="md:col-span-2"><TextInput value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="CEP"><TextInput value={form.zip ?? ""} onChange={(e) => setForm({ ...form, zip: e.target.value })} /></Field>
        <Field label="Responsável"><TextInput value={form.manager ?? ""} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></Field>
        <Field label="Observações" className="md:col-span-2"><TextArea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function BlockModal({
  state,
  campuses,
  onClose,
  onSaved,
}: {
  state: { open: boolean; editing?: Block; campusId?: string };
  campuses: Campus[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = state.editing;
  const [form, setForm] = useState<Partial<Block>>({});
  useEffect(() => {
    setForm(editing ?? { active: true, campusId: state.campusId, floors: 1 });
  }, [editing, state.open, state.campusId]);

  async function save() {
    if (!form.name || !form.code || !form.campusId) return;
    try {
      if (editing) await roomService.updateBlock(editing.id, form);
      else await roomService.createBlock(form as Omit<Block, "id">);
      onSaved();
      onClose();
      toast.success(editing ? "Bloco atualizado com sucesso" : "Bloco criado com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar bloco");
    }
  }

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={editing ? "Editar bloco" : "Novo bloco"}
      footer={<Btn variant="solid" onClick={save}>Salvar</Btn>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Campus" required className="md:col-span-2">
          <SelectInput
            value={form.campusId ?? ""}
            onChange={(e) => setForm({ ...form, campusId: e.target.value })}
            options={campuses.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field label="Nome" required><TextInput value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Código" required><TextInput value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
        <Field label="Andares"><TextInput type="number" value={form.floors ?? 1} onChange={(e) => setForm({ ...form, floors: Number(e.target.value) })} /></Field>
        <Field label="Responsável"><TextInput value={form.manager ?? ""} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function RoomModal({
  state,
  campuses,
  blocks,
  onClose,
  onSaved,
}: {
  state: { open: boolean; editing?: Room; campusId?: string; blockId?: string };
  campuses: Campus[];
  blocks: Block[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = state.editing;
  const [form, setForm] = useState<Partial<Room>>({});
  useEffect(() => {
    setForm(
      editing ?? {
        campusId: state.campusId,
        blockId: state.blockId,
        type: "sala",
        status: "disponivel",
        resources: [],
        gallery: [],
        cover: "linear-gradient(135deg, oklch(0.6 0.18 260), oklch(0.68 0.18 305))",
        floor: 1,
        capacity: 30,
        area: 40,
        openingHours: "07:00 – 22:00",
        weekdays: ["seg", "ter", "qua", "qui", "sex"],
      },
    );
  }, [editing, state.open, state.campusId, state.blockId]);

  async function save() {
    if (!form.name || !form.code || !form.campusId || !form.blockId) return;
    try {
      if (editing) await roomService.update(editing.id, form);
      else await roomService.create(form as Omit<Room, "id">);
      onSaved();
      onClose();
      toast.success(editing ? "Ambiente atualizado com sucesso" : "Ambiente criado com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar ambiente");
    }
  }

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={editing ? "Editar ambiente" : "Novo ambiente"}
      size="lg"
      footer={<Btn variant="solid" onClick={save}>Salvar</Btn>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Campus" required>
          <SelectInput
            value={form.campusId ?? ""}
            onChange={(e) => setForm({ ...form, campusId: e.target.value, blockId: "" })}
            options={campuses.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field label="Bloco" required>
          <SelectInput
            value={form.blockId ?? ""}
            onChange={(e) => setForm({ ...form, blockId: e.target.value })}
            options={blocks.filter((b) => !form.campusId || b.campusId === form.campusId).map((b) => ({ value: b.id, label: b.name }))}
          />
        </Field>
        <Field label="Nome" required><TextInput value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Código" required><TextInput value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
        <Field label="Tipo">
          <SelectInput
            value={form.type ?? "sala"}
            onChange={(e) => setForm({ ...form, type: e.target.value as Room["type"] })}
            options={Object.entries(SPACE_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </Field>
        <Field label="Status">
          <SelectInput
            value={form.status ?? "disponivel"}
            onChange={(e) => setForm({ ...form, status: e.target.value as Room["status"] })}
            options={[
              { value: "disponivel", label: "Disponível" },
              { value: "em-uso", label: "Em uso" },
              { value: "manutencao", label: "Manutenção" },
              { value: "bloqueado", label: "Bloqueado" },
            ]}
          />
        </Field>
        <Field label="Capacidade"><TextInput type="number" value={form.capacity ?? 0} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></Field>
        <Field label="Área (m²)"><TextInput type="number" value={form.area ?? 0} onChange={(e) => setForm({ ...form, area: Number(e.target.value) })} /></Field>
        <Field label="Horário de funcionamento" hint="Ex.: 07:00 – 22:00"><TextInput value={form.openingHours ?? ""} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} /></Field>
        <Field label="Descrição" className="md:col-span-2"><TextArea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="md:col-span-2">
          <SlotEditor
            openingHours={form.openingHours ?? "07:00 – 22:00"}
            slots={form.slots ?? roomSlots({ openingHours: form.openingHours ?? "07:00 – 22:00", slotMinutes: form.slotMinutes }).map((s) => `${s.start}-${s.end}`)}
            onChange={(slots) => setForm({ ...form, slots })}
          />
        </div>
      </div>
    </Modal>
  );
}

/** Editor de períodos de horário reserváveis do ambiente (usados na tela Reservar). */
function SlotEditor({
  openingHours,
  slots,
  onChange,
}: {
  openingHours: string;
  slots: string[];
  onChange: (slots: string[]) => void;
}) {
  const base = parseOpeningHours(openingHours);
  const [start, setStart] = useState(base.start);
  const [end, setEnd] = useState(base.end);
  const [minutes, setMinutes] = useState(60);

  function generate() {
    onChange(buildSlots(start, end, minutes).map((s) => `${s.start}-${s.end}`));
  }
  function addManual() {
    const value = `${start}-${end}`;
    if (!slots.includes(value)) onChange([...slots, value].sort());
  }

  return (
    <div className="rounded-xl border bg-background/40 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium"><Clock className="h-3.5 w-3.5" /> Períodos de horário</p>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Estes períodos aparecem como opções na tela Reservar (ex.: 07:00 - 08:00).
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Início">
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Fim">
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Duração (min)">
          <SelectInput
            value={String(minutes)}
            onChange={(e) => setMinutes(Number(e.target.value))}
            options={[30, 45, 50, 60, 90, 120].map((m) => ({ value: String(m), label: `${m} min` }))}
            className="w-32"
          />
        </Field>
        <Btn onClick={generate}>Gerar períodos</Btn>
        <Btn onClick={addManual}><Plus className="h-4 w-4" /> Adicionar</Btn>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {slots.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">Nenhum período cadastrado.</span>
        ) : (
          slots.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] tabular-nums">
              {s.replace("-", " - ")}
              <button type="button" onClick={() => onChange(slots.filter((x) => x !== s))} className="text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
