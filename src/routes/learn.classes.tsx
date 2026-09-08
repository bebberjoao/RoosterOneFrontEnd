import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CrudHeader, SectionCard, EmptyState, Btn, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, FilterInput, FileUpload,
} from "@/components/shared";
import {
  KLASSES, DISCIPLINES, TEACHERS, STUDENTS, discipline, formatDate, TYPE_LABEL, STATUS_LABEL,
  type ActivityType, type ActivityStatus,
} from "@/components/rooster/learn/mock-data";
import { ActivityStatusBadge, TypeBadge } from "@/components/rooster/learn/badges";
import {
  useLearnActivities, learnForms, newQuestion, newOption, QTYPE_OPTIONS, isManualQuestion,
  ensureGradings, learnGrading, useGradingVersion,
  type FormActivity, type FormQuestion, type FormQuestionType,
} from "@/components/rooster/learn/forms-store";
import { useRole, learnCan } from "@/components/rooster/role-context";
import {
  Users, ClipboardList, Plus, Pencil, Trash2, ChevronRight, Search, GripVertical,
  Copy, CheckCircle2, Image as ImageIcon, Type as TypeIcon, Lock, ArrowLeft, Save,
  SquarePen, Paperclip,
} from "lucide-react";


export const Route = createFileRoute("/learn/classes")({
  head: () => ({
    meta: [
      { title: "Turmas e atividades — Rooster Learn" },
      { name: "description", content: "Professores organizam suas turmas e criam atividades com perguntas de múltipla escolha, discursivas, textos e imagens." },
      { property: "og:title", content: "Turmas e atividades — Rooster Learn" },
      { property: "og:description", content: "Construtor de atividades por turma no Rooster Learn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherClassesPage,
});

const TEACHER_ID = "t-1";

function TeacherClassesPage() {
  const { role } = useRole();
  const canCreate = learnCan(role, "createActivity");
  const activities = useLearnActivities();

  const [klassId, setKlassId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [meta, setMeta] = useState<{ open: boolean; editing?: FormActivity } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const myClasses = useMemo(() => {
    if (role !== "professor") return KLASSES;
    const mine = KLASSES.filter((k) => activities.some((a) => a.klassId === k.id && a.teacherId === TEACHER_ID));
    return mine.length ? mine : KLASSES;
  }, [role, activities]);

  const klass = myClasses.find((k) => k.id === klassId) ?? null;
  const editing = activities.find((a) => a.id === editingId) ?? null;
  const grading = activities.find((a) => a.id === gradingId) ?? null;

  if (!canCreate) {
    return (
      <EmptyState icon={Lock} title="Sem permissão" description="Somente professores e administradores podem cadastrar atividades." />
    );
  }

  if (editing) {
    return <ActivityBuilder activity={editing} onBack={() => setEditingId(null)} />;
  }

  if (grading) {
    return <GradingScreen activity={grading} onBack={() => setGradingId(null)} />;
  }

  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const list = klass ? activities.filter((a) => a.klassId === klass.id && match(a.title)) : [];

  return (
    <>
      <CrudHeader
        title="Turmas e atividades"
        description="Selecione uma turma para gerenciar as atividades disponíveis para os alunos."
        actions={
          klass ? (
            <Btn variant="solid" onClick={() => setMeta({ open: true })}>
              <Plus className="h-4 w-4" /> Nova atividade
            </Btn>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <Crumb active={!klass} onClick={() => setKlassId(null)}>
          <Users className="h-3.5 w-3.5" /> Turmas
        </Crumb>
        {klass && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Crumb active onClick={() => undefined}>
              <ClipboardList className="h-3.5 w-3.5" /> {klass.name}
            </Crumb>
          </>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterInput value={q} onChange={setQ} placeholder={klass ? "Buscar atividade..." : "Buscar turma..."} icon={Search} />
      </div>

      {!klass ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {myClasses.filter((k) => match(k.name)).map((k) => {
            const d = discipline(k.disciplineId);
            const count = activities.filter((a) => a.klassId === k.id).length;
            const published = activities.filter((a) => a.klassId === k.id && a.status === "publicada").length;
            return (
              <button
                key={k.id}
                onClick={() => { setKlassId(k.id); setQ(""); }}
                className="group rounded-2xl border bg-card p-5 text-left transition-colors hover:border-foreground/20 hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in oklab, ${d?.color ?? "oklch(0.6 0.1 260)"} 14%, transparent)`, color: d?.color }}
                  >
                    <Users className="h-4 w-4" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-sm font-semibold">{k.name}</p>
                <p className="text-xs text-muted-foreground">{d?.name} · {k.students} alunos</p>
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  <span>{count} atividades</span>
                  <span>{published} publicadas</span>
                </div>
              </button>
            );
          })}
          {myClasses.length === 0 && <EmptyState icon={Users} title="Nenhuma turma vinculada" />}
        </div>
      ) : (
        <SectionCard title={`Atividades · ${klass.name}`} description="CRUD das atividades disponíveis para esta turma.">
          {list.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Nenhuma atividade" description="Crie a primeira atividade para esta turma." />
          ) : (
            <div className="space-y-2">
              {list.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      <TypeBadge type={a.type} />
                      <ActivityStatusBadge status={a.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.questions.length} perguntas · nota máx. {a.maxGrade} · entrega {formatDate(a.dueAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Btn onClick={() => setEditingId(a.id)}><Pencil className="h-3.5 w-3.5" /> Editar perguntas</Btn>
                    {a.questions.some(isManualQuestion) && (
                      <Btn onClick={() => setGradingId(a.id)}><SquarePen className="h-3.5 w-3.5" /> Corrigir</Btn>
                    )}
                    <Btn onClick={() => setMeta({ open: true, editing: a })}>Detalhes</Btn>
                    <Btn onClick={() => setConfirm(a.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {meta?.open && klass && (
        <ActivityMetaModal
          klassId={klass.id}
          editing={meta.editing}
          onClose={() => setMeta(null)}
          onSaved={(id) => { setMeta(null); if (!meta.editing) setEditingId(id); }}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) learnForms.remove(confirm); setConfirm(null); }}
        title="Excluir atividade"
        description="Esta ação remove a atividade e todas as suas perguntas."
      />
    </>
  );
}

function Crumb({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"}`}
    >
      {children}
    </button>
  );
}

const TYPE_OPTIONS = (Object.keys(TYPE_LABEL) as ActivityType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }));
const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as ActivityStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

function ActivityMetaModal({
  klassId, editing, onClose, onSaved,
}: { klassId: string; editing?: FormActivity; onClose: () => void; onSaved: (id: string) => void }) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [type, setType] = useState<ActivityType>(editing?.type ?? "lista");
  const [status, setStatus] = useState<ActivityStatus>(editing?.status ?? "rascunho");
  const [maxGrade, setMaxGrade] = useState(String(editing?.maxGrade ?? 10));
  const [dueAt, setDueAt] = useState((editing?.dueAt ?? new Date(Date.now() + 7 * 864e5).toISOString()).slice(0, 16));

  function save() {
    if (!title.trim()) return;
    const payload = {
      klassId,
      teacherId: editing?.teacherId ?? TEACHER_ID,
      title: title.trim(),
      description: description.trim(),
      type,
      status,
      maxGrade: Number(maxGrade) || 10,
      dueAt: new Date(dueAt).toISOString(),
      questions: editing?.questions ?? [],
    };
    if (editing) { learnForms.update(editing.id, payload); onSaved(editing.id); }
    else onSaved(learnForms.create(payload).id);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Editar atividade" : "Nova atividade"}
      description="Defina as informações gerais. As perguntas são criadas no construtor."
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="solid" onClick={save}>Salvar</Btn></>}
    >
      <div className="grid gap-4">
        <Field label="Título" required><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Lista 4 — Integrais" /></Field>
        <Field label="Descrição"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo"><SelectInput options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value as ActivityType)} /></Field>
          <Field label="Situação"><SelectInput options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value as ActivityStatus)} /></Field>
          <Field label="Nota máxima"><TextInput type="number" value={maxGrade} onChange={(e) => setMaxGrade(e.target.value)} /></Field>
          <Field label="Prazo de entrega"><TextInput type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Construtor de perguntas (estilo Google Forms) ---------- */

function ActivityBuilder({ activity, onBack }: { activity: FormActivity; onBack: () => void }) {
  const [questions, setQuestions] = useState<FormQuestion[]>(activity.questions);
  const [saved, setSaved] = useState(false);

  const total = questions.reduce((s, q) => s + (Number(q.points) || 0), 0);

  function patch(id: string, dto: Partial<FormQuestion>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...dto } : q)));
    setSaved(false);
  }
  function changeType(id: string, type: FormQuestionType) {
    setQuestions((qs) => qs.map((q) => {
      if (q.id !== id) return q;
      const base = newQuestion(type);
      const noOptions = type === "discursiva" || type === "arquivo";
      return { ...q, type, options: noOptions ? [] : q.options.length && type !== "vf" ? q.options : base.options };
    }));
    setSaved(false);
  }

  function save() {
    learnForms.update(activity.id, { questions });
    setSaved(true);
  }

  return (
    <>
      <CrudHeader
        title={activity.title}
        description="Monte a atividade adicionando perguntas, textos de apoio e imagens."
        actions={
          <>
            <Btn onClick={onBack}><ArrowLeft className="h-4 w-4" /> Voltar</Btn>
            <Btn variant="solid" onClick={save}><Save className="h-4 w-4" /> Salvar atividade</Btn>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground">
        <span>{questions.length} perguntas</span>
        <span>Pontuação total: <span className="font-medium text-foreground tabular-nums">{total}</span></span>
        {saved && <span className="inline-flex items-center gap-1 text-[oklch(0.62_0.18_155)]"><CheckCircle2 className="h-3.5 w-3.5" /> Alterações salvas</span>}
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
                  <Field label={`Pergunta ${idx + 1}`} required>
                    <TextInput value={q.statement} onChange={(e) => patch(q.id, { statement: e.target.value })} placeholder="Digite o enunciado" />
                  </Field>
                  <Field label="Tipo de resposta">
                    <SelectInput options={QTYPE_OPTIONS} value={q.type} onChange={(e) => changeType(q.id, e.target.value as FormQuestionType)} />
                  </Field>
                </div>

                <Field label="Texto de apoio (opcional)">
                  <TextArea value={q.text ?? ""} onChange={(e) => patch(q.id, { text: e.target.value })} placeholder="Cole aqui um trecho, contexto ou instrução" className="min-h-16" />
                </Field>

                <Field label="Imagem (opcional)">
                  <FileUpload value={q.imageUrl} onChange={(url) => patch(q.id, { imageUrl: url })} label="Anexar imagem" />
                </Field>

                {q.type === "arquivo" && (
                  <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                    O aluno responde anexando um documento (PDF, Word, planilha, imagem). A correção é manual.
                  </p>
                )}

                {q.type !== "discursiva" && q.type !== "arquivo" && (
                  <div className="space-y-2">
                    <span className="block text-xs font-medium text-muted-foreground">Alternativas</span>
                    {q.options.map((o) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => patch(q.id, {
                            options: q.options.map((x) =>
                              q.type === "multipla-varias"
                                ? x.id === o.id ? { ...x, correct: !x.correct } : x
                                : { ...x, correct: x.id === o.id },
                            ),
                          })}
                          title="Marcar como correta"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center border text-[10px] ${q.type === "multipla-varias" ? "rounded-md" : "rounded-full"} ${o.correct ? "border-transparent bg-foreground text-background" : "text-transparent"}`}
                        >
                          ✓
                        </button>
                        <TextInput
                          value={o.label}
                          onChange={(e) => patch(q.id, { options: q.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })}
                          placeholder="Texto da alternativa"
                          disabled={q.type === "vf"}
                        />
                        {q.type !== "vf" && (
                          <Btn onClick={() => patch(q.id, { options: q.options.filter((x) => x.id !== o.id) })} className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Btn>
                        )}
                      </div>
                    ))}
                    {q.type !== "vf" && (
                      <Btn onClick={() => patch(q.id, { options: [...q.options, newOption()] })}>
                        <Plus className="h-3.5 w-3.5" /> Adicionar alternativa
                      </Btn>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Pontos
                    <input
                      type="number"
                      value={q.points}
                      onChange={(e) => patch(q.id, { points: Number(e.target.value) })}
                      className="w-20 rounded-lg border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={q.required} onChange={(e) => patch(q.id, { required: e.target.checked })} />
                    Obrigatória
                  </label>
                  <div className="ml-auto flex gap-1.5">
                    <Btn onClick={() => setQuestions((qs) => [...qs.slice(0, idx + 1), { ...q, id: `${q.id}-copy-${Date.now()}` }, ...qs.slice(idx + 1)])}>
                      <Copy className="h-3.5 w-3.5" /> Duplicar
                    </Btn>
                    <Btn onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </Btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <EmptyState icon={ClipboardList} title="Nenhuma pergunta" description="Adicione a primeira pergunta da atividade." />
        )}

        <div className="flex flex-wrap gap-2">
          <Btn variant="solid" onClick={() => { setQuestions((qs) => [...qs, newQuestion("multipla-uma")]); setSaved(false); }}>
            <Plus className="h-4 w-4" /> Múltipla escolha
          </Btn>
          <Btn onClick={() => { setQuestions((qs) => [...qs, newQuestion("discursiva")]); setSaved(false); }}>
            <TypeIcon className="h-4 w-4" /> Discursiva
          </Btn>
          <Btn onClick={() => { setQuestions((qs) => [...qs, newQuestion("vf")]); setSaved(false); }}>
            <CheckCircle2 className="h-4 w-4" /> Verdadeiro ou Falso
          </Btn>
          <Btn onClick={() => { setQuestions((qs) => [...qs, { ...newQuestion("discursiva"), statement: "Analise a imagem a seguir" }]); setSaved(false); }}>
            <ImageIcon className="h-4 w-4" /> Pergunta com imagem
          </Btn>
          <Btn onClick={() => { setQuestions((qs) => [...qs, { ...newQuestion("arquivo"), statement: "Envie o documento da atividade" }]); setSaved(false); }}>
            <Paperclip className="h-4 w-4" /> Envio de documento
          </Btn>
        </div>
      </div>
    </>
  );
}

/* ---------- Correção de respostas discursivas ---------- */

function GradingScreen({ activity, onBack }: { activity: FormActivity; onBack: () => void }) {
  useGradingVersion();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const discursivas = activity.questions.filter(isManualQuestion);
  const students = STUDENTS.filter((s) => s.klassId === activity.klassId);
  const entries = useMemo(
    () => ensureGradings(activity, students.map((s) => s.id)),
    [activity, students.length],
  );

  const rows = entries
    .map((e) => ({ e, student: students.find((s) => s.id === e.studentId)! }))
    .filter((r) => r.student && (!q || r.student.name.toLowerCase().includes(q.toLowerCase())));

  const gradedCount = entries.filter((e) => e.graded).length;
  const maxPoints = discursivas.reduce((s, x) => s + (Number(x.points) || 0), 0);
  const open = rows.find((r) => r.e.studentId === openId) ?? null;

  return (
    <>
      <CrudHeader
        title={`Correção · ${activity.title}`}
        description="Avalie as respostas discursivas de cada aluno, atribua a nota por questão e registre o feedback."
        actions={<Btn onClick={onBack}><ArrowLeft className="h-4 w-4" /> Voltar</Btn>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground">
        <span>{discursivas.length} questões discursivas</span>
        <span>Pontuação discursiva: <span className="font-medium text-foreground tabular-nums">{maxPoints}</span></span>
        <span>Corrigidas: <span className="font-medium text-foreground tabular-nums">{gradedCount}/{entries.length}</span></span>
      </div>

      <div className="mb-4">
        <FilterInput value={q} onChange={setQ} placeholder="Buscar aluno..." icon={Search} />
      </div>

      <SectionCard title="Entregas" description="Somente questões discursivas exigem correção manual.">
        {rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nenhuma entrega" />
        ) : (
          <div className="space-y-2">
            {rows.map(({ e, student }) => {
              const total = discursivas.reduce((s, x) => s + (e.scores[x.id] ?? 0), 0);
              return (
                <div key={e.studentId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{student.name}</p>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] ${e.graded ? "bg-[color-mix(in_oklab,oklch(0.62_0.18_155)_16%,transparent)] text-[oklch(0.62_0.18_155)]" : "bg-accent text-muted-foreground"}`}>
                        {e.graded ? "Corrigida" : "Aguardando correção"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Enviado em {formatDate(e.submittedAt)}
                      {e.graded && ` · ${total.toFixed(1)} de ${maxPoints} pontos`}
                    </p>
                  </div>
                  <Btn variant={e.graded ? undefined : "solid"} onClick={() => setOpenId(e.studentId)}>
                    <SquarePen className="h-3.5 w-3.5" /> {e.graded ? "Revisar" : "Corrigir"}
                  </Btn>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {open && (
        <GradeModal
          activity={activity}
          questions={discursivas}
          studentName={open.student.name}
          entry={open.e}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

function GradeModal({
  activity, questions, studentName, entry, onClose,
}: {
  activity: FormActivity;
  questions: FormQuestion[];
  studentName: string;
  entry: import("@/components/rooster/learn/forms-store").GradingEntry;
  onClose: () => void;
}) {
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(questions.map((q) => [q.id, entry.scores[q.id] === null || entry.scores[q.id] === undefined ? "" : String(entry.scores[q.id])])),
  );
  const [feedback, setFeedback] = useState(entry.feedback);

  const total = questions.reduce((s, q) => s + (Number(scores[q.id]) || 0), 0);
  const maxPoints = questions.reduce((s, q) => s + (Number(q.points) || 0), 0);

  function save() {
    learnGrading.save(activity.id, entry.studentId, {
      scores: Object.fromEntries(questions.map((q) => [q.id, scores[q.id] === "" ? null : Number(scores[q.id])])),
      feedback,
      graded: true,
    });
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Corrigir · ${studentName}`}
      description={`${questions.length} respostas discursivas · ${total.toFixed(1)} de ${maxPoints} pontos`}
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="solid" onClick={save}><CheckCircle2 className="h-4 w-4" /> Salvar correção</Btn></>}
    >
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border p-3">
            <p className="text-sm font-medium">{i + 1}. {q.statement || "Sem enunciado"}</p>
            {q.text && <p className="mt-1 text-xs text-muted-foreground">{q.text}</p>}
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-accent/40 p-3 text-sm">
              {entry.answers[q.id] ?? "Sem resposta enviada."}
            </p>
            <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              Nota
              <input
                type="number"
                min={0}
                max={q.points}
                step="0.5"
                value={scores[q.id] ?? ""}
                onChange={(e) => setScores((s) => ({ ...s, [q.id]: e.target.value }))}
                className="w-24 rounded-lg border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              de {q.points} pontos
            </label>
          </div>
        ))}
        <Field label="Feedback ao aluno">
          <TextArea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Comentário geral sobre a entrega" />
        </Field>
      </div>
    </Modal>
  );
}
