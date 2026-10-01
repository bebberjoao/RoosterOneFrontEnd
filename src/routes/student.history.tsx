import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, Table, Select, FilterInput, StatCard, TONE, Chip, EmptyState } from "@/components/rooster/student/ui";
import { LoadingCards } from "@/components/shared";
import { studentService, computeCR, totalHoursDone, type HistoryRow } from "@/services/mock-api/student.service";
import { Search, GraduationCap, Award, Clock, UserX } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { fmtNumero } from "@/lib/formatacao";

export const Route = createFileRoute("/student/history")({ component: StudentHistory });

function StudentHistory() {
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [noLink, setNoLink] = useState(false);
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("todos");
  const [sit, setSit] = useState("todas");

  useEffect(() => {
    studentService.getMyHistory().then(setHistory).catch(() => setNoLink(true));
  }, []);

  if (noLink) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student · integrado ao Rooster Academy" title="Histórico acadêmico" description="Disciplinas cursadas e coeficiente de rendimento." />
        <EmptyState icon={UserX} title="Sem vínculo de aluno" description="O usuário autenticado não possui um registro de aluno associado." />
      </>
    );
  }

  if (history === null) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student · integrado ao Rooster Academy" title="Histórico acadêmico" description="Disciplinas cursadas e coeficiente de rendimento." />
        <LoadingCards />
      </>
    );
  }

  const terms = Array.from(new Set(history.map((h) => h.term)));

  const rows = history.filter((h) =>
    (!q.trim() || `${h.name} ${h.code}`.toLowerCase().includes(q.trim().toLowerCase())) &&
    (term === "todos" || h.term === term) &&
    (sit === "todas" || h.situation === sit),
  );

  const perTerm = terms.map((t) => {
    const items = history.filter((h) => h.term === t && h.grade !== null);
    const w = items.reduce((s, h) => s + h.workload, 0);
    return { term: t, media: w ? Number((items.reduce((s, h) => s + (h.grade as number) * h.workload, 0) / w).toFixed(2)) : 0 };
  });

  const approved = history.filter((h) => h.situation === "aprovado").length;
  const failed = history.filter((h) => h.situation.startsWith("reprovado")).length;
  const cr = computeCR(history);
  const hours = totalHoursDone(history);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Academy"
        title="Histórico acadêmico"
        description="Disciplinas cursadas, notas finais, carga horária, situação e coeficiente de rendimento."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Coeficiente de rendimento" value={cr !== null ? fmtNumero(cr, 2) : "—"} hint="ponderado por carga horária" icon={GraduationCap} tone={TONE.ok} />
        <StatCard label="Disciplinas aprovadas" value={approved.toString()} hint={`${failed} reprovação(ões)`} icon={Award} tone={TONE.info} />
        <StatCard label="Horas integralizadas" value={`${hours}h`} hint="carga horária das disciplinas aprovadas" icon={Clock} tone={TONE.cyan} />
        <StatCard label="Cursando" value={history.filter((h) => h.situation === "cursando").length.toString()} hint="disciplinas no período atual" icon={GraduationCap} tone={TONE.purple} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Resumo" className="lg:col-span-1">
          <ul className="space-y-2 text-xs">
            <li className="flex justify-between"><span className="text-muted-foreground">Aprovadas</span><Chip tone={TONE.ok}>{approved}</Chip></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Cursando</span><Chip tone={TONE.info}>{history.filter((h) => h.situation === "cursando").length}</Chip></li>
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
          { value: "trancado", label: "Trancado" },
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
              <td className="px-3 py-2.5">{h.grade !== null ? fmtNumero(h.grade, 1) : "—"}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{h.attendance}%</td>
              <td className="px-3 py-2.5"><StatusChip status={h.situation} /></td>
            </tr>
          ))}
        </Table>
      </SectionCard>
    </>
  );
}
