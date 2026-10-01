import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import {
  SectionCard,
  Table,
  Select,
  FilterInput,
  Chip,
  TONE,
  EmptyState,
} from "@/components/rooster/student/ui";
import { LoadingCards } from "@/components/shared";
import { formatDate } from "@/components/rooster/student/mock-data";
import { downloadBlob } from "@/components/rooster/finance/format";
import { academyService, type AcademyDoc } from "@/services/mock-api/academy.service";
import { studentService, type StudentDiscipline } from "@/services/mock-api/student.service";
import { Search, Download, FileText, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/student/documents")({ component: StudentDocuments });

/**
 * Central de documentos do aluno: documentos institucionais (sem disciplina) e os das disciplinas em que o aluno
 * está matriculado, obtidos de `GET /documentos-academicos` e baixados decifrados pelo backend. Os documentos de
 * disciplinas não cursadas pelo aluno não são exibidos.
 */
function StudentDocuments() {
  const [docs, setDocs] = useState<AcademyDoc[] | null>(null);
  const [disciplines, setDisciplines] = useState<StudentDiscipline[]>([]);
  const [failed, setFailed] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState("todos");

  useEffect(() => {
    Promise.all([
      academyService.getDocs(),
      studentService.getMyEnrollments().catch(() => [] as StudentDiscipline[]),
    ])
      .then(([rows, enrolled]) => {
        setDisciplines(enrolled);
        setDocs(rows);
      })
      .catch(() => setFailed(true));
  }, []);

  const disciplineName = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of disciplines) map.set(d.disciplineId, `${d.code} — ${d.name}`);
    return map;
  }, [disciplines]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (docs ?? [])
      .filter((d) => !d.disciplineId || disciplineName.has(d.disciplineId))
      .filter(
        (d) =>
          origin === "todos" ||
          (origin === "institucional" ? !d.disciplineId : d.disciplineId === origin),
      )
      .filter((d) => !n || `${d.name} ${d.kind}`.toLowerCase().includes(n))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [docs, q, origin, disciplineName]);

  async function baixar(doc: AcademyDoc) {
    setDownloadError(null);
    setDownloading(doc.id);
    try {
      downloadBlob(await academyService.downloadDoc(doc.id), doc.name);
    } catch {
      setDownloadError(`Não foi possível baixar "${doc.name}". Tente novamente.`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student"
        title="Central de documentos"
        description="Documentos institucionais e documentos das disciplinas em que você está matriculado."
      />

      {failed ? (
        <EmptyState
          icon={AlertTriangle}
          title="Documentos indisponíveis"
          description="Não foi possível carregar os documentos. Verifique a conexão ou tente novamente mais tarde."
        />
      ) : docs === null ? (
        <LoadingCards />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
            <FilterInput value={q} onChange={setQ} placeholder="Buscar documento" icon={Search} />
            <Select
              value={origin}
              onChange={setOrigin}
              options={[
                { value: "todos", label: "Todas as origens" },
                { value: "institucional", label: "Institucionais" },
                ...disciplines.map((d) => ({
                  value: d.disciplineId,
                  label: `${d.code} — ${d.name}`,
                })),
              ]}
            />
          </div>

          {downloadError ? (
            <div
              className="mb-4 rounded-xl border p-3 text-sm"
              style={{ borderColor: `color-mix(in oklab, ${TONE.danger} 35%, transparent)` }}
            >
              {downloadError}
            </div>
          ) : null}

          {rows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum documento encontrado"
              description="Não há documentos disponíveis para os filtros selecionados."
            />
          ) : (
            <SectionCard title="Documentos" description={`${rows.length} registro(s)`}>
              <Table head={["Documento", "Tipo", "Origem", "Atualizado", "Tamanho", ""]}>
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium">{d.name}</td>
                    <td className="px-3 py-2.5">
                      <Chip tone={TONE.info}>{d.kind}</Chip>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {d.disciplineId ? disciplineName.get(d.disciplineId) : "Institucional"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatDate(d.updatedAt)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{d.size}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => baixar(d)}
                        disabled={downloading === d.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" />{" "}
                        {downloading === d.id ? "Baixando…" : "Baixar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            </SectionCard>
          )}
        </>
      )}
    </>
  );
}
