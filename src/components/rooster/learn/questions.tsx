// Questões das atividades do Rooster Learn: editor do professor, preenchimento pelo aluno e
// exibição do resultado (resposta, pontuação e gabarito). Os tipos e as regras de alternativas
// espelham o backend (RN048 e RN049): múltipla escolha com uma resposta (exatamente uma correta),
// com várias respostas (ao menos uma correta), verdadeiro ou falso (duas alternativas, uma
// correta), discursiva e envio de arquivo (sem alternativas).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, Chip, ConfirmDialog, EmptyState, Modal } from "@/components/shared";
import {
  learnService, OBJECTIVE_TYPES, QUESTION_TYPE_LABEL,
  type Activity, type Answer, type Attachment, type Question, type QuestionDraft, type QuestionType,
} from "@/services/mock-api/learn.service";
import {
  ArrowDown, ArrowUp, CheckCircle2, CircleDot, FileUp, ImagePlus, ListChecks, Lock, Paperclip, Pencil, Plus,
  SquareCheck, Trash2, X, XCircle,
} from "lucide-react";
import { fmtNumero } from "@/lib/formatacao";
import { answerMissing, type AnswerState } from "./questions-utils";

const MAX_IMAGEM_BYTES = 5 * 1024 * 1024;
const IMAGENS_ACEITAS = "image/jpeg,image/png,image/gif,image/webp";

const controle =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

// ============================================================================
// Imagem de apoio
// ============================================================================

/** A imagem é servida por rota autenticada; por isso é obtida como Blob, não por URL direta. */
export function QuestionImage({ questionId, name, version = 0 }: { questionId: string; name: string | null; version?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let ativo = true;
    let criada: string | null = null;
    setFailed(false);
    learnService.getQuestionImage(questionId)
      .then((blob) => {
        if (!ativo) return;
        criada = URL.createObjectURL(blob);
        setUrl(criada);
      })
      .catch(() => ativo && setFailed(true));
    return () => {
      ativo = false;
      if (criada) URL.revokeObjectURL(criada);
    };
  }, [questionId, version]);

  if (failed) return <p className="text-xs text-muted-foreground">Não foi possível carregar a imagem de apoio.</p>;
  if (!url) return <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />;
  return (
    <img
      src={url}
      alt={name ? `Imagem de apoio: ${name}` : "Imagem de apoio da questão"}
      className="max-h-80 max-w-full rounded-lg border object-contain"
    />
  );
}

function QuestionHeader({ question, index }: { question: Question; index: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">Questão {index + 1}</span>
      <Chip tone="oklch(0.6 0.18 260)">{QUESTION_TYPE_LABEL[question.type]}</Chip>
      <span className="text-xs text-muted-foreground">
        {fmtNumero(question.points, question.points % 1 ? 2 : 0)} {question.points === 1 ? "ponto" : "pontos"}
      </span>
      {question.required ? <span className="text-xs text-muted-foreground">· obrigatória</span> : <span className="text-xs text-muted-foreground">· opcional</span>}
    </div>
  );
}

function QuestionBody({ question, imageVersion }: { question: Question; imageVersion?: number }) {
  return (
    <div className="mt-2 space-y-2">
      {question.supportText && (
        <div className="whitespace-pre-wrap rounded-lg border-l-2 border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {question.supportText}
        </div>
      )}
      {question.hasImage && <QuestionImage questionId={question.id} name={question.imageName} version={imageVersion} />}
      <p className="whitespace-pre-wrap text-sm">{question.statement}</p>
    </div>
  );
}

// ============================================================================
// Editor (professor)
// ============================================================================

export function QuestionsEditor({ activity, canEdit, onChanged }: { activity: Activity; canEdit: boolean; onChanged: () => void }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [editing, setEditing] = useState<Question | "new" | null>(null);
  const [removing, setRemoving] = useState<Question | null>(null);
  const [imageVersions, setImageVersions] = useState<Record<string, number>>({});
  const locked = activity.submissionsCount > 0;
  const editable = canEdit && !locked;

  function reload() {
    learnService.getQuestions(activity.id).then(setQuestions).catch(() => setQuestions([]));
  }
  useEffect(reload, [activity.id]);

  function falha(err: unknown, padrao: string) {
    toast.error(err instanceof Error ? err.message : padrao);
  }

  async function move(index: number, delta: number) {
    if (!questions) return;
    const ids = questions.map((q) => q.id);
    const destino = index + delta;
    if (destino < 0 || destino >= ids.length) return;
    [ids[index], ids[destino]] = [ids[destino], ids[index]];
    try {
      setQuestions(await learnService.reorderQuestions(activity.id, ids));
    } catch (err) {
      falha(err, "Falha ao reordenar as questões");
    }
  }

  async function uploadImage(question: Question, file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_IMAGEM_BYTES) { toast.error("A imagem deve ter no máximo 5 MB."); return; }
    try {
      await learnService.uploadQuestionImage(question.id, file);
      setImageVersions((v) => ({ ...v, [question.id]: (v[question.id] ?? 0) + 1 }));
      reload();
      toast.success("Imagem de apoio atualizada");
    } catch (err) {
      falha(err, "Falha ao enviar a imagem");
    }
  }

  async function removeImage(question: Question) {
    try {
      await learnService.removeQuestionImage(question.id);
      reload();
      toast.success("Imagem de apoio removida");
    } catch (err) {
      falha(err, "Falha ao remover a imagem");
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await learnService.removeQuestion(removing.id);
      setRemoving(null);
      reload();
      onChanged();
      toast.success("Questão excluída");
    } catch (err) {
      falha(err, "Falha ao excluir a questão");
    }
  }

  const totalPoints = (questions ?? []).reduce((s, q) => s + q.points, 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">Questões</h3>
          <p className="text-xs text-muted-foreground">
            {questions?.length ?? 0} {questions?.length === 1 ? "questão" : "questões"} · {fmtNumero(totalPoints, totalPoints % 1 ? 2 : 0)} pontos no total ·
            a nota é proporcional aos pontos obtidos, sobre a nota máxima de {fmtNumero(activity.maxGrade, 1)}.
          </p>
        </div>
        {editable && (
          <Btn variant="solid" onClick={() => setEditing("new")} tour="questoes-adicionar"><Plus className="h-3.5 w-3.5" /> Adicionar questão</Btn>
        )}
      </div>

      {locked && (
        <div className="flex items-start gap-2 rounded-xl border border-dashed bg-card/40 px-4 py-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          A atividade já recebeu entregas; as questões não podem mais ser alteradas, para não invalidar as respostas enviadas.
        </div>
      )}

      {questions === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nenhuma questão cadastrada"
          description="Sem questões, o aluno responde em texto livre e anexa arquivos. Adicione questões para montar uma prova, lista ou questionário."
        />
      ) : (
        <ol className="space-y-3">
          {questions.map((q, i) => (
            <li key={q.id} className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <QuestionHeader question={q} index={i} />
                {editable && (
                  <div className="flex items-center gap-1">
                    <IconButton label="Mover para cima" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></IconButton>
                    <IconButton label="Mover para baixo" disabled={i === questions.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></IconButton>
                    <label className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" title={q.hasImage ? "Trocar imagem de apoio" : "Adicionar imagem de apoio"}>
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span className="sr-only">{q.hasImage ? "Trocar imagem de apoio" : "Adicionar imagem de apoio"}</span>
                      <input type="file" accept={IMAGENS_ACEITAS} className="hidden" onChange={(e) => { uploadImage(q, e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                    <IconButton label="Editar questão" onClick={() => setEditing(q)}><Pencil className="h-3.5 w-3.5" /></IconButton>
                    <IconButton label="Excluir questão" onClick={() => setRemoving(q)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                  </div>
                )}
              </div>
              <QuestionBody question={q} imageVersion={imageVersions[q.id]} />
              {editable && q.hasImage && (
                <button type="button" onClick={() => removeImage(q)} className="mt-1 text-xs text-muted-foreground underline hover:text-foreground">
                  Remover imagem de apoio
                </button>
              )}
              {q.options.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {q.options.map((o) => (
                    <li key={o.id} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${o.correct ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}>
                      {o.correct ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <span className="h-3.5 w-3.5" />}
                      <span className="flex-1">{o.text}</span>
                      {o.correct && <span className="text-[11px] font-medium text-emerald-600">correta</span>}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === "discursiva" && <p className="mt-3 text-xs text-muted-foreground">Resposta em texto, pontuada pelo professor.</p>}
              {q.type === "arquivo" && <p className="mt-3 text-xs text-muted-foreground">Resposta por envio de arquivo, pontuada pelo professor.</p>}
            </li>
          ))}
        </ol>
      )}

      {editing && (
        <QuestionFormModal
          activityId={activity.id}
          question={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); onChanged(); }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Excluir questão"
        description="A questão, as alternativas e a imagem de apoio serão excluídas. Esta ação não poderá ser desfeita."
      />
    </section>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

type OptionDraft = { text: string; correct: boolean };

function optionsPadrao(type: QuestionType): OptionDraft[] {
  if (type === "vf") return [{ text: "Verdadeiro", correct: true }, { text: "Falso", correct: false }];
  if (OBJECTIVE_TYPES.has(type)) return [{ text: "", correct: true }, { text: "", correct: false }];
  return [];
}

/** Validação local, com as mesmas regras do backend, para orientar o professor antes do envio. */
function validar(type: QuestionType, statement: string, points: number, options: OptionDraft[]): string | null {
  if (!statement.trim()) return "Informe o enunciado da questão.";
  if (!(points > 0)) return "O valor da questão deve ser maior que zero.";
  if (!OBJECTIVE_TYPES.has(type)) return null;
  if (options.some((o) => !o.text.trim())) return "Toda alternativa deve possuir texto.";
  const corretas = options.filter((o) => o.correct).length;
  if (type === "vf" && (options.length !== 2 || corretas !== 1)) return "Marque qual das duas alternativas é a correta.";
  if (type !== "vf" && options.length < 2) return "Informe ao menos duas alternativas.";
  if (type === "multipla-uma" && corretas !== 1) return "Marque exatamente uma alternativa correta.";
  if (type === "multipla-varias" && corretas < 1) return "Marque ao menos uma alternativa correta.";
  return null;
}

function QuestionFormModal({
  activityId, question, onClose, onSaved,
}: { activityId: string; question: Question | null; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<QuestionType>(question?.type ?? "multipla-uma");
  const [statement, setStatement] = useState(question?.statement ?? "");
  const [supportText, setSupportText] = useState(question?.supportText ?? "");
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [required, setRequired] = useState(question?.required ?? true);
  const [options, setOptions] = useState<OptionDraft[]>(
    question ? question.options.map((o) => ({ text: o.text, correct: !!o.correct })) : optionsPadrao("multipla-uma"),
  );
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const objective = OBJECTIVE_TYPES.has(type);

  function changeType(next: QuestionType) {
    setType(next);
    if (next === "vf") setOptions(optionsPadrao("vf"));
    else if (!OBJECTIVE_TYPES.has(next)) setOptions([]);
    else if (type === "vf" || !OBJECTIVE_TYPES.has(type)) setOptions(optionsPadrao(next));
    else if (next === "multipla-uma") {
      // Ao passar para resposta única, mantém marcada apenas a primeira correta.
      const primeira = options.findIndex((o) => o.correct);
      setOptions(options.map((o, i) => ({ ...o, correct: i === Math.max(primeira, 0) })));
    }
  }

  function toggleCorrect(index: number) {
    setOptions((atual) => atual.map((o, i) => {
      if (type === "multipla-varias") return i === index ? { ...o, correct: !o.correct } : o;
      return { ...o, correct: i === index };
    }));
  }

  async function save() {
    const valor = Number(points.replace(",", "."));
    const problema = validar(type, statement, valor, options);
    if (problema) { setError(problema); return; }
    if (image && image.size > MAX_IMAGEM_BYTES) { setError("A imagem deve ter no máximo 5 MB."); return; }
    setSaving(true);
    setError(null);
    const draft: QuestionDraft = {
      type, statement: statement.trim(), supportText: supportText.trim(), points: valor, required,
      options: objective ? options.map((o) => ({ text: o.text.trim(), correct: o.correct })) : [],
    };
    try {
      const salva = question
        ? await learnService.updateQuestion(question.id, draft)
        : await learnService.createQuestion(activityId, draft);
      if (image) await learnService.uploadQuestionImage(salva.id, image);
      toast.success(question ? "Questão atualizada" : "Questão adicionada");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar a questão");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={question ? "Editar questão" : "Nova questão"}
      description="Defina o tipo, o enunciado, o material de apoio, o valor e, nas objetivas, as alternativas e o gabarito."
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="solid" onClick={save} disabled={saving} tour="questao-salvar">{saving ? "Salvando…" : "Salvar questão"}</Btn></>}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <label className="block" data-tour="questao-tipo">
            <span className="mb-1.5 block text-xs font-medium">Tipo de questão</span>
            <select value={type} onChange={(e) => changeType(e.target.value as QuestionType)} className={controle}>
              {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </label>
          <label className="block" data-tour="questao-tipo">
            <span className="mb-1.5 block text-xs font-medium">Valor (pontos)</span>
            <input type="number" min="0.01" step="0.25" value={points} onChange={(e) => setPoints(e.target.value)} className={controle} />
          </label>
        </div>

        <label className="block" data-tour="questao-enunciado">
          <span className="mb-1.5 block text-xs font-medium">Enunciado</span>
          <textarea rows={3} value={statement} onChange={(e) => setStatement(e.target.value)} className={`${controle} resize-y`} placeholder="Digite a pergunta…" />
        </label>

        <label className="block" data-tour="questao-apoio">
          <span className="mb-1.5 block text-xs font-medium">Texto de apoio (opcional)</span>
          <textarea rows={3} value={supportText} onChange={(e) => setSupportText(e.target.value)} className={`${controle} resize-y`} placeholder="Trecho, citação, dados ou contexto exibido acima do enunciado." />
        </label>

        <div data-tour="questao-apoio">
          <span className="mb-1.5 block text-xs font-medium">Imagem de apoio (opcional)</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent/50">
              <ImagePlus className="h-3.5 w-3.5" /> {image ? "Trocar imagem" : question?.hasImage ? "Substituir imagem atual" : "Selecionar imagem"}
              <input type="file" accept={IMAGENS_ACEITAS} className="hidden" onChange={(e) => { setImage(e.target.files?.[0] ?? null); e.target.value = ""; }} />
            </label>
            {image && (
              <span className="inline-flex items-center gap-1 text-xs">
                {image.name}
                <button type="button" aria-label="Descartar imagem selecionada" onClick={() => setImage(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">JPEG, PNG, GIF ou WebP, até 5 MB.</span>
          </div>
        </div>

        {objective && (
          <div data-tour="questao-alternativas">
            <span className="mb-1.5 block text-xs font-medium">
              Alternativas · {type === "multipla-varias" ? "marque todas as corretas" : "marque a correta"}
            </span>
            <ul className="space-y-2">
              {options.map((o, i) => (
                <li key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(i)}
                    aria-label={o.correct ? `Alternativa ${i + 1} marcada como correta` : `Marcar alternativa ${i + 1} como correta`}
                    aria-pressed={o.correct}
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${o.correct ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    {type === "multipla-varias" ? <SquareCheck className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                  </button>
                  <input
                    value={o.text}
                    disabled={type === "vf"}
                    onChange={(e) => setOptions((atual) => atual.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                    placeholder={`Alternativa ${i + 1}`}
                    className={`${controle} disabled:opacity-80`}
                  />
                  {type !== "vf" && (
                    <button
                      type="button"
                      aria-label={`Remover alternativa ${i + 1}`}
                      disabled={options.length <= 2}
                      onClick={() => setOptions((atual) => atual.filter((_, j) => j !== i))}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {type !== "vf" && options.length < 10 && (
              <button type="button" onClick={() => setOptions((atual) => [...atual, { text: "", correct: false }])} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                <Plus className="h-3.5 w-3.5" /> Adicionar alternativa
              </button>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm" data-tour="questao-obrigatoria">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="h-4 w-4" />
          Resposta obrigatória
        </label>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </Modal>
  );
}

// ============================================================================
// Preenchimento (aluno)
// ============================================================================

export function QuestionAnswerInput({
  question, index, value, onChange, invalid,
}: { question: Question; index: number; value: AnswerState; onChange: (v: AnswerState) => void; invalid?: boolean }) {
  const name = `questao-${question.id}`;
  return (
    <div className={`rounded-xl border p-4 ${invalid ? "border-destructive/60" : ""}`}>
      <QuestionHeader question={question} index={index} />
      <QuestionBody question={question} />
      <div className="mt-3">
        {OBJECTIVE_TYPES.has(question.type) && (
          <fieldset className="space-y-1.5">
            <legend className="sr-only">Alternativas da questão {index + 1}</legend>
            {question.options.map((o) => {
              const multiple = question.type === "multipla-varias";
              const checked = value.optionIds.includes(o.id);
              return (
                <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent/40 ${checked ? "border-foreground/40 bg-accent/40" : ""}`}>
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={name}
                    checked={checked}
                    onChange={() => onChange({
                      ...value,
                      optionIds: multiple
                        ? (checked ? value.optionIds.filter((id) => id !== o.id) : [...value.optionIds, o.id])
                        : [o.id],
                    })}
                    className="h-4 w-4"
                  />
                  {o.text}
                </label>
              );
            })}
            {question.type === "multipla-varias" && <p className="text-[11px] text-muted-foreground">Marque todas as alternativas corretas.</p>}
          </fieldset>
        )}
        {question.type === "discursiva" && (
          <textarea
            rows={5}
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            placeholder="Digite sua resposta…"
            aria-label={`Resposta da questão ${index + 1}`}
            className={`${controle} resize-y`}
          />
        )}
        {question.type === "arquivo" && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent/50">
              <FileUp className="h-3.5 w-3.5" /> {value.file ? "Trocar arquivo" : "Selecionar arquivo"}
              <input type="file" className="hidden" onChange={(e) => { onChange({ ...value, file: e.target.files?.[0] ?? null }); e.target.value = ""; }} />
            </label>
            {value.file && <span className="text-xs">{value.file.name}</span>}
            <span className="text-[11px] text-muted-foreground">Até 15 MB (PDF, Office, imagem, texto ou ZIP).</span>
          </div>
        )}
        {invalid && <p className="mt-2 text-xs text-destructive">Esta questão é obrigatória.</p>}
      </div>
    </div>
  );
}

// ============================================================================
// Resultado (correção do professor e revisão do aluno)
// ============================================================================

export function QuestionResult({
  question, index, answer, attachment, showKey, onDownload, scoreInput,
}: {
  question: Question;
  index: number;
  answer: Answer | undefined;
  attachment?: Attachment;
  /** Exibe o gabarito (professor, ou aluno após a correção). */
  showKey: boolean;
  onDownload?: (a: Attachment) => void;
  /** Campo de pontuação do professor; ausente na revisão do aluno. */
  scoreInput?: React.ReactNode;
}) {
  const objective = OBJECTIVE_TYPES.has(question.type);
  const chosen = new Set(answer?.optionIds ?? []);
  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <QuestionHeader question={question} index={index} />
        {scoreInput ?? (
          <span className="text-sm font-semibold tabular-nums">
            {answer?.score !== null && answer?.score !== undefined ? fmtNumero(answer.score, answer.score % 1 ? 2 : 0) : "—"}
            <span className="text-xs font-normal text-muted-foreground"> / {fmtNumero(question.points, question.points % 1 ? 2 : 0)}</span>
          </span>
        )}
      </div>
      <QuestionBody question={question} />
      <div className="mt-3">
        {objective && (
          <ul className="space-y-1.5">
            {question.options.map((o) => {
              const marcada = chosen.has(o.id);
              const correta = showKey && o.correct;
              const errada = showKey && marcada && !o.correct;
              return (
                <li
                  key={o.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${correta ? "border-emerald-500/50 bg-emerald-500/5" : ""} ${errada ? "border-destructive/50 bg-destructive/5" : ""}`}
                >
                  {marcada ? (errada ? <XCircle className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className={`h-3.5 w-3.5 ${showKey ? "text-emerald-600" : ""}`} />) : <span className="h-3.5 w-3.5" />}
                  <span className="flex-1">{o.text}</span>
                  {marcada && <span className="text-[11px] text-muted-foreground">resposta do aluno</span>}
                  {correta && !marcada && <span className="text-[11px] font-medium text-emerald-600">correta</span>}
                </li>
              );
            })}
            {chosen.size === 0 && <li className="text-xs text-muted-foreground">Sem resposta.</li>}
          </ul>
        )}
        {question.type === "discursiva" && (
          <div className="whitespace-pre-wrap rounded-lg border bg-background p-3 text-sm">
            {answer?.text || <span className="text-muted-foreground">Sem resposta.</span>}
          </div>
        )}
        {question.type === "arquivo" && (
          attachment ? (
            <button type="button" onClick={() => onDownload?.(attachment)} className="inline-flex items-center gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5 text-xs hover:bg-accent/50">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" /> {attachment.name}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum arquivo enviado.</p>
          )
        )}
        {objective && answer?.autoGraded && <p className="mt-2 text-[11px] text-muted-foreground">Corrigida automaticamente.</p>}
      </div>
    </div>
  );
}
