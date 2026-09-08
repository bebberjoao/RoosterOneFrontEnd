import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar, SectionCard, EmptyState, Btn, Modal, FilterInput } from "@/components/shared";
import {
  SUBMISSIONS, discipline, klass as findKlass, teacher as findTeacher,
  formatDate, relativeDue,
} from "@/components/rooster/learn/mock-data";
import { TypeBadge, SubmissionBadge, ProgressBar } from "@/components/rooster/learn/badges";
import {
  useLearnActivities, learnResponses, useResponsesVersion, resolveStudentResponse, questionScore,
  type FormActivity, type FormQuestion,
} from "@/components/rooster/learn/forms-store";
import { useRole } from "@/components/rooster/role-context";
import {
  ClipboardList, CheckCircle2, TrendingUp, Clock, Search, BookOpen, Send, AlertTriangle, ArrowLeft,
  Eye, ImagePlus, X, MessageSquare, Paperclip, FileText,
} from "lucide-react";

export const Route = createFileRoute("/learn/student")({
  head: () => ({
    meta: [
      { title: "Minhas atividades — Rooster Learn" },
      { name: "description", content: "Área do aluno: veja as atividades disponíveis para fazer, envie respostas e acompanhe as notas de cada atividade já realizada." },
      { property: "og:title", content: "Minhas atividades — Rooster Learn" },
      { property: "og:description", content: "Atividades disponíveis, entregas e notas do aluno no Rooster Learn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentActivitiesPage,
});

/** Aluno logado no mock (Ana Prado, Engenharia · 3A). */
/** Turmas em que o aluno logado está matriculado (mock). */
const STUDENT_KLASS_IDS = ["k-eng3a", "k-let2a", "k-com1a", "k-dir4a"];
const studentIdIn = (klassId: string) => `${klassId}-s0`;

type Tab = "disponiveis" | "realizadas";

function StudentActivitiesPage() {
  const { role } = useRole();
  const activities = useLearnActivities();
  const [openKlass, setOpenKlass] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("disponiveis");
  const [q, setQ] = useState("");
  const [answering, setAnswering] = useState<FormActivity | null>(null);
  const [reviewing, setReviewing] = useState<{ activity: FormActivity; feedback: string | null; grade: number | null } | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  const subOf = (activityId: string, klassId: string) =>
    SUBMISSIONS.find((s) => s.activityId === activityId && s.studentId === studentIdIn(klassId));

  const isDone = (a: FormActivity) =>
    sent.includes(a.id) || ["enviada", "corrigida"].includes(subOf(a.id, a.klassId)?.status ?? "");

  /** Agrupamento por matéria (turma). */
  const bySubject = useMemo(() => {
    return STUDENT_KLASS_IDS.map((kid) => {
      const k = findKlass(kid);
      const d = discipline(k?.disciplineId ?? "");
      const list = activities.filter((a) => a.klassId === kid && a.status !== "rascunho");
      const done = list.filter(isDone);
      const available = list.filter((a) => !done.includes(a));
      const graded = done
        .map((a) => ({ a, s: subOf(a.id, kid) }))
        .filter((x) => x.s && x.s.grade !== null);
      const avg = graded.length ? graded.reduce((acc, x) => acc + (x.s!.grade ?? 0), 0) / graded.length : 0;
      const pct = list.length ? (done.length / list.length) * 100 : 0;
      return { klassId: kid, klass: k, disc: d, list, done, available, avg, pct };
    });
  }, [activities, sent]);

  const current = bySubject.find((s) => s.klassId === openKlass) ?? null;

  const totals = {
    available: bySubject.reduce((n, s) => n + s.available.length, 0),
    done: bySubject.reduce((n, s) => n + s.done.length, 0),
  };

  const match = (a: FormActivity) => !q || a.title.toLowerCase().includes(q.toLowerCase());
  const list = current ? (tab === "disponiveis" ? current.available : current.done).filter(match) : [];

  return (
    <>
      <PageHeader
        eyebrow="Rooster Learn"
        title="Minhas atividades"
        description="Selecione uma matéria para ver o desempenho, as atividades a fazer e as já realizadas."
      />

      {role !== "aluno" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed bg-card/40 px-4 py-2.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" /> Visualização da área do aluno (perfil atual não é Aluno).
        </div>
      )}

      {!current ? (
        <SectionCard
          title="Minhas matérias"
          description={`${bySubject.length} matérias · ${totals.available} atividades a fazer · ${totals.done} realizadas`}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bySubject.map((s) => (
              <button
                key={s.klassId}
                type="button"
                onClick={() => { setOpenKlass(s.klassId); setTab("disponiveis"); setQ(""); }}
                className="group rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-foreground/25 hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{s.disc?.name ?? s.klass?.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.klass?.name}</p>
                  </div>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-md"
                    style={{ backgroundColor: `color-mix(in oklab, ${s.disc?.color ?? "oklch(0.6 0.1 260)"} 14%, transparent)`, color: s.disc?.color }}
                  >
                    <BookOpen className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
                    <span>{s.done.length}/{s.list.length} concluídas</span>
                    <span className="tabular-nums text-foreground">{Math.round(s.pct)}%</span>
                  </div>
                  <div className="mt-1.5"><ProgressBar value={s.pct} /></div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> {s.available.length} a fazer</span>
                  <span className="inline-flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> média {s.avg ? s.avg.toFixed(1) : "—"}</span>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{current.disc?.name}</p>
              <p className="text-xs text-muted-foreground">{current.klass?.name}</p>
            </div>
            <Btn onClick={() => setOpenKlass(null)}><ArrowLeft className="h-3.5 w-3.5" /> Voltar para matérias</Btn>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Conclusão", value: `${Math.round(current.pct)}%`, icon: CheckCircle2, tone: "oklch(0.62 0.18 155)" },
              { label: "A fazer", value: String(current.available.length), icon: ClipboardList, tone: "oklch(0.72 0.14 90)" },
              { label: "Realizadas", value: String(current.done.length), icon: CheckCircle2, tone: "oklch(0.55 0.19 265)" },
              { label: "Média das notas", value: current.avg ? current.avg.toFixed(1) : "—", icon: TrendingUp, tone: "oklch(0.6 0.2 305)" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in oklab, ${s.tone} 14%, transparent)`, color: s.tone }}>
                    <s.icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <TabBar
              tabs={[
                { value: "disponiveis", label: `A fazer (${current.available.length})` },
                { value: "realizadas", label: `Realizadas (${current.done.length})` },
              ]}
              value={tab}
              onChange={(v) => setTab(v as Tab)}
            />
            <FilterInput value={q} onChange={setQ} placeholder="Buscar atividade..." icon={Search} />
          </div>

          <SectionCard
            title={tab === "disponiveis" ? "Atividades para fazer" : "Atividades realizadas"}
            description={tab === "disponiveis" ? "Clique em responder para abrir a atividade." : "Notas e feedback do professor por atividade."}
          >
            {list.length === 0 ? (
              <EmptyState
                icon={tab === "disponiveis" ? ClipboardList : CheckCircle2}
                title={tab === "disponiveis" ? "Nenhuma atividade pendente" : "Nenhuma atividade realizada"}
              />
            ) : (
              <div className="space-y-2">
                {list.map((a) => {
                  const sub = subOf(a.id, current.klassId);
                  const isSent = sent.includes(a.id);
                  const grade = isSent ? null : sub?.grade ?? null;
                  const late = new Date(a.dueAt) < new Date();
                  return (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="min-w-[240px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{a.title}</p>
                          <TypeBadge type={a.type} />
                          {tab === "realizadas" && (
                            <SubmissionBadge status={isSent ? "enviada" : (sub?.status ?? "enviada")} />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {findTeacher(a.teacherId)?.name} · {a.questions.length} perguntas · entrega {formatDate(a.dueAt)}
                          {tab === "disponiveis" && (
                            <span className={late ? "text-destructive" : ""}> · {late ? "atrasada" : `prazo ${relativeDue(a.dueAt)}`}</span>
                          )}
                        </p>
                        {tab === "realizadas" && sub?.feedback && (
                          <p className="mt-1 text-xs text-muted-foreground">Feedback: {sub.feedback}</p>
                        )}
                      </div>

                      {tab === "realizadas" ? (
                        <div className="flex items-center gap-3">
                          <div className="w-40">
                            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                              <span>Nota</span>
                              <span className="text-base font-semibold tabular-nums text-foreground">
                                {grade !== null ? grade.toFixed(1) : "—"}
                              </span>
                            </div>
                            <div className="mt-1.5">
                              <ProgressBar value={grade !== null ? (grade / a.maxGrade) * 100 : 0} />
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {grade !== null ? `de ${a.maxGrade}` : "aguardando correção"}
                            </p>
                          </div>
                          <Btn onClick={() => setReviewing({ activity: a, feedback: sub?.feedback ?? null, grade })}>
                            <Eye className="h-3.5 w-3.5" /> Ver respostas
                          </Btn>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {a.maxGrade} pts</span>
                          <Btn variant="solid" onClick={() => setAnswering(a)}><BookOpen className="h-3.5 w-3.5" /> Responder</Btn>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </>
      )}

      {answering && (
        <AnswerModal
          activity={answering}
          studentId={studentIdIn(answering.klassId)}
          onClose={() => setAnswering(null)}
          onSubmit={() => { setSent((s) => [...s, answering.id]); setAnswering(null); setTab("realizadas"); }}
        />
      )}

      {reviewing && (
        <ReviewModal
          activity={reviewing.activity}
          studentId={studentIdIn(reviewing.activity.klassId)}
          feedback={reviewing.feedback}
          grade={reviewing.grade}
          onClose={() => setReviewing(null)}
        />
      )}
    </>
  );
}


function AnswerModal({
  activity, studentId, onClose, onSubmit,
}: { activity: FormActivity; studentId: string; onClose: () => void; onSubmit: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [images, setImages] = useState<Record<string, string[]>>({});
  const [files, setFiles] = useState<Record<string, { name: string; url: string }[]>>({});

  const set = (id: string, v: string | string[]) => setAnswers((a) => ({ ...a, [id]: v }));
  const addImages = (id: string, files: FileList | null) => {
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setImages((m) => ({ ...m, [id]: [...(m[id] ?? []), ...urls] }));
  };
  const addFiles = (id: string, list: FileList | null) => {
    if (!list?.length) return;
    const added = Array.from(list).map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setFiles((m) => ({ ...m, [id]: [...(m[id] ?? []), ...added] }));
  };
  const removeFile = (id: string, url: string) =>
    setFiles((m) => ({ ...m, [id]: (m[id] ?? []).filter((f) => f.url !== url) }));
  const removeImage = (id: string, url: string) =>
    setImages((m) => ({ ...m, [id]: (m[id] ?? []).filter((u) => u !== url) }));

  const submit = () => {
    const withNames = { ...answers };
    Object.entries(files).forEach(([qid, list]) => {
      if (list.length) withNames[qid] = list.map((f) => f.name).join(", ");
    });
    learnResponses.save(activity.id, studentId, { answers: withNames, images, files });
    onSubmit();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={activity.title}
      description={`${activity.questions.length} perguntas · entrega até ${formatDate(activity.dueAt)}`}
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="solid" onClick={submit}><Send className="h-3.5 w-3.5" /> Enviar respostas</Btn></>}
    >
      <div className="space-y-4">
        {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
        {activity.questions.length === 0 && <EmptyState icon={ClipboardList} title="Atividade sem perguntas" />}
        {activity.questions.map((q, i) => (
          <QuestionView
            key={q.id}
            q={q}
            index={i}
            value={answers[q.id]}
            onChange={(v) => set(q.id, v)}
            images={images[q.id] ?? []}
            onAddImages={(files) => addImages(q.id, files)}
            onRemoveImage={(url) => removeImage(q.id, url)}
            files={files[q.id] ?? []}
            onAddFiles={(list) => addFiles(q.id, list)}
            onRemoveFile={(url) => removeFile(q.id, url)}
          />
        ))}
      </div>
    </Modal>
  );
}

function QuestionView({
  q, index, value, onChange, images, onAddImages, onRemoveImage, files, onAddFiles, onRemoveFile,
}: {
  q: FormQuestion; index: number; value?: string | string[]; onChange: (v: string | string[]) => void;
  images: string[]; onAddImages: (files: FileList | null) => void; onRemoveImage: (url: string) => void;
  files: { name: string; url: string }[]; onAddFiles: (list: FileList | null) => void; onRemoveFile: (url: string) => void;
}) {
  const multi = q.type === "multipla-varias";
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm font-medium">
        {index + 1}. {q.statement}
        {q.required && <span className="ml-1 text-destructive">*</span>}
      </p>
      {q.text && <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted-foreground">{q.text}</p>}
      {q.imageUrl && <img src={q.imageUrl} alt={`Imagem da pergunta ${index + 1}`} className="mt-2 max-h-56 rounded-lg border object-contain" />}

      <div className="mt-3 space-y-2">
        {q.type === "arquivo" ? (
          <div className="rounded-lg border border-dashed p-3">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50">
              <Paperclip className="h-3.5 w-3.5" /> Anexar documento
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*"
                className="hidden"
                onChange={(e) => { onAddFiles(e.target.files); e.target.value = ""; }}
              />
            </label>
            {files.length === 0 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">Nenhum documento anexado.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {files.map((f) => (
                  <li key={f.url} className="flex items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <button type="button" onClick={() => onRemoveFile(f.url)} aria-label="Remover documento" className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : q.type === "discursiva" ? (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite sua resposta"
            className="min-h-24 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        ) : (
          q.options.map((o) => {
            const on = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onChange(multi ? (on ? selected.filter((x) => x !== o.id) : [...selected, o.id]) : o.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${on ? "border-foreground/40 bg-accent" : "hover:bg-accent/50"}`}
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] ${multi ? "rounded-md" : "rounded-full"} ${on ? "border-transparent bg-foreground text-background" : "text-transparent"}`}>✓</span>
                {o.label || <span className="text-muted-foreground">Alternativa sem texto</span>}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50">
          <ImagePlus className="h-3.5 w-3.5" /> Anexar imagem
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onAddImages(e.target.files); e.target.value = ""; }} />
        </label>
        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="Anexo da resposta" className="h-20 w-20 rounded-lg border object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveImage(url)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-foreground"
                  aria-label="Remover imagem"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">{q.points} ponto(s)</p>
    </div>
  );
}

/* ---------- Revisão: mesma atividade em modo leitura, com correção ---------- */

function ReviewModal({
  activity, studentId, feedback, grade, onClose,
}: { activity: FormActivity; studentId: string; feedback: string | null; grade: number | null; onClose: () => void }) {
  useResponsesVersion();
  const response = resolveStudentResponse(activity, studentId);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={activity.title}
      description={`Suas respostas · ${grade !== null ? `nota ${grade.toFixed(1)} de ${activity.maxGrade}` : "aguardando correção"}`}
      footer={<Btn onClick={onClose}>Fechar</Btn>}
    >
      <div className="space-y-4">
        {feedback && (
          <div className="flex items-start gap-2 rounded-xl border bg-card/60 p-3">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Retorno do professor:</strong> {feedback}
            </p>
          </div>
        )}
        {activity.questions.length === 0 && <EmptyState icon={ClipboardList} title="Atividade sem perguntas" />}
        {activity.questions.map((q, i) => (
          <ReviewQuestion key={q.id} q={q} index={i} activity={activity} studentId={studentId} response={response} />
        ))}
      </div>
    </Modal>
  );
}

function ReviewQuestion({
  q, index, activity, studentId, response,
}: {
  q: FormQuestion; index: number; activity: FormActivity; studentId: string;
  response: ReturnType<typeof resolveStudentResponse>;
}) {
  const value = response.answers[q.id];
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const images = response.images[q.id] ?? [];
  const sentFiles = response.files?.[q.id] ?? [];
  const score = questionScore(activity, q, response, studentId);

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{index + 1}. {q.statement}</p>
        <span className="shrink-0 rounded-md border px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
          {score === null ? "aguardando" : `${score} / ${q.points}`}
        </span>
      </div>
      {q.text && <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted-foreground">{q.text}</p>}
      {q.imageUrl && <img src={q.imageUrl} alt={`Imagem da pergunta ${index + 1}`} className="mt-2 max-h-56 rounded-lg border object-contain" />}

      <div className="mt-3 space-y-2">
        {q.type === "arquivo" ? (
          sentFiles.length > 0 ? (
            <ul className="space-y-1.5">
              {sentFiles.map((f) => (
                <li key={f.url} className="flex items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">{f.name}</a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border bg-card/60 px-3 py-2 text-sm">
              {typeof value === "string" && value.trim() ? value : <span className="text-muted-foreground">Nenhum documento enviado</span>}
            </div>
          )
        ) : q.type === "discursiva" ? (
          <div className="whitespace-pre-wrap rounded-lg border bg-card/60 px-3 py-2 text-sm">
            {typeof value === "string" && value.trim() ? value : <span className="text-muted-foreground">Sem resposta enviada</span>}
          </div>
        ) : (
          q.options.map((o) => {
            const on = selected.includes(o.id);
            const state = o.correct ? "correct" : on ? "wrong" : "idle";
            return (
              <div
                key={o.id}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                  state === "correct" ? "border-[oklch(0.62_0.18_155)]/50 bg-[oklch(0.62_0.18_155)]/10"
                    : state === "wrong" ? "border-destructive/50 bg-destructive/10" : ""
                }`}
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${on ? "border-transparent bg-foreground text-background" : "text-transparent"}`}>✓</span>
                <span className="flex-1">{o.label || <span className="text-muted-foreground">Alternativa sem texto</span>}</span>
                {on && <span className="text-[11px] text-muted-foreground">sua resposta</span>}
                {o.correct && <span className="text-[11px] text-muted-foreground">correta</span>}
              </div>
            );
          })
        )}
      </div>

      {images.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] text-muted-foreground">Imagens enviadas</p>
          <div className="flex flex-wrap gap-2">
            {images.map((url) => (
              <img key={url} src={url} alt="Anexo da resposta" className="h-20 w-20 rounded-lg border object-cover" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
