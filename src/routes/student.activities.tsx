import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, FilterInput, Select, Chip, TONE, EmptyState, Btn, Pagination } from "@/components/rooster/student/ui";
import { LoadingBlock } from "@/components/shared";
import { learnService, TYPE_LABEL, formatDate as formatDateTime, type Activity, type Submission } from "@/services/mock-api/learn.service";
import { toneFor } from "@/services/mock-api/academy.service";
import { Search, ClipboardList, Upload, FileText, MessageSquare, Paperclip, X, CheckCircle2, UserX } from "lucide-react";
import { fmtNumero } from "@/lib/formatacao";

export const Route = createFileRoute("/student/activities")({ component: StudentActivities });

const PER_PAGE = 6;

type Row = { activity: Activity; submission: Submission | null; display: "pendente" | "atrasada" | "entregue" | "corrigida" };

function classify(activity: Activity, submission: Submission | null): Row["display"] {
  if (submission?.status === "corrigida") return "corrigida";
  if (submission?.status === "enviada" || submission?.status === "reenvio") return "entregue";
  if (submission?.status === "atrasada") return "atrasada";
  if (activity.dueAt && new Date(activity.dueAt) < new Date()) return "atrasada";
  return "pendente";
}

function StudentActivities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [noLink, setNoLink] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todas");
  const [disc, setDisc] = useState("todas");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Row | null>(null);

  function reload() {
    learnService.getMyActivities().then(setActivities).catch(() => setNoLink(true));
    learnService.getMySubmissions().then(setSubmissions).catch(() => {});
  }
  useEffect(reload, []);

  const rows: Row[] = useMemo(() => {
    if (!activities) return [];
    return activities.map((a) => {
      const submission = submissions.find((s) => s.activityId === a.id) ?? null;
      return { activity: a, submission, display: classify(a, submission) };
    });
  }, [activities, submissions]);

  const disciplineOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.activity.classId, r.activity.disciplineName ?? r.activity.className ?? "Turma"));
    return Array.from(map.entries());
  }, [rows]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter((r) =>
      (!n || `${r.activity.title}`.toLowerCase().includes(n)) &&
      (status === "todas" || r.display === status) &&
      (disc === "todas" || r.activity.classId === disc),
    ).sort((a, b) => (a.activity.dueAt ?? "").localeCompare(b.activity.dueAt ?? ""));
  }, [rows, q, status, disc]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    pendentes: rows.filter((r) => r.display === "pendente" || r.display === "atrasada").length,
    entregues: rows.filter((r) => r.display === "entregue").length,
    corrigidas: rows.filter((r) => r.display === "corrigida").length,
  };
  const graded = rows.map((r) => r.submission?.grade).filter((g): g is number => g !== null && g !== undefined);
  const avg = graded.length ? graded.reduce((s, g) => s + g, 0) / graded.length : null;

  if (noLink) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student · integrado ao Rooster Learn" title="Atividades e avaliações" description="Entregas e correções das suas turmas." />
        <EmptyState icon={UserX} title="Sem vínculo de aluno" description="O usuário autenticado não possui um registro de aluno associado." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Learn"
        title="Atividades e avaliações"
        description="Envie respostas e arquivos para as atividades publicadas pelos professores e acompanhe notas e feedback."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Pendentes</p><p className="mt-1 text-2xl font-semibold">{counts.pendentes}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Entregues</p><p className="mt-1 text-2xl font-semibold">{counts.entregues}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Corrigidas</p><p className="mt-1 text-2xl font-semibold">{counts.corrigidas}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Média das entregas</p><p className="mt-1 text-2xl font-semibold">{avg !== null ? fmtNumero(avg, 1) : "—"}</p></div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar atividade" icon={Search} />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { value: "todas", label: "Todos os status" },
          { value: "pendente", label: "Pendentes" },
          { value: "atrasada", label: "Atrasadas" },
          { value: "entregue", label: "Entregues" },
          { value: "corrigida", label: "Corrigidas" },
        ]} />
        <Select value={disc} onChange={(v) => { setDisc(v); setPage(1); }} options={[{ value: "todas", label: "Todas as disciplinas" }, ...disciplineOptions.map(([id, label]) => ({ value: id, label }))]} />
      </div>

      {activities === null ? (
        <LoadingBlock />
      ) : paged.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma atividade encontrada" description="Ajuste os filtros para visualizar outras entregas." />
      ) : (
        <div className="space-y-3">
          {paged.map((r) => {
            const a = r.activity;
            const accent = toneFor(a.classId);
            return (
              <article key={a.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent }}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{a.disciplineName ?? a.className} · {TYPE_LABEL[a.type]}</p>
                    {a.description ? <p className="mt-1 text-xs text-muted-foreground">{a.description}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusChip status={r.display} />
                    <span className={`text-[11px] ${r.display === "atrasada" ? "text-destructive" : "text-muted-foreground"}`}>Prazo {formatDateTime(a.dueAt)}</span>
                    {r.submission?.grade !== null && r.submission?.grade !== undefined ? (
                      <Chip tone={r.submission.grade >= 7 ? TONE.ok : r.submission.grade >= 5 ? TONE.warn : TONE.danger}>Nota {fmtNumero(r.submission.grade, 1)} / {a.maxGrade}</Chip>
                    ) : null}
                  </div>
                </div>

                {r.submission?.feedback ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border bg-background/40 p-3">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground"><strong className="text-foreground">Feedback do professor:</strong> {r.submission.feedback}</p>
                  </div>
                ) : null}

                <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                  <Btn onClick={() => setOpen(r)}><FileText className="h-4 w-4" /> Detalhes</Btn>
                  {r.display !== "corrigida" ? (
                    <Btn variant="solid" onClick={() => setOpen(r)}><Upload className="h-4 w-4" /> {r.submission ? "Reenviar" : "Enviar entrega"}</Btn>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onPage={setPage} total={filtered.length} />

      {open ? <ActivityModal row={open} onClose={() => setOpen(null)} onSubmitted={() => { setOpen(null); reload(); }} /> : null}
    </>
  );
}

function ActivityModal({ row, onClose, onSubmitted }: { row: Row; onClose: () => void; onSubmitted: () => void }) {
  const { activity, submission } = row;
  const [text, setText] = useState(submission?.text ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = row.display === "entregue" || row.display === "corrigida";

  async function send() {
    setSending(true);
    setError(null);
    try {
      const entrega = await learnService.submit(activity.id, text.trim() || undefined);
      for (const file of files) {
        await learnService.uploadAttachment(entrega.id, file);
      }
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar a entrega");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{activity.disciplineName ?? activity.className} · {TYPE_LABEL[activity.type]}</p>
            <h2 className="text-base font-semibold">{activity.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Prazo {formatDateTime(activity.dueAt)} · vale {activity.maxGrade} pontos</p>
          </div>
          <button onClick={onClose} className="rounded-lg border p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          {activity.description ? <p className="text-sm text-muted-foreground">{activity.description}</p> : null}

          {submitted && submission ? (
            <div className="rounded-xl border bg-background/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" style={{ color: TONE.ok }} /> Entrega registrada</p>
              {submission.text ? <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{submission.text}</p> : null}
              {submission.attachments.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {submission.attachments.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-xs text-muted-foreground"><Paperclip className="h-3.5 w-3.5" /> {f.name}</li>
                  ))}
                </ul>
              ) : null}
              {submission.feedback ? <p className="mt-2 text-xs text-muted-foreground"><strong className="text-foreground">Feedback:</strong> {submission.feedback}</p> : <p className="mt-2 text-xs text-muted-foreground">Aguardando correção do professor.</p>}
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Sua resposta</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  placeholder="Escreva sua resposta…"
                  className="w-full rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">Arquivos (opcional)</label>
                <div className="rounded-xl border border-dashed p-4 text-center">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent/50">
                    <Paperclip className="h-3.5 w-3.5" /> Anexar arquivo
                    <input type="file" multiple className="hidden" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])} />
                  </label>
                </div>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2 text-xs">
                        <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> {f.name}</span>
                        <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error ? <p className="text-xs text-destructive">{error}</p> : null}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Btn onClick={onClose}>Cancelar</Btn>
                <Btn variant="solid" onClick={send} disabled={sending}><CheckCircle2 className="h-4 w-4" /> {sending ? "Enviando…" : "Enviar entrega"}</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
