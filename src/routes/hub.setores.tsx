import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/rooster/page-header";
import { Avatar, Btn, Chip, EmptyState, TONE } from "@/components/shared/primitives";
import { Modal } from "@/components/shared/overlays";
import { Checkbox } from "@/components/ui/checkbox";
import { HubCrud, type HubField, OfflineBanner } from "@/components/rooster/hub/crud-panel";
import { useResource } from "@/components/rooster/hub/use-hub";
import { fmtDate, initials } from "@/components/rooster/hub/format";
import { setoresService, usuariosService, usuariosSetoresService, type Setor, type Usuario } from "@/services/hub";
import { len } from "@/services/hub/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hub/setores")({
  head: () => ({
    meta: [
      { title: "Setores — Rooster Hub" },
      { name: "description", content: "Setores institucionais e gestão dos usuários vinculados a cada setor." },
      { property: "og:title", content: "Setores — Rooster Hub" },
      { property: "og:description", content: "Cadastro de setores e dos usuários que pertencem a cada um no Rooster One." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetoresPage,
});

const fields: HubField<Setor>[] = [
  { name: "nome", label: "Nome", required: true, validate: (v) => len(v, 3, 80, "Nome") },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "ativo", label: "Ativo", type: "boolean" },
];

function SetoresPage() {
  // Vínculo N:N preservado: um usuário pode pertencer a mais de um setor,
  // mas o gerenciamento passa a ser feito exclusivamente por aqui.
  const vinculos = useResource(usuariosSetoresService);
  const usuarios = useResource(usuariosService);
  const [setorAberto, setSetorAberto] = useState<Setor | null>(null);

  const membros = (setorId: string) => vinculos.rows.filter((v) => v.setorId === setorId).length;

  return (
    <div>
      <PageHeader
        eyebrow="Rooster Hub"
        title="Setores"
        description="Estrutura organizacional da instituição. Aqui você define quais usuários pertencem a cada setor."
      />
      <OfflineBanner />
      <HubCrud<Setor>
        service={setoresService}
        entityLabel="setor"
        fields={fields}
        searchPlaceholder="Buscar setor..."
        searchText={(s) => `${s.nome} ${s.descricao ?? ""}`}
        rowExtra={(s) => (
          <button
            type="button"
            aria-label={`Gerenciar usuários de ${s.nome}`}
            title="Usuários do setor"
            onClick={() => setSetorAberto(s)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
        )}
        columns={[
          { key: "nome", header: "Setor", sortValue: (s) => s.nome, cell: (s) => <span className="font-medium">{s.nome}</span> },
          { key: "descricao", header: "Descrição", cell: (s) => <span className="text-muted-foreground">{s.descricao ?? "—"}</span> },
          {
            key: "membros",
            header: "Usuários",
            cell: (s) => (
              <button type="button" onClick={() => setSetorAberto(s)} className="cursor-pointer">
                <Chip tone={TONE.cyan}>{membros(s.id)}</Chip>
              </button>
            ),
          },
          { key: "ativo", header: "Situação", cell: (s) => <Chip tone={s.ativo === false ? TONE.muted : TONE.ok}>{s.ativo === false ? "Inativo" : "Ativo"}</Chip> },
          { key: "criadoEm", header: "Criado em", cell: (s) => <span className="text-xs text-muted-foreground">{fmtDate(s.criadoEm)}</span> },
        ]}
      />

      <SetorUsuariosModal
        setor={setorAberto}
        usuarios={usuarios.rows}
        loadingUsuarios={usuarios.loading}
        onClose={() => setSetorAberto(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Usuários do setor                                                    */
/* ------------------------------------------------------------------ */

function SetorUsuariosModal({
  setor,
  usuarios,
  loadingUsuarios,
  onClose,
}: {
  setor: Setor | null;
  usuarios: Usuario[];
  loadingUsuarios: boolean;
  onClose: () => void;
}) {
  const vinculos = useResource(usuariosSetoresService);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const salvos = useMemo(() => {
    if (!setor) return new Set<string>();
    return new Set(vinculos.rows.filter((v) => v.setorId === setor.id).map((v) => v.usuarioId));
  }, [vinculos.rows, setor]);

  const selecionados = draft ?? salvos;

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => `${u.nome} ${u.email}`.toLowerCase().includes(q));
  }, [usuarios, query]);

  const adicionados = [...selecionados].filter((id) => !salvos.has(id));
  const removidos = [...salvos].filter((id) => !selecionados.has(id));
  const dirty = adicionados.length > 0 || removidos.length > 0;

  function toggle(id: string) {
    const next = new Set(selecionados);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDraft(next);
    setFeedback(null);
  }

  function fechar() {
    setDraft(null);
    setQuery("");
    setFeedback(null);
    onClose();
  }

  async function salvar() {
    if (!setor || !dirty) return;
    setSaving(true);
    setFeedback(null);
    try {
      for (const usuarioId of adicionados) {
        await usuariosSetoresService.create({ usuarioId, setorId: setor.id });
      }
      for (const usuarioId of removidos) {
        const vinculo = vinculos.rows.find((v) => v.setorId === setor.id && v.usuarioId === usuarioId);
        if (vinculo) await usuariosSetoresService.remove(vinculo.id);
      }
      await vinculos.reload();
      setDraft(null);
      setFeedback("Usuários do setor atualizados.");
    } catch {
      setFeedback("Não foi possível salvar os usuários deste setor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(setor)}
      onClose={fechar}
      title={setor ? `Usuários de ${setor.nome}` : "Usuários do setor"}
      description="Marque os usuários que pertencem a este setor. O setor organiza as pessoas; as permissões continuam individuais."
      size="lg"
      footer={
        <>
          <Btn variant="ghost" onClick={fechar} disabled={saving}>
            Fechar
          </Btn>
          <Btn onClick={salvar} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar usuários
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={TONE.cyan}>{selecionados.size} no setor</Chip>
          {dirty ? <Chip tone={TONE.warn}>Alterações não salvas</Chip> : null}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuário por nome ou e-mail..."
            className="h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        {feedback ? (
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{feedback}</div>
        ) : null}

        <div className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
          {loadingUsuarios || vinculos.loading ? (
            <div className="flex items-center gap-2 px-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando usuários...
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyState icon={Search} title="Nenhum usuário encontrado" description="Ajuste a busca para localizar as pessoas da instituição." />
          ) : (
            filtrados.map((u) => {
              const on = selecionados.has(u.id);
              return (
                <label
                  key={u.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-2.5 py-2 transition-colors",
                    on ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-accent/40",
                  )}
                >
                  <Checkbox checked={on} onCheckedChange={() => toggle(u.id)} aria-label={`Vincular ${u.nome}`} />
                  <Avatar initials={initials(u.nome)} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{u.nome}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{u.email}</span>
                  </span>
                  {u.ativo === false ? <Chip tone={TONE.muted}>Inativo</Chip> : null}
                </label>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
