import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar, SectionCard, EmptyState, Btn, Modal, FilterInput, LoadingCards } from "@/components/shared";
import {
  learnService, TYPE_LABEL, formatDate, relativeDue,
  type Activity, type Submission,
} from "@/services/mock-api/learn.service";
import { TypeBadge, SubmissionBadge, ProgressBar } from "@/components/rooster/learn/badges";
import { useRole } from "@/components/rooster/role-context";
import {
  ClipboardList, CheckCircle2, TrendingUp, Clock, Search, BookOpen, Send, AlertTriangle, ArrowLeft,
  Eye, X, MessageSquare, Paperclip, FileText, UserX,
} from "lucide-react";
import { fmtNumero } from "@/lib/formatacao";

export const Route = createFileRoute("/learn/student")({
  head: () => ({
    meta: [
      { title: "Minhas atividades — Rooster Learn" },
      { name: "description", content: "Área do aluno: veja as atividades disponíveis para fazer, envie respostas e acompanhe as notas de cada atividade já realizada." },
    ],
  }),
  component: StudentActivitiesPage,
});

type Tab = "disponiveis" | "realizadas";

type Subject = {
  classId: string; name: string; list: Activity[]; done: Activity[]; available: Activity[]; avg: number; pct: number;
};

function StudentActivitiesPage() {
  const { role } = useRole();
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [noLink, setNoLink] = useState(false);
  const [openClass, setOpenClass] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("disponiveis");
  const [q, setQ] = useState("");
  const [answering, setAnswering] = useState<Activity | null>(null);
  const [reviewing, setReviewing] = useState<Activity | null>(null);

  function reload() {
    learnService.getMyActivities().then(setActivities).catch(() => setNoLink(true));
    learnService.getMySubmissions().then(setSubmissions).catch(() => {});
  }
  useEffect(reload, []);

  const subOf = (activityId: string) => submissions.find((s) => s.activityId === activityId) ?? null;
  const isDone = (a: Activity) => ["enviada", "corrigida", "reenvio", "atrasada"].includes(subOf(a.id)?.status ?? "");

  const bySubject: Subject[] = useMemo(() => {
    if (!activities) return [];
    const byClass = new Map<string, Activity[]>();
    activities.forEach((a) => {
      const list = byClass.get(a.classId) ?? [];
      list.push(a);
      byClass.set(a.classId, list);
    });
    return Array.from(byClass.entries()).map(([classId, list]) => {
      const done = list.filter(isDone);
      const available = list.filter((a) => !done.includes(a));
      const graded = done.map((a) => subOf(a.id)).filter((s): s is Submission => !!s && s.grade !== null);
      const avg = graded.length ? graded.reduce((acc, s) => acc + (s.grade as number), 0) / graded.length : 0;
      const pct = list.length ? (done.length / list.length) * 100 : 0;
      const name = list[0]?.disciplineName ?? list[0]?.className ?? "Turma";
      return { classId, name, list, done, available, avg, pct };
    });
  }, [activities, submissions]);

  const current = bySubject.find((s) => s.classId === openClass) ?? null;
  const totals = {
    available: bySubject.reduce((n, s) => n + s.available.length, 0),
    done: bySubject.reduce((n, s) => n + s.done.length, 0),
  };

  const match = (a: Activity) => !q || a.title.toLowerCase().includes(q.toLowerCase());
  const list = current ? (tab === "disponiveis" ? current.available : current.done).filter(match) : [];

  if (noLink) {
    return (
      <>
        <PageHeader eyebrow="Rooster Learn" title="Minhas atividades" description="Atividades publicadas nas suas turmas." />
        <EmptyState icon={UserX} title="Sem vínculo de aluno" description="O usuário autenticado não possui um registro de aluno associado." />
      </>
    );
  }

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

      {activities === null ? (
        <LoadingCards />
      ) : !current ? (
        <SectionCard
          title="Minhas matérias"
          description={`${bySubject.length} matérias · ${totals.available} atividades a fazer · ${totals.done} realizadas`}
        >
          {bySubject.length === 0 ? (
            <EmptyState icon={BookOpen} title="Nenhuma atividade publicada" description="Assim que o professor publicar uma atividade nas suas turmas, ela aparece aqui." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {bySubject.map((s) => (
                <button
                  key={s.classId}
                  type="button"
                  onClick={() => { setOpenClass(s.classId); setTab("disponiveis"); setQ(""); }}
                  className="group rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-foreground/25 hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent"><BookOpen className="h-4 w-4" /></span>
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
                    <span className="inline-flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> média {s.avg ? fmtNumero(s.avg, 1) : "—"}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">{current.name}</p>
            <Btn onClick={() => setOpenClass(null)}><ArrowLeft className="h-3.5 w-3.5" /> Voltar para matérias</Btn>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Conclusão", value: `${Math.round(current.pct)}%`, icon: CheckCircle2, tone: "oklch(0.62 0.18 155)" },
              { label: "A fazer", value: String(current.available.length), icon: ClipboardList, tone: "oklch(0.72 0.14 90)" },
              { label: "Realizadas", value: String(current.done.length), icon: CheckCircle2, tone: "oklch(0.55 0.19 265)" },
              { label: "Média das notas", value: current.avg ? fmtNumero(current.avg, 1) : "—", icon: TrendingUp, tone: "oklch(0.6 0.2 305)" },
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
              <EmptyState icon={tab === "disponiveis" ? ClipboardList : CheckCircle2} title={tab === "disponiveis" ? "Nenhuma atividade pendente" : "Nenhuma atividade realizada"} />
            ) : (
              <div className="space-y-2">
                {list.map((a) => {
                  const sub = subOf(a.id);
                  const late = a.dueAt ? new Date(a.dueAt) < new Date() : false;
                  return (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="min-w-[240px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{a.title}</p>
                          <TypeBadge type={a.type} />
                          {tab === "realizadas" && sub && <SubmissionBadge status={sub.status} />}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {TYPE_LABEL[a.type]} · entrega {formatDate(a.dueAt)}
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
                              <span className="text-base font-semibold tabular-nums text-foreground">{sub?.grade !== null && sub?.grade !== undefined ? fmtNumero(sub.grade, 1) : "—"}</span>
                            </div>
                            <div className="mt-1.5"><ProgressBar value={sub?.grade ? (sub.grade / a.maxGrade) * 100 : 0} /></div>
                            <p className="mt-1 text-[11px] text-muted-foreground">{sub?.grade !== null && sub?.grade !== undefined ? `de ${a.maxGrade}` : "aguardando correção"}</p>
                          </div>
                          <Btn onClick={() => setReviewing(a)}><Eye className="h-3.5 w-3.5" /> Ver entrega</Btn>
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
          existing={subOf(answering.id)}
          onClose={() => setAnswering(null)}
          onSubmit={() => { setAnswering(null); setTab("realizadas"); reload(); }}
        />
      )}

      {reviewing && (
        <ReviewModal activity={reviewing} submission={subOf(reviewing.id)} onClose={() => setReviewing(null)} />
      )}
    </>
  );
}

function AnswerModal({
  activity, existing, onClose, onSubmit,
}: { activity: Activity; existing: Submission | null; onClose: () => void; onSubmit: () => void }) {
  const [text, setText] = useState(existing?.text ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const entrega = await learnService.submit(activity.id, text.trim() || undefined);
      for (const file of files) await learnService.uploadAttachment(entrega.id, file);
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar a entrega");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={activity.title}
      description={`${TYPE_LABEL[activity.type]} · entrega até ${formatDate(activity.dueAt)}`}
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="solid" onClick={submit} disabled={sending}><Send className="h-3.5 w-3.5" /> {sending ? "Enviando…" : "Enviar resposta"}</Btn></>}
    >
      <div className="space-y-4">
        {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
        <div>
          <label className="mb-1.5 block text-xs font-medium">Sua resposta</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Digite sua resposta…"
            className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Arquivos (opcional)</label>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent/50">
            <Paperclip className="h-3.5 w-3.5" /> Anexar arquivo
            <input type="file" multiple className="hidden" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])} />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </Modal>
  );
}

function ReviewModal({ activity, submission, onClose }: { activity: Activity; submission: Submission | null; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={activity.title}
      description={`Sua entrega · ${submission?.grade !== null && submission?.grade !== undefined ? `nota ${fmtNumero(submission.grade, 1)} de ${activity.maxGrade}` : "aguardando correção"}`}
      footer={<Btn onClick={onClose}>Fechar</Btn>}
    >
      <div className="space-y-4">
        {submission?.feedback && (
          <div className="flex items-start gap-2 rounded-xl border bg-card/60 p-3">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground"><strong className="text-foreground">Retorno do professor:</strong> {submission.feedback}</p>
          </div>
        )}
        <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">
          {submission?.text || <span className="text-muted-foreground">Sem resposta em texto.</span>}
        </div>
        {submission && submission.attachments.length > 0 && (
          <ul className="space-y-1.5">
            {submission.attachments.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {f.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
