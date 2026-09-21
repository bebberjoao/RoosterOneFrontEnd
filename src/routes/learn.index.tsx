import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar, LoadingCards } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { learnService, formatDate, relativeDue, STATUS_LABEL, type Activity, type ActivityStatus } from "@/services/mock-api/learn.service";
import { academyService, type SchoolClass, toneFor } from "@/services/mock-api/academy.service";
import { ActivityStatusBadge, TypeBadge, ProgressBar } from "@/components/rooster/learn/badges";
import { useRole, learnCan } from "@/components/rooster/role-context";
import { useCan } from "@/components/rooster/hub/permission-context";
import {
  Search, Plus, Clock, Users, FileText, Inbox, CheckCircle2, TrendingUp, ClipboardList, BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/learn/")({
  component: LearnHome,
});

type Tab = "atividades" | "turmas" | "relatorios";

/**
 * Qual dado buscar depende SEMPRE da permissão real do usuário logado, nunca da Visão de
 * demonstração — do contrário um aluno de verdade cuja Visão esteja em "professor" bateria
 * num endpoint de turma (403), e um professor de verdade cuja Visão esteja em "admin" buscaria
 * turmas de todo mundo sem `minhas:true` (403 também).
 */
function useLearnData() {
  const isAlunoReal = useCan("/learn/student", "acessar");
  const podeGestaoAmpla = useCan("/academy/manage", "acessar");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        if (isAlunoReal) {
          const acts = await learnService.getMyActivities();
          if (!alive) return;
          setActivities(acts);
          setClasses([]);
        } else {
          const cls = await academyService.getClasses(podeGestaoAmpla ? undefined : { minhas: true });
          if (!alive) return;
          setClasses(cls);
          const lists = await Promise.all(cls.map((c) => learnService.getByClass(c.id).catch(() => [])));
          if (!alive) return;
          setActivities(lists.flat());
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [isAlunoReal, podeGestaoAmpla]);

  return { classes, activities, loading, isAlunoReal };
}

function LearnHome() {
  const { role } = useRole();
  const canViewReports = learnCan(role, "viewReports");
  const canManageClasses = learnCan(role, "manageClasses");
  const [tab, setTab] = useState<Tab>("atividades");
  const { classes, activities, loading, isAlunoReal } = useLearnData();

  const tabs = [
    { value: "atividades", label: "Atividades" },
    ...(canManageClasses ? [{ value: "turmas", label: "Turmas" }] : []),
    ...(canViewReports ? [{ value: "relatorios", label: "Relatórios" }] : []),
  ];

  const published = activities.filter((a) => a.status === "publicada").length;
  const toGrade = activities.reduce((s, a) => s + a.submissionsCount, 0);

  const mine = activities.filter((a) => a.status === "publicada" || a.status === "encerrada");
  const pending = mine.filter((a) => a.dueAt && new Date(a.dueAt) > new Date()).length;
  const done = mine.filter((a) => a.status === "encerrada").length;

  const STATS_TEACHER = [
    { label: "Atividades publicadas", value: published.toString(), icon: FileText, tone: "oklch(0.62 0.18 155)" },
    { label: "Entregas recebidas", value: toGrade.toString(), icon: Inbox, tone: "oklch(0.72 0.14 90)" },
    { label: "Turmas", value: classes.length.toString(), icon: Users, tone: "oklch(0.6 0.18 260)" },
    { label: "Atividades no total", value: activities.length.toString(), icon: TrendingUp, tone: "oklch(0.6 0.2 305)" },
  ];

  const STATS_ALUNO = [
    { label: "Pendentes", value: pending.toString(), icon: FileText, tone: "oklch(0.72 0.14 90)" },
    { label: "Concluídas", value: done.toString(), icon: CheckCircle2, tone: "oklch(0.62 0.18 155)" },
    { label: "Atividades publicadas", value: mine.length.toString(), icon: TrendingUp, tone: "oklch(0.55 0.19 265)" },
  ];

  const STATS = isAlunoReal ? STATS_ALUNO : STATS_TEACHER;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Learn"
        title="Atividades"
        description="Gerencie atividades, turmas e o desempenho das entregas em um só lugar."
        actions={
          learnCan(role, "createActivity") ? (
            <Link to="/learn/classes" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
              <Plus className="h-4 w-4" /> Nova atividade
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in oklab, ${s.tone} 14%, transparent)`, color: s.tone }}>
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {tabs.length > 1 ? (
        <div className="mb-4">
          <TabBar tabs={tabs} value={tab} onChange={(v) => setTab(v as Tab)} />
        </div>
      ) : null}

      {loading ? (
        <LoadingCards />
      ) : (
        <>
          {tab === "atividades" ? <ActivitiesPanel activities={activities} classes={classes} isAlunoReal={isAlunoReal} /> : null}
          {tab === "turmas" && canManageClasses ? <ClassesPanel classes={classes} activities={activities} /> : null}
          {tab === "relatorios" && canViewReports ? <ReportsPanel activities={activities} /> : null}
        </>
      )}
    </>
  );
}

function ActivitiesPanel({ activities, classes, isAlunoReal }: { activities: Activity[]; classes: SchoolClass[]; isAlunoReal: boolean }) {
  const [q, setQ] = useState("");
  const [kls, setKls] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const s = q.toLowerCase().trim();
    return activities.filter((a) => {
      if (kls !== "all" && a.classId !== kls) return false;
      if (status !== "all" && a.status !== status) return false;
      if (s && !`${a.title} ${a.code ?? ""}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [activities, q, kls, status]);

  return (
    <>
      <div className="mb-4 rounded-xl border border-border/60 bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título ou código" className="pl-9" />
          </div>
          <FilterSelect value={kls} onChange={setKls} placeholder="Turma" options={[{ v: "all", l: "Todas turmas" }, ...classes.map((k) => ({ v: k.id, l: k.code }))]} />
          <FilterSelect value={status} onChange={setStatus} placeholder="Situação" options={[{ v: "all", l: "Todas situações" }, ...(Object.entries(STATUS_LABEL) as [ActivityStatus, string][]).map(([v, l]) => ({ v, l }))]} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Atividade</th>
                <th className="px-3 py-2.5 text-left font-medium">Disciplina · Turma</th>
                <th className="px-3 py-2.5 text-left font-medium">Prazo</th>
                <th className="px-3 py-2.5 text-left font-medium">Situação</th>
                <th className="px-3 py-2.5 text-left font-medium">Entregas</th>
                <th className="px-3 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <TypeBadge type={a.type} />
                      <div>
                        <Link to="/learn/activities/$id" params={{ id: a.id }} className="font-medium text-foreground hover:underline">{a.title}</Link>
                        <div className="text-[11px] text-muted-foreground">{a.code ?? "—"} · peso {a.weight}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{a.disciplineName ?? "—"} · {a.className ?? a.classId}</td>
                  <td className="px-3 py-2.5 text-xs">
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /> {relativeDue(a.dueAt)}</div>
                    <div className="text-[11px] text-muted-foreground">{formatDate(a.dueAt)}</div>
                  </td>
                  <td className="px-3 py-2.5"><ActivityStatusBadge status={a.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="tabular-nums">{a.submissionsCount}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {isAlunoReal ? (
                      <Link to="/student/activities" className="inline-flex h-7 items-center gap-1 rounded-md bg-foreground px-2.5 text-xs font-medium text-background hover:opacity-90">
                        <FileText className="h-3.5 w-3.5" /> Realizar
                      </Link>
                    ) : (
                      <Link to="/learn/activities/$id" params={{ id: a.id }} className="inline-flex h-7 items-center gap-1 rounded-md bg-foreground px-2.5 text-xs font-medium text-background hover:opacity-90">
                        Abrir
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma atividade encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
          <span>{rows.length} de {activities.length} atividades</span>
        </div>
      </div>
    </>
  );
}

function ClassesPanel({ classes, activities }: { classes: SchoolClass[]; activities: Activity[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {classes.map((k) => {
        const acts = activities.filter((a) => a.classId === k.id);
        const published = acts.filter((a) => a.status === "publicada").length;
        const color = toneFor(k.id);
        return (
          <div key={k.id} className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 40%, transparent))` }} />
            <div className="p-5">
              <h3 className="text-base font-semibold tracking-tight">{k.code}</h3>
              <p className="text-xs text-muted-foreground">{k.shift} · {k.enrolledCount}/{k.capacity} alunos</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border/60 p-2 text-center">
                  <ClipboardList className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                  <div className="mt-1 text-base font-semibold tabular-nums">{acts.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Atividades</div>
                </div>
                <div className="rounded-lg border border-border/60 p-2 text-center">
                  <TrendingUp className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                  <div className="mt-1 text-base font-semibold tabular-nums">{published}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Publicadas</div>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/learn/classes" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <BookOpen className="h-3.5 w-3.5" /> Gerenciar atividades
                </Link>
              </div>
            </div>
          </div>
        );
      })}
      {classes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma turma vinculada.</p>}
    </div>
  );
}

function ReportsPanel({ activities }: { activities: Activity[] }) {
  const total = activities.reduce((s, a) => s + a.submissionsCount, 0);
  const published = activities.filter((a) => a.status === "publicada" || a.status === "encerrada").length;
  const withGradeItem = activities.filter((a) => a.hasGradeItem).length;

  const STATS = [
    { label: "Entregas recebidas", value: total.toString(), delta: `${activities.length} atividade(s) no total`, icon: Users },
    { label: "Atividades publicadas", value: published.toString(), delta: `${activities.length ? Math.round((published / activities.length) * 100) : 0}% do total`, icon: TrendingUp },
    { label: "Geram nota no Academy", value: withGradeItem.toString(), delta: "com item avaliativo vinculado", icon: BookOpen },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {STATS.map((s) => (
        <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{s.delta}</div>
        </div>
      ))}
    </div>
  );
}

function FilterSelect({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (<SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}
