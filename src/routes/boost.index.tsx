import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import {
  COURSES,
  ENROLLMENTS,
  CERTIFICATES,
  CATEGORIES,
  ENROLLMENTS_PER_MONTH,
  AVG_COMPLETION_TIME,
  categoryColor,
  formatDate,
} from "@/components/rooster/boost/mock-data";
import { ProgressBar, RatingStars } from "@/components/rooster/boost/badges";
import {
  GraduationCap,
  BookOpen,
  Clock,
  Users,
  Award,
  PlayCircle,
  ArrowUpRight,
  Star,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/boost/")({
  component: BoostDashboard,
});

function BoostDashboard() {
  const total = COURSES.length;
  const active = COURSES.filter((c) => c.status === "publicado").length;
  const drafts = COURSES.filter((c) => c.status !== "publicado").length;
  const students = COURSES.reduce((s, c) => s + c.students, 0);
  const certs = CERTIFICATES.filter((c) => c.status === "emitido").length;
  const hours = COURSES.reduce((s, c) => s + (parseInt(c.workload, 10) || 0), 0);

  const STATS = [
    { label: "Total de cursos", value: total.toString(), delta: `${drafts} em desenvolvimento`, icon: BookOpen, tone: "oklch(0.55 0.19 265)" },
    { label: "Cursos ativos", value: active.toString(), delta: "publicados", icon: GraduationCap, tone: "oklch(0.62 0.18 155)" },
    { label: "Em desenvolvimento", value: drafts.toString(), delta: "rascunho e revisão", icon: PlayCircle, tone: "oklch(0.72 0.14 90)" },
    { label: "Alunos matriculados", value: students.toLocaleString("pt-BR"), delta: "+156 no mês", icon: Users, tone: "oklch(0.6 0.18 260)" },
    { label: "Certificados emitidos", value: certs.toString(), delta: "últimos 30 dias", icon: Award, tone: "oklch(0.68 0.18 40)" },
    { label: "Horas publicadas", value: `${hours}h`, delta: "conteúdo total", icon: Clock, tone: "oklch(0.68 0.14 195)" },
  ];

  const byCategory = CATEGORIES.map((c) => ({
    name: c.name,
    v: COURSES.filter((co) => co.category === c.id).length,
    color: c.color,
  })).filter((c) => c.v > 0);

  const topAccess = [...COURSES].sort((a, b) => b.students - a.students).slice(0, 5);
  const topCompletion = [...COURSES].filter((c) => c.completionRate > 0).sort((a, b) => b.completionRate - a.completionRate).slice(0, 5);
  const lastEnrollments = ENROLLMENTS.slice(0, 5);
  const lastReviews = [
    { student: "Ana Prado", course: "React para plataformas institucionais", rating: 5, at: "2026-07-22", comment: "Conteúdo direto ao ponto, exemplos excelentes." },
    { student: "Igor Ramos", course: "Inglês acadêmico", rating: 5, at: "2026-07-21", comment: "Ajudou muito na escrita do meu artigo." },
    { student: "Helena Duarte", course: "Comunicação institucional", rating: 4, at: "2026-07-19", comment: "Muito prático, poderia ter mais exemplos." },
    { student: "Bruno Alves", course: "Segurança da informação", rating: 5, at: "2026-07-18", comment: "Obrigatório para toda a equipe." },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Rooster Boost"
        title="Visão geral"
        description="Indicadores em tempo real de cursos, alunos e certificações."
        actions={
          <Link
            to="/boost"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Criar curso <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ backgroundColor: `color-mix(in oklab, ${s.tone} 14%, transparent)`, color: s.tone }}
              >
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Matrículas por mês</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 meses</p>
            </div>
            <span className="text-xs font-medium" style={{ color: "oklch(0.62 0.18 155)" }}>+42% no ano</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer>
              <AreaChart data={ENROLLMENTS_PER_MONTH} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="boostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.18 40)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.68 0.18 40)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="oklch(0.68 0.18 40)" strokeWidth={2} fill="url(#boostGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h3 className="text-sm font-semibold">Cursos por categoria</h3>
          <p className="text-xs text-muted-foreground">Distribuição atual</p>
          <div className="mt-2 h-[180px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="v" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {byCategory.map((d, i) => (
                    <Cell key={i} fill={d.color} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
            {byCategory.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="truncate text-muted-foreground">{p.name}</span>
                <span className="ml-auto tabular-nums">{p.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Taxa de conclusão</h3>
              <p className="text-xs text-muted-foreground">Cursos com maior aproveitamento</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <BarChart data={topCompletion.map((c) => ({ name: c.title.split(" ").slice(0, 3).join(" "), v: c.completionRate }))} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Bar dataKey="v" radius={[0, 6, 6, 0]} fill="oklch(0.62 0.18 155)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Tempo médio de conclusão</h3>
              <p className="text-xs text-muted-foreground">Horas para concluir um curso</p>
            </div>
            <span className="text-xs font-medium" style={{ color: "oklch(0.62 0.18 155)" }}>-9h vs. jan</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <LineChart data={AVG_COMPLETION_TIME} margin={{ left: -20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Line type="monotone" dataKey="h" stroke="oklch(0.55 0.19 265)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <h3 className="text-sm font-semibold">Cursos mais acessados</h3>
            <Link to="/boost" className="text-xs font-medium text-muted-foreground hover:text-foreground">Ver todos</Link>
          </div>
          <ul className="divide-y divide-border/60">
            {topAccess.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <span className="h-9 w-14 flex-none rounded-md" style={{ background: c.cover }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span style={{ color: categoryColor(c.category) }}>●</span>
                    <span>{c.instructor.name}</span>
                    <span>·</span>
                    <span>{c.workload}</span>
                  </div>
                </div>
                <RatingStars value={c.rating} />
                <div className="hidden w-24 md:block">
                  <ProgressBar value={c.completionRate} />
                  <div className="mt-1 text-right text-[10px] tabular-nums text-muted-foreground">{c.completionRate}%</div>
                </div>
                <span className="tabular-nums text-xs text-muted-foreground">{c.students}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <h3 className="text-sm font-semibold">Últimas matrículas</h3>
            <Link to="/boost" className="text-xs font-medium text-muted-foreground hover:text-foreground">Ver todas</Link>
          </div>
          <ul className="divide-y divide-border/60">
            {lastEnrollments.map((e) => (
              <li key={e.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{e.student}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{formatDate(e.lastAccess)}</span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{e.course}</div>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={e.progress} tone="oklch(0.68 0.18 40)" />
                  <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">{e.progress}%</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Star className="h-4 w-4" style={{ color: "oklch(0.75 0.17 60)" }} />
            Últimas avaliações
          </h3>
        </div>
        <ul className="divide-y divide-border/60">
          {lastReviews.map((r, i) => (
            <li key={i} className="flex items-start gap-3 px-5 py-3">
              <span
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: "color-mix(in oklab, oklch(0.68 0.18 40) 14%, transparent)", color: "oklch(0.68 0.18 40)" }}
              >
                {r.student.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{r.student}</span>
                  <span className="text-xs text-muted-foreground">avaliou</span>
                  <span className="truncate text-sm">{r.course}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.comment}</p>
              </div>
              <div className="flex flex-none items-center gap-1 text-xs" style={{ color: "oklch(0.75 0.17 60)" }}>
                {"★".repeat(r.rating)}
                <span className="text-muted-foreground">{formatDate(r.at)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
