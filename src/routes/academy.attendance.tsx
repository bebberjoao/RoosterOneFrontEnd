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
  today,
  formatDate,
} from "@/components/rooster/academy/mock-data";
import type { AttendanceMark, Klass } from "@/components/rooster/academy/mock-data";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  Save,
  ChevronLeft,
  Users,
  CalendarDays,
  GraduationCap,
  Plus,
  Eye,
  History,
} from "lucide-react";

export const Route = createFileRoute("/academy/attendance")({
  head: () => ({
    meta: [
      { title: "Chamada por turma — Rooster Academy" },
      { name: "description", content: "Acesse a turma, consulte as chamadas anteriores e registre a presença dos alunos matriculados." },
      { property: "og:title", content: "Chamada por turma — Rooster Academy" },
      { property: "og:description", content: "Registro e histórico de frequência por turma no Rooster Academy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Attendance,
});

const MARK_META: Record<AttendanceMark, { label: string; tone: string; short: string }> = {
  P: { label: "Presente", tone: "oklch(0.62 0.18 155)", short: "P" },
  F: { label: "Falta", tone: "oklch(0.65 0.18 25)", short: "F" },
  A: { label: "Atraso", tone: "oklch(0.72 0.14 90)", short: "A" },
  J: { label: "Justificada", tone: "oklch(0.55 0.19 265)", short: "J" },
};

// Registro em memória: chave `${klassId}|${date}` -> marcações por aluno.
const attendanceStore = new Map<string, Record<string, AttendanceMark>>();

const shiftDate = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const rnd = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Semeia chamadas anteriores (determinísticas) para que o histórico apareça na primeira visita.
function seedHistory() {
  if (attendanceStore.size > 0) return;
  const offsets = [-2, -4, -7, -9, -11];
  KLASSES.forEach((k, ki) => {
    offsets.forEach((off, di) => {
      const date = shiftDate(off);
      const marks: Record<string, AttendanceMark> = {};
      k.studentIds.forEach((sid, si) => {
        const r = rnd((ki + 1) * 1000 + (di + 1) * 100 + (si + 1) * 7);
        marks[sid] = r < 0.72 ? "P" : r < 0.85 ? "F" : r < 0.94 ? "A" : "J";
      });
      attendanceStore.set(`${k.id}|${date}`, marks);
    });
  });
}
seedHistory();

function summarize(marks: Record<string, AttendanceMark>) {
  const counts: Record<AttendanceMark, number> = { P: 0, F: 0, A: 0, J: 0 };
  Object.values(marks).forEach((m) => (counts[m] += 1));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pct = total === 0 ? 0 : Math.round(((counts.P + counts.A + counts.J) / total) * 100);
  return { counts, total, pct };
}

function klassHistory(klassId: string) {
  return [...attendanceStore.entries()]
    .filter(([key]) => key.startsWith(`${klassId}|`))
    .map(([key, marks]) => ({ date: key.split("|")[1], marks, ...summarize(marks) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function Attendance() {
  const [openKlassId, setOpenKlassId] = useState<string | null>(null);

  if (openKlassId) {
    return <KlassAttendance klassId={openKlassId} onBack={() => setOpenKlassId(null)} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Academy"
        title="Chamada"
        description="Acesse uma turma para consultar as chamadas anteriores e lançar a frequência dos alunos matriculados."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {KLASSES.map((k) => {
          const d = disciplineById(k.disciplineId);
          const t = teacherById(k.teacherId);
          const avg = Math.round(
            k.studentIds.reduce((s, id) => s + studentAttendance(id, k.id), 0) / Math.max(k.studentIds.length, 1),
          );
          const calls = klassHistory(k.id).length;
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
              <p className="mt-2 truncate text-[11px] text-muted-foreground">
                {t?.title} {t?.name}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {k.studentIds.length} alunos</span>
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {k.shift}</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{k.schedule}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span>
                  Frequência média: <span className="font-semibold text-foreground">{avg}%</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <History className="h-3.5 w-3.5" /> {calls} chamada{calls === 1 ? "" : "s"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function KlassAttendance({ klassId, onBack }: { klassId: string; onBack: () => void }) {
  const k = klassById(klassId)!;
  const d = disciplineById(k.disciplineId);
  const t = teacherById(k.teacherId);
  const [rollCallDate, setRollCallDate] = useState<string | null>(null);
  const [, bump] = useState(0); // força re-render ao voltar da chamada (store em memória)

  if (rollCallDate) {
    return (
      <RollCall
        klass={k}
        date={rollCallDate}
        onBack={() => {
          setRollCallDate(null);
          bump((n) => n + 1);
        }}
      />
    );
  }

  const history = klassHistory(klassId);
  const avgPct = history.length
    ? Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length)
    : 0;

  return (
    <>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Voltar para as turmas
      </button>

      <PageHeader
        eyebrow={`Rooster Academy · ${d?.code} · Turma ${k.code}`}
        title={d?.name ?? "Chamada"}
        description={`${t?.title} ${t?.name} · ${k.shift} · ${k.schedule} · ${k.studentIds.length} alunos matriculados`}
        actions={
          <button
            onClick={() => setRollCallDate(today)}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nova chamada
          </button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "color-mix(in oklab, oklch(0.55 0.19 265) 14%, transparent)", color: "oklch(0.55 0.19 265)" }}>
              <History className="h-4 w-4" />
            </div>
            <div className="text-xs text-muted-foreground">Chamadas realizadas</div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{history.length}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "color-mix(in oklab, oklch(0.62 0.18 155) 14%, transparent)", color: "oklch(0.62 0.18 155)" }}>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-xs text-muted-foreground">Presença média</div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{avgPct}%</div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "color-mix(in oklab, oklch(0.68 0.14 195) 14%, transparent)", color: "oklch(0.68 0.14 195)" }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-xs text-muted-foreground">Alunos matriculados</div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{k.studentIds.length}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="hidden grid-cols-[150px_repeat(4,minmax(0,1fr))_110px_90px] items-center border-b bg-muted/30 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:grid">
          <span>Data</span>
          <span className="text-center">Presentes</span>
          <span className="text-center">Faltas</span>
          <span className="text-center">Atrasos</span>
          <span className="text-center">Justificadas</span>
          <span className="text-center">Presença</span>
          <span className="text-right">Ação</span>
        </div>
        {history.map((h) => (
          <div
            key={h.date}
            className="grid grid-cols-2 items-center gap-2 border-b px-4 py-3 last:border-0 md:grid-cols-[150px_repeat(4,minmax(0,1fr))_110px_90px]"
          >
            <div>
              <p className="text-sm font-medium">{formatDate(h.date)}</p>
              <p className="text-[11px] text-muted-foreground md:hidden">
                P {h.counts.P} · F {h.counts.F} · A {h.counts.A} · J {h.counts.J}
              </p>
            </div>
            <span className="hidden text-center text-sm md:block" style={{ color: MARK_META.P.tone }}>{h.counts.P}</span>
            <span className="hidden text-center text-sm md:block" style={{ color: MARK_META.F.tone }}>{h.counts.F}</span>
            <span className="hidden text-center text-sm md:block" style={{ color: MARK_META.A.tone }}>{h.counts.A}</span>
            <span className="hidden text-center text-sm md:block" style={{ color: MARK_META.J.tone }}>{h.counts.J}</span>
            <div className="flex items-center justify-start gap-2 md:justify-center">
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${h.pct}%`, background: MARK_META.P.tone }} />
              </div>
              <span className="text-xs font-medium">{h.pct}%</span>
            </div>
            <div className="text-right">
              <button
                onClick={() => setRollCallDate(h.date)}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-accent"
              >
                <Eye className="h-3.5 w-3.5" /> Abrir
              </button>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma chamada registrada para esta turma. Clique em "Nova chamada" para começar.
          </p>
        )}
      </div>
    </>
  );
}

function RollCall({ klass, date: initialDate, onBack }: { klass: Klass; date: string; onBack: () => void }) {
  const k = klass;
  const d = disciplineById(k.disciplineId);
  const t = teacherById(k.teacherId);
  const [date, setDate] = useState(initialDate);
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>(
    () => attendanceStore.get(`${k.id}|${initialDate}`) ?? {},
  );
  const [saved, setSaved] = useState(() => attendanceStore.has(`${k.id}|${initialDate}`));

  const roster = useMemo(() => k.studentIds.map((id) => STUDENTS.find((s) => s.id === id)!).filter(Boolean), [k]);

  const changeDate = (value: string) => {
    setDate(value);
    setMarks(attendanceStore.get(`${k.id}|${value}`) ?? {});
    setSaved(attendanceStore.has(`${k.id}|${value}`));
  };

  const setAll = (m: AttendanceMark) => {
    const n: Record<string, AttendanceMark> = {};
    roster.forEach((s) => (n[s.id] = m));
    setMarks(n);
    setSaved(false);
  };

  const save = () => {
    const full: Record<string, AttendanceMark> = {};
    roster.forEach((s) => (full[s.id] = marks[s.id] ?? "P"));
    attendanceStore.set(`${k.id}|${date}`, full);
    setSaved(true);
  };

  const counts = roster.reduce((a, s) => { const m = marks[s.id] ?? "P"; a[m] = (a[m] ?? 0) + 1; return a; }, {} as Record<AttendanceMark, number>);
  const presentPct = Math.round(((counts.P ?? 0) + (counts.A ?? 0) + (counts.J ?? 0)) / roster.length * 100);

  return (
    <>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Voltar para o histórico da turma
      </button>

      <PageHeader
        eyebrow={`Rooster Academy · ${d?.code} · Turma ${k.code}`}
        title={d?.name ?? "Chamada"}
        description={`${t?.title} ${t?.name} · ${k.shift} · ${k.schedule} · ${roster.length} alunos matriculados`}
        actions={
          <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
            <Save className="h-4 w-4" /> Salvar chamada
          </button>
        }
      />

      <div className="mb-4 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[180px_1fr]">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Data da aula</label>
          <input type="date" value={date} onChange={(e) => changeDate(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Marcar todos</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(Object.keys(MARK_META) as AttendanceMark[]).map((m) => (
              <button key={m} onClick={() => setAll(m)} className="rounded-md border px-2 py-1 text-xs hover:bg-accent" style={{ color: MARK_META[m].tone, borderColor: `color-mix(in oklab, ${MARK_META[m].tone} 40%, transparent)` }}>
                Todos: {MARK_META[m].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card icon={CheckCircle2} tone="oklch(0.62 0.18 155)" label="Presentes" value={counts.P ?? 0} />
        <Card icon={XCircle} tone="oklch(0.65 0.18 25)" label="Faltas" value={counts.F ?? 0} />
        <Card icon={Clock3} tone="oklch(0.72 0.14 90)" label="Atrasos" value={counts.A ?? 0} />
        <Card icon={FileText} tone="oklch(0.55 0.19 265)" label="Justificadas" value={counts.J ?? 0} />
      </div>
      <div className="mb-4 text-[11px] text-muted-foreground">
        Presença efetiva: <span className="font-semibold text-foreground">{isFinite(presentPct) ? presentPct : 0}%</span> · aula de {formatDate(date)}
        {saved && <span className="ml-2 font-medium" style={{ color: "oklch(0.62 0.18 155)" }}>Chamada salva</span>}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_140px_minmax(0,1.6fr)] items-center border-b bg-muted/30 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Aluno</span><span>RA</span><span className="text-right">Registro</span>
        </div>
        {roster.map((s) => {
          const m = marks[s.id] ?? "P";
          return (
            <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_140px_minmax(0,1.6fr)] items-center border-b px-4 py-2.5 last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{s.initials}</div>
                <div className="truncate text-sm">{s.name}</div>
              </div>
              <div className="text-xs text-muted-foreground">{s.ra}</div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                {(Object.keys(MARK_META) as AttendanceMark[]).map((opt) => {
                  const active = m === opt;
                  const meta = MARK_META[opt];
                  return (
                    <button key={opt} onClick={() => { setMarks((s2) => ({ ...s2, [s.id]: opt })); setSaved(false); }} className="rounded-md px-2 py-1 text-[11px] font-medium transition-all" style={active ? { background: meta.tone, color: "white" } : { color: meta.tone, background: `color-mix(in oklab, ${meta.tone} 12%, transparent)` }}>
                      {meta.short} · {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Card({ icon: Icon, tone, label, value }: any) {
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
