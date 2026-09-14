import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ACTIVITIES, SUBMISSIONS, STUDENTS, KLASSES, DISCIPLINES, TEACHERS,
  discipline, klass, teacher, formatDate, relativeDue,
  STATUS_LABEL, type ActivityStatus,
} from "@/components/rooster/learn/mock-data";
import { ActivityStatusBadge, TypeBadge, ProgressBar } from "@/components/rooster/learn/badges";
import { useRole, learnCan } from "@/components/rooster/role-context";
import {
  Search, Download, Plus, Clock, Users, FileText, Inbox, CheckCircle2, TrendingUp,
  ClipboardList, BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/learn/")({
  component: LearnHome,
});

type Tab = "atividades" | "turmas" | "relatorios";

function LearnHome() {
  const { role } = useRole();
  const canViewReports = learnCan(role, "viewReports");
  const canManageClasses = learnCan(role, "manageClasses");
  const [tab, setTab] = useState<Tab>("atividades");

  const tabs = [
    { value: "atividades", label: "Atividades" },
    ...(canManageClasses ? [{ value: "turmas", label: "Turmas" }] : []),
    ...(canViewReports ? [{ value: "relatorios", label: "Relatórios" }] : []),
  ];

  const published = ACTIVITIES.filter((a) => a.status === "publicada").length;
  const toGrade = SUBMISSIONS.filter((s) => s.status === "enviada" || s.status === "atrasada").length;
  const gradedGrades = SUBMISSIONS.filter((s) => s.grade !== null).map((s) => s.grade!) as number[];
  const avg = gradedGrades.length ? gradedGrades.reduce((s, v) => s + v, 0) / gradedGrades.length : 0;

  const mine = ACTIVITIES.filter((a) => a.status === "publicada" || a.status === "encerrada");
  const pending = mine.filter((a) => new Date(a.dueAt) > new Date()).length;
  const done = mine.filter((a) => a.status === "encerrada").length;

  const STATS_TEACHER = [
    { label: "Atividades publicadas", value: published.toString(), icon: FileText, tone: "oklch(0.62 0.18 155)" },
    { label: "Aguardando correção", value: toGrade.toString(), icon: Inbox, tone: "oklch(0.72 0.14 90)" },
    { label: "Turmas ativas", value: KLASSES.length.toString(), icon: Users, tone: "oklch(0.6 0.18 260)" },
    { label: "Média geral", value: avg.toFixed(1), icon: TrendingUp, tone: "oklch(0.6 0.2 305)" },
  ];

  const STATS_ALUNO = [
    { label: "Pendentes", value: pending.toString(), icon: FileText, tone: "oklch(0.72 0.14 90)" },
    { label: "Concluídas", value: done.toString(), icon: CheckCircle2, tone: "oklch(0.62 0.18 155)" },
    { label: "Média geral", value: "7.6", icon: TrendingUp, tone: "oklch(0.55 0.19 265)" },
  ];

  const STATS = role === "aluno" ? STATS_ALUNO : STATS_TEACHER;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Learn"
        title="Atividades"
        description="Gerencie atividades, turmas e o desempenho das entregas em um só lugar."
        actions={
          learnCan(role, "createActivity") ? (
            <Link to="/learn/activities/$id" params={{ id: "new" }} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
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

      {tab === "atividades" ? <ActivitiesPanel /> : null}
      {tab === "turmas" && canManageClasses ? <ClassesPanel /> : null}
      {tab === "relatorios" && canViewReports ? <ReportsPanel /> : null}
    </>
  );
}

function ActivitiesPanel() {
  const { role } = useRole();
  const [q, setQ] = useState("");
  const [disc, setDisc] = useState("all");
  const [kls, setKls] = useState("all");
  const [status, setStatus] = useState("all");
  const [teach, setTeach] = useState("all");

  const rows = useMemo(() => {
    const s = q.toLowerCase().trim();
    return ACTIVITIES.filter((a) => {
      if (disc !== "all" && a.disciplineId !== disc) return false;
      if (kls !== "all" && a.klassId !== kls) return false;
      if (status !== "all" && a.status !== status) return false;
      if (teach !== "all" && a.teacherId !== teach) return false;
      if (s && !`${a.title} ${a.code}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [q, disc, kls, status, teach]);

  return (
    <>
      <div className="mb-4 rounded-xl border border-border/60 bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título ou código" className="pl-9" />
          </div>
          <FilterSelect value={disc} onChange={setDisc} placeholder="Disciplina" options={[{ v: "all", l: "Todas disciplinas" }, ...DISCIPLINES.map((d) => ({ v: d.id, l: d.name }))]} />
          <FilterSelect value={kls} onChange={setKls} placeholder="Turma" options={[{ v: "all", l: "Todas turmas" }, ...KLASSES.map((k) => ({ v: k.id, l: k.name }))]} />
          <FilterSelect value={status} onChange={setStatus} placeholder="Situação" options={[{ v: "all", l: "Todas situações" }, ...(Object.entries(STATUS_LABEL) as [ActivityStatus, string][]).map(([v, l]) => ({ v, l }))]} />
          <FilterSelect value={teach} onChange={setTeach} placeholder="Professor" options={[{ v: "all", l: "Todos professores" }, ...TEACHERS.map((t) => ({ v: t.id, l: t.name }))]} />
          <Button size="sm" variant="outline" className="gap-1.5"><Download className="h-4 w-4" /> Exportar</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Atividade</th>
                <th className="px-3 py-2.5 text-left font-medium">Disciplina</th>
                <th className="px-3 py-2.5 text-left font-medium">Turma</th>
                <th className="px-3 py-2.5 text-left font-medium">Professor</th>
                <th className="px-3 py-2.5 text-left font-medium">Prazo</th>
                <th className="px-3 py-2.5 text-left font-medium">Situação</th>
                <th className="px-3 py-2.5 text-left font-medium">Entregas</th>
                <th className="px-3 py-2.5 text-left font-medium">Média</th>
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
                        <div className="text-[11px] text-muted-foreground">{a.code} · {a.questionsCount} questões · peso {a.weight}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs" style={{ color: discipline(a.disciplineId)?.color }}>● {discipline(a.disciplineId)?.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{klass(a.klassId)?.name}</td>
                  <td className="px-3 py-2.5 text-xs">{teacher(a.teacherId)?.name}</td>
                  <td className="px-3 py-2.5 text-xs">
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /> {relativeDue(a.dueAt)}</div>
                    <div className="text-[11px] text-muted-foreground">{formatDate(a.dueAt)}</div>
                  </td>
                  <td className="px-3 py-2.5"><ActivityStatusBadge status={a.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="tabular-nums">{a.submissionsCount}/{klass(a.klassId)?.students ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-xs">{a.avgGrade !== null ? a.avgGrade.toFixed(1) : "—"}</td>
                  <td className="px-3 py-2.5 text-right">
                    {role === "aluno" ? (
                      <Link to="/learn/activities/$id" params={{ id: a.id }} className="inline-flex h-7 items-center gap-1 rounded-md bg-foreground px-2.5 text-xs font-medium text-background hover:opacity-90">
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
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
          <span>{rows.length} de {ACTIVITIES.length} atividades</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled>Anterior</Button>
            <span className="rounded-md bg-muted px-2 py-1 text-foreground">1</span>
            <Button variant="ghost" size="sm">Próximo</Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ClassesPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {KLASSES.map((k) => {
        const d = discipline(k.disciplineId)!;
        const acts = ACTIVITIES.filter((a) => a.klassId === k.id);
        const subs = SUBMISSIONS.filter((s) => STUDENTS.find((st) => st.id === s.studentId)?.klassId === k.id);
        const grades = subs.map((s) => s.grade).filter((g): g is number => g !== null);
        const avg = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        const participation = subs.length ? Math.round((subs.filter((s) => s.status !== "pendente").length / subs.length) * 100) : 0;
        return (
          <div key={k.id} className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${d.color}, color-mix(in oklab, ${d.color} 40%, transparent))` }} />
            <div className="p-5">
              <span className="rounded-md px-1.5 py-0.5 text-[11px] font-medium" style={{ color: d.color, backgroundColor: `color-mix(in oklab, ${d.color} 12%, transparent)` }}>
                {d.name}
              </span>
              <h3 className="mt-1 text-base font-semibold tracking-tight">{k.name}</h3>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-border/60 p-2 text-center">
                  <Users className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                  <div className="mt-1 text-base font-semibold tabular-nums">{k.students}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Alunos</div>
                </div>
                <div className="rounded-lg border border-border/60 p-2 text-center">
                  <ClipboardList className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                  <div className="mt-1 text-base font-semibold tabular-nums">{acts.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Atividades</div>
                </div>
                <div className="rounded-lg border border-border/60 p-2 text-center">
                  <TrendingUp className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                  <div className="mt-1 text-base font-semibold tabular-nums">{avg.toFixed(1)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Média</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Participação</span>
                  <span className="tabular-nums">{participation}%</span>
                </div>
                <ProgressBar value={participation} tone={d.color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportsPanel() {
  const total = SUBMISSIONS.length;
  const delivered = SUBMISSIONS.filter((s) => s.status !== "pendente").length;
  const late = SUBMISSIONS.filter((s) => s.status === "atrasada").length;
  const avg = 7.2;

  const STATS = [
    { label: "Entregas", value: delivered.toString(), delta: `${Math.round((delivered / total) * 100)}% do total`, icon: Users },
    { label: "Média geral", value: avg.toFixed(1), delta: "+0.3 no bimestre", icon: TrendingUp },
    { label: "Entregas atrasadas", value: late.toString(), delta: `${Math.round((late / total) * 100)}% do total`, icon: BookOpen },
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
