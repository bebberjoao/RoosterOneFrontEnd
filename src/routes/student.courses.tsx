import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, ProgressBar, Chip, TONE, FilterInput, Select, StatCard, EmptyState, Btn, Table } from "@/components/rooster/student/ui";
import { BOOST_COURSES } from "@/components/rooster/student/mock-data";
import { Search, Rocket, Award, PlayCircle, Clock, Download } from "lucide-react";

export const Route = createFileRoute("/student/courses")({ component: StudentCourses });

const STATUS_LABEL = { andamento: "Em andamento", concluido: "Concluído", disponivel: "Disponível" } as const;
const STATUS_TONE = { andamento: TONE.info, concluido: TONE.ok, disponivel: TONE.cyan } as const;

function StudentCourses() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [cat, setCat] = useState("todas");
  const [enrolled, setEnrolled] = useState<string[]>([]);

  const categories = Array.from(new Set(BOOST_COURSES.map((c) => c.category)));

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return BOOST_COURSES.filter((c) =>
      (!n || `${c.title} ${c.instructor}`.toLowerCase().includes(n)) &&
      (status === "todos" || c.status === status) &&
      (cat === "todas" || c.category === cat),
    );
  }, [q, status, cat]);

  const inProgress = BOOST_COURSES.filter((c) => c.status === "andamento");
  const finished = BOOST_COURSES.filter((c) => c.status === "concluido");
  const hours = finished.reduce((s, c) => s + c.hours, 0);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Boost"
        title="Cursos e certificados"
        description="Cursos extracurriculares disponíveis, progresso de conclusão e certificados obtidos."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Em andamento" value={inProgress.length.toString()} hint="continue de onde parou" icon={PlayCircle} tone={TONE.info} />
        <StatCard label="Concluídos" value={finished.length.toString()} hint="certificados emitidos" icon={Award} tone={TONE.ok} />
        <StatCard label="Horas complementares" value={`${hours}h`} hint="validadas no histórico" icon={Clock} tone={TONE.cyan} />
        <StatCard label="Novas oportunidades" value={BOOST_COURSES.filter((c) => c.status === "disponivel").length.toString()} hint="abertos para inscrição" icon={Rocket} tone={TONE.orange} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={q} onChange={setQ} placeholder="Buscar curso ou instrutor" icon={Search} />
        <Select value={status} onChange={setStatus} options={[
          { value: "todos", label: "Todos os status" },
          { value: "andamento", label: "Em andamento" },
          { value: "concluido", label: "Concluídos" },
          { value: "disponivel", label: "Disponíveis" },
        ]} />
        <Select value={cat} onChange={setCat} options={[{ value: "todas", label: "Todas as categorias" }, ...categories.map((c) => ({ value: c, label: c }))]} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Rocket} title="Nenhum curso encontrado" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <article key={c.id} className="flex flex-col rounded-2xl border bg-card p-5">
              <div className="h-20 rounded-xl" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${c.tone} 28%, transparent), color-mix(in oklab, ${c.tone} 8%, transparent))` }} />
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{c.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{c.instructor} · {c.hours}h</p>
                </div>
                <Chip tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Chip>
              </div>
              <Chip tone={c.tone}>{c.category}</Chip>
              <div className="mt-3 flex-1">
                <div className="flex justify-between text-[11px] text-muted-foreground"><span>Progresso</span><span>{enrolled.includes(c.id) ? 0 : c.progress}%</span></div>
                <ProgressBar className="mt-1" value={enrolled.includes(c.id) ? 0 : c.progress} tone={c.tone} />
              </div>
              <div className="mt-4 flex gap-2 border-t pt-3">
                {c.status === "concluido" ? (
                  <Btn className="flex-1 justify-center"><Download className="h-4 w-4" /> Certificado</Btn>
                ) : c.status === "andamento" ? (
                  <Btn variant="solid" className="flex-1 justify-center"><PlayCircle className="h-4 w-4" /> Continuar</Btn>
                ) : enrolled.includes(c.id) ? (
                  <Btn className="flex-1 justify-center">Inscrição confirmada</Btn>
                ) : (
                  <Btn variant="solid" className="flex-1 justify-center" onClick={() => setEnrolled((p) => [...p, c.id])}>Inscrever-se</Btn>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <SectionCard className="mt-6" title="Certificados obtidos" description="Documentos válidos como horas complementares">
        <Table head={["Curso", "Categoria", "Carga horária", "Código", ""]}>
          {finished.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30">
              <td className="px-3 py-2.5 font-medium">{c.title}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{c.category}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{c.hours}h</td>
              <td className="px-3 py-2.5"><Chip tone={TONE.ok}>{c.certificate}</Chip></td>
              <td className="px-3 py-2.5 text-right">
                <button className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent"><Download className="h-3.5 w-3.5" /> Baixar PDF</button>
              </td>
            </tr>
          ))}
        </Table>
      </SectionCard>
    </>
  );
}
