import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CrudHeader, SectionCard, EmptyState, Btn, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, FilterInput, LoadingBlock,
} from "@/components/shared";
import {
  learnService, TYPE_LABEL, formatDate, fmtSize,
  type Activity, type ActivityType, type ActivityDraft, type Submission,
} from "@/services/mock-api/learn.service";
import { academyService, type SchoolClass } from "@/services/mock-api/academy.service";
import { ActivityStatusBadge, TypeBadge } from "@/components/rooster/learn/badges";
import { useRole, learnCan } from "@/components/rooster/role-context";
import { useCan } from "@/components/rooster/hub/permission-context";
import {
  Users, ClipboardList, Plus, Pencil, Trash2, ChevronRight, Search,
  CheckCircle2, Lock, ArrowLeft, Send, Paperclip, SquarePen,
} from "lucide-react";
import { fmtNumero, fmtNumeroLivre } from "@/lib/formatacao";

export const Route = createFileRoute("/learn/classes")({
  head: () => ({
    meta: [
      { title: "Turmas e atividades — Rooster Learn" },
      { name: "description", content: "Professores organizam suas turmas e cadastram atividades (provas, listas, trabalhos, questionários e materiais) vinculadas às turmas reais do Rooster Academy." },
    ],
  }),
  component: TeacherClassesPage,
});

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function TeacherClassesPage() {
  const { role } = useRole();
  const canCreate = learnCan(role, "createActivity");
  // Decisão SEMPRE pela permissão real (nunca a Visão de demonstração): quem não tem
  // `academy.manage.acessar` de verdade toma 403 do backend se `minhas:true` não for enviado.
  const podeGestao = useCan("/academy/manage", "acessar");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [meta, setMeta] = useState<{ open: boolean; editing?: Activity } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    academyService.getClasses(podeGestao ? undefined : { minhas: true })
      .then(setClasses)
      .finally(() => setLoadingClasses(false));
  }, [podeGestao]);

  function reloadActivities(id: string) {
    learnService.getByClass(id).then(setActivities);
  }
  useEffect(() => {
    if (classId) reloadActivities(classId);
    else setActivities([]);
  }, [classId]);

  const klass = classes.find((k) => k.id === classId) ?? null;
  const grading = activities.find((a) => a.id === gradingId) ?? null;

  if (!canCreate) {
    return <EmptyState icon={Lock} title="Sem permissão" description="Somente professores e administradores podem cadastrar atividades." />;
  }

  if (grading) {
    return <GradingScreen activity={grading} onBack={() => setGradingId(null)} />;
  }

  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const list = klass ? activities.filter((a) => match(a.title)) : [];

  return (
    <>
      <CrudHeader
        title="Turmas e atividades"
        description="Selecione uma turma para gerenciar as atividades disponíveis para os alunos."
        actions={klass ? <Btn variant="solid" onClick={() => setMeta({ open: true })}><Plus className="h-4 w-4" /> Nova atividade</Btn> : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <Crumb active={!klass} onClick={() => setClassId(null)}><Users className="h-3.5 w-3.5" /> Turmas</Crumb>
        {klass && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Crumb active onClick={() => undefined}><ClipboardList className="h-3.5 w-3.5" /> {klass.code}</Crumb>
          </>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterInput value={q} onChange={setQ} placeholder={klass ? "Buscar atividade..." : "Buscar turma..."} icon={Search} />
      </div>

      {!klass ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.filter((k) => match(k.code)).map((k) => (
            <button
              key={k.id}
              onClick={() => { setClassId(k.id); setQ(""); }}
              className="group rounded-2xl border bg-card p-5 text-left transition-colors hover:border-foreground/20 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent"><Users className="h-4 w-4" /></span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-sm font-semibold">{k.code}</p>
              <p className="text-xs text-muted-foreground">{k.shift} · {k.enrolledCount}/{k.capacity} alunos</p>
            </button>
          ))}
          {!loadingClasses && classes.length === 0 && <EmptyState icon={Users} title="Nenhuma turma vinculada" />}
        </div>
      ) : (
        <SectionCard title={`Atividades · ${klass.code}`} description="Cadastro de atividades (provas, listas, trabalhos, questionários e materiais) desta turma.">
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
                      peso {fmtNumeroLivre(a.weight)} · nota máx. {a.maxGrade} · prazo {formatDate(a.dueAt)} · {a.submissionsCount} entrega(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {a.status === "rascunho" || a.status === "agendada" ? (
                      <Btn onClick={async () => {
                        try {
                          await learnService.publish(a.id);
                          reloadActivities(klass.id);
                          toast.success("Atividade publicada com sucesso");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Falha ao publicar atividade");
                        }
                      }}><Send className="h-3.5 w-3.5" /> Publicar</Btn>
                    ) : null}
                    <Btn onClick={() => setGradingId(a.id)}><SquarePen className="h-3.5 w-3.5" /> Entregas</Btn>
                    <Btn onClick={() => { setMeta({ open: true, editing: a }); }}><Pencil className="h-3.5 w-3.5" /> Editar</Btn>
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
          classId={klass.id}
          editing={meta.editing}
          onClose={() => setMeta(null)}
          onSaved={() => { setMeta(null); reloadActivities(klass.id); }}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm) {
            try {
              await learnService.remove(confirm);
              if (klass) reloadActivities(klass.id);
              toast.success("Atividade excluída com sucesso");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Falha ao excluir atividade");
            }
          }
          setConfirm(null);
        }}
        title="Excluir atividade"
        description="Esta ação remove a atividade e as entregas associadas."
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

function ActivityMetaModal({
  classId, editing, onClose, onSaved,
}: { classId: string; editing?: Activity; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [type, setType] = useState<ActivityType>(editing?.type ?? "lista");
  const [weight, setWeight] = useState(String(editing?.weight ?? 1));
  const [maxGrade, setMaxGrade] = useState(String(editing?.maxGrade ?? 10));
  const [dueAt, setDueAt] = useState(toDatetimeLocal(editing?.dueAt ?? new Date(Date.now() + 7 * 864e5).toISOString()));
  const [opensAt, setOpensAt] = useState(toDatetimeLocal(editing?.opensAt ?? null));
  const [timeLimitMin, setTimeLimitMin] = useState(editing?.timeLimitMin ? String(editing.timeLimitMin) : "");
  const [allowLate, setAllowLate] = useState(editing?.allowLate ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) { setError("Informe o título da atividade."); return; }
    setSaving(true);
    setError(null);
    const draft: ActivityDraft = {
      title: title.trim(), type, description: description.trim(), classId,
      weight: Number(weight) || 0, maxGrade: Number(maxGrade) || 10,
      opensAt: opensAt ? new Date(opensAt).toISOString() : null,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      timeLimitMin: timeLimitMin ? Number(timeLimitMin) : null,
      allowLate,
    };
    try {
      if (editing) await learnService.update(editing.id, draft);
      else await learnService.create(draft);
      onSaved();
      toast.success(editing ? "Atividade atualizada com sucesso" : "Atividade criada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar a atividade";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Editar atividade" : "Nova atividade"}
      description="Provas, listas, trabalhos, questionários e materiais — sem banco de questões (o aluno responde com texto livre e anexos)."
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="solid" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Btn></>}
    >
      <div className="grid gap-4">
        <Field label="Título" required><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Lista 4 — Integrais" /></Field>
        <Field label="Descrição"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo"><SelectInput options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value as ActivityType)} /></Field>
          <Field label="Peso"><TextInput type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
          <Field label="Nota máxima"><TextInput type="number" value={maxGrade} onChange={(e) => setMaxGrade(e.target.value)} /></Field>
          <Field label="Tempo máximo (min, opcional)"><TextInput type="number" value={timeLimitMin} onChange={(e) => setTimeLimitMin(e.target.value)} /></Field>
          <Field label="Abertura (opcional)"><TextInput type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} /></Field>
          <Field label="Prazo de entrega"><TextInput type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)} /> Permitir entrega após o prazo (marcada como atrasada)
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </Modal>
  );
}

/* ---------- Correção de entregas ---------- */

function GradingScreen({ activity, onBack }: { activity: Activity; onBack: () => void }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  function reload() {
    learnService.getSubmissions(activity.id).then((rows) => { setSubmissions(rows); setLoading(false); });
  }
  useEffect(reload, [activity.id]);

  const rows = submissions.filter((s) => !q || s.studentName.toLowerCase().includes(q.toLowerCase()));
  const current = rows.find((r) => r.id === selected) ?? rows[0] ?? null;
  const graded = submissions.filter((s) => s.status === "corrigida").length;

  return (
    <>
      <CrudHeader
        title={`Entregas · ${activity.title}`}
        description="Avalie cada entrega com nota e feedback. A nota propaga automaticamente para o Rooster Academy quando a atividade tem peso."
        actions={<Btn onClick={onBack}><ArrowLeft className="h-4 w-4" /> Voltar</Btn>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground">
        <span>{submissions.length} entrega(s)</span>
        <span>Corrigidas: <span className="font-medium text-foreground tabular-nums">{graded}/{submissions.length}</span></span>
      </div>

      <div className="mb-4"><FilterInput value={q} onChange={setQ} placeholder="Buscar aluno..." icon={Search} /></div>

      {loading ? (
        <LoadingBlock lines={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma entrega" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <ul className="max-h-[560px] divide-y divide-border/60 overflow-y-auto">
              {rows.map((s) => {
                const isActive = (selected ?? rows[0]?.id) === s.id;
                return (
                  <li key={s.id}>
                    <button onClick={() => setSelected(s.id)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 ${isActive ? "bg-muted/60" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{s.studentName}</div>
                        <div className="text-[11px] text-muted-foreground">{s.submittedAt ? formatDate(s.submittedAt) : "Não enviou"} · {s.status}</div>
                      </div>
                      {s.grade !== null ? <span className="text-sm font-semibold tabular-nums">{fmtNumero(s.grade, 1)}</span> : null}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {current ? <GradePanel key={current.id} submission={current} maxGrade={activity.maxGrade} onSaved={reload} /> : null}
        </div>
      )}
    </>
  );
}

function GradePanel({ submission, maxGrade, onSaved }: { submission: Submission; maxGrade: number; onSaved: () => void }) {
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
    <SectionCard
      title={submission.studentName}
      action={<span className="text-xs text-muted-foreground">{submission.submittedAt ? formatDate(submission.submittedAt) : "Não enviou"}</span>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-background p-4 text-sm whitespace-pre-wrap">
            {submission.text || <span className="text-muted-foreground">Sem resposta em texto.</span>}
          </div>
          {submission.attachments.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Anexos</p>
              <ul className="space-y-1.5">
                {submission.attachments.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 text-xs"><Paperclip className="h-3.5 w-3.5 text-muted-foreground" /> {f.name} <span className="text-muted-foreground">({fmtSize(f.size)})</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 p-4">
            <label className="text-xs font-medium text-muted-foreground">Nota (máx. {maxGrade})</label>
            <div className="mt-2 flex items-center gap-2">
              <TextInput type="number" step="0.1" value={nota} onChange={(e) => setNota(e.target.value)} className="h-9 text-lg font-semibold" placeholder="0.0" />
            </div>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <label className="text-xs font-medium text-muted-foreground">Feedback</label>
            <TextArea rows={4} className="mt-2" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Escreva um feedback construtivo..." />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Btn variant="solid" className="w-full justify-center" onClick={save} disabled={saving}><CheckCircle2 className="h-3.5 w-3.5" /> {saving ? "Salvando…" : "Salvar correção"}</Btn>
        </div>
      </div>
    </SectionCard>
  );
}
