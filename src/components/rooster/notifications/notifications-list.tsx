import { useMemo, useState } from "react";
import { Bell, Check, Search } from "lucide-react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, Btn, EmptyState, FilterInput } from "@/components/rooster/student/ui";
import { tempoRelativo, useNotificacoes } from "./use-notificacoes";

export function NotificationsList({ eyebrow = "Rooster One" }: { eyebrow?: string }) {
  const { itens, naoLidas, carregando, erro, marcarLida, marcarTodasLidas } = useNotificacoes();
  const [filtro, setFiltro] = useState<"todas" | "nao-lidas">("todas");
  const [busca, setBusca] = useState("");

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter(
      (n) =>
        (filtro === "todas" || !n.lida) &&
        (!termo || `${n.titulo ?? ""} ${n.mensagem ?? ""}`.toLowerCase().includes(termo)),
    );
  }, [itens, filtro, busca]);

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Central de notificações"
        description="Avisos sobre seus chamados, reservas e cobranças."
        actions={
          <Btn onClick={() => void marcarTodasLidas()} disabled={naoLidas === 0}>
            <Check className="h-4 w-4" /> Marcar todas como lidas
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={busca} onChange={setBusca} placeholder="Buscar notificação" icon={Search} />
        <div className="flex gap-1.5">
          {[
            { id: "todas", label: `Todas (${itens.length})` },
            { id: "nao-lidas", label: `Não lidas (${naoLidas})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id as "todas" | "nao-lidas")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filtro === f.id ? "bg-foreground text-background" : "border hover:bg-accent"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {erro && itens.length === 0 ? (
        <EmptyState icon={Bell} title="Não foi possível carregar" description="Verifique a conexão com o servidor e tente novamente." />
      ) : linhas.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={carregando ? "Carregando…" : "Nenhuma notificação"}
          description={carregando ? "Buscando seus avisos." : "Você está em dia com todos os avisos."}
        />
      ) : (
        <SectionCard title="Notificações" description={`${linhas.length} registro(s)`}>
          <ul className="space-y-2">
            {linhas.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 rounded-xl border p-3 ${n.lida ? "bg-background/30" : "bg-card"}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.lida ? "bg-transparent" : "bg-primary"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.lida ? "" : "font-semibold"}`}>{n.titulo}</p>
                  {n.mensagem ? <p className="mt-0.5 text-xs text-muted-foreground">{n.mensagem}</p> : null}
                  <p className="mt-1 text-[11px] text-muted-foreground">{tempoRelativo(n.criadoEm)}</p>
                </div>
                {!n.lida ? (
                  <button type="button" onClick={() => void marcarLida(n.id)} className="rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent">
                    Marcar lida
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
