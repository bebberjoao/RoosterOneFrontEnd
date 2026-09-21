import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { StatCard, SectionCard, ProgressBar, Avatar, TONE, Chip, EmptyState } from "@/components/rooster/student/ui";
import { LoadingCards } from "@/components/shared";
import { NOTICES, NOTIFICATIONS } from "@/components/rooster/student/mock-data";
import { studentService, overallAverage, overallAttendance, MIN_ATTENDANCE, type StudentDiscipline, type ClassGrades } from "@/services/mock-api/student.service";
import { learnService, formatDate, TYPE_LABEL, type Activity } from "@/services/mock-api/learn.service";
import { academyService, type CalendarEvent } from "@/services/mock-api/academy.service";
import { financeService, type Cobranca } from "@/services/mock-api/finance.service";
import { CobrancaStatusBadge } from "@/components/rooster/finance/badges";
import { brl, valorDevido } from "@/components/rooster/finance/format";
import {
  BookOpen, ClipboardList, UserCheck, Wallet, CalendarDays, Bell, ArrowUpRight, AlertTriangle, Star, UserX,
} from "lucide-react";

export const Route = createFileRoute("/student/")({ component: StudentDashboard });

const today = new Date().toISOString().slice(0, 10);

function StudentDashboard() {
  const [disciplines, setDisciplines] = useState<StudentDiscipline[] | null>(null);
  const [grades, setGrades] = useState<ClassGrades[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [noLink, setNoLink] = useState(false);

  useEffect(() => {
    studentService.getMyEnrollments().then(setDisciplines).catch(() => setNoLink(true));
    studentService.getMyGrades().then(setGrades).catch(() => {});
    learnService.getMyActivities().then(setActivities).catch(() => {});
    academyService.getCalendarEvents().then(setEvents).catch(() => {});
    financeService.me.getCobrancas().then(setCobrancas).catch(() => {});
  }, []);

  if (noLink) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student" title="Portal do aluno" description="Acompanhe suas disciplinas, entregas, notas e frequência." />
        <EmptyState icon={UserX} title="Sem vínculo de aluno" description="O usuário autenticado não possui um registro de aluno associado no Rooster Academy." />
      </>
    );
  }

  if (disciplines === null) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student" title="Portal do aluno" description="Acompanhe suas disciplinas, entregas, notas e frequência." />
        <LoadingCards />
      </>
    );
  }

  const upcoming = [...activities].filter((a) => a.dueAt).sort((a, b) => (a.dueAt as string).localeCompare(b.dueAt as string)).slice(0, 5);
  const open = cobrancas.filter((c) => c.status === "aberto" || c.status === "vencido");
  const openTotal = open.reduce((s, c) => s + valorDevido(c), 0);
  const recentGrades = grades.flatMap((g) => g.items.filter((i) => i.value !== null).map((i) => ({ ...i, classId: g.classId }))).slice(0, 5);
  const risky = disciplines.filter((d) => d.attendance < MIN_ATTENDANCE + 5);
  const nextEvents = [...events].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;
  const avg = overallAverage(disciplines);
  const attendance = overallAttendance(disciplines);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student"
        title="Olá 👋"
        description="Acompanhe suas disciplinas, entregas, notas, frequência e pendências do semestre."
        actions={
          <Link to="/student/notifications" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent">
            <Bell className="h-4 w-4" /> {unread} novas
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Disciplinas" value={disciplines.length.toString()} hint="matriculadas neste período" icon={BookOpen} tone={TONE.info} />
        <StatCard label="Média geral" value={avg !== null ? avg.toFixed(1) : "—"} hint="médias das turmas com nota lançada" icon={Star} tone={TONE.ok} />
        <StatCard label="Frequência média" value={`${attendance.toFixed(0)}%`} hint={`mínimo exigido ${MIN_ATTENDANCE}%`} icon={UserCheck} tone={attendance < 80 ? TONE.warn : TONE.cyan} />
        <StatCard label="Financeiro em aberto" value={brl(openTotal)} hint={`${open.length} cobrança(s)`} icon={Wallet} tone={open.some((c) => c.status === "vencido") ? TONE.danger : TONE.purple} />
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
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade publicada no momento.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-xl border bg-background/40 p-3">
                  <span className="h-8 w-1 rounded-full" style={{ background: TONE.info }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{a.disciplineName ?? a.className} · {TYPE_LABEL[a.type]} · entrega {formatDate(a.dueAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
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

        <SectionCard title="Notas recentes" action={<Link to="/student/grades" className="text-xs text-muted-foreground hover:text-foreground">Boletim</Link>}>
          {recentGrades.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma nota lançada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recentGrades.map((g) => {
                const val = g.value as number;
                return (
                  <li key={g.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{g.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{g.origin === "learn" ? "Rooster Learn" : "Manual"}</p>
                    </div>
                    <Chip tone={val >= 7 ? TONE.ok : val >= 5 ? TONE.warn : TONE.danger}>{val.toFixed(1)}</Chip>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Minhas disciplinas" className="lg:col-span-2" action={<Link to="/student/disciplines" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>}>
          <div className="grid gap-3 sm:grid-cols-2">
            {disciplines.slice(0, 4).map((d) => (
              <div key={d.id} className="rounded-xl border bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <Avatar initials={d.teacherInitials} tone={d.accent} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{d.teacher} · {d.schedule || "horário a definir"}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Média {d.average?.toFixed(1) ?? "—"}</span>
                  <span>Freq. {d.attendance}%</span>
                </div>
                <ProgressBar className="mt-1.5" value={d.attendance} tone={d.accent} />
              </div>
            ))}
            {disciplines.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma disciplina matriculada.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Próximos eventos" description="Calendário acadêmico" className="lg:col-span-2" action={<Link to="/student/calendar" className="text-xs text-muted-foreground hover:text-foreground">Abrir calendário</Link>}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {nextEvents.map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-xl border bg-background/40 p-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground">{e.date.split("-").reverse().join("/")} {e.time ? `· ${e.time}` : ""}</p>
                </div>
              </li>
            ))}
            {nextEvents.length === 0 && <li className="text-sm text-muted-foreground">Nenhum evento futuro cadastrado.</li>}
          </ul>
        </SectionCard>

        <SectionCard title="Situação financeira" description="Rooster Finance" action={<Link to="/student/finance" className="text-xs text-muted-foreground hover:text-foreground">Ver</Link>}>
          <ul className="space-y-2">
            {cobrancas.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{c.descricao}</p>
                  <p className="text-[11px] text-muted-foreground">Venc. {c.vencimento.slice(0, 10).split("-").reverse().join("/")} · {brl(valorDevido(c))}</p>
                </div>
                <CobrancaStatusBadge status={c.status} />
              </li>
            ))}
            {cobrancas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p>}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          { to: "/student/activities", label: "Entregar atividade", icon: ClipboardList },
          { to: "/student/finance", label: "Baixar boleto", icon: Wallet },
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
