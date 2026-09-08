import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import {
  KLASSES,
  STUDENTS,
  klassById,
  disciplineById,
  teacherById,
  studentAttendance,
} from "@/components/rooster/academy/mock-data";
import type { Klass } from "@/components/rooster/academy/mock-data";
import {
  learnForms,
  resolveStudentResponse,
  questionScore,
  useGradingVersion,
} from "@/components/rooster/learn/forms-store";
import {
  ChevronLeft,
  Plus,
  Save,
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
} from "lucide-react";
import { Modal, SelectInput } from "@/components/shared";

export const Route = createFileRoute("/academy/grades")({
  head: () => ({
    meta: [
      { title: "Notas por turma — Rooster Academy" },
      {
        name: "description",
        content:
          "Configure a composição da nota (provas, atividades e presença) e lance as notas dos alunos matriculados em cada turma.",
      },
      { property: "og:title", content: "Notas por turma — Rooster Academy" },
      {
        property: "og:description",
        content: "Composição de nota configurável com integração ao Rooster Learn e à frequência da turma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Grades,
});

/* ---------------- Mock store em memória ---------------- */
// Trocar por GET/POST /turmas/:id/composicao-nota e /turmas/:id/notas.

export type GradeSource = "manual" | "attendance" | "learn";

export type GradeComponent = {
  id: string;
  name: string;
  points: number;
  source: GradeSource;
};

const SOURCE_META: Record<GradeSource, { label: string; hint: string; tone: string }> = {
  manual: { label: "Lançamento manual", hint: "O professor digita a nota de cada aluno.", tone: "oklch(0.55 0.19 265)" },
  attendance: { label: "Presença (Academy)", hint: "Calculada pela frequência registrada na chamada.", tone: "oklch(0.62 0.18 155)" },
  learn: { label: "Atividades do Rooster Learn", hint: "Calculada pelas atividades online corrigidas.", tone: "oklch(0.6 0.2 305)" },
};

const schemes = new Map<string, GradeComponent[]>();
const manualScores = new Map<string, number | null>();
const sKey = (klassId: string, componentId: string, studentId: string) => `${klassId}|${componentId}|${studentId}`;
const uid = () => Math.random().toString(36).slice(2, 9);

function defaultScheme(): GradeComponent[] {
  return [
    { id: "c-presenca", name: "Presença", points: 10, source: "attendance" },
    { id: "c-atividades", name: "Atividades online", points: 20, source: "learn" },
    { id: "c-p1", name: "Prova 1", points: 35, source: "manual" },
    { id: "c-p2", name: "Prova 2", points: 35, source: "manual" },
  ];
}

function getScheme(klassId: string) {
  if (!schemes.has(klassId)) schemes.set(klassId, defaultScheme());
  return schemes.get(klassId)!;
}

const hashNum = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** Percentual (0–1) obtido pelo aluno nas atividades online da turma. */
function learnRatio(klassId: string, studentId: string) {
  const activities = learnForms.byClass(klassId);
  let got = 0;
  let total = 0;
  activities.forEach((a) => {
    const resp = resolveStudentResponse(a, studentId);
    a.questions.forEach((q) => {
      total += q.points;
      got += questionScore(a, q, resp, studentId) ?? 0;
    });
  });
  if (total === 0) return null;
  return got / total;
}

function componentScore(klassId: string, c: GradeComponent, studentId: string): number | null {
  if (c.source === "attendance") return +((studentAttendance(studentId, klassId) / 100) * c.points).toFixed(1);
  if (c.source === "learn") {
    const r = learnRatio(klassId, studentId);
    if (r == null) return null;
    return +(r * c.points).toFixed(1);
  }
  const key = sKey(klassId, c.id, studentId);
  if (!manualScores.has(key)) {
    // semeia notas determinísticas para o mock
    const h = hashNum(key) % 100;
    manualScores.set(key, +((0.55 + (h / 100) * 0.45) * c.points).toFixed(1));
  }
  return manualScores.get(key) ?? null;
}

/* ---------------- Telas ---------------- */

function Grades() {
  const [openKlassId, setOpenKlassId] = useState<string | null>(null);

  if (openKlassId) return <KlassGrades klassId={openKlassId} onBack={() => setOpenKlassId(null)} />;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Academy"
        title="Notas"
        description="Acesse uma turma para definir a composição da nota (provas, atividades e presença) e lançar as notas dos alunos matriculados."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {KLASSES.map((k) => {
          const d = disciplineById(k.disciplineId);
          const t = teacherById(k.teacherId);
          const scheme = getScheme(k.id);
          const total = scheme.reduce((s, c) => s + c.points, 0);
          return (
            <button
              key={k.id}
              onClick={() => setOpenKlassId(k.id)}
              className="group rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-accent/40"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `color-mix(in oklab, ${d?.accent} 14%, transparent)`, color: d?.accent }}
                >
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d?.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{d?.code} · Turma {k.code}</p>
                </div>
              </div>
              <p className="mt-2 truncate text-[11px] text-muted-foreground">{t?.title} {t?.name}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {k.studentIds.length} alunos</span>
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {k.shift}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" /> {scheme.length} componentes
                </span>
                <span>Total: <span className="font-semibold text-foreground">{total} pts</span></span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function KlassGrades({ klassId, onBack }: { klassId: string; onBack: () => void }) {
  const k = klassById(klassId)! as Klass;
  const d = disciplineById(k.disciplineId);
  const t = teacherById(k.teacherId);
  useGradingVersion();
  const [, bump] = useState(0);
  const rerender = () => bump((n) => n + 1);

  const [modal, setModal] = useState<GradeComponent | "new" | null>(null);
  const [saved, setSaved] = useState(false);

  const scheme = getScheme(klassId);
  const totalPoints = scheme.reduce((s, c) => s + c.points, 0);
  const roster = useMemo(
    () => k.studentIds.map((id) => STUDENTS.find((s) => s.id === id)!).filter(Boolean),
    [k],
  );

  const finalOf = (studentId: string) =>
    +scheme.reduce((s, c) => s + (componentScore(klassId, c, studentId) ?? 0), 0).toFixed(1);

  const classAvg = roster.length
    ? +(roster.reduce((s, st) => s + finalOf(st.id), 0) / roster.length).toFixed(1)
    : 0;
  const passMark = totalPoints * 0.6;
  const approval = roster.length
    ? Math.round((roster.filter((s) => finalOf(s.id) >= passMark).length / roster.length) * 100)
    : 0;

  const saveComponent = (c: GradeComponent) => {
    const list = getScheme(klassId);
    const i = list.findIndex((x) => x.id === c.id);
    if (i >= 0) list[i] = c;
    else list.push(c);
    setModal(null);
    rerender();
  };

  const removeComponent = (id: string) => {
    schemes.set(klassId, getScheme(klassId).filter((c) => c.id !== id));
    rerender();
  };

  const setManual = (componentId: string, studentId: string, value: string, max: number) => {
    const num = value === "" ? null : Math.min(max, Math.max(0, parseFloat(value)));
    manualScores.set(sKey(klassId, componentId, studentId), isNaN(num as number) ? null : num);
    setSaved(false);
    rerender();
  };

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
        eyebrow={`Rooster Academy · ${d?.code} · Turma ${k.code}`}
        title={d?.name ?? "Notas"}
        description={`${t?.title} ${t?.name} · ${k.shift} · ${k.schedule} · ${roster.length} alunos matriculados`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setModal("new")} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
              <Plus className="h-4 w-4" /> Novo componente
            </button>
            <button onClick={() => setSaved(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
              <Save className="h-4 w-4" /> Salvar boletim
            </button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Kpi icon={Percent} tone="oklch(0.55 0.19 265)" label="Total configurado" value={`${totalPoints} pts`} />
        <Kpi icon={ClipboardList} tone="oklch(0.68 0.14 195)" label="Componentes" value={String(scheme.length)} />
        <Kpi icon={CheckCircle2} tone="oklch(0.62 0.18 155)" label="Média da turma" value={String(classAvg)} />
        <Kpi icon={Users} tone="oklch(0.72 0.14 90)" label="Aprovação" value={`${approval}%`} />
      </div>

      {/* Composição da nota */}
      <div className="mb-4 overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Composição da nota</span>
          <span className="text-[11px] text-muted-foreground">
            Soma: <span className={totalPoints === 100 ? "font-semibold text-foreground" : "font-semibold"} style={totalPoints === 100 ? undefined : { color: "oklch(0.72 0.14 90)" }}>{totalPoints} pontos</span>
          </span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {scheme.map((c) => {
            const meta = SOURCE_META[c.source];
            return (
              <div key={c.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px]" style={{ color: meta.tone }}>
                      {c.source === "learn" && <Sparkles className="h-3 w-3" />}
                      {meta.label}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: `color-mix(in oklab, ${meta.tone} 14%, transparent)`, color: meta.tone }}>
                    {c.points} pts
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{meta.hint}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <button onClick={() => setModal(c)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-accent">
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button onClick={() => removeComponent(c.id)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-accent" style={{ color: "oklch(0.65 0.18 25)" }}>
                    <Trash2 className="h-3 w-3" /> Remover
                  </button>
                </div>
              </div>
            );
          })}
          {scheme.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
              Nenhum componente configurado. Clique em "Novo componente" para definir como a nota será composta.
            </p>
          )}
        </div>
      </div>

      {/* Boletim */}
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 text-left">Aluno</th>
              {scheme.map((c) => (
                <th key={c.id} className="px-3 py-2.5 text-center">
                  <div className="flex flex-col items-center">
                    <span className="inline-flex items-center gap-1">
                      {c.name}
                      {c.source === "learn" && <Sparkles className="h-3 w-3" style={{ color: SOURCE_META.learn.tone }} />}
                      {c.source === "attendance" && <CheckCircle2 className="h-3 w-3" style={{ color: SOURCE_META.attendance.tone }} />}
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground/80">{c.points} pts</span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-2.5 text-center">Nota final</th>
              <th className="px-4 py-2.5 text-center">Situação</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s) => {
              const total = finalOf(s.id);
              const ok = total >= passMark;
              return (
                <tr key={s.id} className="border-b last:border-0 hover:bg-accent/20">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px]">{s.initials}</div>
                      <div>
                        <div className="text-sm">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground">RA {s.ra}</div>
                      </div>
                    </div>
                  </td>
                  {scheme.map((c) => {
                    const v = componentScore(klassId, c, s.id);
                    if (c.source === "manual") {
                      return (
                        <td key={c.id} className="px-2 py-2 text-center">
                          <input
                            value={v ?? ""}
                            onChange={(e) => setManual(c.id, s.id, e.target.value, c.points)}
                            inputMode="decimal"
                            placeholder="—"
                            className="w-16 rounded-md border bg-background px-1.5 py-1 text-center text-sm"
                            style={{ color: v == null ? undefined : tone(v, c.points) }}
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={c.id} className="px-2 py-2 text-center text-sm font-medium" style={{ color: v == null ? undefined : tone(v, c.points) }}>
                        {v ?? "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-center text-sm font-semibold" style={{ color: tone(total, totalPoints) }}>
                    {total}
                    <span className="text-[10px] font-normal text-muted-foreground"> /{totalPoints}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        background: `color-mix(in oklab, ${ok ? "oklch(0.62 0.18 155)" : "oklch(0.65 0.18 25)"} 14%, transparent)`,
                        color: ok ? "oklch(0.62 0.18 155)" : "oklch(0.65 0.18 25)",
                      }}
                    >
                      {ok ? "Aprovado" : "Recuperação"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Componentes marcados com <Sparkles className="mx-0.5 inline h-3 w-3" style={{ color: SOURCE_META.learn.tone }} /> usam as
        notas das atividades online do Rooster Learn; os marcados com <CheckCircle2 className="mx-0.5 inline h-3 w-3" style={{ color: SOURCE_META.attendance.tone }} /> usam a
        frequência lançada na chamada. Aprovação a partir de {passMark.toFixed(0)} pontos (60%).
        {saved && <span className="ml-2 font-medium" style={{ color: "oklch(0.62 0.18 155)" }}>Boletim salvo</span>}
      </p>

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

function ComponentModal({
  initial,
  onClose,
  onSave,
}: {
  initial: GradeComponent | null;
  onClose: () => void;
  onSave: (c: GradeComponent) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [points, setPoints] = useState(String(initial?.points ?? 10));
  const [source, setSource] = useState<GradeSource>(initial?.source ?? "manual");

  const submit = () => {
    const p = parseFloat(points);
    if (!name.trim() || isNaN(p)) return;
    onSave({ id: initial?.id ?? `c-${uid()}`, name: name.trim(), points: p, source });
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
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pontos</label>
          <input
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Origem da nota</label>
          <SelectInput
            value={source}
            onChange={(e) => setSource(e.target.value as GradeSource)}
            options={(Object.keys(SOURCE_META) as GradeSource[]).map((s) => ({ value: s, label: SOURCE_META[s].label }))}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">{SOURCE_META[source].hint}</p>
        </div>
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
