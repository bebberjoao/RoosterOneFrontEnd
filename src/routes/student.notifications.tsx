import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, Chip, TONE, Btn, EmptyState, FilterInput } from "@/components/rooster/student/ui";
import { NOTIFICATIONS, formatDate } from "@/components/rooster/student/mock-data";
import { Bell, BookOpen, Wallet, ClipboardList, LifeBuoy, Rocket, Megaphone, Check, Search } from "lucide-react";

export const Route = createFileRoute("/student/notifications")({ component: StudentNotifications });

const KIND = {
  academico: { label: "Acadêmico", icon: BookOpen, tone: TONE.info },
  financeiro: { label: "Financeiro", icon: Wallet, tone: TONE.ok },
  atividade: { label: "Atividades", icon: ClipboardList, tone: TONE.purple },
  chamado: { label: "Chamados", icon: LifeBuoy, tone: TONE.danger },
  curso: { label: "Cursos", icon: Rocket, tone: TONE.orange },
  institucional: { label: "Institucional", icon: Megaphone, tone: TONE.cyan },
} as const;

function StudentNotifications() {
  const [filter, setFilter] = useState<string>("todas");
  const [q, setQ] = useState("");
  const [read, setRead] = useState<string[]>([]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return NOTIFICATIONS.filter((x) =>
      (filter === "todas" || (filter === "nao-lidas" ? !x.read && !read.includes(x.id) : x.kind === filter)) &&
      (!n || `${x.title} ${x.body}`.toLowerCase().includes(n)),
    );
  }, [filter, q, read]);

  const unread = NOTIFICATIONS.filter((n) => !n.read && !read.includes(n.id)).length;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student"
        title="Central de notificações"
        description="Comunicados, alterações em atividades, notas, respostas de chamados e vencimentos financeiros."
        actions={<Btn onClick={() => setRead(NOTIFICATIONS.map((n) => n.id))}><Check className="h-4 w-4" /> Marcar todas como lidas</Btn>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={q} onChange={setQ} placeholder="Buscar notificação" icon={Search} />
        <div className="flex flex-wrap gap-1.5">
          {[{ id: "todas", label: `Todas (${NOTIFICATIONS.length})` }, { id: "nao-lidas", label: `Não lidas (${unread})` }, ...Object.entries(KIND).map(([k, v]) => ({ id: k, label: v.label }))].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === f.id ? "bg-foreground text-background" : "border hover:bg-accent"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Bell} title="Nenhuma notificação" description="Você está em dia com todos os avisos." />
      ) : (
        <SectionCard title="Notificações" description={`${rows.length} registro(s)`}>
          <ul className="space-y-2">
            {rows.map((n) => {
              const meta = KIND[n.kind];
              const isRead = n.read || read.includes(n.id);
              const Icon = meta.icon;
              return (
                <li key={n.id} className={`flex items-start gap-3 rounded-xl border p-3 ${isRead ? "bg-background/30" : "bg-card"}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${meta.tone} 14%, transparent)`, color: meta.tone }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm ${isRead ? "" : "font-semibold"}`}>{n.title}</p>
                      {!isRead ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE.info }} /> : null}
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(n.at)}</p>
                  </div>
                  {!isRead ? (
                    <button onClick={() => setRead((p) => [...p, n.id])} className="rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent">Marcar lida</button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
