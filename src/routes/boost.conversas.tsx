import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
import { PageHeader } from "@/components/rooster/page-header";
import { Avatar, EmptyState } from "@/components/shared";
import { useCan } from "@/components/rooster/hub/permission-context";
import { boostService, messageToFront, type BoostConversation, type BoostMessage } from "@/services/mock-api/boost.service";
import { useBoostConversasSocket } from "@/hooks/use-boost-conversas-socket";
import { toneFor, initialsOf } from "@/services/mock-api/academy.service";
import { fmtDataHora } from "@/lib/formatacao";

export const Route = createFileRoute("/boost/conversas")({
  head: () => ({
    meta: [
      { title: "Rooster Boost — Conversas" },
      { name: "description", content: "Converse com os alunos dos cursos em que você é orientador e tire as dúvidas deles." },
    ],
  }),
  component: BoostConversas,
});

function formatDateTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return fmtDataHora(d);
}

function BoostConversas() {
  const canReply = useCan("/boost/conversas", "responder");
  const [conversations, setConversations] = useState<BoostConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BoostMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedId;

  const reloadInbox = useCallback(async () => {
    try {
      setConversations(await boostService.listConversations());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar as conversas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadInbox();
  }, [reloadInbox]);

  const markRead = useCallback((id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    void boostService.markConversationRead(id).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let alive = true;
    setLoadingMessages(true);
    boostService
      .getConversationMessages(selectedId)
      .then((rows) => {
        if (!alive) return;
        setMessages(rows);
        markRead(selectedId);
      })
      .catch((err) => alive && toast.error(err instanceof Error ? err.message : "Falha ao carregar a conversa"))
      .finally(() => alive && setLoadingMessages(false));
    return () => {
      alive = false;
    };
  }, [selectedId, markRead]);

  useBoostConversasSocket(selectedId, {
    onMensagem: (raw) => {
      const nova = messageToFront(raw as Parameters<typeof messageToFront>[0]);
      setMessages((prev) => (prev.some((m) => m.id === nova.id) ? prev : [...prev, nova]));
      if (!nova.fromInstructor && selectedRef.current) markRead(selectedRef.current);
    },
    // aluno escreveu (em qualquer conversa): atualiza contadores e ordem da lista
    onCaixaAtualizada: () => {
      void reloadInbox();
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body || !selectedId) return;
    setSending(true);
    try {
      const created = await boostService.sendConversationMessage(selectedId, body);
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      setText("");
      void reloadInbox();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar a mensagem");
    } finally {
      setSending(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => !q || `${c.studentName} ${c.courseTitle}`.toLowerCase().includes(q));
  }, [conversations, query]);
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Boost"
        title="Conversas com alunos"
        description={
          totalUnread > 0
            ? `${totalUnread} mensagem(ns) de aluno aguardando resposta.`
            : "Dúvidas dos alunos dos cursos em que você é orientador."
        }
      />

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      {!loading && conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma conversa ainda"
          description="Quando um aluno de um curso que você orienta enviar uma dúvida, a conversa aparece aqui. Se você não vê nenhum curso, peça ao gestor do Boost para vincular você como orientador."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <aside className="rounded-xl border border-border/60 bg-card">
            <div className="border-b border-border/60 p-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar aluno ou curso"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <ul className="max-h-[560px] divide-y overflow-y-auto">
              {loading && <li className="p-4 text-xs text-muted-foreground">Carregando…</li>}
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50 ${c.id === selectedId ? "bg-accent" : ""}`}
                  >
                    <Avatar initials={initialsOf(c.studentName)} tone={toneFor(c.studentId)} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-sm ${c.unread > 0 ? "font-semibold" : "font-medium"}`}>{c.studentName}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{formatDateTime(c.lastMessageAt)}</span>
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">{c.courseTitle}</span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="line-clamp-1 flex-1 text-xs text-muted-foreground">{c.lastMessage ?? "Sem mensagens"}</span>
                        {c.unread > 0 && (
                          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {!loading && filtered.length === 0 && <li className="p-4 text-xs text-muted-foreground">Nenhuma conversa encontrada.</li>}
            </ul>
          </aside>

          <section className="flex min-h-[420px] flex-col rounded-xl border border-border/60 bg-card">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
                Escolha uma conversa à esquerda.
              </div>
            ) : (
              <>
                <div className="border-b border-border/60 px-4 py-3">
                  <div className="text-sm font-semibold">{selected.studentName}</div>
                  <div className="text-[11px] text-muted-foreground">{selected.courseTitle}</div>
                </div>
                <div ref={scrollRef} className="max-h-[440px] min-h-[260px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {loadingMessages ? (
                    <p className="text-xs text-muted-foreground">Carregando…</p>
                  ) : messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma mensagem nesta conversa.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={"flex " + (m.fromInstructor ? "justify-end" : "justify-start")}>
                        <div className={"max-w-[80%] rounded-lg px-3 py-2 text-sm " + (m.fromInstructor ? "bg-foreground text-background" : "bg-muted/60")}>
                          <div className="mb-0.5 text-[11px] font-medium opacity-70">{m.authorName}</div>
                          <div className="whitespace-pre-wrap">{m.text}</div>
                          <div className={"mt-1 text-[10px] " + (m.fromInstructor ? "text-background/60" : "text-muted-foreground")}>
                            {formatDateTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-border/60 p-3">
                  <input
                    value={text}
                    disabled={!canReply}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder={canReply ? "Responder ao aluno…" : "Seu usuário não pode responder"}
                    className="w-full flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={sending || !text.trim() || !canReply}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Enviar
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
