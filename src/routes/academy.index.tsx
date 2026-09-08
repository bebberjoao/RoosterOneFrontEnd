import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import {
  BookOpen, Users, GraduationCap, CalendarDays, ClipboardCheck, TrendingUp,
  Activity, School, ArrowUpRight, ClipboardList,
} from "lucide-react";
import {
  DISCIPLINES, KLASSES, TEACHERS, STUDENTS, EVENTS, TERMS,
  disciplineById, teacherById, EVENT_TONE, EVENT_LABEL, formatDate, today,
} from "@/components/rooster/academy/mock-data";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/academy/")({ component: AcademyDashboard });

function AcademyDashboard() {
  const activeTerm = TERMS.find((t) => t.active);
  const activeDisc = DISCIPLINES.filter((d) => d.status === "ativa");
  const activeKlasses = KLASSES.filter((k) => k.status !== "encerrada");
  const activeTeachers = TEACHERS.filter((t) => t.status === "ativo");
  const todayEvents = EVENTS.filter((e) => e.date === today);
  const upcoming = [...EVENTS].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  const totalEnrollments = KLASSES.reduce((a, k) => a + k.studentIds.length, 0);
  const avgOccupancy = Math.round(
    (KLASSES.reduce((a, k) => a + k.studentIds.length / k.capacity, 0) / KLASSES.length) * 100,
  );
  const pendingTasks = 24; // integração futura Learn

  const STATS = [
    { label: "Disciplinas ativas", value: activeDisc.length.toString(), delta: `${DISCIPLINES.length} no total`, icon: BookOpen, tone: "oklch(0.7 0.16 145)" },
    { label: "Turmas ativas", value: activeKlasses.length.toString(), delta: `${KLASSES.length - activeKlasses.length} encerradas`, icon: Users, tone: "oklch(0.55 0.19 265)" },
    { label: "Professores ativos", value: activeTeachers.length.toString(), delta: `${TEACHERS.length} cadastrados`, icon: GraduationCap, tone: "oklch(0.68 0.14 195)" },
    { label: "Aulas hoje", value: "8", delta: "próxima em 45 min", icon: CalendarDays, tone: "oklch(0.6 0.2 305)" },
    { label: "Alunos matriculados", value: totalEnrollments.toString(), delta: `${STUDENTS.length} únicos`, icon: School, tone: "oklch(0.68 0.18 40)" },
    { label: "Atividades pendentes", value: pendingTasks.toString(), delta: "vindas do Rooster Learn", icon: ClipboardList, tone: "oklch(0.65 0.18 25)" },
    { label: "Ocupação média", value: `${avgOccupancy}%`, delta: "das vagas ofertadas", icon: Activity, tone: "oklch(0.62 0.18 155)" },
    { label: "Aprovação média", value: "87%", delta: "período letivo atual", icon: TrendingUp, tone: "oklch(0.72 0.14 90)" },
  ];

  const enrollmentsBySeries = KLASSES.map((k) => ({
    name: k.code.slice(0, 12),
    alunos: k.studentIds.length,
    vagas: k.capacity,
  })).slice(0, 8);

  const monthly = [
    { m: "Fev", aulas: 210, presenca: 92 },
    { m: "Mar", aulas: 240, presenca: 89 },
    { m: "Abr", aulas: 232, presenca: 88 },
    { m: "Mai", aulas: 245, presenca: 87 },
    { m: "Jun", aulas: 190, presenca: 84 },
  ];

  const byCourse = Object.entries(
    DISCIPLINES.reduce<Record<string, number>>((a, d) => { a[d.courseId] = (a[d.courseId] ?? 0) + 1; return a; }, {}),
  ).map(([k, v]) => ({ name: k.replace("c-", "").toUpperCase(), v, color: DISCIPLINES.find((d) => d.courseId === k)!.accent }));

  return (
    <>
      <PageHeader
        eyebrow="Rooster Academy"
        title="Painel acadêmico"
        description={activeTerm ? `Período letivo em vigor: ${activeTerm.name} · ${formatDate(activeTerm.startDate)} até ${formatDate(activeTerm.endDate)}.` : "Indicadores gerais da gestão acadêmica."}
        actions={
          <Link to="/academy/manage" className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <CalendarDays className="h-4 w-4" /> Calendário acadêmico
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${s.tone} 14%, transparent)`, color: s.tone }}>
                <s.icon className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Aulas e presença média</div>
              <div className="text-xs text-muted-foreground">Evolução do período letivo</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={monthly} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="a" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.19 265)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.55 0.19 265)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Area type="monotone" dataKey="aulas" stroke="oklch(0.55 0.19 265)" fill="url(#a)" strokeWidth={2} />
                <Area type="monotone" dataKey="presenca" stroke="oklch(0.62 0.18 155)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3">
            <div className="text-sm font-semibold">Disciplinas por curso</div>
            <div className="text-xs text-muted-foreground">Distribuição no catálogo</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCourse} dataKey="v" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {byCourse.map((e, i) => (<Cell key={i} fill={e.color} />))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
            {byCourse.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                <span className="truncate text-muted-foreground">{c.name}</span>
                <span className="ml-auto font-medium">{c.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Ocupação por turma</div>
              <div className="text-xs text-muted-foreground">Matriculados vs. vagas</div>
            </div>
            <Link to="/academy/manage" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={enrollmentsBySeries} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="vagas" fill="oklch(0.9 0.02 260)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="alunos" fill="oklch(0.55 0.19 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Próximos eventos</div>
              <div className="text-xs text-muted-foreground">Calendário acadêmico</div>
            </div>
            <Link to="/academy/manage" className="text-xs text-muted-foreground hover:text-foreground">Ver</Link>
          </div>
          <ul className="space-y-2.5">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-lg border bg-background/40 p-2.5">
                <div className="flex h-9 w-9 flex-col items-center justify-center rounded-lg text-[10px] font-medium" style={{ background: `color-mix(in oklab, ${EVENT_TONE[e.type]} 14%, transparent)`, color: EVENT_TONE[e.type] }}>
                  <span className="text-[9px] uppercase">{new Date(e.date).toLocaleDateString("pt-BR", { month: "short" })}</span>
                  <span className="text-sm font-semibold leading-none">{new Date(e.date).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{e.title}</div>
                  <div className="text-[11px] text-muted-foreground">{EVENT_LABEL[e.type]} · {e.audience}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Disciplinas em destaque</div>
            <div className="text-xs text-muted-foreground">Selecionadas no período em vigor</div>
          </div>
          <Link to="/academy/manage" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {activeDisc.slice(0, 6).map((d) => {
            const t = teacherById(d.teacherId);
            const ks = KLASSES.filter((k) => k.disciplineId === d.id);
            const enrolled = ks.reduce((a, k) => a + k.studentIds.length, 0);
            return (
              <Link to="/academy/manage" key={d.id} className="group rounded-xl border p-4 transition-colors hover:bg-accent/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg" style={{ background: `color-mix(in oklab, ${d.accent} 18%, transparent)`, border: `1px solid color-mix(in oklab, ${d.accent} 40%, transparent)` }} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.code} · {d.workload}h</div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{t?.title} {t?.name}</span>
                  <span>{ks.length} turma(s) · {enrolled} alunos</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}