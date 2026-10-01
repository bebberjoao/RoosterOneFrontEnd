import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, ProgressBar, StatusChip, Avatar, FilterInput, Select, Chip, TONE, EmptyState } from "@/components/rooster/student/ui";
import { LoadingCards } from "@/components/shared";
import { studentService, MIN_ATTENDANCE, type StudentDiscipline } from "@/services/mock-api/student.service";
import { learnService, type Activity } from "@/services/mock-api/learn.service";
import { Search, BookOpen, Clock, MapPin, ClipboardList, BarChart3, LayoutGrid, List, UserX } from "lucide-react";
import { fmtNumero } from "@/lib/formatacao";

export const Route = createFileRoute("/student/disciplines")({ component: StudentDisciplines });

function StudentDisciplines() {
  const [disciplines, setDisciplines] = useState<StudentDiscipline[] | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [noLink, setNoLink] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    studentService.getMyEnrollments()
      .then(setDisciplines)
      .catch(() => setNoLink(true));
    learnService.getMyActivities().then(setActivities).catch(() => {});
  }, []);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const f = (disciplines ?? []).filter((d) => !n || `${d.name} ${d.code} ${d.teacher}`.toLowerCase().includes(n));
    return [...f].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name)
      : sort === "average" ? (b.average ?? 0) - (a.average ?? 0)
      : a.attendance - b.attendance,
    );
  }, [disciplines, q, sort]);

  const pendingOf = (classId: string) => activities.filter((a) => a.classId === classId && a.status === "publicada").length;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student"
        title="Minhas disciplinas"
        description="Disciplinas matriculadas com professor, carga horária, frequência, média e situação."
      />

      {noLink ? (
        <EmptyState icon={UserX} title="Sem vínculo de aluno" description="O usuário autenticado não possui um registro de aluno associado." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
            <FilterInput value={q} onChange={setQ} placeholder="Buscar disciplina, código ou professor" icon={Search} />
            <Select
              value={sort}
              onChange={setSort}
              options={[
                { value: "name", label: "Ordenar por nome" },
                { value: "average", label: "Maior média" },
                { value: "attendance", label: "Menor frequência" },
              ]}
            />
            <div className="flex overflow-hidden rounded-lg border">
              <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-foreground text-background" : "hover:bg-accent"}`}><LayoutGrid className="h-4 w-4" /></button>
              <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-foreground text-background" : "hover:bg-accent"}`}><List className="h-4 w-4" /></button>
            </div>
          </div>

          {disciplines === null ? (
            <LoadingCards />
          ) : list.length === 0 ? (
            <EmptyState icon={BookOpen} title="Nenhuma disciplina encontrada" description="Ajuste a busca para ver seus componentes curriculares." />
          ) : view === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((d) => (
                <article key={d.id} className="rounded-2xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{d.code}</p>
                      <h3 className="truncate text-sm font-semibold">{d.name}</h3>
                    </div>
                    <StatusChip status={d.situation} />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Avatar initials={d.teacherInitials} tone={d.accent} size={32} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{d.teacher}</p>
                      <p className="truncate text-[11px] text-muted-foreground">Professor responsável</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {d.workload}h · {d.schedule || "horário a definir"}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {d.room || "sala a definir"}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Frequência</span><span>{d.attendance}%</span></div>
                      <ProgressBar className="mt-1" value={d.attendance} tone={d.attendance < MIN_ATTENDANCE ? TONE.danger : d.attendance < 80 ? TONE.warn : TONE.ok} />
                    </div>
                    <div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Média</span><span>{fmtNumero(d.average, 1)}</span></div>
                      <ProgressBar className="mt-1" value={(d.average ?? 0) * 10} tone={d.accent} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                    <Chip tone={pendingOf(d.classId) ? TONE.warn : TONE.muted}>{pendingOf(d.classId)} atividade(s) publicada(s)</Chip>
                    <div className="flex gap-2">
                      <Link to="/student/activities" className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent"><ClipboardList className="h-3.5 w-3.5" /> Atividades</Link>
                      <Link to="/student/grades" className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent"><BarChart3 className="h-3.5 w-3.5" /> Notas</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <SectionCard title="Disciplinas" description={`${list.length} componentes no semestre`}>
              <ul className="divide-y">
                {list.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="h-8 w-1 rounded-full" style={{ background: d.accent }} />
                    <div className="min-w-[220px] flex-1">
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">{d.code} · {d.teacher} · {d.schedule || "horário a definir"}</p>
                    </div>
                    <div className="w-28 text-xs"><span className="text-muted-foreground">Freq.</span> {d.attendance}%</div>
                    <div className="w-24 text-xs"><span className="text-muted-foreground">Média</span> {fmtNumero(d.average, 1)}</div>
                    <StatusChip status={d.situation} />
                    <Link to="/student/activities" className="rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent">Atividades</Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}
    </>
  );
}
