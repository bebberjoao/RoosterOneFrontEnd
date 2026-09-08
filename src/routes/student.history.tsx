import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, Table, Select, FilterInput, StatCard, ProgressBar, TONE, Chip } from "@/components/rooster/student/ui";
import { HISTORY, CR, totalHoursDone, CURRICULUM_HOURS } from "@/components/rooster/student/mock-data";
import { Search, Download, GraduationCap, Award, Clock, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const Route = createFileRoute("/student/history")({ component: StudentHistory });

function StudentHistory() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("todos");
  const [sit, setSit] = useState("todas");

  const terms = Array.from(new Set(HISTORY.map((h) => h.term)));

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return HISTORY.filter((h) =>
      (!n || `${h.name} ${h.code}`.toLowerCase().includes(n)) &&
      (term === "todos" || h.term === term) &&
      (sit === "todas" || h.situation === sit),
    );
  }, [q, term, sit]);

  const perTerm = terms.map((t) => {
    const items = HISTORY.filter((h) => h.term === t && h.grade !== null);
    const w = items.reduce((s, h) => s + h.workload, 0);
    return { term: t, media: Number((items.reduce((s, h) => s + (h.grade as number) * h.workload, 0) / (w || 1)).toFixed(2)) };
  });

  const approved = HISTORY.filter((h) => h.situation === "aprovado").length;
  const failed = HISTORY.filter((h) => h.situation.startsWith("reprovado")).length;
  const progress = (totalHoursDone / CURRICULUM_HOURS) * 100;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Academy"
        title="Histórico acadêmico"
        description="Disciplinas cursadas, notas finais, carga horária, situação e coeficiente de rendimento."
        actions={<button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"><Download className="h-4 w-4" /> Baixar histórico</button>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Coeficiente de rendimento" value={CR.toFixed(2)} hint="ponderado por carga horária" icon={TrendingUp} tone={TONE.ok} />
        <StatCard label="Disciplinas aprovadas" value={approved.toString()} hint={`${failed} reprovação(ões)`} icon={Award} tone={TONE.info} />
        <StatCard label="Horas integralizadas" value={`${totalHoursDone}h`} hint={`de ${CURRICULUM_HOURS}h da matriz`} icon={Clock} tone={TONE.cyan} />
        <StatCard label="Conclusão do curso" value={`${progress.toFixed(0)}%`} hint="progresso curricular" icon={GraduationCap} tone={TONE.purple} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Progresso curricular" className="lg:col-span-1">
          <p className="text-xs text-muted-foreground">{totalHoursDone}h concluídas de {CURRICULUM_HOURS}h</p>
          <ProgressBar className="mt-2 h-2.5" value={progress} tone={TONE.purple} />
          <ul className="mt-4 space-y-2 text-xs">
            <li className="flex justify-between"><span className="text-muted-foreground">Aprovadas</span><Chip tone={TONE.ok}>{approved}</Chip></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Cursando</span><Chip tone={TONE.info}>{HISTORY.filter((h) => h.situation === "cursando").length}</Chip></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Reprovadas</span><Chip tone={TONE.danger}>{failed}</Chip></li>
          </ul>
        </SectionCard>

        <SectionCard title="Média por período letivo" className="lg:col-span-2">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perTerm}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="term" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="media" name="Média" fill="oklch(0.55 0.19 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={q} onChange={setQ} placeholder="Buscar disciplina ou código" icon={Search} />
        <Select value={term} onChange={setTerm} options={[{ value: "todos", label: "Todos os períodos" }, ...terms.map((t) => ({ value: t, label: t }))]} />
        <Select value={sit} onChange={setSit} options={[
          { value: "todas", label: "Todas as situações" },
          { value: "aprovado", label: "Aprovado" },
          { value: "cursando", label: "Cursando" },
          { value: "reprovado", label: "Reprovado" },
          { value: "reprovado-falta", label: "Reprovado por falta" },
        ]} />
      </div>

      <SectionCard title="Disciplinas cursadas" description={`${rows.length} registro(s)`}>
        <Table head={["Período", "Código", "Disciplina", "CH", "Nota", "Freq.", "Situação"]}>
          {rows.map((h) => (
            <tr key={h.id} className="hover:bg-muted/30">
              <td className="px-3 py-2.5 text-muted-foreground">{h.term}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{h.code}</td>
              <td className="px-3 py-2.5 font-medium">{h.name}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{h.workload}h</td>
              <td className="px-3 py-2.5">{h.grade !== null ? h.grade.toFixed(1) : "—"}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{h.attendance}%</td>
              <td className="px-3 py-2.5"><StatusChip status={h.situation} /></td>
            </tr>
          ))}
        </Table>
      </SectionCard>
    </>
  );
}
