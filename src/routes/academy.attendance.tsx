import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/rooster/page-header";
import {
  academyService, toneFor,
  type SchoolClass,
  type Enrollment,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/services/mock-api/academy.service";
import { ApiError } from "@/services/hub/client";
import { useCan } from "@/components/rooster/hub/permission-context";
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
  Loader2,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { fmtData, dataLocalIso } from "@/lib/formatacao";

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

const STATUS_META: Record<AttendanceStatus, { label: string; tone: string; short: string }> = {
  presente: { label: "Presente", tone: "oklch(0.62 0.18 155)", short: "P" },
  falta: { label: "Falta", tone: "oklch(0.65 0.18 25)", short: "F" },
  atraso: { label: "Atraso", tone: "oklch(0.72 0.14 90)", short: "A" },
  justificado: { label: "Justificada", tone: "oklch(0.55 0.19 265)", short: "J" },
};
const STATUS_LIST: AttendanceStatus[] = ["presente", "falta", "atraso", "justificado"];

const todayIso = () => dataLocalIso();
const formatDate = (iso: string) => fmtData(iso);

function errMsg(err: unknown, forbidden = "Você não tem permissão para acessar a frequência desta turma.") {
  if (err instanceof ApiError) return err.status === 403 ? forbidden : err.message;
  return err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
}

type HistoryEntry = {
  date: string;
  counts: Record<AttendanceStatus, number>;
  total: number;
  pct: number;
};

function summarize(records: AttendanceRecord[]): { counts: Record<AttendanceStatus, number>; total: number; pct: number } {
  const counts: Record<AttendanceStatus, number> = { presente: 0, falta: 0, atraso: 0, justificado: 0 };
  records.forEach((r) => { counts[r.status] += 1; });
  const total = records.length;
  const pct = total === 0 ? 0 : Math.round(((counts.presente + counts.atraso + counts.justificado) / total) * 100);
  return { counts, total, pct };
}

function groupHistory(records: AttendanceRecord[]): HistoryEntry[] {
  const byDate = new Map<string, AttendanceRecord[]>();
  records.forEach((r) => {
    const arr = byDate.get(r.date) ?? [];
    arr.push(r);
    byDate.set(r.date, arr);
  });
  return [...byDate.entries()]
    .map(([date, recs]) => ({ date, ...summarize(recs) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function Attendance() {
  // Decisão SEMPRE pela permissão real (nunca a Visão de demonstração): quem não tem
  // `academy.manage.acessar` de verdade toma 403 do backend se `minhas:true` não for enviado.
  const podeGestao = useCan("/academy/manage", "acessar");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [summaries, setSummaries] = useState<Record<string, { calls: number; avgPct: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openClassId, setOpenClassId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Professor só vê as próprias turmas (`minhas: true`); coordenação/admin podem
    // registrar chamada em qualquer turma (bypass de dono no backend), então buscam todas.
    academyService
      .getClasses(podeGestao ? undefined : { minhas: true })
      .then(async (myClasses) => {
        if (cancelled) return;
        setClasses(myClasses);
        const entries = await Promise.all(
          myClasses.map(async (k) => {
            try {
              const records = await academyService.getFrequencia(k.id);
              const history = groupHistory(records);
              const avgPct = history.length ? Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length) : 0;
              return [k.id, { calls: history.length, avgPct }] as const;
            } catch {
              return [k.id, { calls: 0, avgPct: 0 }] as const;
            }
          }),
        );
        if (!cancelled) setSummaries(Object.fromEntries(entries));
      })
      .catch((err) => !cancelled && setError(errMsg(err, "Você não tem permissão para acessar a frequência.")))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [podeGestao]);

  if (openClassId) {
    const k = classes.find((c) => c.id === openClassId);
    if (k) return <KlassAttendance klass={k} onBack={() => setOpenClassId(null)} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Academy"
        title="Chamada"
        description="Acesse uma turma para consultar as chamadas anteriores e lançar a frequência dos alunos matriculados."
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
            const summary = summaries[k.id] ?? { calls: 0, avgPct: 0 };
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
                <p className="mt-2 text-[11px] text-muted-foreground">{k.schedule || "Horário a definir"}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span>
                    Frequência média: <span className="font-semibold text-foreground">{summary.avgPct}%</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <History className="h-3.5 w-3.5" /> {summary.calls} chamada{summary.calls === 1 ? "" : "s"}
                  </span>
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

function KlassAttendance({ klass: k, onBack }: { klass: SchoolClass; onBack: () => void }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollCallDate, setRollCallDate] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    academyService
      .getFrequencia(k.id)
      .then((records) => !cancelled && setHistory(groupHistory(records)))
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [k.id, refresh]);

  if (rollCallDate) {
    return (
      <RollCall
        klass={k}
        date={rollCallDate}
        onBack={() => {
          setRollCallDate(null);
          setRefresh((n) => n + 1);
        }}
      />
    );
  }

  const avgPct = history.length ? Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length) : 0;

  return (
    <>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Voltar para as turmas
      </button>

      <PageHeader
        eyebrow={`Rooster Academy · ${k.disciplineCode ?? ""} · Turma ${k.code}`}
        title={k.disciplineName ?? "Chamada"}
        description={`${k.shift} · ${k.schedule || "Horário a definir"} · ${k.enrolledCount} alunos matriculados`}
        actions={
          <button
            onClick={() => setRollCallDate(todayIso())}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nova chamada
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
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico…
        </div>
      ) : (
        <>
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
              <div className="mt-2 text-2xl font-semibold">{k.enrolledCount}</div>
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
                    P {h.counts.presente} · F {h.counts.falta} · A {h.counts.atraso} · J {h.counts.justificado}
                  </p>
                </div>
                <span className="hidden text-center text-sm md:block" style={{ color: STATUS_META.presente.tone }}>{h.counts.presente}</span>
                <span className="hidden text-center text-sm md:block" style={{ color: STATUS_META.falta.tone }}>{h.counts.falta}</span>
                <span className="hidden text-center text-sm md:block" style={{ color: STATUS_META.atraso.tone }}>{h.counts.atraso}</span>
                <span className="hidden text-center text-sm md:block" style={{ color: STATUS_META.justificado.tone }}>{h.counts.justificado}</span>
                <div className="flex items-center justify-start gap-2 md:justify-center">
                  <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${h.pct}%`, background: STATUS_META.presente.tone }} />
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
      )}
    </>
  );
}

function RollCall({ klass: k, date: initialDate, onBack }: { klass: SchoolClass; date: string; onBack: () => void }) {
  const [date, setDate] = useState(initialDate);
  const [roster, setRoster] = useState<Enrollment[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    academyService.getEnrollmentsByClass(k.id).then((rows) => !cancelled && setRoster(rows)).catch(() => {});
    return () => { cancelled = true; };
  }, [k.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    academyService
      .getFrequencia(k.id, date)
      .then((records) => {
        if (cancelled) return;
        const byStudent: Record<string, AttendanceStatus> = {};
        records.forEach((r) => { byStudent[r.studentId] = r.status; });
        setMarks(byStudent);
        setSaved(records.length > 0);
      })
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [k.id, date]);

  const setAll = (m: AttendanceStatus) => {
    const n: Record<string, AttendanceStatus> = {};
    roster.forEach((e) => { n[e.studentId] = m; });
    setMarks(n);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const registros = roster.map((e) => ({ alunoId: e.studentId, presenca: marks[e.studentId] ?? "presente" as AttendanceStatus }));
      await academyService.registrarFrequencia(k.id, date, registros);
      setSaved(true);
      toast.success("Chamada registrada com sucesso");
    } catch (err) {
      const message = errMsg(err, "Você não tem permissão para registrar a frequência desta turma.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const counts = roster.reduce((a, e) => {
    const m = marks[e.studentId] ?? "presente";
    a[m] = (a[m] ?? 0) + 1;
    return a;
  }, {} as Record<AttendanceStatus, number>);
  const presentPct = roster.length
    ? Math.round(((counts.presente ?? 0) + (counts.atraso ?? 0) + (counts.justificado ?? 0)) / roster.length * 100)
    : 0;

  return (
    <>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Voltar para o histórico da turma
      </button>

      <PageHeader
        eyebrow={`Rooster Academy · ${k.disciplineCode ?? ""} · Turma ${k.code}`}
        title={k.disciplineName ?? "Chamada"}
        description={`${k.shift} · ${k.schedule || "Horário a definir"} · ${roster.length} alunos matriculados`}
        actions={
          <button
            onClick={save}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar chamada
          </button>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[180px_1fr]">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Data da aula</label>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); }} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Marcar todos</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {STATUS_LIST.map((m) => (
              <button key={m} onClick={() => setAll(m)} className="rounded-md border px-2 py-1 text-xs hover:bg-accent" style={{ color: STATUS_META[m].tone, borderColor: `color-mix(in oklab, ${STATUS_META[m].tone} 40%, transparent)` }}>
                Todos: {STATUS_META[m].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card icon={CheckCircle2} tone="oklch(0.62 0.18 155)" label="Presentes" value={counts.presente ?? 0} />
        <Card icon={XCircle} tone="oklch(0.65 0.18 25)" label="Faltas" value={counts.falta ?? 0} />
        <Card icon={Clock3} tone="oklch(0.72 0.14 90)" label="Atrasos" value={counts.atraso ?? 0} />
        <Card icon={FileText} tone="oklch(0.55 0.19 265)" label="Justificadas" value={counts.justificado ?? 0} />
      </div>
      <div className="mb-4 text-[11px] text-muted-foreground">
        Presença efetiva: <span className="font-semibold text-foreground">{presentPct}%</span> · aula de {formatDate(date)}
        {saved && <span className="ml-2 font-medium" style={{ color: "oklch(0.62 0.18 155)" }}>Chamada salva</span>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando turma…
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid grid-cols-[minmax(0,1fr)_140px_minmax(0,1.6fr)] items-center border-b bg-muted/30 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Aluno</span><span>RA</span><span className="text-right">Registro</span>
          </div>
          {roster.map((e) => {
            const s = e.student;
            const m = marks[e.studentId] ?? "presente";
            return (
              <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_140px_minmax(0,1.6fr)] items-center border-b px-4 py-2.5 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{s?.initials ?? "—"}</div>
                  <div className="truncate text-sm">{s?.name ?? e.studentId}</div>
                </div>
                <div className="text-xs text-muted-foreground">{s?.ra ?? "—"}</div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {STATUS_LIST.map((opt) => {
                    const active = m === opt;
                    const meta = STATUS_META[opt];
                    return (
                      <button key={opt} onClick={() => { setMarks((s2) => ({ ...s2, [e.studentId]: opt })); setSaved(false); }} className="rounded-md px-2 py-1 text-[11px] font-medium transition-all" style={active ? { background: meta.tone, color: "white" } : { color: meta.tone, background: `color-mix(in oklab, ${meta.tone} 12%, transparent)` }}>
                        {meta.short} · {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {roster.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum aluno matriculado nesta turma.</p>
          )}
        </div>
      )}
    </>
  );
}

function Card({ icon: Icon, tone, label, value }: { icon: LucideIcon; tone: string; label: string; value: number }) {
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
