import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import { StatCard, SectionCard, ProgressBar, StatusChip, Avatar, TONE, Chip } from "@/components/rooster/student/ui";
import {
  DISCIPLINES, ACTIVITIES, CHARGES, BOOST_COURSES, NOTICES, NOTIFICATIONS, ASSESSMENTS,
  PERFORMANCE_TREND, EVENTS, today, formatDate, overallAverage, overallAttendance, money,
  disciplineById, MIN_ATTENDANCE, CR,
} from "@/components/rooster/student/mock-data";
import {
  BookOpen, ClipboardList, UserCheck, Wallet, GraduationCap, CalendarDays, Bell, ArrowUpRight, AlertTriangle, Star,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line, LineChart } from "recharts";

export const Route = createFileRoute("/student/")({ component: StudentDashboard });

function StudentDashboard() {
  const pending = ACTIVITIES.filter((a) => a.status === "pendente" || a.status === "em-andamento" || a.status === "atrasada");
  const upcoming = [...pending].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const open = CHARGES.filter((c) => c.status === "aberto" || c.status === "vencido");
  const openTotal = open.reduce((s, c) => s + c.amount, 0);
  const inProgress = BOOST_COURSES.filter((c) => c.status === "andamento");
  const recentGrades = ASSESSMENTS.filter((a) => a.value !== null).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const risky = DISCIPLINES.filter((d) => d.attendance < MIN_ATTENDANCE + 5);
  const nextEvents = [...EVENTS].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student"
        title="Olá, Ana 👋"
        description="Acompanhe suas disciplinas, entregas, notas, frequência e pendências do semestre 2026.1."
        actions={
          <Link to="/student/notifications" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent">
            <Bell className="h-4 w-4" /> {unread} novas
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Disciplinas" value={DISCIPLINES.length.toString()} hint="matriculadas em 2026.1" icon={BookOpen} tone={TONE.info} />
        <StatCard label="Média geral" value={overallAverage.toFixed(1)} hint={`CR acumulado ${CR.toFixed(2)}`} icon={Star} tone={TONE.ok} />
        <StatCard label="Frequência média" value={`${overallAttendance.toFixed(0)}%`} hint={`mínimo exigido ${MIN_ATTENDANCE}%`} icon={UserCheck} tone={overallAttendance < 80 ? TONE.warn : TONE.cyan} />
        <StatCard label="Financeiro em aberto" value={money(openTotal)} hint={`${open.length} cobrança(s)`} icon={Wallet} tone={open.some((c) => c.status === "vencido") ? TONE.danger : TONE.purple} />
      </div>

      {risky.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border p-4" style={{ borderColor: "color-mix(in oklab, oklch(0.65 0.18 25) 35%, transparent)", background: "color-mix(in oklab, oklch(0.65 0.18 25) 8%, transparent)" }}>
          <AlertTriangle className="mt-0.5 h-4 w-4" style={{ color: TONE.danger }} />
          <div className="text-sm">
            <p className="font-medium">Atenção à frequência</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {risky.map((d) => `${d.name} (${d.attendance}%)`).join(" · ")} — limite mínimo de {MIN_ATTENDANCE}%.{" "}
              <Link to="/student/attendance" className="underline">Ver detalhes</Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Próximas atividades"
          description="Integrado ao Rooster Learn"
          className="lg:col-span-2"
          action={<Link to="/student/activities" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
        >
          <ul className="space-y-2">
            {upcoming.map((a) => {
              const d = disciplineById(a.disciplineId);
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-xl border bg-background/40 p-3">
                  <span className="h-8 w-1 rounded-full" style={{ background: d?.accent }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{d?.name} · {a.teacher} · entrega {formatDate(a.due)}</p>
                  </div>
                  <StatusChip status={a.status} />
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Avisos importantes" description="Comunicados institucionais">
          <ul className="space-y-2">
            {NOTICES.map((n) => (
              <li key={n.id} className="rounded-xl border bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: n.tone }} />
                  <p className="text-sm font-medium">{n.title}</p>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{n.text}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Evolução do desempenho" description="Sua média x média da turma" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_TREND}>
                <defs>
                  <linearGradient id="stG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.19 265)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.55 0.19 265)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="media" name="Minha média" stroke="oklch(0.55 0.19 265)" fill="url(#stG)" strokeWidth={2} />
                <Line type="monotone" dataKey="turma" name="Turma" stroke="oklch(0.65 0.05 260)" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Notas recentes" action={<Link to="/student/grades" className="text-xs text-muted-foreground hover:text-foreground">Boletim</Link>}>
          <ul className="space-y-2">
            {recentGrades.map((g) => {
              const d = disciplineById(g.disciplineId);
              const val = g.value as number;
              return (
                <li key={g.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{g.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{d?.code} · {formatDate(g.date)}</p>
                  </div>
                  <Chip tone={val >= 7 ? TONE.ok : val >= 5 ? TONE.warn : TONE.danger}>{val.toFixed(1)}</Chip>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Minhas disciplinas" className="lg:col-span-2" action={<Link to="/student/disciplines" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>}>
          <div className="grid gap-3 sm:grid-cols-2">
            {DISCIPLINES.slice(0, 4).map((d) => (
              <div key={d.id} className="rounded-xl border bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <Avatar initials={d.teacherInitials} tone={d.accent} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{d.teacher} · {d.schedule}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Média {d.average?.toFixed(1) ?? "—"}</span>
                  <span>Freq. {d.attendance}%</span>
                </div>
                <ProgressBar className="mt-1.5" value={d.progress} tone={d.accent} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Cursos em andamento" description="Rooster Boost" action={<Link to="/student/courses" className="text-xs text-muted-foreground hover:text-foreground">Ver cursos</Link>}>
          <ul className="space-y-3">
            {inProgress.map((c) => (
              <li key={c.id} className="rounded-xl border bg-background/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <span className="text-[11px] text-muted-foreground">{c.progress}%</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{c.instructor} · {c.hours}h</p>
                <ProgressBar className="mt-2" value={c.progress} tone={c.tone} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Próximos eventos" description="Calendário acadêmico" className="lg:col-span-2" action={<Link to="/student/calendar" className="text-xs text-muted-foreground hover:text-foreground">Abrir calendário</Link>}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {nextEvents.map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-xl border bg-background/40 p-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(e.date)} {e.time ? `· ${e.time}` : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Situação financeira" description="Rooster Finance" action={<Link to="/student/finance" className="text-xs text-muted-foreground hover:text-foreground">Ver</Link>}>
          <ul className="space-y-2">
            {CHARGES.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{c.description}</p>
                  <p className="text-[11px] text-muted-foreground">Venc. {formatDate(c.due)} · {money(c.amount)}</p>
                </div>
                <StatusChip status={c.status} />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { to: "/student/activities", label: "Entregar atividade", icon: ClipboardList },
          { to: "/student/finance", label: "Baixar boleto", icon: Wallet },
          { to: "/student/reservations", label: "Reservar espaço", icon: CalendarDays },
          { to: "/student/tickets", label: "Abrir chamado", icon: GraduationCap },
        ].map((s) => (
          <Link key={s.to} to={s.to} className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{s.label}</span>
            <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </>
  );
}
