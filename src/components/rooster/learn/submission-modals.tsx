// Modais de entrega do aluno (responder e revisar), compartilhados pela área do aluno do
// Rooster Learn (/learn/student) e pelo Rooster Student (/student/activities). Na atividade com
// questões, cada questão é respondida conforme o tipo; sem questões, a entrega é texto livre e anexos.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, Modal } from "@/components/shared";
import {
  learnService, TYPE_LABEL, formatDate,
  type Activity, type Attachment, type Question, type Submission,
} from "@/services/mock-api/learn.service";
import { QuestionAnswerInput, QuestionResult } from "@/components/rooster/learn/questions";
import { answerMissing, emptyAnswer, salvarArquivo, type AnswerState } from "@/components/rooster/learn/questions-utils";
import { FileText, MessageSquare, Paperclip, Send, X } from "lucide-react";
import { fmtNumero } from "@/lib/formatacao";

export function AnswerModal({
  activity, existing, onClose, onSubmit,
}: { activity: Activity; existing: Submission | null; onClose: () => void; onSubmit: () => void }) {
  const [text, setText] = useState(existing?.text ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<Question[] | null>(activity.questionsCount > 0 ? null : []);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [showMissing, setShowMissing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activity.questionsCount === 0) return;
    learnService.getQuestions(activity.id)
      .then((qs) => {
        setQuestions(qs);
        // No reenvio, as respostas anteriores voltam preenchidas (exceto arquivos, que precisam ser reenviados).
        setAnswers(Object.fromEntries(qs.map((q) => {
          const anterior = existing?.answers.find((a) => a.questionId === q.id);
          return [q.id, { ...emptyAnswer(), optionIds: anterior?.optionIds ?? [], text: anterior?.text ?? "" }];
        })));
      })
      .catch((err) => { setQuestions([]); setError(err instanceof Error ? err.message : "Falha ao carregar as questões"); });
  }, [activity.id, activity.questionsCount, existing]);

  const hasQuestions = (questions?.length ?? 0) > 0;
  const missing = (questions ?? []).filter((q) => answerMissing(q, answers[q.id]));

  async function submit() {
    if (missing.length > 0) {
      setShowMissing(true);
      setError(`Responda às questões obrigatórias: ${missing.map((q) => (questions ?? []).indexOf(q) + 1).join(", ")}.`);
      return;
    }
    setSending(true);
    setError(null);
    try {
      const entrega = await learnService.submit(
        activity.id,
        text.trim() || undefined,
        hasQuestions
          ? (questions ?? []).map((q) => ({
              questionId: q.id,
              optionIds: answers[q.id]?.optionIds ?? [],
              text: answers[q.id]?.text.trim() || undefined,
            }))
          : undefined,
      );
      for (const q of questions ?? []) {
        const arquivo = answers[q.id]?.file;
        if (q.type === "arquivo" && arquivo) await learnService.uploadAttachment(entrega.id, arquivo, q.id);
      }
      for (const file of files) await learnService.uploadAttachment(entrega.id, file);
      if (entrega.status === "corrigida" && entrega.grade !== null) {
        toast.success(`Entrega corrigida automaticamente: nota ${fmtNumero(entrega.grade, 2)} de ${fmtNumero(activity.maxGrade, 1)}.`);
      } else {
        toast.success("Entrega enviada com sucesso");
      }
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
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="solid" onClick={submit} disabled={sending || questions === null} tour="resposta-enviar"><Send className="h-3.5 w-3.5" /> {sending ? "Enviando…" : "Enviar resposta"}</Btn></>}
    >
      <div className="space-y-4">
        {activity.description && <p className="whitespace-pre-wrap text-xs text-muted-foreground">{activity.description}</p>}
        {questions === null ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : hasQuestions ? (
          <div className="space-y-3" data-tour="resposta-questoes">
            {questions.map((q, i) => (
              <QuestionAnswerInput
                key={q.id}
                question={q}
                index={i}
                value={answers[q.id] ?? emptyAnswer()}
                onChange={(v) => { setAnswers((a) => ({ ...a, [q.id]: v })); setError(null); }}
                invalid={showMissing && answerMissing(q, answers[q.id])}
              />
            ))}
          </div>
        ) : null}
        <div data-tour="resposta-texto">
          <label className="mb-1.5 block text-xs font-medium">{hasQuestions ? "Observações (opcional)" : "Sua resposta"}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={hasQuestions ? 3 : 8}
            placeholder={hasQuestions ? "Observações para o professor…" : "Digite sua resposta…"}
            className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div data-tour="resposta-anexos">
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

export function ReviewModal({ activity, submission, onClose }: { activity: Activity; submission: Submission | null; onClose: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const corrigida = submission?.status === "corrigida";

  useEffect(() => {
    // Com a entrega corrigida, o backend devolve também o gabarito das questões objetivas.
    if (activity.questionsCount > 0) learnService.getQuestions(activity.id).then(setQuestions).catch(() => setQuestions([]));
  }, [activity.id, activity.questionsCount]);

  async function download(a: Attachment) {
    if (!submission) return;
    try {
      salvarArquivo(await learnService.downloadAttachment(submission.id, a.id), a.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao baixar o arquivo");
    }
  }

  const generalAttachments = submission?.attachments.filter((a) => !a.questionId) ?? [];

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
        {questions.length > 0 ? (
          <div className="space-y-3">
            {!corrigida && <p className="text-xs text-muted-foreground">O gabarito é exibido após a correção da entrega.</p>}
            {questions.map((q, i) => (
              <QuestionResult
                key={q.id}
                question={q}
                index={i}
                answer={submission?.answers.find((a) => a.questionId === q.id)}
                attachment={submission?.attachments.find((a) => a.questionId === q.id)}
                showKey={corrigida}
                onDownload={download}
              />
            ))}
          </div>
        ) : null}
        {(questions.length === 0 || submission?.text) && (
          <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">
            {submission?.text || <span className="text-muted-foreground">Sem resposta em texto.</span>}
          </div>
        )}
        {generalAttachments.length > 0 && (
          <ul className="space-y-1.5">
            {generalAttachments.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => download(f)} className="flex items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5 text-xs hover:bg-accent/50">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {f.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
