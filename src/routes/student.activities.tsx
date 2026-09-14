import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, FilterInput, Select, Chip, TONE, EmptyState, Btn, Pagination, ProgressBar } from "@/components/rooster/student/ui";
import { ACTIVITIES, DISCIPLINES, disciplineById, formatDate, today } from "@/components/rooster/student/mock-data";
import type { StudentActivity } from "@/components/rooster/student/mock-data";
import { Search, ClipboardList, Upload, FileText, PlayCircle, ListChecks, PenLine, X, CheckCircle2, MessageSquare, Paperclip } from "lucide-react";

export const Route = createFileRoute("/student/activities")({ component: StudentActivities });

const KIND_ICON = { arquivo: Upload, discursiva: PenLine, quiz: ListChecks, video: PlayCircle } as const;
const KIND_LABEL = { arquivo: "Envio de arquivo", discursiva: "Discursiva", quiz: "Questionário", video: "Videoaula" } as const;

const PER_PAGE = 6;

function StudentActivities() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todas");
  const [disc, setDisc] = useState("todas");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<StudentActivity | null>(null);
  const [done, setDone] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return ACTIVITIES.filter((a) =>
      (!n || `${a.title} ${a.teacher}`.toLowerCase().includes(n)) &&
      (status === "todas" || (done.includes(a.id) ? "entregue" : a.status) === status) &&
      (disc === "todas" || a.disciplineId === disc),
    ).sort((a, b) => a.due.localeCompare(b.due));
  }, [q, status, disc, done]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    pendentes: ACTIVITIES.filter((a) => ["pendente", "em-andamento", "atrasada"].includes(a.status) && !done.includes(a.id)).length,
    entregues: ACTIVITIES.filter((a) => a.status === "entregue").length + done.length,
    corrigidas: ACTIVITIES.filter((a) => a.status === "corrigida").length,
  };
  const graded = ACTIVITIES.filter((a) => a.grade !== null);
  const avg = graded.reduce((s, a) => s + (a.grade as number), 0) / (graded.length || 1);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Learn"
        title="Atividades e avaliações"
        description="Envie arquivos, responda questões discursivas e questionários, assista videoaulas e consulte feedbacks."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Pendentes</p><p className="mt-1 text-2xl font-semibold">{counts.pendentes}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Entregues</p><p className="mt-1 text-2xl font-semibold">{counts.entregues}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Corrigidas</p><p className="mt-1 text-2xl font-semibold">{counts.corrigidas}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Média das entregas</p><p className="mt-1 text-2xl font-semibold">{avg.toFixed(1)}</p></div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar atividade ou professor" icon={Search} />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { value: "todas", label: "Todos os status" },
          { value: "pendente", label: "Pendentes" },
          { value: "em-andamento", label: "Em andamento" },
          { value: "atrasada", label: "Atrasadas" },
          { value: "entregue", label: "Entregues" },
          { value: "corrigida", label: "Corrigidas" },
        ]} />
        <Select value={disc} onChange={(v) => { setDisc(v); setPage(1); }} options={[{ value: "todas", label: "Todas as disciplinas" }, ...DISCIPLINES.map((d) => ({ value: d.id, label: d.name }))]} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma atividade encontrada" description="Ajuste os filtros para visualizar outras entregas." />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const d = disciplineById(a.disciplineId);
            const Icon = KIND_ICON[a.kind];
            const st = done.includes(a.id) ? "entregue" : a.status;
            const late = a.due < today && ["pendente", "em-andamento"].includes(st);
            return (
              <article key={a.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${d?.accent} 14%, transparent)`, color: d?.accent }}>
                    <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{d?.name} · {a.teacher} · {KIND_LABEL[a.kind]}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusChip status={st} />
                    <span className={`text-[11px] ${late ? "text-destructive" : "text-muted-foreground"}`}>Prazo {formatDate(a.due)}</span>
                    {a.grade !== null ? <Chip tone={a.grade >= 7 ? TONE.ok : a.grade >= 5 ? TONE.warn : TONE.danger}>Nota {a.grade.toFixed(1)} / {a.max}</Chip> : null}
                  </div>
                </div>

                {a.feedback ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border bg-background/40 p-3">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground"><strong className="text-foreground">Feedback do professor:</strong> {a.feedback}</p>
                  </div>
                ) : null}

                <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                  <Btn onClick={() => setOpen(a)}><FileText className="h-4 w-4" /> Detalhes</Btn>
                  {st !== "corrigida" && st !== "entregue" ? (
                    <Btn variant="solid" onClick={() => setOpen(a)}><Upload className="h-4 w-4" /> Realizar entrega</Btn>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onPage={setPage} total={filtered.length} />

      {open ? <ActivityModal activity={open} onClose={() => setOpen(null)} onSubmit={() => { setDone((p) => [...p, open.id]); setOpen(null); }} /> : null}
    </>
  );
}

function ActivityModal({ activity, onClose, onSubmit }: { activity: StudentActivity; onClose: () => void; onSubmit: () => void }) {
  const d = disciplineById(activity.disciplineId);
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [files, setFiles] = useState<string[]>([]);
  const [watched, setWatched] = useState(false);
  const submitted = activity.status === "entregue" || activity.status === "corrigida";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{d?.name} · {activity.teacher}</p>
            <h2 className="text-base font-semibold">{activity.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Prazo {formatDate(activity.due)} · {KIND_LABEL[activity.kind]} · vale {activity.max} pontos</p>
          </div>
          <button onClick={onClose} className="rounded-lg border p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">{activity.description}</p>

          {submitted ? (
            <div className="rounded-xl border bg-background/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" style={{ color: TONE.ok }} /> Entrega registrada</p>
              {activity.feedback ? <p className="mt-2 text-xs text-muted-foreground">{activity.feedback}</p> : <p className="mt-2 text-xs text-muted-foreground">Aguardando correção do professor.</p>}
            </div>
          ) : (
            <>
              {activity.kind === "arquivo" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Arquivos</label>
                  <div className="rounded-xl border border-dashed p-6 text-center">
                    <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">Arraste arquivos ou selecione do dispositivo (PDF, PNG, DOCX até 20MB)</p>
                    <Btn className="mx-auto mt-3" onClick={() => setFiles((f) => [...f, `entrega-${f.length + 1}.pdf`])}><Paperclip className="h-4 w-4" /> Anexar arquivo</Btn>
                  </div>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {files.map((f) => (
                        <li key={f} className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2 text-xs">
                          <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> {f}</span>
                          <button onClick={() => setFiles((p) => p.filter((x) => x !== f))} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activity.kind === "discursiva" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Sua resposta</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    placeholder="Escreva sua resposta…"
                    className="w-full rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">{text.trim() ? text.trim().split(/\s+/).length : 0} palavras</p>
                </div>
              )}

              {activity.kind === "quiz" && (
                <div className="space-y-4">
                  {activity.questions?.map((qq, i) => (
                    <div key={qq.id} className="rounded-xl border bg-background/40 p-4">
                      <p className="text-sm font-medium">{i + 1}. {qq.text}</p>
                      <div className="mt-2 space-y-1.5">
                        {qq.options.map((o, oi) => (
                          <label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs hover:bg-accent">
                            <input type="radio" name={qq.id} checked={answers[qq.id] === oi} onChange={() => setAnswers({ ...answers, [qq.id]: oi })} />
                            {o}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <ProgressBar value={(Object.keys(answers).length / (activity.questions?.length || 1)) * 100} />
                </div>
              )}

              {activity.kind === "video" && (
                <div>
                  <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted/40">
                    <PlayCircle className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{activity.videoTitle}</p>
                  <label className="mt-3 flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={watched} onChange={(e) => setWatched(e.target.checked)} /> Confirmo que assisti ao conteúdo completo
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Btn onClick={onClose}>Cancelar</Btn>
                <Btn variant="solid" onClick={onSubmit}><CheckCircle2 className="h-4 w-4" /> Enviar entrega</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
