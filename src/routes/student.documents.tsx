import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, Table, Select, FilterInput, Btn, TONE, EmptyState } from "@/components/rooster/student/ui";
import { DOCUMENTS, formatDate } from "@/components/rooster/student/mock-data";
import { Search, Download, Upload, FileText, X, Paperclip } from "lucide-react";

export const Route = createFileRoute("/student/documents")({ component: StudentDocuments });

function StudentDocuments() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [modal, setModal] = useState(false);
  const [sent, setSent] = useState<string[]>([]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return DOCUMENTS.filter((d) =>
      (!n || d.name.toLowerCase().includes(n)) &&
      (kind === "todos" || d.kind === kind) &&
      (status === "todos" || d.status === status),
    );
  }, [q, kind, status]);

  const pending = DOCUMENTS.filter((d) => d.status === "pendente" || d.status === "recusado");

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student"
        title="Central de documentos"
        description="Baixe documentos institucionais, envie os arquivos solicitados e acompanhe o status das análises."
        actions={<Btn variant="solid" onClick={() => setModal(true)}><Upload className="h-4 w-4" /> Enviar documento</Btn>}
      />

      {pending.length > 0 && (
        <div className="mb-6 rounded-2xl border p-4" style={{ borderColor: `color-mix(in oklab, ${TONE.warn} 35%, transparent)`, background: `color-mix(in oklab, ${TONE.warn} 8%, transparent)` }}>
          <p className="text-sm font-medium">Documentos aguardando seu envio</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {pending.map((d) => <li key={d.id}>{d.name} — {d.note ?? "reenvio necessário"}</li>)}
          </ul>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={q} onChange={setQ} placeholder="Buscar documento" icon={Search} />
        <Select value={kind} onChange={setKind} options={[
          { value: "todos", label: "Todas as origens" },
          { value: "Institucional", label: "Institucionais" },
          { value: "Enviado", label: "Enviados por mim" },
          { value: "Solicitado", label: "Solicitados" },
        ]} />
        <Select value={status} onChange={setStatus} options={[
          { value: "todos", label: "Todos os status" },
          { value: "disponivel", label: "Disponível" },
          { value: "em-analise", label: "Em análise" },
          { value: "aprovado", label: "Aprovado" },
          { value: "recusado", label: "Recusado" },
          { value: "pendente", label: "Pendente" },
        ]} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum documento encontrado" />
      ) : (
        <SectionCard title="Documentos" description={`${rows.length} registro(s)`}>
          <Table head={["Documento", "Origem", "Atualizado", "Tamanho", "Status", ""]}>
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-3 py-2.5">
                  <p className="font-medium">{d.name}</p>
                  {d.note ? <p className="text-[11px] text-muted-foreground">{d.note}</p> : null}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{d.kind}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{formatDate(d.updatedAt)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{d.size ?? "—"}</td>
                <td className="px-3 py-2.5"><StatusChip status={sent.includes(d.id) ? "em-analise" : d.status} /></td>
                <td className="px-3 py-2.5 text-right">
                  {d.status === "pendente" || d.status === "recusado" ? (
                    <button onClick={() => { setSent((p) => [...p, d.id]); setModal(true); }} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent"><Upload className="h-3.5 w-3.5" /> Enviar</button>
                  ) : (
                    <button className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent"><Download className="h-3.5 w-3.5" /> Baixar</button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </SectionCard>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">Enviar documento</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Formatos aceitos: PDF, JPG, PNG (até 20MB).</p>
              </div>
              <button onClick={() => setModal(false)} className="rounded-lg border p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <Select value="" onChange={() => {}} options={[{ value: "", label: "Selecione o tipo de documento" }, ...DOCUMENTS.filter((d) => d.kind !== "Institucional").map((d) => ({ value: d.id, label: d.name }))]} />
              <div className="rounded-xl border border-dashed p-6 text-center">
                <Paperclip className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Arraste o arquivo aqui ou clique para selecionar</p>
              </div>
              <div className="flex justify-end gap-2">
                <Btn onClick={() => setModal(false)}>Cancelar</Btn>
                <Btn variant="solid" onClick={() => setModal(false)}>Enviar para análise</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
