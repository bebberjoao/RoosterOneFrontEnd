import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Breadcrumbs, CrudHeader, CrudToolbar, Btn, Select, Drawer, EmptyState } from "@/components/shared";
import { useDeskCategories, categoriesApi, AGENT_DIRECTORY, AGENT_ROLES, SECTORS } from "@/components/rooster/desk/categories-store";
import { AgentAvatar } from "@/components/rooster/desk/assignee-picker";
import { Check, Layers, Search } from "lucide-react";
import { useRole } from "@/components/rooster/role-context";

export const Route = createFileRoute("/desk/team")({
  head: () => ({
    meta: [
      { title: "Atendentes e permissões — Rooster Desk" },
      { name: "description", content: "Gerencie quais atendentes respondem cada subcategoria de chamados, em massa e por setor." },
      { property: "og:title", content: "Atendentes e permissões — Rooster Desk" },
      { property: "og:description", content: "Permissões de atendimento por subcategoria no Rooster Desk." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const cats = useDeskCategories();
  const { role: userRole } = useRole();
  const canManage = userRole === "admin" || userRole === "coordenador";
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [perms, setPerms] = useState("all");
  const [agent, setAgent] = useState<string | null>(null);

  const rows = useMemo(() => {
    const s = q.toLowerCase().trim();
    return AGENT_DIRECTORY.filter((a) => {
      if (s && !a.name.toLowerCase().includes(s) && !a.email.toLowerCase().includes(s)) return false;
      if (sector !== "all" && a.sector !== sector) return false;
      if (role !== "all" && a.role !== role) return false;
      if (status !== "all" && (status === "active") !== a.active) return false;
      return true;
    })
      .map((a) => {
        const subs = cats.flatMap((c) =>
          c.subcategories.filter((sub) => sub.assignees.includes(a.name)).map((sub) => ({ cat: c.name, sub: sub.name })),
        );
        return { ...a, subs };
      })
      .filter((a) => (perms === "with" ? a.subs.length > 0 : perms === "without" ? a.subs.length === 0 : true));
  }, [q, sector, role, status, perms, cats]);

  const activeSector = useMemo(
    () => (sector === "all" ? cats : cats.filter((c) => c.sector === sector)),
    [cats, sector],
  );

  if (!canManage) {
    return <EmptyState icon={Layers} title="Acesso restrito" description="A configuração de atendentes está disponível apenas para administradores e coordenadores." />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Rooster Desk" }, { label: "Atendentes" }]} />
      <CrudHeader
        title="Atendentes e permissões"
        description="Filtre por nome, setor, cargo ou situação e marque de uma só vez as subcategorias que cada atendente pode atender."
      />

      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por nome ou e-mail"
        filters={
          <>
            <Select
              value={sector}
              onChange={setSector}
              options={[{ value: "all", label: "Todos os setores" }, ...SECTORS.map((s) => ({ value: s, label: s }))]}
            />
            <Select
              value={role}
              onChange={setRole}
              options={[{ value: "all", label: "Todos os cargos" }, ...AGENT_ROLES.map((r) => ({ value: r, label: r }))]}
            />
            <Select
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "Ativos e inativos" },
                { value: "active", label: "Somente ativos" },
                { value: "inactive", label: "Somente inativos" },
              ]}
            />
            <Select
              value={perms}
              onChange={setPerms}
              options={[
                { value: "all", label: "Qualquer permissão" },
                { value: "with", label: "Com permissões" },
                { value: "without", label: "Sem permissões" },
              ]}
            />
          </>
        }
        trailing={<span className="text-xs text-muted-foreground">{rows.length} atendente(s)</span>}
      />

      {rows.length === 0 ? (
        <EmptyState icon={Search} title="Nenhum atendente encontrado" description="Ajuste a busca ou os filtros." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setAgent(r.name)}
              className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent/40"
            >
              <div className="flex items-center gap-2">
                <AgentAvatar name={r.name} className="h-8 w-8 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                </div>
                {!r.active ? (
                  <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">Inativo</span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">{r.sector}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">{r.role}</span>
                <span>{r.subs.length} subcategorias</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.subs.slice(0, 3).map((s) => (
                  <span key={`${s.cat}-${s.sub}`} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {s.sub}
                  </span>
                ))}
                {r.subs.length > 3 ? (
                  <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">+{r.subs.length - 3}</span>
                ) : null}
                {r.subs.length === 0 ? <span className="text-[11px] text-muted-foreground">Sem permissões de atendimento.</span> : null}
              </div>
            </button>
          ))}
        </div>
      )}

      {canManage ? <Drawer
        open={!!agent}
        onClose={() => setAgent(null)}
        title={agent ?? ""}
        subtitle="Marque as subcategorias que este atendente pode atender."
        width={560}
      >
        {agent ? (
          <div className="space-y-5">
            {activeSector.map((c) => {
              const all = c.subcategories.length > 0 && c.subcategories.every((s) => s.assignees.includes(agent));
              return (
                <div key={c.id} className="rounded-xl border">
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" /> {c.name}
                      <span className="text-xs font-normal text-muted-foreground">· {c.sector}</span>
                    </p>
                    <Btn
                      onClick={() =>
                        c.subcategories.forEach((s) =>
                          categoriesApi.updateSub(c.id, s.id, {
                            assignees: all ? s.assignees.filter((x) => x !== agent) : Array.from(new Set([...s.assignees, agent])),
                          }),
                        )
                      }
                    >
                      {all ? "Remover todas" : "Marcar todas"}
                    </Btn>
                  </div>
                  <div className="p-1">
                    {c.subcategories.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground">Nenhuma subcategoria cadastrada.</p>
                    ) : (
                      c.subcategories.map((s) => {
                        const on = s.assignees.includes(agent);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              categoriesApi.updateSub(c.id, s.id, {
                                assignees: on ? s.assignees.filter((x) => x !== agent) : [...s.assignees, agent],
                              })
                            }
                            className={
                              "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition " +
                              (on ? "bg-accent" : "hover:bg-accent/50")
                            }
                          >
                            <span>{s.name} <span className="text-xs text-muted-foreground">· SLA {s.slaHours}h</span></span>
                            {on ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </Drawer> : null}
    </>
  );
}
