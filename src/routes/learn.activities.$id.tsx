import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar, LoadingBlock } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  learnService, TYPE_LABEL, formatDate, fmtSize,
  type Activity, type ActivityType, type Attachment, type Question, type Submission,
} from "@/services/mock-api/learn.service";
import { QuestionsEditor, QuestionResult } from "@/components/rooster/learn/questions";
import { salvarArquivo } from "@/components/rooster/learn/questions-utils";
import { ActivityStatusBadge, SubmissionBadge } from "@/components/rooster/learn/badges";
import { useRole, learnCan } from "@/components/rooster/role-context";
import {
  ArrowLeft, Save, Send, ChevronRight, CheckCircle2, MessageSquare, FileText, History, Paperclip,
} from "lucide-react";
import { fmtNumero } from "@/lib/formatacao";

export const Route = createFileRoute("/learn/activities/$id")({
  component: ActivityDetail,
});

type Tab = "descricao" | "questoes" | "entregas" | "correcao" | "notas" | "feedback" | "historico";

function toDatetimeLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

function ActivityDetail() {
  const { id } = Route.useParams();
  const { role } = useRole();
  const [activity, setActivity] = useState<Activity | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("descricao");

  useEffect(() => {
    if (id === "new") { setActivity(null); return; }
    learnService.getById(id).then((a) => setActivity(a ?? null));
  }, [id]);

  if (id === "new") {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Para criar uma atividade, escolha primeiro a turma em "Turmas e atividades".</p>
        <Link to="/learn/classes" className="mt-3 inline-block text-sm font-medium text-foreground underline">Ir para Turmas e atividades</Link>
      </div>
    );
  }

  if (activity === undefined) {
    return <LoadingBlock className="py-4" />;
  }

  if (!activity) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Atividade não encontrada.</p>
        <Link to="/learn" className="mt-3 inline-block text-sm font-medium text-foreground underline">Voltar</Link>
      </div>
    );
  }

  const tabs = [
    { value: "descricao", label: "Descrição" },
    { value: "questoes", label: `Questões (${activity.questionsCount})` },
    { value: "entregas", label: "Entregas" },
    ...(learnCan(role, "gradeActivity") ? [{ value: "correcao", label: "Correção" }] : []),
    { value: "notas", label: "Notas" },
    { value: "feedback", label: "Feedback" },
    { value: "historico", label: "Histórico" },
  ];

  function reload() {
    learnService.getById(id).then((a) => setActivity(a ?? null));
  }

  return (
    <>
      <div className="mb-3">
        <Link to="/learn" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Atividades
        </Link>
      </div>

      <PageHeader
        eyebrow="Rooster Learn"
        title={activity.title}
        description={`${activity.code ?? "sem código"} · ${activity.disciplineName ?? ""} ${activity.className ?? ""}`}
        actions={
          <>
            <ActivityStatusBadge status={activity.status} />
            {(activity.status === "rascunho" || activity.status === "agendada") && learnCan(role, "createActivity") ? (
              <Button size="sm" className="gap-1.5" onClick={async () => {
                try {
                  await learnService.publish(activity.id);
                  reload();
                  toast.success("Atividade publicada com sucesso");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Falha ao publicar atividade");
                }
              }}>
                <Send className="h-4 w-4" /> Publicar
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mb-4">
        <TabBar tabs={tabs} value={tab} onChange={(v) => setTab(v as Tab)} />
      </div>

      {tab === "descricao" ? <DescricaoTab activity={activity} onSaved={reload} /> : null}
      {tab === "questoes" ? <QuestionsEditor activity={activity} canEdit={learnCan(role, "manageQuestions")} onChanged={reload} /> : null}
      {tab === "entregas" ? <EntregasTab activityId={activity.id} /> : null}
      {tab === "correcao" ? <CorrecaoTab activity={activity} /> : null}
      {tab === "notas" ? <NotasTab activityId={activity.id} maxGrade={activity.maxGrade} /> : null}
      {tab === "feedback" ? <FeedbackTab activityId={activity.id} /> : null}
      {tab === "historico" ? <HistoricoTab activity={activity} /> : null}
    </>
  );
}

const TYPE_OPTIONS = (Object.keys(TYPE_LABEL) as ActivityType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }));

function DescricaoTab({ activity, onSaved }: { activity: Activity; onSaved: () => void }) {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description);
  const [type, setType] = useState<ActivityType>(activity.type);
  const [weight, setWeight] = useState(String(activity.weight));
  const [maxGrade, setMaxGrade] = useState(String(activity.maxGrade));
  const [dueAt, setDueAt] = useState(toDatetimeLocal(activity.dueAt));
  const [opensAt, setOpensAt] = useState(toDatetimeLocal(activity.opensAt));
  const [timeLimitMin, setTimeLimitMin] = useState(activity.timeLimitMin ? String(activity.timeLimitMin) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await learnService.update(activity.id, {
        title: title.trim(), description: description.trim(), type,
        weight: Number(weight) || 0, maxGrade: Number(maxGrade) || 10,
        opensAt: opensAt ? new Date(opensAt).toISOString() : null,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        timeLimitMin: timeLimitMin ? Number(timeLimitMin) : null,
      });
      onSaved();
      toast.success("Atividade atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold">Informações básicas</h3>
      <div className="grid gap-4">
        <Field label="Nome da atividade"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Tipo">
            <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Peso"><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
          <Field label="Nota máxima"><Input type="number" value={maxGrade} onChange={(e) => setMaxGrade(e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Abertura"><Input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} /></Field>
          <Field label="Prazo final"><Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></Field>
          <Field label="Tempo máximo (min)"><Input type="number" value={timeLimitMin} onChange={(e) => setTimeLimitMin(e.target.value)} /></Field>
        </div>
        <Field label="Instruções gerais">
          <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o que os alunos devem fazer, materiais permitidos e observações gerais." />
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div>
          <Button size="sm" className="gap-1.5" onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar alterações"}</Button>
        </div>
      </div>
    </section>
  );
}

function EntregasTab({ activityId }: { activityId: string }) {
  const [rows, setRows] = useState<Submission[]>([]);
  useEffect(() => { learnService.getSubmissions(activityId).then(setRows); }, [activityId]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Aluno</th>
            <th className="px-3 py-2.5 text-left font-medium">Enviado em</th>
            <th className="px-3 py-2.5 text-left font-medium">Situação</th>
            <th className="px-3 py-2.5 text-left font-medium">Anexos</th>
            <th className="px-3 py-2.5 text-right font-medium">Nota</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-muted/30">
              <td className="px-4 py-2.5 font-medium">{s.studentName}</td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.submittedAt ? formatDate(s.submittedAt) : "Não enviou"}</td>
              <td className="px-3 py-2.5"><SubmissionBadge status={s.status} /></td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.attachments.length}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{s.grade !== null ? fmtNumero(s.grade, 1) : "—"}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma entrega ainda.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function CorrecaoTab({ activity }: { activity: Activity }) {
  const [rows, setRows] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  function reload() { learnService.getSubmissions(activity.id).then(setRows); }
  useEffect(reload, [activity.id]);
  useEffect(() => {
    if (activity.questionsCount > 0) learnService.getQuestions(activity.id).then(setQuestions).catch(() => setQuestions([]));
  }, [activity.id, activity.questionsCount]);

  const current = rows.find((s) => s.id === selected) ?? rows[0] ?? null;

  async function download(entregaId: string, a: Attachment) {
    try {
      salvarArquivo(await learnService.downloadAttachment(entregaId, a.id), a.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao baixar o arquivo");
    }
  }

  if (current && questions.length > 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <SubmissionList rows={rows} selected={selected} onSelect={setSelected} />
        <section className="rounded-xl border border-border/60 bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{current.studentName}</h3>
            <SubmissionBadge status={current.status} />
          </div>
          <QuestionGradeForm
            key={current.id}
            submission={current}
            questions={questions}
            maxGrade={activity.maxGrade}
            onDownload={(a) => download(current.id, a)}
            onSaved={reload}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <SubmissionList rows={rows} selected={selected} onSelect={setSelected} />

      <section className="rounded-xl border border-border/60 bg-card p-5">
        {current ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{current.studentName}</h3>
              <SubmissionBadge status={current.status} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 bg-background p-4 text-sm whitespace-pre-wrap">
                  {current.text || <span className="text-muted-foreground">Sem resposta em texto.</span>}
                </div>
                {current.attachments.length > 0 && (
                  <ul className="space-y-1.5">
                    {current.attachments.map((f) => (
                      <li key={f.id}>
                        <button type="button" onClick={() => download(current.id, f)} className="flex w-full items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5 text-left text-xs hover:bg-accent/50">
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {f.name} <span className="text-muted-foreground">({fmtSize(f.size)})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <GradeForm submission={current} maxGrade={activity.maxGrade} onSaved={reload} />
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhuma entrega para corrigir.</div>
        )}
      </section>
    </div>
  );
}

function SubmissionList({ rows, selected, onSelect }: { rows: Submission[]; selected: string | null; onSelect: (id: string) => void }) {
  return (
    <aside className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground">{rows.length} entregas</div>
      <ul className="max-h-[480px] divide-y divide-border/60 overflow-y-auto">
        {rows.map((s) => {
          const isActive = (selected ?? rows[0]?.id) === s.id;
          return (
            <li key={s.id}>
              <button onClick={() => onSelect(s.id)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 ${isActive ? "bg-muted/60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.studentName}</div>
                  <div className="text-[11px] text-muted-foreground">{s.submittedAt ? formatDate(s.submittedAt) : "Não enviou"}</div>
                </div>
                {s.grade !== null ? <span className="text-sm font-semibold tabular-nums">{fmtNumero(s.grade, 1)}</span> : null}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/**
 * Correção de atividade com questões: o professor pontua cada questão (as objetivas já chegam
 * pontuadas pela correção automática e podem ser revistas) e a nota é calculada no backend como
 * a proporção dos pontos obtidos sobre o total, aplicada à nota máxima.
 */
function QuestionGradeForm({
  submission, questions, maxGrade, onDownload, onSaved,
}: { submission: Submission; questions: Question[]; maxGrade: number; onDownload: (a: Attachment) => void; onSaved: () => void }) {
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => {
      const answer = submission.answers.find((a) => a.questionId === q.id);
      return [q.id, answer?.score !== null && answer?.score !== undefined ? String(answer.score) : ""];
    })),
  );
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = questions.reduce((s, q) => s + q.points, 0);
  const parsed = questions.map((q) => ({ q, value: scores[q.id] === "" ? null : Number(scores[q.id].replace(",", ".")) }));
  const complete = parsed.every((p) => p.value !== null && !Number.isNaN(p.value));
  const preview = complete && total > 0 ? (parsed.reduce((s, p) => s + (p.value as number), 0) / total) * maxGrade : null;

  async function save() {
    const invalida = parsed.find((p) => p.value === null || Number.isNaN(p.value) || p.value < 0 || p.value > p.q.points);
    if (invalida) {
      setError(`Informe, na questão ${questions.indexOf(invalida.q) + 1}, uma pontuação entre 0 e ${fmtNumero(invalida.q.points, 2)}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await learnService.gradeByQuestion(submission.id, parsed.map((p) => ({ questionId: p.q.id, score: p.value as number })), feedback.trim() || undefined);
      onSaved();
      toast.success("Correção salva com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar a correção";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionResult
            key={q.id}
            question={q}
            index={i}
            answer={submission.answers.find((a) => a.questionId === q.id)}
            attachment={submission.attachments.find((a) => a.questionId === q.id)}
            showKey
            onDownload={onDownload}
            scoreInput={
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Pontos
                <Input
                  type="number" min="0" max={q.points} step="0.25"
                  value={scores[q.id]}
                  onChange={(e) => setScores((s) => ({ ...s, [q.id]: e.target.value }))}
                  aria-label={`Pontuação da questão ${i + 1}`}
                  className="h-8 w-20 text-right tabular-nums"
                />
                / {fmtNumero(q.points, q.points % 1 ? 2 : 0)}
              </label>
            }
          />
        ))}
        {(submission.text || submission.attachments.some((a) => !a.questionId)) && (
          <div className="rounded-xl border p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Observações e anexos gerais do aluno</p>
            {submission.text && <p className="whitespace-pre-wrap text-sm">{submission.text}</p>}
            <ul className="mt-2 space-y-1.5">
              {submission.attachments.filter((a) => !a.questionId).map((f) => (
                <li key={f.id}>
                  <button type="button" onClick={() => onDownload(f)} className="flex items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5 text-xs hover:bg-accent/50">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" /> {f.name} <span className="text-muted-foreground">({fmtSize(f.size)})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-border/60 p-4">
          <p className="text-xs font-medium text-muted-foreground">Nota calculada (máx. {fmtNumero(maxGrade, 1)})</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{preview !== null ? fmtNumero(preview, 2) : "—"}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Pontos obtidos ÷ {fmtNumero(total, total % 1 ? 2 : 0)} pontos × nota máxima.</p>
        </div>
        <div className="rounded-lg border border-border/60 p-4">
          <label className="text-xs font-medium text-muted-foreground">Feedback</label>
          <Textarea rows={4} className="mt-2" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Escreva um feedback construtivo..." />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button size="sm" className="w-full gap-1.5" onClick={save} disabled={saving}><CheckCircle2 className="h-3.5 w-3.5" /> {saving ? "Salvando…" : "Salvar correção"}</Button>
      </div>
    </div>
  );
}

function GradeForm({ submission, maxGrade, onSaved }: { submission: Submission; maxGrade: number; onSaved: () => void }) {
  const [nota, setNota] = useState(submission.grade !== null ? String(submission.grade) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = Number(nota);
    if (Number.isNaN(value)) { setError("Informe uma nota válida."); return; }
    setSaving(true);
    setError(null);
    try {
      await learnService.gradeSubmission(submission.id, value, feedback.trim() || undefined);
      onSaved();
      toast.success("Correção salva com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar a correção";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 p-4">
        <label className="text-xs font-medium text-muted-foreground">Nota final (máx. {maxGrade})</label>
        <div className="mt-2 flex items-center gap-2">
          <Input type="number" step="0.1" value={nota} onChange={(e) => setNota(e.target.value)} className="h-9 text-lg font-semibold" placeholder="0.0" />
        </div>
      </div>
      <div className="rounded-lg border border-border/60 p-4">
        <label className="text-xs font-medium text-muted-foreground">Feedback</label>
        <Textarea rows={4} className="mt-2" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Escreva um feedback construtivo..." />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" className="w-full gap-1.5" onClick={save} disabled={saving}><CheckCircle2 className="h-3.5 w-3.5" /> {saving ? "Salvando…" : "Salvar correção"}</Button>
    </div>
  );
}

function NotasTab({ activityId, maxGrade }: { activityId: string; maxGrade: number }) {
  const [rows, setRows] = useState<Submission[]>([]);
  useEffect(() => { learnService.getSubmissions(activityId).then(setRows); }, [activityId]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Aluno</th>
            <th className="px-3 py-2.5 text-right font-medium">Nota</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-muted/30">
              <td className="px-4 py-2.5">{s.studentName}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{s.grade !== null ? `${fmtNumero(s.grade, 1)} / ${maxGrade}` : "—"}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma entrega ainda.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackTab({ activityId }: { activityId: string }) {
  const [rows, setRows] = useState<Submission[]>([]);
  useEffect(() => { learnService.getSubmissions(activityId).then((all) => setRows(all.filter((s) => s.feedback))); }, [activityId]);

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4" /> Feedbacks enviados</h3>
      </div>
      <ul className="divide-y divide-border/60">
        {rows.length ? rows.map((s) => (
          <li key={s.id} className="px-5 py-3">
            <div className="text-sm font-medium">{s.studentName}</div>
            <p className="mt-1 text-xs text-muted-foreground">{s.feedback}</p>
          </li>
        )) : (
          <li className="px-5 py-6 text-center text-sm text-muted-foreground">Nenhum feedback enviado ainda.</li>
        )}
      </ul>
    </div>
  );
}

function HistoricoTab({ activity }: { activity: Activity }) {
  const events = [
    { label: "Atividade criada", at: activity.createdAt, icon: FileText },
    ...(activity.publishedAt ? [{ label: "Atividade publicada", at: activity.publishedAt, icon: Send }] : []),
  ];
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Histórico</h3>
      </div>
      <ul className="divide-y divide-border/60">
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-3">
            <e.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{e.label}</span>
            <span className="ml-auto text-xs text-muted-foreground">{formatDate(e.at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5"><span className="text-sm font-medium">{label}</span></div>
      {children}
    </label>
  );
}
