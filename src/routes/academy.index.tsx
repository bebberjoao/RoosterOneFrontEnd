import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard } from "@/components/shared";
import {
  BookOpen, Users, GraduationCap, CalendarDays, School, ArrowUpRight, ClipboardList, Loader2, AlertTriangle, History,
} from "lucide-react";
import {
  academyService, toneFor,
  type Term, type Discipline, type SchoolClass, type Teacher, type Student, type Course,
  type CalendarEvent, type AcademyDoc,
} from "@/services/mock-api/academy.service";
import { ApiError } from "@/services/hub/client";
import { useCan } from "@/components/rooster/hub/permission-context";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { fmtData, dataLocalIso } from "@/lib/formatacao";

export const Route = createFileRoute("/academy/")({ component: AcademyDashboard });

/**
 * Quem não tem a permissão real `academy.manage.acessar` (só coordenação/admin têm) sempre
 * recebe 403 dos endpoints do painel institucional (`getTerms`/`getAll`/`getTeachers`/
 * `getStudents`/`getCourses`/`getCalendarEvents`/`getDocs`). A decisão de qual painel mostrar
 * tem que vir da permissão REAL do usuário logado, nunca da Visão de demonstração — do
 * contrário um professor de verdade cuja Visão ainda esteja em "admin" cairia no painel
 * institucional e tomaria 403 em cascata.
 */
function AcademyDashboard() {
  const podeGestao = useCan("/academy/manage", "acessar");
  return podeGestao ? <CoordenadorDashboard /> : <ProfessorDashboard />;
}

const EVENT_TONE: Record<CalendarEvent["type"], string> = {
  semestre: "oklch(0.55 0.19 265)",
  prova: "oklch(0.65 0.18 25)",
  feriado: "oklch(0.62 0.18 155)",
  reuniao: "oklch(0.6 0.2 305)",
  apresentacao: "oklch(0.68 0.18 40)",
  semana: "oklch(0.68 0.14 195)",
  institucional: "oklch(0.55 0.1 260)",
};
const EVENT_LABEL: Record<CalendarEvent["type"], string> = {
  semestre: "Semestre",
  prova: "Prova",
  feriado: "Feriado",
  reuniao: "Reunião",
  apresentacao: "Apresentação",
  semana: "Semana acadêmica",
  institucional: "Institucional",
};

const formatDate = (iso: string) => fmtData(iso);

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.status === 403 ? "Você não tem permissão para ver o painel acadêmico." : err.message;
  return err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
}

type DashboardData = {
  terms: Term[]; disciplines: Discipline[]; classes: SchoolClass[]; teachers: Teacher[];
  students: Student[]; courses: Course[]; events: CalendarEvent[]; docs: AcademyDoc[];
};

function CoordenadorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      academyService.getTerms(),
      academyService.getAll(),
      academyService.getClasses(),
      academyService.getTeachers(),
      academyService.getStudents(),
      academyService.getCourses(),
      academyService.getCalendarEvents(),
      academyService.getDocs(),
    ])
      .then(([terms, disciplines, classes, teachers, students, courses, events, docs]) => {
        if (!cancelled) setData({ terms, disciplines, classes, teachers, students, courses, events, docs });
      })
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="Rooster Academy" title="Painel acadêmico" description="Indicadores gerais da gestão acadêmica." />
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando painel…
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader eyebrow="Rooster Academy" title="Painel acadêmico" description="Indicadores gerais da gestão acadêmica." />
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error ?? "Falha ao carregar o painel."}
        </div>
      </>
    );
  }

  const { terms, disciplines, classes, teachers, students, courses, events, docs } = data;
  const today = dataLocalIso();

  const activeTerm = terms.find((t) => t.active);
  const activeDisc = disciplines.filter((d) => d.status === "ativa");
  const activeKlasses = classes.filter((k) => k.status !== "encerrada");
  const activeTeachers = teachers.filter((t) => t.status === "ativo");
  const upcoming = [...events].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  const totalEnrollments = classes.reduce((a, k) => a + k.enrolledCount, 0);
  const withCapacity = classes.filter((k) => k.capacity > 0);
  const avgOccupancy = withCapacity.length
    ? Math.round((withCapacity.reduce((a, k) => a + k.enrolledCount / k.capacity, 0) / withCapacity.length) * 100)
    : 0;

  const STATS = [
    { label: "Disciplinas ativas", value: activeDisc.length.toString(), delta: `${disciplines.length} no total`, icon: BookOpen, tone: "oklch(0.7 0.16 145)" },
    { label: "Turmas ativas", value: activeKlasses.length.toString(), delta: `${classes.length - activeKlasses.length} encerradas`, icon: Users, tone: "oklch(0.55 0.19 265)" },
    { label: "Professores ativos", value: activeTeachers.length.toString(), delta: `${teachers.length} cadastrados`, icon: GraduationCap, tone: "oklch(0.68 0.14 195)" },
    { label: "Alunos matriculados", value: totalEnrollments.toString(), delta: `${students.length} no cadastro`, icon: School, tone: "oklch(0.68 0.18 40)" },
    { label: "Ocupação média", value: `${avgOccupancy}%`, delta: "das vagas ofertadas", icon: ArrowUpRight, tone: "oklch(0.62 0.18 155)" },
    { label: "Documentos acadêmicos", value: docs.length.toString(), delta: "planos, ementas e regulamentos", icon: ClipboardList, tone: "oklch(0.65 0.18 25)" },
  ];

  const enrollmentsBySeries = classes.map((k) => ({
    name: k.code.slice(0, 12),
    alunos: k.enrolledCount,
    vagas: k.capacity,
  })).slice(0, 8);

  const shiftCounts = (["Matutino", "Vespertino", "Noturno"] as const).map((shift) => ({
    name: shift,
    turmas: classes.filter((k) => k.shift === shift).length,
  }));

  const byCourse = courses
    .map((c) => ({ name: c.name, v: disciplines.filter((d) => d.courseId === c.id).length, color: toneFor(c.id) }))
    .filter((c) => c.v > 0);

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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${s.tone} 14%, transparent)`, color: s.tone }}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Turmas por turno" description="Distribuição das turmas cadastradas" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={shiftCounts} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="turmas" fill="oklch(0.55 0.19 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Disciplinas por curso" description="Distribuição no catálogo">
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
            {byCourse.length === 0 && <span className="col-span-2 text-muted-foreground">Nenhuma disciplina cadastrada.</span>}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Ocupação por turma"
          description="Matriculados vs. vagas"
          action={<Link to="/academy/manage" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>}
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={enrollmentsBySeries} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="vagas" fill="oklch(0.9 0.02 260)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="alunos" fill="oklch(0.55 0.19 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Próximos eventos"
          description="Calendário acadêmico"
          action={<Link to="/academy/manage" className="text-xs text-muted-foreground hover:text-foreground">Ver</Link>}
        >
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
            {upcoming.length === 0 && <li className="text-sm text-muted-foreground">Nenhum evento futuro cadastrado.</li>}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Disciplinas em destaque"
        description="Selecionadas no período em vigor"
        action={<Link to="/academy/manage" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>}
        className="mt-4"
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {activeDisc.slice(0, 6).map((d) => {
            const ks = classes.filter((k) => k.disciplineId === d.id);
            const enrolled = ks.reduce((a, k) => a + k.enrolledCount, 0);
            return (
              <Link to="/academy/manage" key={d.id} className="group rounded-xl border p-4 transition-colors hover:bg-accent/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg" style={{ background: `color-mix(in oklab, ${d.accent} 18%, transparent)`, border: `1px solid color-mix(in oklab, ${d.accent} 40%, transparent)` }} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.code} · {d.workload}h</div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{d.description || "Sem descrição cadastrada."}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{ks.length} turma(s)</span>
                  <span>{enrolled} alunos</span>
                </div>
              </Link>
            );
          })}
          {activeDisc.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">Nenhuma disciplina ativa cadastrada.</p>
          )}
        </div>
      </SectionCard>
    </>
  );
}

function ProfessorErrMsg(err: unknown) {
  if (err instanceof ApiError) return err.status === 403 ? "Você não tem permissão para ver este painel." : err.message;
  return err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
}

function ProfessorDashboard() {
  const [classes, setClasses] = useState<SchoolClass[] | null>(null);
  const [avgAttendanceByClass, setAvgAttendanceByClass] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    academyService
      .getClasses({ minhas: true })
      .then(async (myClasses) => {
        if (cancelled) return;
        setClasses(myClasses);
        const entries = await Promise.all(
          myClasses.map(async (k) => {
            try {
              const records = await academyService.getFrequencia(k.id);
              if (records.length === 0) return [k.id, 100] as const;
              const present = records.filter((r) => r.status === "presente" || r.status === "atraso" || r.status === "justificado").length;
              return [k.id, Math.round((present / records.length) * 100)] as const;
            } catch {
              return [k.id, 100] as const;
            }
          }),
        );
        if (!cancelled) setAvgAttendanceByClass(Object.fromEntries(entries));
      })
      .catch((err) => !cancelled && setError(ProfessorErrMsg(err)));
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <>
        <PageHeader eyebrow="Rooster Academy" title="Meu painel" description="Suas turmas, alunos e frequência." />
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      </>
    );
  }

  if (classes === null) {
    return (
      <>
        <PageHeader eyebrow="Rooster Academy" title="Meu painel" description="Suas turmas, alunos e frequência." />
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando painel…
        </div>
      </>
    );
  }

  const totalStudents = classes.reduce((a, k) => a + k.enrolledCount, 0);
  const attendanceValues = classes.map((k) => avgAttendanceByClass[k.id]).filter((v): v is number => v !== undefined);
  const avgAttendance = attendanceValues.length ? Math.round(attendanceValues.reduce((a, v) => a + v, 0) / attendanceValues.length) : 0;
  const shiftCounts = (["Matutino", "Vespertino", "Noturno"] as const).map((shift) => ({
    name: shift,
    turmas: classes.filter((k) => k.shift === shift).length,
  }));

  const STATS = [
    { label: "Minhas turmas", value: classes.length.toString(), delta: "no período em vigor", icon: BookOpen, tone: "oklch(0.7 0.16 145)" },
    { label: "Alunos matriculados", value: totalStudents.toString(), delta: "nas suas turmas", icon: School, tone: "oklch(0.68 0.18 40)" },
    { label: "Frequência média", value: `${avgAttendance}%`, delta: "nas turmas com chamada registrada", icon: History, tone: "oklch(0.62 0.18 155)" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Rooster Academy"
        title="Meu painel"
        description="Suas turmas, alunos e frequência."
        actions={
          <div className="flex gap-2">
            <Link to="/academy/attendance" className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
              <History className="h-4 w-4" /> Chamada
            </Link>
            <Link to="/academy/grades" className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
              <ClipboardList className="h-4 w-4" /> Notas
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${s.tone} 14%, transparent)`, color: s.tone }}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Minhas turmas por turno" description="Distribuição das turmas que você leciona" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={shiftCounts} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="turmas" fill="oklch(0.55 0.19 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Turmas"
          action={<Link to="/academy/grades" className="text-xs text-muted-foreground hover:text-foreground">Ver notas</Link>}
        >
          <ul className="space-y-2">
            {classes.map((k) => (
              <li key={k.id} className="rounded-lg border bg-background/40 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 shrink-0 rounded-lg" style={{ background: `color-mix(in oklab, ${toneFor(k.disciplineId)} 18%, transparent)`, border: `1px solid color-mix(in oklab, ${toneFor(k.disciplineId)} 40%, transparent)` }} />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{k.disciplineName ?? k.code}</div>
                    <div className="text-[11px] text-muted-foreground">{k.code} · {k.shift} · {k.enrolledCount} alunos</div>
                  </div>
                </div>
              </li>
            ))}
            {classes.length === 0 && <li className="text-sm text-muted-foreground">Você não leciona nenhuma turma no momento.</li>}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
