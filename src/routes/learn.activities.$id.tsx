import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar, FileUpload } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ACTIVITIES, SUBMISSIONS, STUDENTS, KLASSES, DISCIPLINES, TEACHERS,
  klass, discipline, teacher, formatDate,
} from "@/components/rooster/learn/mock-data";
import { ActivityStatusBadge, SubmissionBadge } from "@/components/rooster/learn/badges";
import { useRole, learnCan } from "@/components/rooster/role-context";
import {
  ArrowLeft, Save, Send, Plus, Trash2, ChevronRight, CheckCircle2, RotateCcw,
  MessageSquare, FileText, History, ImageIcon, Video,
} from "lucide-react";

export const Route = createFileRoute("/learn/activities/$id")({
  component: ActivityDetail,
});

type Tab = "descricao" | "questoes" | "midias" | "entregas" | "correcao" | "notas" | "feedback" | "historico";

function uid() { return Math.random().toString(36).slice(2, 9); }

function ActivityDetail() {
  const { id } = Route.useParams();
  const { role } = useRole();
  const isNew = id === "new";
  const activity = isNew ? undefined : ACTIVITIES.find((a) => a.id === id);

  if (!isNew && !activity) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Atividade não encontrada.</p>
        <Link to="/learn" className="mt-3 inline-block text-sm font-medium text-foreground underline">Voltar</Link>
      </div>
    );
  }

  const [tab, setTab] = useState<Tab>("descricao");

  const tabs = [
    { value: "descricao", label: "Descrição" },
    { value: "questoes", label: "Questões" },
    { value: "midias", label: "Mídias" },
    ...(!isNew ? [{ value: "entregas", label: "Respostas" }] : []),
    ...(!isNew && learnCan(role, "gradeActivity") ? [{ value: "correcao", label: "Correção" }] : []),
    ...(!isNew ? [{ value: "notas", label: "Notas" }] : []),
    ...(!isNew ? [{ value: "feedback", label: "Feedback" }] : []),
    ...(!isNew ? [{ value: "historico", label: "Histórico" }] : []),
  ];

  return (
    <>
      <div className="mb-3">
        <Link to="/learn" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Atividades
        </Link>
      </div>

      <PageHeader
        eyebrow="Rooster Learn"
        title={isNew ? "Nova atividade" : activity!.title}
        description={isNew ? "Monte a atividade em blocos, adicione questões e publique para as turmas." : `${activity!.code} · ${klass(activity!.klassId)?.name}`}
        actions={
          <>
            {!isNew ? <ActivityStatusBadge status={activity!.status} /> : null}
            <Button size="sm" variant="outline" className="gap-1.5"><Save className="h-4 w-4" /> Salvar rascunho</Button>
            <Button size="sm" className="gap-1.5"><Send className="h-4 w-4" /> {isNew ? "Publicar" : "Salvar"}</Button>
          </>
        }
      />

      <div className="mb-4">
        <TabBar tabs={tabs} value={tab} onChange={(v) => setTab(v as Tab)} />
      </div>

      {tab === "descricao" ? <DescricaoTab activity={activity} /> : null}
      {tab === "questoes" ? <QuestoesTab /> : null}
      {tab === "midias" ? <MidiasTab /> : null}
      {tab === "entregas" && activity ? <EntregasTab activityId={activity.id} /> : null}
      {tab === "correcao" && activity ? <CorrecaoTab activityId={activity.id} /> : null}
      {tab === "notas" && activity ? <NotasTab activity={activity} /> : null}
      {tab === "feedback" && activity ? <FeedbackTab activityId={activity.id} /> : null}
      {tab === "historico" && activity ? <HistoricoTab activity={activity} /> : null}
    </>
  );
}

function DescricaoTab({ activity }: { activity?: ReturnType<typeof ACTIVITIES.find> }) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold">Informações básicas</h3>
      <div className="grid gap-4">
        <Field label="Nome da atividade"><Input defaultValue={activity?.title} placeholder="Ex: Lista 3 — Limites e continuidade" /></Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Disciplina">
            <Select defaultValue={activity?.disciplineId ?? DISCIPLINES[0].id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DISCIPLINES.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Turma">
            <Select defaultValue={activity?.klassId ?? KLASSES[0].id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KLASSES.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Professor responsável">
            <Select defaultValue={activity?.teacherId ?? TEACHERS[0].id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TEACHERS.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Peso"><Input type="number" defaultValue={activity?.weight ?? 2} min={1} max={10} /></Field>
          <Field label="Nota máxima"><Input type="number" defaultValue={10} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Abertura"><Input type="datetime-local" /></Field>
          <Field label="Prazo final"><Input type="datetime-local" defaultValue={activity?.dueAt?.slice(0, 16)} /></Field>
          <Field label="Tempo máximo (min)"><Input type="number" placeholder="Ex: 90" /></Field>
        </div>
        <Field label="Instruções gerais">
          <Textarea rows={5} placeholder="Descreva o que os alunos devem fazer, materiais permitidos e observações gerais." />
        </Field>
      </div>
    </section>
  );
}

type Question = {
  id: string; statement: string; points: number;
  options?: { id: string; label: string; correct: boolean }[];
};

function QuestoesTab() {
  const [questions, setQuestions] = useState<Question[]>([
    { id: uid(), statement: "Qual é o valor de lim (x→0) sin(x)/x?", points: 1, options: [
      { id: uid(), label: "0", correct: false }, { id: uid(), label: "1", correct: true },
      { id: uid(), label: "∞", correct: false },
    ] },
    { id: uid(), statement: "Explique o Teorema do Valor Médio.", points: 3 },
  ]);
  const addQuestion = () => setQuestions((q) => [...q, { id: uid(), statement: "", points: 1 }]);
  const removeQuestion = (id: string) => setQuestions((q) => q.filter((x) => x.id !== id));
  const updateQuestion = (id: string, patch: Partial<Question>) => setQuestions((q) => q.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const total = questions.reduce((s, q) => s + q.points, 0);

  return (
    <section className="rounded-xl border border-border/60 bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Questões</h3>
          <p className="text-xs text-muted-foreground">{questions.length} questões · total {total} pts</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={addQuestion}><Plus className="h-4 w-4" /> Nova questão</Button>
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-border/60 bg-background p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-muted text-[11px] font-semibold">{i + 1}</span>
              <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>Pontos</span>
                <input type="number" value={q.points} onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })} className="h-6 w-14 rounded-md border border-input bg-background px-1.5 text-right text-xs outline-none" />
              </div>
              <button onClick={() => removeQuestion(q.id)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <Textarea value={q.statement} onChange={(e) => updateQuestion(q.id, { statement: e.target.value })} rows={2} placeholder="Enunciado da questão..." className="mb-3" />
            {q.options ? (
              <div className="space-y-1.5">
                {q.options.map((o, oi) => (
                  <div key={o.id} className="flex items-center gap-2 rounded-md border border-border/50 bg-card px-2 py-1.5">
                    <input type="radio" name={q.id} checked={o.correct} onChange={() => updateQuestion(q.id, { options: q.options!.map((x, j) => ({ ...x, correct: j === oi })) })} />
                    <input value={o.label} onChange={(e) => updateQuestion(q.id, { options: q.options!.map((x, j) => (j === oi ? { ...x, label: e.target.value } : x)) })} placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`} className="flex-1 border-0 bg-transparent text-sm outline-none" />
                  </div>
                ))}
                <button onClick={() => updateQuestion(q.id, { options: [...(q.options ?? []), { id: uid(), label: "", correct: false }] })} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Plus className="h-3 w-3" /> Adicionar alternativa
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">Campo de resposta em texto (dissertativa).</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MidiasTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h3 className="mb-3 text-sm font-semibold">Imagens</h3>
        <FileUpload accept="image/*" label="Enviar imagem" onChange={() => {}} />
      </section>
      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h3 className="mb-3 text-sm font-semibold">Vídeos</h3>
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          <Video className="mx-auto mb-2 h-6 w-6" /> Envie vídeos ou cole um link de incorporação.
        </div>
      </section>
      <section className="rounded-xl border border-border/60 bg-card p-6 lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold">Arquivos de apoio</h3>
        <FileUpload accept="*" label="Enviar arquivo" preview={false} onChange={() => {}} />
      </section>
    </div>
  );
}

function EntregasTab({ activityId }: { activityId: string }) {
  const rows = SUBMISSIONS.filter((s) => s.activityId === activityId);
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Aluno</th>
            <th className="px-3 py-2.5 text-left font-medium">Enviado em</th>
            <th className="px-3 py-2.5 text-left font-medium">Situação</th>
            <th className="px-3 py-2.5 text-right font-medium">Nota</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((s) => {
            const st = STUDENTS.find((x) => x.id === s.studentId)!;
            return (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{st.name}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.submittedAt ? formatDate(s.submittedAt) : "Não enviou"}</td>
                <td className="px-3 py-2.5"><SubmissionBadge status={s.status} /></td>
                <td className="px-3 py-2.5 text-right tabular-nums">{s.grade !== null ? s.grade.toFixed(1) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CorrecaoTab({ activityId }: { activityId: string }) {
  const submissions = SUBMISSIONS.filter((s) => s.activityId === activityId);
  const [selected, setSelected] = useState<string | null>(submissions[0]?.id ?? null);
  const current = submissions.find((s) => s.id === selected) ?? submissions[0];
  const student = current ? STUDENTS.find((s) => s.id === current.studentId) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground">{submissions.length} entregas</div>
        <ul className="max-h-[480px] divide-y divide-border/60 overflow-y-auto">
          {submissions.map((s) => {
            const st = STUDENTS.find((x) => x.id === s.studentId)!;
            const isActive = (selected ?? submissions[0]?.id) === s.id;
            return (
              <li key={s.id}>
                <button onClick={() => setSelected(s.id)} className={"flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 " + (isActive ? "bg-muted/60" : "")}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{st.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.submittedAt ? formatDate(s.submittedAt) : "Não enviou"}</div>
                  </div>
                  {s.grade !== null ? <span className="text-sm font-semibold tabular-nums">{s.grade.toFixed(1)}</span> : null}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        {current && student ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{student.name}</h3>
                <SubmissionBadge status={current.status} />
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" className="gap-1"><RotateCcw className="h-3.5 w-3.5" /> Solicitar reenvio</Button>
                <Button size="sm" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Aprovar</Button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="rounded-lg border border-border/60 bg-background p-4 text-sm">
                Respostas do aluno para esta atividade seriam exibidas aqui, questão a questão.
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 p-4">
                  <label className="text-xs font-medium text-muted-foreground">Nota final</label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input type="number" defaultValue={current.grade ?? ""} className="h-9 text-lg font-semibold" placeholder="0.0" />
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 p-4">
                  <label className="text-xs font-medium text-muted-foreground">Feedback</label>
                  <Textarea rows={4} className="mt-2" defaultValue={current.feedback} placeholder="Escreva um feedback construtivo..." />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhuma entrega para corrigir.</div>
        )}
      </section>
    </div>
  );
}

function NotasTab({ activity }: { activity: NonNullable<ReturnType<typeof ACTIVITIES.find>> }) {
  const students = STUDENTS.filter((s) => s.klassId === activity.klassId);
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
          {students.map((s) => {
            const sub = SUBMISSIONS.find((x) => x.studentId === s.id && x.activityId === activity.id);
            return (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">{s.name}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{sub?.grade !== null && sub?.grade !== undefined ? sub.grade.toFixed(1) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackTab({ activityId }: { activityId: string }) {
  const rows = SUBMISSIONS.filter((s) => s.activityId === activityId && s.feedback);
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4" /> Feedbacks enviados</h3>
      </div>
      <ul className="divide-y divide-border/60">
        {rows.length ? rows.map((s) => {
          const st = STUDENTS.find((x) => x.id === s.studentId)!;
          return (
            <li key={s.id} className="px-5 py-3">
              <div className="text-sm font-medium">{st.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{s.feedback}</p>
            </li>
          );
        }) : (
          <li className="px-5 py-6 text-center text-sm text-muted-foreground">Nenhum feedback enviado ainda.</li>
        )}
      </ul>
    </div>
  );
}

function HistoricoTab({ activity }: { activity: NonNullable<ReturnType<typeof ACTIVITIES.find>> }) {
  const events = [
    { label: "Atividade criada", at: activity.createdAt, icon: FileText },
    { label: "Atividade publicada", at: activity.dueAt, icon: Send },
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
