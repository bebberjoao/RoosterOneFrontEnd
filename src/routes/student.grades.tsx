import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, Chip, TONE, Table, Select, ProgressBar, EmptyState } from "@/components/rooster/student/ui";
import { LoadingCards } from "@/components/shared";
import { studentService, overallAverage, type StudentDiscipline, type ClassGrades } from "@/services/mock-api/student.service";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { UserX } from "lucide-react";

export const Route = createFileRoute("/student/grades")({ component: StudentGrades });

function StudentGrades() {
  const [disciplines, setDisciplines] = useState<StudentDiscipline[] | null>(null);
  const [grades, setGrades] = useState<ClassGrades[]>([]);
  const [noLink, setNoLink] = useState(false);
  const [disc, setDisc] = useState("todas");

  useEffect(() => {
    studentService.getMyEnrollments().then(setDisciplines).catch(() => setNoLink(true));
    studentService.getMyGrades().then(setGrades).catch(() => {});
  }, []);

  if (noLink) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student · integrado ao Academy e Learn" title="Notas e desempenho" description="Boletim com avaliações, médias e situação." />
        <EmptyState icon={UserX} title="Sem vínculo de aluno" description="O usuário autenticado não possui um registro de aluno associado." />
      </>
    );
  }

  if (disciplines === null) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student · integrado ao Academy e Learn" title="Notas e desempenho" description="Boletim com avaliações, médias e situação." />
        <LoadingCards />
      </>
    );
  }

  const list = disciplines.filter((d) => disc === "todas" || d.classId === disc);
  const gradesByClass = new Map(grades.map((g) => [g.classId, g]));
  const avg = overallAverage(disciplines);
  const launched = grades.reduce((s, g) => s + g.items.filter((i) => i.value !== null).length, 0);
  const pending = grades.reduce((s, g) => s + g.items.filter((i) => i.value === null).length, 0);
  const atRisk = disciplines.filter((d) => (d.average ?? 10) < 6).length;

  const byDiscipline = disciplines.map((d) => ({ name: d.code, media: Number((d.average ?? 0).toFixed(1)), accent: d.accent }));

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Academy e Learn"
        title="Notas e desempenho"
        description="Boletim com avaliações, médias por disciplina e situação, alimentado pelo Rooster Academy e pelas atividades corrigidas no Rooster Learn."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Média geral</p><p className="mt-1 text-2xl font-semibold">{avg !== null ? avg.toFixed(1) : "—"}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Avaliações lançadas</p><p className="mt-1 text-2xl font-semibold">{launched}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Avaliações pendentes</p><p className="mt-1 text-2xl font-semibold">{pending}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Disciplinas em risco</p><p className="mt-1 text-2xl font-semibold">{atRisk}</p></div>
      </div>

      <div className="mb-4">
        <SectionCard title="Média por disciplina">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDiscipline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="media" radius={[6, 6, 0, 0]}>
                  {byDiscipline.map((b) => <Cell key={b.name} fill={b.accent} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <Select value={disc} onChange={setDisc} options={[{ value: "todas", label: "Todas as disciplinas" }, ...disciplines.map((d) => ({ value: d.classId, label: d.name }))]} />
        <p className="text-xs text-muted-foreground">Notas com origem <strong>Learn</strong> vêm de atividades corrigidas automaticamente.</p>
      </div>

      <div className="space-y-4">
        {list.map((d) => {
          const g = gradesByClass.get(d.classId);
          const items = g?.items ?? [];
          return (
            <SectionCard
              key={d.id}
              title={`${d.code} — ${d.name}`}
              description={`${d.teacher} · ${d.workload}h`}
              action={
                <div className="flex items-center gap-2">
                  <Chip tone={(d.average ?? 0) >= 7 ? TONE.ok : (d.average ?? 0) >= 5 ? TONE.warn : TONE.danger}>Média {d.average?.toFixed(1) ?? "—"}</Chip>
                  <StatusChip status={d.situation} />
                </div>
              }
            >
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item avaliativo lançado nesta turma ainda.</p>
              ) : (
                <>
                  <Table head={["Avaliação", "Peso", "Origem", "Nota", "Situação"]}>
                    {items.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5">{a.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{a.weight}</td>
                        <td className="px-3 py-2.5"><Chip tone={a.origin === "learn" ? TONE.purple : TONE.muted}>{a.origin === "learn" ? "Rooster Learn" : "Manual"}</Chip></td>
                        <td className="px-3 py-2.5 font-medium">{a.value !== null ? a.value.toFixed(1) : "—"}</td>
                        <td className="px-3 py-2.5">{a.value === null ? <Chip tone={TONE.info}>Aguardando</Chip> : <Chip tone={a.value >= 7 ? TONE.ok : a.value >= 5 ? TONE.warn : TONE.danger}>{a.value >= 7 ? "Suficiente" : a.value >= 5 ? "Atenção" : "Insuficiente"}</Chip>}</td>
                      </tr>
                    ))}
                  </Table>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Média ponderada: <strong className="text-foreground">{d.average !== null ? d.average.toFixed(1) : "—"}</strong> de 10</span>
                    <div className="w-48"><ProgressBar value={(d.average ?? 0) * 10} tone={d.accent} /></div>
                  </div>
                </>
              )}
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
