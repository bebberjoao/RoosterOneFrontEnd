import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, ProgressBar, Chip, TONE, Table, StatCard } from "@/components/rooster/student/ui";
import { DISCIPLINES, MIN_ATTENDANCE, ATTENDANCE_TREND, overallAttendance, shiftDate, formatDate } from "@/components/rooster/student/mock-data";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { UserCheck, AlertTriangle, CalendarX, Percent } from "lucide-react";

export const Route = createFileRoute("/student/attendance")({ component: StudentAttendance });

const RECENT_ABSENCES = [
  { id: "ab1", disciplineId: "d5", date: shiftDate(-4), justified: false },
  { id: "ab2", disciplineId: "d3", date: shiftDate(-7), justified: false },
  { id: "ab3", disciplineId: "d2", date: shiftDate(-11), justified: true },
  { id: "ab4", disciplineId: "d5", date: shiftDate(-14), justified: false },
  { id: "ab5", disciplineId: "d3", date: shiftDate(-18), justified: true },
  { id: "ab6", disciplineId: "d1", date: shiftDate(-25), justified: false },
];

function StudentAttendance() {
  const totalAbsences = DISCIPLINES.reduce((s, d) => s + d.absences, 0);
  const below = DISCIPLINES.filter((d) => d.attendance < MIN_ATTENDANCE);
  const risk = DISCIPLINES.filter((d) => d.attendance >= MIN_ATTENDANCE && d.attendance < 80);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Academy"
        title="Frequência"
        description={`Acompanhe presenças, faltas e o limite mínimo de ${MIN_ATTENDANCE}% exigido pela instituição.`}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Frequência média" value={`${overallAttendance.toFixed(0)}%`} hint="todas as disciplinas" icon={Percent} tone={overallAttendance < 80 ? TONE.warn : TONE.ok} />
        <StatCard label="Faltas no semestre" value={totalAbsences.toString()} hint="registros lançados" icon={CalendarX} tone={TONE.info} />
        <StatCard label="Abaixo do mínimo" value={below.length.toString()} hint={`${MIN_ATTENDANCE}% exigidos`} icon={AlertTriangle} tone={below.length ? TONE.danger : TONE.muted} />
        <StatCard label="Em zona de atenção" value={risk.length.toString()} hint="entre 75% e 80%" icon={UserCheck} tone={TONE.warn} />
      </div>

      {below.length > 0 && (
        <div className="mb-6 rounded-2xl border p-4" style={{ borderColor: `color-mix(in oklab, ${TONE.danger} 35%, transparent)`, background: `color-mix(in oklab, ${TONE.danger} 8%, transparent)` }}>
          <p className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4" style={{ color: TONE.danger }} /> Risco de reprovação por falta</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {below.map((d) => (
              <li key={d.id}>{d.name} — {d.attendance}% de presença ({d.absences} faltas em {d.classesGiven} aulas). Máximo permitido: {Math.floor(d.classesGiven * 0.25)} faltas.</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Frequência por disciplina" className="lg:col-span-2">
          <Table head={["Disciplina", "Aulas", "Faltas", "Limite", "Frequência", "Situação"]}>
            {DISCIPLINES.map((d) => {
              const limit = Math.floor(d.classesGiven * 0.25);
              return (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.code} · {d.teacher}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{d.classesGiven}</td>
                  <td className="px-3 py-2.5">{d.absences}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{limit}</td>
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
              );
            })}
          </Table>
        </SectionCard>

        <SectionCard title="Faltas recentes" description="Últimos registros de ausência">
          <ul className="space-y-2">
            {RECENT_ABSENCES.map((a) => {
              const d = DISCIPLINES.find((x) => x.id === a.disciplineId);
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{d?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(a.date)}</p>
                  </div>
                  <Chip tone={a.justified ? TONE.cyan : TONE.danger}>{a.justified ? "Justificada" : "Falta"}</Chip>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Evolução da frequência" className="lg:col-span-3">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ATTENDANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis domain={[50, 100]} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <ReferenceLine y={MIN_ATTENDANCE} stroke="oklch(0.65 0.18 25)" strokeDasharray="4 4" label={{ value: `mínimo ${MIN_ATTENDANCE}%`, fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Line type="monotone" dataKey="freq" name="Frequência" stroke="oklch(0.68 0.14 195)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
