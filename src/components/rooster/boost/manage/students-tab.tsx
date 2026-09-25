import { useEffect, useState } from "react";
import { Award, Users } from "lucide-react";
import { Avatar, DataTable, EmptyState, ProgressBar, type Column } from "@/components/shared";
import { boostService, type BoostEnrollment } from "@/services/mock-api/boost.service";
import { toneFor, initialsOf } from "@/services/mock-api/academy.service";

const STATUS_LABEL: Record<string, string> = {
  ativa: "Ativa", concluida: "Concluída", cancelada: "Cancelada",
  ativo: "Ativo", concluido: "Concluído", cancelado: "Cancelado", trancado: "Trancado",
};

/** Progresso dos alunos matriculados — a conversa com eles é do orientador (tela "Conversas"). */
export function CourseStudentsTab({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<BoostEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    boostService
      .getStudents(courseId)
      .then((rows) => alive && setStudents(rows))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Falha ao carregar alunos"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [courseId]);

  const columns: Column<BoostEnrollment>[] = [
    {
      key: "student", header: "Aluno", sortValue: (s) => s.studentName,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar initials={initialsOf(s.studentName)} tone={toneFor(s.id)} size={32} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{s.studentName}</div>
            <div className="truncate text-[11px] text-muted-foreground">{s.studentEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: "progress", header: "Progresso", sortValue: (s) => s.progressPct,
      cell: (s) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={s.progressPct} className="w-24" tone="oklch(0.68 0.18 40)" />
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{s.progressPct}%</span>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (s) => <span className="text-xs">{STATUS_LABEL[s.status] ?? s.status}</span> },
    {
      key: "certificate", header: "Certificado",
      cell: (s) =>
        s.certificateIssued ? (
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "oklch(0.62 0.18 155)" }}>
            <Award className="h-3.5 w-3.5" /> Emitido
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Alunos matriculados</h2>
        <span className="text-xs text-muted-foreground">({students.length})</span>
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {!loading && students.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum aluno matriculado ainda" description="Assim que alguém se matricular pelo portal do aluno, o progresso aparece aqui." />
      ) : (
        <DataTable rows={students} columns={columns} emptyMessage={loading ? "Carregando…" : "Nenhum aluno encontrado"} />
      )}
    </section>
  );
}
