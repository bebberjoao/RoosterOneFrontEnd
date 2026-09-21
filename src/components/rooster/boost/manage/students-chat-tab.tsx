import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Award, MessageCircle, Send, Users } from "lucide-react";
import { Avatar, DataTable, EmptyState, ProgressBar, type Column } from "@/components/shared";
import { boostService, messageToFront, type BoostEnrollment, type BoostMessage } from "@/services/mock-api/boost.service";
import { useBoostCourseSocket } from "@/hooks/use-boost-course-socket";
import { toneFor, initialsOf } from "@/services/mock-api/academy.service";

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo", concluido: "Concluído", cancelado: "Cancelado", trancado: "Trancado",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function CourseStudentsChatTab({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<BoostEnrollment[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [messages, setMessages] = useState<BoostMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    boostService
      .getStudents(courseId)
      .then((rows) => alive && setStudents(rows))
      .catch((err) => alive && setStudentsError(err instanceof Error ? err.message : "Falha ao carregar alunos"))
      .finally(() => alive && setLoadingStudents(false));
    return () => {
      alive = false;
    };
  }, [courseId]);

  useEffect(() => {
    let alive = true;
    boostService
      .getMessages(courseId)
      .then((rows) => alive && setMessages(rows))
      .finally(() => alive && setLoadingMessages(false));
    return () => {
      alive = false;
    };
  }, [courseId]);

  useBoostCourseSocket(courseId, (raw) => {
    try {
      const mensagem = messageToFront(raw as Parameters<typeof messageToFront>[0]);
      setMessages((prev) => (prev.some((m) => m.id === mensagem.id) ? prev : [...prev, mensagem]));
    } catch {
      // payload em formato inesperado — ignora, o histórico via REST continua confiável.
    }
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const created = await boostService.sendMessage(courseId, body);
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  const columns: Column<BoostEnrollment>[] = [
    {
      key: "student", header: "Aluno", sortValue: (s) => s.studentName,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar initials={initialsOf(s.studentName)} tone={toneFor(s.id)} size={32} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{s.studentName}</div>
            <div className="truncate text-[11px] text-muted-foreground">{s.studentEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: "progress", header: "Progresso", sortValue: (s) => s.progressPct,
      cell: (s) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={s.progressPct} className="w-24" tone="oklch(0.68 0.18 40)" />
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{s.progressPct}%</span>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (s) => <span className="text-xs">{STATUS_LABEL[s.status] ?? s.status}</span> },
    {
      key: "certificate", header: "Certificado",
      cell: (s) =>
        s.certificateIssued ? (
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "oklch(0.62 0.18 155)" }}>
            <Award className="h-3.5 w-3.5" /> Emitido
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Alunos matriculados</h2>
          <span className="text-xs text-muted-foreground">({students.length})</span>
        </div>
        {studentsError && <p className="mb-2 text-xs text-destructive">{studentsError}</p>}
        {!loadingStudents && students.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum aluno matriculado ainda" description="Assim que alguém se matricular pelo portal do aluno, o progresso aparece aqui." />
        ) : (
          <DataTable rows={students} columns={columns} emptyMessage={loadingStudents ? "Carregando…" : "Nenhum aluno encontrado"} />
        )}
      </section>

      <section className="flex flex-col rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Chat do curso</h2>
        </div>
        <div ref={scrollRef} className="max-h-[420px] min-h-[240px] flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {loadingMessages ? (
            <p className="text-xs text-muted-foreground">Carregando…</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira mensagem aos alunos matriculados.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={"flex " + (m.fromInstructor ? "justify-end" : "justify-start")}>
                <div className={"max-w-[85%] rounded-lg px-3 py-2 text-sm " + (m.fromInstructor ? "bg-foreground text-background" : "bg-muted/60")}>
                  {!m.fromInstructor && <div className="mb-0.5 text-[11px] font-medium opacity-70">{m.authorName}</div>}
                  <div>{m.text}</div>
                  <div className={"mt-1 text-[10px] " + (m.fromInstructor ? "text-background/60" : "text-muted-foreground")}>{formatDateTime(m.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-border/60 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Escreva uma mensagem para a turma…"
            className="w-full flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Enviar
          </button>
        </div>
      </section>
    </div>
  );
}
