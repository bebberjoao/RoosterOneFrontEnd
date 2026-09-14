import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, Chip, TONE, Table, Select, ProgressBar } from "@/components/rooster/student/ui";
import { DISCIPLINES, ASSESSMENTS, partialAverage, formatDate, PERFORMANCE_TREND, overallAverage } from "@/components/rooster/student/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, Legend, Line } from "recharts";
import { Download } from "lucide-react";

export const Route = createFileRoute("/student/grades")({ component: StudentGrades });

function StudentGrades() {
  const [disc, setDisc] = useState("todas");
  const list = DISCIPLINES.filter((d) => disc === "todas" || d.id === disc);

  const byDiscipline = DISCIPLINES.map((d) => ({ name: d.code, media: Number((partialAverage(d.id) ?? 0).toFixed(1)), accent: d.accent }));

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Academy e Learn"
        title="Notas e desempenho"
        description="Boletim completo com avaliações, médias parciais, média final, situação e evolução ao longo do semestre."
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"><Download className="h-4 w-4" /> Exportar boletim</button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Média geral</p><p className="mt-1 text-2xl font-semibold">{overallAverage.toFixed(1)}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Avaliações lançadas</p><p className="mt-1 text-2xl font-semibold">{ASSESSMENTS.filter((a) => a.value !== null).length}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Avaliações pendentes</p><p className="mt-1 text-2xl font-semibold">{ASSESSMENTS.filter((a) => a.value === null).length}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Disciplinas em risco</p><p className="mt-1 text-2xl font-semibold">{DISCIPLINES.filter((d) => (d.average ?? 10) < 6).length}</p></div>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Evolução do desempenho" description="Média mensal comparada à turma">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_TREND}>
                <defs>
                  <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.18 155)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.62 0.18 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="media" name="Minha média" stroke="oklch(0.62 0.18 155)" fill="url(#gG)" strokeWidth={2} />
                <Line type="monotone" dataKey="turma" name="Turma" stroke="oklch(0.65 0.05 260)" strokeDasharray="4 4" dot={false} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Média parcial por disciplina">
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
        <Select value={disc} onChange={setDisc} options={[{ value: "todas", label: "Todas as disciplinas" }, ...DISCIPLINES.map((d) => ({ value: d.id, label: d.name }))]} />
        <p className="text-xs text-muted-foreground">Notas com origem <strong>Learn</strong> são importadas automaticamente das atividades corrigidas.</p>
      </div>

      <div className="space-y-4">
        {list.map((d) => {
          const items = ASSESSMENTS.filter((a) => a.disciplineId === d.id);
          const partial = partialAverage(d.id);
          const projected = items.reduce((s, a) => s + (a.value ?? 0) * a.weight, 0);
          return (
            <SectionCard
              key={d.id}
              title={`${d.code} — ${d.name}`}
              description={`${d.teacher} · ${d.workload}h`}
              action={
                <div className="flex items-center gap-2">
                  <Chip tone={(partial ?? 0) >= 7 ? TONE.ok : (partial ?? 0) >= 5 ? TONE.warn : TONE.danger}>Média parcial {partial?.toFixed(1) ?? "—"}</Chip>
                  <StatusChip status={d.situation} />
                </div>
              }
            >
              <Table head={["Avaliação", "Peso", "Origem", "Data", "Nota", "Situação"]}>
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5">{a.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{(a.weight * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2.5"><Chip tone={a.origin === "learn" ? TONE.purple : TONE.muted}>{a.origin === "learn" ? "Rooster Learn" : "Manual"}</Chip></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatDate(a.date)}</td>
                    <td className="px-3 py-2.5 font-medium">{a.value !== null ? a.value.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2.5">{a.value === null ? <Chip tone={TONE.info}>Aguardando</Chip> : <Chip tone={a.value >= 7 ? TONE.ok : a.value >= 5 ? TONE.warn : TONE.danger}>{a.value >= 7 ? "Suficiente" : a.value >= 5 ? "Atenção" : "Insuficiente"}</Chip>}</td>
                  </tr>
                ))}
              </Table>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Nota acumulada no semestre: <strong className="text-foreground">{projected.toFixed(1)}</strong> de 10</span>
                <div className="w-48"><ProgressBar value={projected * 10} tone={d.accent} /></div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
