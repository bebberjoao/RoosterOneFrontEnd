import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  Download,
  Loader2,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { PageHeader } from "@/components/rooster/page-header";
import { Chip, TONE, Btn, EmptyState, ProgressBar, SectionCard } from "@/components/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { OfflineBanner } from "@/components/rooster/hub/crud-panel";
import { useResource } from "@/components/rooster/hub/use-hub";
import {
  ACCESS_ACTION,
  PERMISSION_MODULES,
  describeKey,
  moduleKeys,
  permissionKey,
  screenKeys,
  type ModuleDef,
  type ScreenDef,
} from "@/components/rooster/hub/permission-catalog";
import { usePermissions, useCan } from "@/components/rooster/hub/permission-context";
import {
  permissoesService, usuariosPermissoesService, usuariosService,
  relatorioAuditoria, exportarAuditoriaCsv, relatorioErros, exportarErrosCsv,
  type Permissao, type Usuario, type UsuarioPermissao,
  type RelatorioAuditoria, type RelatorioErros,
} from "@/services/hub";
import { downloadBlob } from "@/components/rooster/finance/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hub/acessos")({
  head: () => ({
    meta: [
      { title: "Acessos e RBAC — Rooster Hub" },
      { name: "description", content: "Permissões por usuário, módulo, tela e ação no controle de acesso do Rooster One." },
      { property: "og:title", content: "Acessos e RBAC — Rooster Hub" },
      { property: "og:description", content: "Configuração de permissões por usuário, módulo, tela e operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcessosPage,
});

function AcessosPage() {
  const usuarios = useResource(usuariosService);

  return (
    <div>
      <PageHeader
        eyebrow="Rooster Hub"
        title="Acessos e permissões"
        description="Autorização individual: cada usuário recebe diretamente as operações liberadas em cada tela de cada módulo."
      />
      <OfflineBanner />
      <UserPermissionsPanel usuarios={usuarios.rows} loadingUsuarios={usuarios.loading} />
      <ReportsPanel />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Relatórios de auditoria e de erros                                  */
/* ------------------------------------------------------------------ */

function ReportsPanel() {
  const podeAuditoria = useCan("/hub/acessos", "relatorio-auditoria");
  const podeErros = useCan("/hub/acessos", "relatorio-erros");
  if (!podeAuditoria && !podeErros) return null;

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {podeAuditoria && <AuditReportCard />}
      {podeErros && <ErrorReportCard />}
    </div>
  );
}

function AuditReportCard() {
  const [dados, setDados] = useState<RelatorioAuditoria | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    relatorioAuditoria().then(setDados).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar relatório de auditoria"));
  }, []);

  async function doExportar() {
    try {
      downloadBlob(await exportarAuditoriaCsv(), "relatorio-auditoria.csv");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao exportar relatório de auditoria");
    }
  }

  return (
    <SectionCard
      title="Relatório de auditoria"
      description="Ações administrativas, financeiras e acadêmicas registradas — quem fez o quê, quando."
      action={<Btn onClick={doExportar}><Download className="h-3.5 w-3.5" /> Exportar CSV</Btn>}
    >
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {!dados ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <p className="mb-3 text-sm"><span className="text-lg font-semibold">{dados.total}</span> <span className="text-xs text-muted-foreground">evento(s) registrados</span></p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="mb-1 font-medium text-muted-foreground">Por módulo</p>
              <ul className="space-y-0.5">
                {dados.porModulo.slice(0, 5).map((m) => <li key={m.modulo} className="flex justify-between"><span>{m.modulo}</span><span className="tabular-nums text-muted-foreground">{m.total}</span></li>)}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium text-muted-foreground">Por ação</p>
              <ul className="space-y-0.5">
                {dados.porAcao.slice(0, 5).map((a) => <li key={a.acao} className="flex justify-between"><span>{a.acao}</span><span className="tabular-nums text-muted-foreground">{a.total}</span></li>)}
              </ul>
            </div>
          </div>
          <p className="mb-1 mt-4 text-xs font-medium text-muted-foreground">Mais recentes</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
            {dados.recentes.slice(0, 10).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 border-b py-1 last:border-0">
                <span className="truncate">{l.acao ?? "—"} · {l.modulo ?? "—"}</span>
                <span className="shrink-0 text-muted-foreground">{l.usuario?.nome ?? "—"}</span>
              </li>
            ))}
            {dados.recentes.length === 0 && <li className="py-2 text-center text-muted-foreground">Nenhum evento registrado.</li>}
          </ul>
        </>
      )}
    </SectionCard>
  );
}

function ErrorReportCard() {
  const [dados, setDados] = useState<RelatorioErros | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    relatorioErros().then(setDados).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar relatório de erros"));
  }, []);

  async function doExportar() {
    try {
      downloadBlob(await exportarErrosCsv(), "relatorio-erros.csv");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao exportar relatório de erros");
    }
  }

  return (
    <SectionCard
      title="Rastreamento de erros"
      description="Toda exceção inesperada (status 500+) capturada automaticamente pela API — nunca recusas esperadas como 400/403/404."
      action={<Btn onClick={doExportar}><Download className="h-3.5 w-3.5" /> Exportar CSV</Btn>}
    >
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {!dados ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <p className="mb-3 text-sm"><span className="text-lg font-semibold">{dados.total}</span> <span className="text-xs text-muted-foreground">erro(s) registrados</span></p>
          {dados.total === 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Nenhum erro inesperado registrado até agora.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Por rota</p>
                <ul className="space-y-0.5">
                  {dados.porRota.slice(0, 5).map((r) => <li key={r.rota} className="flex justify-between gap-2"><span className="truncate">{r.rota}</span><span className="shrink-0 tabular-nums text-muted-foreground">{r.total}</span></li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Por status</p>
                <ul className="space-y-0.5">
                  {dados.porStatus.map((s) => <li key={s.statusCode} className="flex items-center justify-between gap-1"><span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-destructive" /> {s.statusCode}</span><span className="tabular-nums text-muted-foreground">{s.total}</span></li>)}
                </ul>
              </div>
            </div>
          )}
          <p className="mb-1 mt-4 text-xs font-medium text-muted-foreground">Mais recentes</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
            {dados.recentes.slice(0, 10).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 border-b py-1 last:border-0">
                <span className="truncate">{l.metodo} {l.rota}</span>
                <span className="shrink-0 text-destructive">{l.statusCode}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Painel Usuário → Módulo → Tela → Ações                              */
/* ------------------------------------------------------------------ */

type Feedback = { tone: "ok" | "error"; text: string } | null;

function UserPermissionsPanel({ usuarios, loadingUsuarios }: { usuarios: Usuario[]; loadingUsuarios: boolean }) {
  const { reload: reloadRuntime } = usePermissions();
  const [userQuery, setUserQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [moduleId, setModuleId] = useState<string>(PERMISSION_MODULES[0]?.id ?? "");
  const [screenQuery, setScreenQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [links, setLinks] = useState<UsuarioPermissao[]>([]);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const usuario = usuarios.find((u) => u.id === userId) ?? null;
  const mod = PERMISSION_MODULES.find((m) => m.id === moduleId) ?? PERMISSION_MODULES[0];

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => `${u.nome} ${u.email}`.toLowerCase().includes(q));
  }, [usuarios, userQuery]);

  // Carrega as permissões atuais do usuário selecionado.
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);
    setFeedback(null);
    (async () => {
      try {
        const [perms, allLinks] = await Promise.all([permissoesService.list(), usuariosPermissoesService.list()]);
        if (!alive) return;
        setPermissoes(perms);
        setLinks(allLinks);
        const byId = new Map(perms.map((p) => [p.id, p]));
        const keys = new Set(
          allLinks
            .filter((l) => l.usuarioId === userId)
            .map((l) => byId.get(l.permissaoId)?.nome)
            .filter((n): n is string => Boolean(n)),
        );
        setSavedKeys(keys);
        setDraft(new Set(keys));
      } catch {
        if (alive) setFeedback({ tone: "error", text: "Não foi possível carregar as permissões deste usuário." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const added = useMemo(() => [...draft].filter((k) => !savedKeys.has(k)), [draft, savedKeys]);
  const removed = useMemo(() => [...savedKeys].filter((k) => !draft.has(k)), [draft, savedKeys]);
  const dirty = added.length > 0 || removed.length > 0;

  const update = (mutate: (next: Set<string>) => void) => {
    setDraft((prev) => {
      const next = new Set(prev);
      mutate(next);
      return next;
    });
    setFeedback(null);
  };

  const toggleAction = (m: ModuleDef, scr: ScreenDef, actionId: string) => {
    const key = permissionKey(m.id, scr.id, actionId);
    const accessKey = permissionKey(m.id, scr.id, ACCESS_ACTION.id);
    update((next) => {
      if (next.has(key)) {
        next.delete(key);
        // Sem "Acessar", nenhuma outra ação da tela faz sentido.
        if (actionId === ACCESS_ACTION.id) screenKeys(m, scr).forEach((k) => next.delete(k));
      } else {
        next.add(key);
        next.add(accessKey);
      }
    });
  };

  const toggleScreen = (m: ModuleDef, scr: ScreenDef, on: boolean) => {
    const keys = screenKeys(m, scr);
    update((next) => keys.forEach((k) => (on ? next.add(k) : next.delete(k))));
  };

  const toggleModule = (m: ModuleDef, on: boolean) => {
    const keys = moduleKeys(m);
    update((next) => keys.forEach((k) => (on ? next.add(k) : next.delete(k))));
  };

  const grantedInModule = (m: ModuleDef) => moduleKeys(m).filter((k) => draft.has(k)).length;

  const visibleScreens = useMemo(() => {
    if (!mod) return [];
    const q = screenQuery.trim().toLowerCase();
    if (!q) return mod.screens;
    return mod.screens.filter(
      (s) => s.title.toLowerCase().includes(q) || s.actions.some((act) => act.label.toLowerCase().includes(q)),
    );
  }, [mod, screenQuery]);

  async function handleSave() {
    if (!userId || !dirty) return;
    setSaving(true);
    setFeedback(null);
    try {
      let perms = permissoes;
      const byName = new Map(perms.map((p) => [p.nome, p]));

      // Cria os registros de permissão que ainda não existem na tabela `permissoes`.
      for (const key of added) {
        if (byName.has(key)) continue;
        const meta = describeKey(key);
        const created = await permissoesService.create({
          nome: key,
          recurso: meta?.recurso ?? null,
          acao: meta?.acao ?? null,
          descricao: meta?.descricao ?? null,
        });
        byName.set(key, created);
        perms = [created, ...perms];
      }

      for (const key of added) {
        const perm = byName.get(key);
        if (perm) await usuariosPermissoesService.create({ usuarioId: userId, permissaoId: perm.id });
      }

      for (const key of removed) {
        const perm = byName.get(key);
        if (!perm) continue;
        const link = links.find((l) => l.usuarioId === userId && l.permissaoId === perm.id);
        if (link) await usuariosPermissoesService.remove(link.id);
      }

      const [freshPerms, freshLinks] = await Promise.all([permissoesService.list(), usuariosPermissoesService.list()]);
      const byId = new Map(freshPerms.map((p) => [p.id, p]));
      const keys = new Set(
        freshLinks
          .filter((l) => l.usuarioId === userId)
          .map((l) => byId.get(l.permissaoId)?.nome)
          .filter((n): n is string => Boolean(n)),
      );
      setPermissoes(freshPerms);
      setLinks(freshLinks);
      setSavedKeys(keys);
      setDraft(new Set(keys));
      reloadRuntime();
      setFeedback({ tone: "ok", text: "Permissões salvas com sucesso." });
    } catch {
      setFeedback({ tone: "error", text: "Não foi possível salvar as permissões. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* Etapa 1 — usuário */}
      <SectionCard title="1. Usuário" description="Selecione de quem você quer ajustar os acessos.">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {loadingUsuarios ? (
            <div className="flex items-center gap-2 px-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando usuários...
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="px-2 py-6 text-xs text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setUserId(u.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                  u.id === userId ? "border border-primary/40 bg-primary/10" : "border border-transparent hover:bg-accent/50",
                )}
              >
                <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium">{u.nome}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{u.email}</span>
                </span>
                {u.ativo === false ? <Chip tone={TONE.muted}>Inativo</Chip> : null}
              </button>
            ))
          )}
        </div>
      </SectionCard>

      {/* Etapas 2 a 4 */}
      <div className="min-w-0 space-y-4">
        {!usuario ? (
          <SectionCard title="2. Permissões">
            <EmptyState
              icon={ShieldCheck}
              title="Selecione um usuário"
              description="Escolha um usuário na lista ao lado para carregar e editar as permissões dele."
            />
          </SectionCard>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{usuario.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {usuario.email} · permissões deste usuário
                </p>
              </div>
              <Chip tone={usuario.ativo === false ? TONE.muted : TONE.ok}>
                {usuario.ativo === false ? "Inativo" : "Ativo"}
              </Chip>
              <Chip tone={TONE.purple}>{draft.size} permissões</Chip>
              {dirty ? <Chip tone={TONE.warn}>Alterações não salvas</Chip> : null}
              <Btn variant="ghost" onClick={() => setDraft(new Set(savedKeys))} disabled={!dirty || saving}>
                <RotateCcw className="h-3.5 w-3.5" /> Descartar
              </Btn>
              <Btn onClick={handleSave} disabled={!dirty || saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar permissões
              </Btn>
            </div>

            {feedback ? (
              <div
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-xs",
                  feedback.tone === "ok"
                    ? "border-[oklch(0.7_0.16_145)]/40 bg-[oklch(0.7_0.16_145)]/10 text-foreground"
                    : "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {feedback.text}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              {/* Etapa 2 — módulos */}
              <div className="space-y-1 rounded-xl border bg-card p-2">
                <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  2. Módulo
                </p>
                {PERMISSION_MODULES.map((m) => {
                  const total = moduleKeys(m).length;
                  const on = grantedInModule(m);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModuleId(m.id)}
                      className={cn(
                        "w-full rounded-lg px-2.5 py-2 text-left transition-colors",
                        m.id === mod?.id ? "border border-primary/40 bg-primary/10" : "border border-transparent hover:bg-accent/50",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: m.accent }} />
                        <span className="flex-1 truncate text-[13px] font-medium">{m.name}</span>
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {on} de {total} permissões
                      </span>
                      <ProgressBar value={total ? (on / total) * 100 : 0} className="mt-1.5" />
                    </button>
                  );
                })}
              </div>

              {/* Etapas 3 e 4 — telas e ações */}
              <SectionCard
                title={`3. Telas de ${mod?.name ?? ""}`}
                description="Marque as operações liberadas em cada tela."
                action={
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={screenQuery}
                        onChange={(e) => setScreenQuery(e.target.value)}
                        placeholder="Buscar tela..."
                        className="h-8 w-40 rounded-lg border bg-background pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                    {mod ? (
                      <>
                        <Btn variant="ghost" onClick={() => toggleModule(mod, true)}>Marcar módulo</Btn>
                        <Btn variant="ghost" onClick={() => toggleModule(mod, false)}>Limpar</Btn>
                      </>
                    ) : null}
                  </div>
                }
              >
                {loading ? (
                  <div className="flex items-center gap-2 py-8 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando permissões...
                  </div>
                ) : visibleScreens.length === 0 ? (
                  <EmptyState icon={Search} title="Nenhuma tela encontrada" description="Ajuste a busca para ver as telas deste módulo." />
                ) : (
                  <div className="space-y-2">
                    {mod &&
                      visibleScreens.map((scr) => {
                        const keys = screenKeys(mod, scr);
                        const on = keys.filter((k) => draft.has(k)).length;
                        const accessKey = permissionKey(mod.id, scr.id, ACCESS_ACTION.id);
                        const hasAccess = draft.has(accessKey);
                        const isOpen = !collapsed[scr.id];
                        return (
                          <div key={scr.id} className="rounded-xl border">
                            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                              <Checkbox
                                checked={on === keys.length}
                                onCheckedChange={(v) => toggleScreen(mod, scr, v === true)}
                                aria-label={`Selecionar todas as permissões de ${scr.title}`}
                              />
                              <button
                                type="button"
                                onClick={() => setCollapsed((s) => ({ ...s, [scr.id]: !!isOpen }))}
                                className="flex flex-1 min-w-0 items-center gap-2 text-left"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">{scr.title}</span>
                                  <span className="block truncate text-[11px] text-muted-foreground">{scr.route}</span>
                                </span>
                                <Chip tone={on === 0 ? TONE.muted : on === keys.length ? TONE.ok : TONE.info}>
                                  {on} de {keys.length}
                                </Chip>
                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen ? "" : "-rotate-90")} />
                              </button>
                            </div>
                            {isOpen ? (
                              <div className="grid gap-2 border-t px-3 py-3 sm:grid-cols-2 xl:grid-cols-3">
                                {scr.actions.map((act) => {
                                  const key = permissionKey(mod.id, scr.id, act.id);
                                  const isAccess = act.id === ACCESS_ACTION.id;
                                  const blocked = !isAccess && !hasAccess;
                                  return (
                                    <label
                                      key={act.id}
                                      className={cn(
                                        "flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors",
                                        blocked ? "opacity-50" : "hover:bg-accent/40",
                                      )}
                                    >
                                      <Checkbox
                                        className="mt-0.5"
                                        checked={draft.has(key)}
                                        disabled={blocked}
                                        onCheckedChange={() => toggleAction(mod, scr, act.id)}
                                      />
                                      <span className="min-w-0">
                                        <span className={cn("block text-[13px]", isAccess && "font-medium")}>{act.label}</span>
                                        {act.hint ? (
                                          <span className="block text-[11px] text-muted-foreground">{act.hint}</span>
                                        ) : null}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                )}
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
