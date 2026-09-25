import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, UserPlus, X } from "lucide-react";
import { Btn, EmptyState, SectionCard, TextInput } from "@/components/shared";
import { useCan } from "@/components/rooster/hub/permission-context";
import { boostService, type BoostOrientator } from "@/services/mock-api/boost.service";

/**
 * Professores vinculados ao curso como orientadores. O vínculo só dá acesso à CONVERSA com os
 * alunos — não permite editar o curso, ver progresso nem publicar.
 */
export function CourseOrientatorsTab({ courseId }: { courseId: string }) {
  const canLink = useCan("/boost/manage", "vincular-orientadores");
  const [linked, setLinked] = useState<BoostOrientator[]>([]);
  const [professors, setProfessors] = useState<BoostOrientator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [atuais, todos] = await Promise.all([
          boostService.getOrientators(courseId),
          canLink ? boostService.getProfessors() : Promise.resolve([] as BoostOrientator[]),
        ]);
        if (!alive) return;
        setLinked(atuais);
        setProfessors(todos);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao carregar orientadores");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [courseId, canLink]);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ids = new Set(linked.map((o) => o.id));
    return professors.filter((p) => !ids.has(p.id) && (!q || `${p.name} ${p.email ?? ""}`.toLowerCase().includes(q)));
  }, [professors, linked, query]);

  async function apply(next: BoostOrientator[], success: string) {
    setSaving(true);
    try {
      setLinked(await boostService.setOrientators(courseId, next.map((o) => o.id)));
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar orientadores");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard
        title="Orientadores do curso"
        description="Respondem às dúvidas dos alunos na tela “Conversas”. Não editam o curso."
      >
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : linked.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Nenhum orientador vinculado"
            description="Sem orientador, os alunos não conseguem enviar dúvidas neste curso."
          />
        ) : (
          <ul className="divide-y">
            {linked.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{o.name}</div>
                  {o.email && <div className="truncate text-[11px] text-muted-foreground">{o.email}</div>}
                </div>
                {canLink && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => apply(linked.filter((x) => x.id !== o.id), "Orientador removido")}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive disabled:opacity-50"
                    aria-label={`Remover ${o.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {canLink ? (
        <SectionCard title="Vincular professor" description="Professores cadastrados no Rooster Academy.">
          <div className="space-y-3">
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou e-mail" />
            {available.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {professors.length === 0 ? "Nenhum professor cadastrado." : "Nenhum professor disponível para vincular."}
              </p>
            ) : (
              <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
                {available.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{p.name}</div>
                      {p.email && <div className="truncate text-[11px] text-muted-foreground">{p.email}</div>}
                    </div>
                    <Btn disabled={saving} onClick={() => apply([...linked, p], "Orientador vinculado")}>
                      <UserPlus className="h-3.5 w-3.5" /> Vincular
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>
      ) : (
        <p className="self-start text-xs text-muted-foreground">
          Seu usuário não tem a permissão “Vincular orientadores”. Fale com um administrador.
        </p>
      )}
    </div>
  );
}
