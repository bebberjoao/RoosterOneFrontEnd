import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, StatCard, Btn, TONE, Chip, Avatar, EmptyState } from "@/components/rooster/student/ui";
import { TICKETS, SECTORS, formatDate } from "@/components/rooster/student/mock-data";
import type { Ticket } from "@/components/rooster/student/mock-data";
import { LifeBuoy, Plus, X, Send, CheckCircle2, MessagesSquare, Clock } from "lucide-react";
import { SelectInput } from "@/components/shared";

export const Route = createFileRoute("/student/tickets")({ component: StudentTickets });

function StudentTickets() {
  const [selected, setSelected] = useState<Ticket>(TICKETS[0]);
  const [reply, setReply] = useState("");
  const [extra, setExtra] = useState<Record<string, { author: string; role: "aluno"; at: string; text: string }[]>>({});
  const [modal, setModal] = useState(false);
  const [created, setCreated] = useState(false);
  const [sector, setSector] = useState(SECTORS[0]);

  const openCount = TICKETS.filter((t) => t.status !== "resolvido").length;

  const send = () => {
    if (!reply.trim()) return;
    setExtra((p) => ({ ...p, [selected.id]: [...(p[selected.id] ?? []), { author: "Ana Prado", role: "aluno", at: new Date().toISOString().slice(0, 10), text: reply.trim() }] }));
    setReply("");
  };

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Desk"
        title="Central de chamados"
        description="Abra solicitações para qualquer setor, acompanhe o andamento e responda o atendimento."
        actions={<Btn variant="solid" onClick={() => { setModal(true); setCreated(false); }}><Plus className="h-4 w-4" /> Abrir chamado</Btn>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Chamados abertos" value={openCount.toString()} hint="em atendimento" icon={LifeBuoy} tone={TONE.info} />
        <StatCard label="Histórico" value={TICKETS.length.toString()} hint="total de solicitações" icon={MessagesSquare} tone={TONE.cyan} />
        <StatCard label="Tempo médio de resposta" value="6h" hint="últimos 30 dias" icon={Clock} tone={TONE.purple} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <SectionCard title="Meus chamados">
          <ul className="space-y-2">
            {TICKETS.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setSelected(t)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${selected.id === t.id ? "border-foreground/40 bg-accent/50" : "hover:bg-accent/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{t.id}</span>
                    <StatusChip status={t.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium">{t.subject}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t.sector} · atualizado {formatDate(t.updated)}</p>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title={selected.subject}
          description={`${selected.id} · ${selected.sector} · aberto em ${formatDate(selected.created)}`}
          action={<div className="flex gap-1.5"><Chip tone={TONE.muted}>Prioridade</Chip><StatusChip status={selected.priority} /></div>}
        >
          <div className="space-y-3">
            {[...selected.messages, ...(extra[selected.id] ?? [])].map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "aluno" ? "" : "flex-row-reverse"}`}>
                <Avatar initials={m.author.slice(0, 2).toUpperCase()} tone={m.role === "aluno" ? TONE.orange : TONE.info} size={32} />
                <div className={`max-w-[80%] rounded-2xl border p-3 ${m.role === "aluno" ? "bg-background/40" : "bg-accent/40"}`}>
                  <p className="text-[11px] text-muted-foreground">{m.author} · {formatDate(m.at)}</p>
                  <p className="mt-1 text-sm">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          {selected.status !== "resolvido" ? (
            <div className="mt-4 flex gap-2 border-t pt-4">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Escreva uma resposta…"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <Btn variant="solid" onClick={send}><Send className="h-4 w-4" /> Enviar</Btn>
            </div>
          ) : (
            <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">Chamado resolvido — reabra criando uma nova solicitação.</p>
          )}
        </SectionCard>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-semibold">Abrir chamado</h2>
              <button onClick={() => setModal(false)} className="rounded-lg border p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            {created ? (
              <div className="mt-4 rounded-xl border bg-background/40 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" style={{ color: TONE.ok }} /> Chamado registrado</p>
                <p className="mt-1 text-xs text-muted-foreground">Você receberá as atualizações na central de notificações.</p>
                <Btn className="mt-3" onClick={() => setModal(false)}>Fechar</Btn>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">Setor</label>
                  <SelectInput value={sector} onChange={(e) => setSector(e.target.value)} options={SECTORS.map((s) => ({ value: s, label: s }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Assunto</label>
                  <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Resuma sua solicitação" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Descrição</label>
                  <textarea rows={5} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Descreva o que aconteceu" />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Btn onClick={() => setModal(false)}>Cancelar</Btn>
                  <Btn variant="solid" onClick={() => setCreated(true)}>Enviar chamado</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
