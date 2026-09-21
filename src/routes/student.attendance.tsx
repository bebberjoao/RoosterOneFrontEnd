import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, ProgressBar, Chip, TONE, Table, StatCard, EmptyState } from "@/components/rooster/student/ui";
import { LoadingCards } from "@/components/shared";
import { studentService, MIN_ATTENDANCE, overallAttendance, type StudentDiscipline, type StudentAttendanceRecord } from "@/services/mock-api/student.service";
import { UserCheck, AlertTriangle, CalendarX, Percent, UserX } from "lucide-react";

export const Route = createFileRoute("/student/attendance")({ component: StudentAttendance });

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const STATUS_LABEL: Record<StudentAttendanceRecord["status"], string> = {
  presente: "Presente", falta: "Falta", atraso: "Atraso", justificado: "Justificada",
};

function StudentAttendance() {
  const [disciplines, setDisciplines] = useState<StudentDiscipline[] | null>(null);
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [noLink, setNoLink] = useState(false);

  useEffect(() => {
    studentService.getMyEnrollments().then(setDisciplines).catch(() => setNoLink(true));
    studentService.getMyAttendance().then(setRecords).catch(() => {});
  }, []);

  if (noLink) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student · integrado ao Rooster Academy" title="Frequência" description="Presenças e faltas por disciplina." />
        <EmptyState icon={UserX} title="Sem vínculo de aluno" description="O usuário autenticado não possui um registro de aluno associado." />
      </>
    );
  }

  if (disciplines === null) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student · integrado ao Rooster Academy" title="Frequência" description="Presenças e faltas por disciplina." />
        <LoadingCards />
      </>
    );
  }

  const totalAbsences = disciplines.reduce((s, d) => s + d.absences, 0);
  const below = disciplines.filter((d) => d.attendance < MIN_ATTENDANCE);
  const risk = disciplines.filter((d) => d.attendance >= MIN_ATTENDANCE && d.attendance < 80);
  const avgAttendance = overallAttendance(disciplines);
  const recent = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Academy"
        title="Frequência"
        description={`Acompanhe presenças, faltas e o limite mínimo de ${MIN_ATTENDANCE}% exigido pela instituição.`}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Frequência média" value={`${avgAttendance.toFixed(0)}%`} hint="todas as disciplinas" icon={Percent} tone={avgAttendance < 80 ? TONE.warn : TONE.ok} />
        <StatCard label="Faltas no semestre" value={totalAbsences.toString()} hint="registros lançados" icon={CalendarX} tone={TONE.info} />
        <StatCard label="Abaixo do mínimo" value={below.length.toString()} hint={`${MIN_ATTENDANCE}% exigidos`} icon={AlertTriangle} tone={below.length ? TONE.danger : TONE.muted} />
        <StatCard label="Em zona de atenção" value={risk.length.toString()} hint="entre o mínimo e 80%" icon={UserCheck} tone={TONE.warn} />
      </div>

      {below.length > 0 && (
        <div className="mb-6 rounded-2xl border p-4" style={{ borderColor: `color-mix(in oklab, ${TONE.danger} 35%, transparent)`, background: `color-mix(in oklab, ${TONE.danger} 8%, transparent)` }}>
          <p className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4" style={{ color: TONE.danger }} /> Risco de reprovação por falta</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {below.map((d) => (
              <li key={d.id}>{d.name} — {d.attendance}% de presença ({d.absences} faltas em {d.classesGiven} aulas registradas).</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Frequência por disciplina" className="lg:col-span-2">
          <Table head={["Disciplina", "Aulas", "Faltas", "Frequência", "Situação"]}>
            {disciplines.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-3 py-2.5">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">{d.code} · {d.teacher}</p>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{d.classesGiven}</td>
                <td className="px-3 py-2.5">{d.absences}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-24"><ProgressBar value={d.attendance} tone={d.attendance < MIN_ATTENDANCE ? TONE.danger : d.attendance < 80 ? TONE.warn : TONE.ok} /></div>
                    <span className="text-xs">{d.attendance}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Chip tone={d.attendance < MIN_ATTENDANCE ? TONE.danger : d.attendance < 80 ? TONE.warn : TONE.ok}>
                    {d.attendance < MIN_ATTENDANCE ? "Abaixo do mínimo" : d.attendance < 80 ? "Atenção" : "Regular"}
                  </Chip>
                </td>
              </tr>
            ))}
          </Table>
        </SectionCard>

        <SectionCard title="Registros recentes" description="Últimos lançamentos de frequência">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro de frequência lançado ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{r.className}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(r.date)}</p>
                  </div>
                  <Chip tone={r.status === "presente" ? TONE.ok : r.status === "justificado" ? TONE.cyan : r.status === "atraso" ? TONE.warn : TONE.danger}>{STATUS_LABEL[r.status]}</Chip>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
