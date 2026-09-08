import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, Table, StatCard, Btn, TONE, Chip, EmptyState } from "@/components/rooster/student/ui";
import { RESERVATIONS, AVAILABLE_SPACES, formatDate, today } from "@/components/rooster/student/mock-data";
import { CalendarDays, DoorOpen, Clock, Plus, X, CheckCircle2 } from "lucide-react";
import { SelectInput } from "@/components/shared";

export const Route = createFileRoute("/student/reservations")({ component: StudentReservations });

function StudentReservations() {
  const [modal, setModal] = useState(false);
  const [cancelled, setCancelled] = useState<string[]>([]);
  const [created, setCreated] = useState(false);
  const [form, setForm] = useState({ space: AVAILABLE_SPACES[0].id, date: today, slot: AVAILABLE_SPACES[0].slots[0], purpose: "" });

  const upcoming = RESERVATIONS.filter((r) => r.date >= today && !cancelled.includes(r.id));
  const space = AVAILABLE_SPACES.find((s) => s.id === form.space)!;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Rooms"
        title="Reservas de espaços"
        description="Consulte disponibilidade, reserve salas autorizadas e acompanhe suas reservas."
        actions={<Btn variant="solid" onClick={() => { setModal(true); setCreated(false); }}><Plus className="h-4 w-4" /> Nova reserva</Btn>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Reservas futuras" value={upcoming.length.toString()} hint="confirmadas e pendentes" icon={CalendarDays} tone={TONE.info} />
        <StatCard label="Espaços autorizados" value={AVAILABLE_SPACES.length.toString()} hint="para o seu perfil" icon={DoorOpen} tone={TONE.cyan} />
        <StatCard label="Horas reservadas" value={`${upcoming.length * 2}h`} hint="no período atual" icon={Clock} tone={TONE.purple} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Minhas reservas" className="lg:col-span-2">
          {RESERVATIONS.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nenhuma reserva registrada" />
          ) : (
            <Table head={["Espaço", "Data", "Horário", "Finalidade", "Status", ""]}>
              {RESERVATIONS.map((r) => {
                const st = cancelled.includes(r.id) ? "cancelada" : r.status;
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{r.space}</p>
                      <p className="text-[11px] text-muted-foreground">{r.campus}</p>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatDate(r.date)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{r.time}</td>
                    <td className="px-3 py-2.5">{r.purpose}</td>
                    <td className="px-3 py-2.5"><StatusChip status={st} /></td>
                    <td className="px-3 py-2.5 text-right">
                      {(st === "confirmada" || st === "pendente") && r.date >= today ? (
                        <button onClick={() => setCancelled((p) => [...p, r.id])} className="rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent">Cancelar</button>
                      ) : <span className="text-[11px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </SectionCard>

        <SectionCard title="Disponibilidade hoje" description="Horários livres nos espaços autorizados">
          <ul className="space-y-3">
            {AVAILABLE_SPACES.map((s) => (
              <li key={s.id} className="rounded-xl border bg-background/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{s.name}</p>
                  <Chip tone={TONE.cyan}>{s.capacity} lugares</Chip>
                </div>
                <p className="text-[11px] text-muted-foreground">{s.campus}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.slots.map((t) => (
                    <span key={t} className="rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-semibold">Nova reserva</h2>
              <button onClick={() => setModal(false)} className="rounded-lg border p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            {created ? (
              <div className="mt-4 rounded-xl border bg-background/40 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" style={{ color: TONE.ok }} /> Solicitação registrada</p>
                <p className="mt-1 text-xs text-muted-foreground">A reserva ficará pendente até a confirmação do responsável pelo espaço.</p>
                <Btn className="mt-3" onClick={() => setModal(false)}>Fechar</Btn>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">Espaço</label>
                  <SelectInput value={form.space} onChange={(e) => setForm({ ...form, space: e.target.value, slot: AVAILABLE_SPACES.find((s) => s.id === e.target.value)!.slots[0] })} options={AVAILABLE_SPACES.map((s) => ({ value: s.id, label: `${s.name} · ${s.campus}` }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Data</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Horário</label>
                    <SelectInput value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} options={space.slots.map((t) => ({ value: t, label: t }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Finalidade</label>
                  <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Ex.: estudo em grupo" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Btn onClick={() => setModal(false)}>Cancelar</Btn>
                  <Btn variant="solid" onClick={() => setCreated(true)}>Solicitar reserva</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
