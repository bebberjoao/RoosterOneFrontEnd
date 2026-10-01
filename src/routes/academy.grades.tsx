import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/rooster/page-header";
import {
  academyService, toneFor,
  type SchoolClass,
  type Enrollment,
  type GradeItem,
  type GradeItemWithScores,
} from "@/services/mock-api/academy.service";
import { ApiError } from "@/services/hub/client";
import { useCan } from "@/components/rooster/hub/permission-context";
import {
  ChevronLeft,
  Plus,
  Users,
  GraduationCap,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Percent,
  Trash2,
  Pencil,
  ClipboardList,
  ListChecks,
  Loader2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Modal } from "@/components/shared";
import { fmtNumero } from "@/lib/formatacao";

export const Route = createFileRoute("/academy/grades")({
  head: () => ({
    meta: [
      { title: "Notas por turma — Rooster Academy" },
      {
        name: "description",
        content: "Configure a composição da nota (peso e nota máxima de cada item) e lance as notas dos alunos matriculados em cada turma.",
      },
      { property: "og:title", content: "Notas por turma — Rooster Academy" },
      { property: "og:description", content: "Composição de nota configurável com integração ao Rooster Learn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Grades,
});

/** Nota mínima de aprovação (0–10) — mesmo critério usado no portal do aluno (studentService). */
const PASS_MARK = 6;

function errMsg(err: unknown, forbidden = "Você não tem permissão para acessar as notas desta turma.") {
  if (err instanceof ApiError) return err.status === 403 ? forbidden : err.message;
  return err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
}

/** Média ponderada — replica `calcularMediaTurma` do backend: itens sem nota lançada não entram no cálculo. */
function weightedAverage(items: GradeItemWithScores[], studentId: string): number | null {
  let somaPesos = 0;
  let somaPonderada = 0;
  for (const it of items) {
    const nota = it.scores[studentId];
    if (nota == null) continue;
    somaPesos += it.weight;
    somaPonderada += nota * it.weight;
  }
  if (somaPesos === 0) return null;
  return +(somaPonderada / somaPesos).toFixed(2);
}

function Grades() {
  // Decisão SEMPRE pela permissão real (nunca a Visão de demonstração): quem não tem
  // `academy.manage.acessar` de verdade toma 403 do backend se `minhas:true` não for enviado.
  const podeGestao = useCan("/academy/manage", "acessar");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [itemsByClass, setItemsByClass] = useState<Record<string, GradeItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openClassId, setOpenClassId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Professor só vê as próprias turmas (`minhas: true`); coordenação/admin podem
    // configurar composição e lançar notas em qualquer turma, então buscam todas.
    academyService
      .getClasses(podeGestao ? undefined : { minhas: true })
      .then(async (myClasses) => {
        if (cancelled) return;
        setClasses(myClasses);
        const entries = await Promise.all(
          myClasses.map(async (k) => {
            try {
              return [k.id, await academyService.getGradeItems(k.id)] as const;
            } catch {
              return [k.id, [] as GradeItem[]] as const;
            }
          }),
        );
        if (!cancelled) setItemsByClass(Object.fromEntries(entries));
      })
      .catch((err) => !cancelled && setError(errMsg(err, "Você não tem permissão para acessar as notas.")))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [podeGestao]);

  if (openClassId) {
    const k = classes.find((c) => c.id === openClassId);
    if (k) return <KlassGrades klass={k} onBack={() => setOpenClassId(null)} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Academy"
        title="Notas"
        description="Acesse uma turma para definir a composição da nota (peso e nota máxima de cada item) e lançar as notas dos alunos matriculados."
      />

      {loading && (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando suas turmas…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((k) => {
            const accent = toneFor(k.disciplineId);
            const items = itemsByClass[k.id] ?? [];
            const totalPct = Math.round(items.reduce((s, c) => s + c.weight, 0) * 1000) / 10;
            return (
              <button
                key={k.id}
                onClick={() => setOpenClassId(k.id)}
                className="group rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent }}
                  >
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{k.disciplineName ?? "—"}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{k.disciplineCode} · Turma {k.code}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {k.enrolledCount} alunos</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {k.shift}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <ListChecks className="h-3.5 w-3.5" /> {items.length} componentes
                  </span>
                  <span>Peso: <span className="font-semibold text-foreground">{totalPct}%</span></span>
                </div>
              </button>
            );
          })}
          {classes.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              {podeGestao ? "Nenhuma turma cadastrada no momento." : "Você não leciona nenhuma turma no momento."}
            </p>
          )}
        </div>
      )}
    </>
  );
}

function KlassGrades({ klass: k, onBack }: { klass: SchoolClass; onBack: () => void }) {
  const [items, setItems] = useState<GradeItemWithScores[]>([]);
  const [roster, setRoster] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<GradeItem | "new" | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([academyService.getGradeItemsWithScores(k.id), academyService.getEnrollmentsByClass(k.id)])
      .then(([its, roster]) => { setItems(its); setRoster(roster); })
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [k.id]);

  const totalWeight = items.reduce((s, c) => s + c.weight, 0);
  const totalPct = Math.round(totalWeight * 1000) / 10;

  const finals = roster.map((e) => ({ studentId: e.studentId, value: weightedAverage(items, e.studentId) }));
  const graded = finals.filter((f) => f.value !== null);
  const classAvg = graded.length ? +(graded.reduce((s, f) => s + (f.value as number), 0) / graded.length).toFixed(2) : null;
  const approval = graded.length ? Math.round((graded.filter((f) => (f.value as number) >= PASS_MARK).length / graded.length) * 100) : 0;

  async function saveComponent(dto: { id?: string; name: string; weightPct: number; max: number }) {
    try {
      if (dto.id) {
        await academyService.updateGradeItem(dto.id, { name: dto.name, weight: dto.weightPct / 100, max: dto.max });
      } else {
        await academyService.createGradeItem({ classId: k.id, name: dto.name, weight: dto.weightPct / 100, max: dto.max });
      }
      setModal(null);
      load();
      toast.success(dto.id ? "Componente atualizado com sucesso" : "Componente criado com sucesso");
    } catch (err) {
      const message = errMsg(err, "Você não tem permissão para configurar os componentes desta turma.");
      setError(message);
      toast.error(message);
    }
  }

  async function removeComponent(id: string) {
    try {
      await academyService.removeGradeItem(id);
      load();
      toast.success("Componente removido com sucesso");
    } catch (err) {
      const message = errMsg(err, "Você não tem permissão para remover componentes desta turma.");
      setError(message);
      toast.error(message);
    }
  }

  async function commitGrade(itemId: string, studentId: string, value: number | null) {
    const snapshot = items;
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, scores: { ...it.scores, [studentId]: value } } : it)));
    try {
      await academyService.setGrade(itemId, studentId, value);
      setSavedNote(true);
      window.setTimeout(() => setSavedNote(false), 2000);
      toast.success("Nota lançada com sucesso");
    } catch (err) {
      setItems(snapshot);
      const message = errMsg(err, "Você não tem permissão para lançar notas nesta turma.");
      setError(message);
      toast.error(message);
    }
  }

  const tone = (v: number, max: number) => {
    const r = max ? v / max : 0;
    return r >= 0.7 ? "oklch(0.62 0.18 155)" : r >= 0.6 ? "oklch(0.72 0.14 90)" : "oklch(0.65 0.18 25)";
  };

  return (
    <>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Voltar para as turmas
      </button>

      <PageHeader
        eyebrow={`Rooster Academy · ${k.disciplineCode ?? ""} · Turma ${k.code}`}
        title={k.disciplineName ?? "Notas"}
        description={`${k.shift} · ${k.schedule || "Horário a definir"} · ${roster.length} alunos matriculados`}
        actions={
          <button onClick={() => setModal("new")} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <Plus className="h-4 w-4" /> Novo componente
          </button>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando notas…
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Kpi icon={Percent} tone="oklch(0.55 0.19 265)" label="Peso configurado" value={`${totalPct}%`} />
            <Kpi icon={ClipboardList} tone="oklch(0.68 0.14 195)" label="Componentes" value={String(items.length)} />
            <Kpi icon={CheckCircle2} tone="oklch(0.62 0.18 155)" label="Média da turma" value={classAvg === null ? "—" : String(classAvg)} />
            <Kpi icon={Users} tone="oklch(0.72 0.14 90)" label="Aprovação" value={`${approval}%`} />
          </div>

          <div className="mb-4 overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Composição da nota</span>
              <span className="text-[11px] text-muted-foreground">
                Soma dos pesos: <span className={Math.abs(totalWeight - 1) < 0.005 ? "font-semibold text-foreground" : "font-semibold"} style={Math.abs(totalWeight - 1) < 0.005 ? undefined : { color: "oklch(0.72 0.14 90)" }}>{totalPct}%</span>
              </span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
              {items.map((c) => {
                const isLearn = c.origin === "learn";
                return (
                  <div key={c.id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px]" style={{ color: isLearn ? "oklch(0.6 0.2 305)" : "oklch(0.55 0.19 265)" }}>
                          {isLearn ? <Sparkles className="h-3 w-3" /> : null}
                          {isLearn ? "Vindo do Rooster Learn" : "Lançamento manual"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: "color-mix(in oklab, oklch(0.55 0.19 265) 14%, transparent)", color: "oklch(0.55 0.19 265)" }}>
                        {Math.round(c.weight * 1000) / 10}%
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">Nota máxima: {c.max} pts</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {isLearn ? (
                        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-muted-foreground">
                          <Lock className="h-3 w-3" /> Somente leitura
                        </span>
                      ) : (
                        <>
                          <button onClick={() => setModal(c)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-accent">
                            <Pencil className="h-3 w-3" /> Editar
                          </button>
                          <button onClick={() => removeComponent(c.id)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-accent" style={{ color: "oklch(0.65 0.18 25)" }}>
                            <Trash2 className="h-3 w-3" /> Remover
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                  Nenhum componente configurado. Clique em "Novo componente" para definir como a nota será composta.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 text-left">Aluno</th>
                  {items.map((c) => (
                    <th key={c.id} className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center gap-1">
                          {c.name}
                          {c.origin === "learn" && <Sparkles className="h-3 w-3" style={{ color: "oklch(0.6 0.2 305)" }} />}
                        </span>
                        <span className="text-[10px] font-normal text-muted-foreground/80">{c.max} pts</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-center">Nota final</th>
                  <th className="px-4 py-2.5 text-center">Situação</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((e) => {
                  const s = e.student;
                  const total = weightedAverage(items, e.studentId);
                  const ok = total !== null && total >= PASS_MARK;
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-accent/20">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px]">{s?.initials ?? "—"}</div>
                          <div>
                            <div className="text-sm">{s?.name ?? e.studentId}</div>
                            <div className="text-[10px] text-muted-foreground">RA {s?.ra ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      {items.map((c) => {
                        const v = c.scores[e.studentId] ?? null;
                        if (c.origin !== "learn") {
                          return (
                            <td key={c.id} className="px-2 py-2 text-center">
                              <ManualScoreCell max={c.max} value={v} onCommit={(nv) => commitGrade(c.id, e.studentId, nv)} />
                            </td>
                          );
                        }
                        return (
                          <td key={c.id} className="px-2 py-2 text-center text-sm font-medium" style={{ color: v == null ? undefined : tone(v, c.max) }}>
                            {v ?? "—"}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-center text-sm font-semibold" style={{ color: total == null ? undefined : tone(total, 10) }}>
                        {total ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            background: `color-mix(in oklab, ${ok ? "oklch(0.62 0.18 155)" : "oklch(0.65 0.18 25)"} 14%, transparent)`,
                            color: ok ? "oklch(0.62 0.18 155)" : "oklch(0.65 0.18 25)",
                          }}
                        >
                          {total === null ? "Pendente" : ok ? "Aprovado" : "Recuperação"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {roster.length === 0 && (
                  <tr><td colSpan={items.length + 3} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum aluno matriculado nesta turma.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Componentes marcados com <Sparkles className="mx-0.5 inline h-3 w-3" style={{ color: "oklch(0.6 0.2 305)" }} /> vêm de atividades do Rooster Learn corrigidas por lá — somente leitura aqui.
            As notas lançadas manualmente são salvas automaticamente ao sair do campo. Aprovação a partir de {fmtNumero(PASS_MARK, 1)} (escala 0–10).
            {savedNote && <span className="ml-2 font-medium" style={{ color: "oklch(0.62 0.18 155)" }}>Nota salva</span>}
          </p>
        </>
      )}

      {modal && (
        <ComponentModal
          initial={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveComponent}
        />
      )}
    </>
  );
}

function ManualScoreCell({ max, value, onCommit }: { max: number; value: number | null; onCommit: (v: number | null) => void }) {
  const [text, setText] = useState(value == null ? "" : String(value));
  useEffect(() => { setText(value == null ? "" : String(value)); }, [value]);
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const raw = text.trim();
        if (raw === "") { onCommit(null); return; }
        const n = Math.min(max, Math.max(0, parseFloat(raw.replace(",", "."))));
        if (Number.isNaN(n)) { setText(value == null ? "" : String(value)); return; }
        setText(String(n));
        onCommit(n);
      }}
      inputMode="decimal"
      placeholder="—"
      className="w-16 rounded-md border bg-background px-1.5 py-1 text-center text-sm"
    />
  );
}

function ComponentModal({
  initial,
  onClose,
  onSave,
}: {
  initial: GradeItem | null;
  onClose: () => void;
  onSave: (dto: { id?: string; name: string; weightPct: number; max: number }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [weightPct, setWeightPct] = useState(String(initial ? Math.round(initial.weight * 1000) / 10 : 10));
  const [max, setMax] = useState(String(initial?.max ?? 10));
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const w = parseFloat(weightPct.replace(",", "."));
    const m = parseFloat(max.replace(",", "."));
    if (!name.trim()) { setErr("Informe uma descrição."); return; }
    if (isNaN(w) || w <= 0 || w > 100) { setErr("Peso deve ser um percentual entre 0 e 100."); return; }
    if (isNaN(m) || m <= 0) { setErr("Nota máxima deve ser maior que zero."); return; }
    onSave({ id: initial?.id, name: name.trim(), weightPct: w, max: m });
  };

  return (
    <Modal open onClose={onClose} title={initial ? "Editar componente da nota" : "Novo componente da nota"}>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Descrição</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Prova 1, Trabalho em grupo, Seminário"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Peso (%)</label>
            <input
              value={weightPct}
              onChange={(e) => setWeightPct(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Nota máxima</label>
            <input
              value={max}
              onChange={(e) => setMax(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg border px-3 py-2 text-sm hover:bg-accent">Cancelar</button>
          <button onClick={submit} className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

function Kpi({ icon: Icon, tone, label, value }: { icon: any; tone: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklab, ${tone} 14%, transparent)`, color: tone }}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
