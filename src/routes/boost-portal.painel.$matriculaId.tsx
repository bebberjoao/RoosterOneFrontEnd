// Player do curso — exige sessão Boost + matrícula (GET /boost/me/matriculas/:id
// já garante isso no backend: 404 se o id não existe ou não pertence ao
// aluno logado). Lista de aulas com status de conclusão, conteúdo da aula
// selecionada, ação "marcar como concluída" e o chat do curso (REST +
// WebSocket via useBoostPortalSocket).
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Award, BookOpen, CheckCircle2, Circle, Clock, Download, FileText, Link as LinkIcon,
  MessageSquare, PlayCircle, Send, ArrowLeft,
} from "lucide-react";
import {
  cursosBoostPortalService, type AulaCompleta, type MatriculaDetalhe, type Mensagem, type TipoAula,
} from "@/services/boost-portal/cursos.service";
import { useBoostAuth } from "@/services/boost-portal/auth-context";
import { useBoostPortalSocket } from "@/hooks/use-boost-portal-socket";
import { EmptyState, ProgressBar, TONE, LoadingBlock } from "@/components/shared/primitives";

export const Route = createFileRoute("/boost-portal/painel/$matriculaId")({
  head: () => ({ meta: [{ title: "Meu curso — Rooster Boost" }] }),
  component: PlayerPage,
});

const TIPO_ICON: Record<TipoAula, typeof PlayCircle> = { video: PlayCircle, texto: FileText, pdf: FileText, link: LinkIcon };

function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function PlayerPage() {
  const { matriculaId } = Route.useParams();
  const { authed, ready } = useBoostAuth();
  const navigate = useNavigate();

  const [matricula, setMatricula] = useState<MatriculaDetalhe | null | undefined>(undefined);
  const [aulaAtivaId, setAulaAtivaId] = useState<string | null>(null);
  const [concluindo, setConcluindo] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [carregandoChat, setCarregandoChat] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    if (!authed) {
      navigate({ to: "/boost-portal/entrar", search: { matriculaId }, replace: true });
    }
  }, [ready, authed, matriculaId, navigate]);

  const carregarMatricula = () => {
    return cursosBoostPortalService
      .getMatricula(matriculaId)
      .then((m) => {
        setMatricula(m);
        setAulaAtivaId((prev) => {
          if (prev) return prev;
          const todasAulas = m.curso.modulos.flatMap((mod) => mod.aulas);
          return (todasAulas.find((a) => !a.concluida) ?? todasAulas[0])?.id ?? null;
        });
        return m;
      })
      .catch(() => {
        setMatricula(null);
        return null;
      });
  };

  useEffect(() => {
    if (!authed || !ready) return;
    carregarMatricula();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, ready, matriculaId]);

  const cursoId = matricula?.cursoId ?? "";

  useEffect(() => {
    if (!cursoId) return;
    let alive = true;
    setCarregandoChat(true);
    cursosBoostPortalService
      .getMensagens(cursoId)
      .then((rows) => {
        if (alive) setMensagens(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setCarregandoChat(false);
      });
    return () => {
      alive = false;
    };
  }, [cursoId]);

  useBoostPortalSocket(cursoId, (msg) => {
    setMensagens((prev) => {
      const m = msg as { id: string };
      if (prev.some((p) => p.id === m.id)) return prev;
      return [...prev, normalizaMensagemSocket(msg, cursoId)];
    });
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  const todasAulas = useMemo(() => matricula?.curso.modulos.flatMap((m) => m.aulas) ?? [], [matricula]);
  const aulaAtiva: AulaCompleta | undefined = todasAulas.find((a) => a.id === aulaAtivaId);

  async function marcarConcluida() {
    if (!aulaAtiva) return;
    setErroAcao(null);
    setConcluindo(true);
    try {
      await cursosBoostPortalService.concluirAula(aulaAtiva.id);
      const atualizada = await carregarMatricula();
      // Avança automaticamente para a próxima aula não concluída, se houver.
      if (atualizada) {
        const lista = atualizada.curso.modulos.flatMap((m) => m.aulas);
        const idx = lista.findIndex((a) => a.id === aulaAtiva.id);
        const proxima = lista.slice(idx + 1).find((a) => !a.concluida);
        if (proxima) setAulaAtivaId(proxima.id);
      }
    } catch {
      setErroAcao("Não foi possível marcar a aula como concluída. Tente novamente.");
    } finally {
      setConcluindo(false);
    }
  }

  async function enviarMensagem() {
    const texto = novaMensagem.trim();
    if (!texto || !cursoId) return;
    setNovaMensagem("");
    try {
      const criada = await cursosBoostPortalService.enviarMensagem(cursoId, texto);
      setMensagens((prev) => (prev.some((p) => p.id === criada.id) ? prev : [...prev, criada]));
    } catch {
      setErroAcao("Não foi possível enviar a mensagem.");
    }
  }

  if (!ready || !authed) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Verificando sessão…</p>;
  }
  if (matricula === undefined) {
    return <LoadingBlock className="py-4" />;
  }
  if (matricula === null) {
    return (
      <>
        <EmptyState icon={BookOpen} title="Matrícula não encontrada" description="Esta matrícula não existe ou não pertence à sua conta." />
        <div className="mt-6 text-center">
          <Link to="/boost-portal/painel" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao meu painel
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Link to="/boost-portal/painel" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Meu painel
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{matricula.curso.titulo}</h1>
          <p className="text-xs text-muted-foreground">{matricula.curso.professorNome}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <ProgressBar value={matricula.progressoPct} tone={matricula.status === "concluida" ? TONE.ok : TONE.info} />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{matricula.progressoPct}%</p>
          </div>
          {matricula.certificado ? (
            <button
              onClick={() => cursosBoostPortalService.baixarCertificado(matricula.certificado!.id, `certificado-${matricula.certificado!.codigo}.pdf`)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent"
            >
              <Award className="h-3.5 w-3.5" /> Certificado <Download className="h-3.5 w-3.5" />
            </button>
          ) : matricula.curso.emiteCertificado ? (
            <span className="text-[11px] text-muted-foreground">Certificado liberado ao concluir 100%</span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lista de módulos/aulas */}
        <div className="rounded-2xl border bg-card lg:col-span-1">
          <div className="border-b px-4 py-3 text-sm font-semibold">Conteúdo do curso</div>
          <div className="max-h-[60vh] overflow-y-auto">
            {matricula.curso.modulos.map((m) => (
              <div key={m.id}>
                <div className="bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">{m.titulo}</div>
                <ul className="divide-y">
                  {m.aulas.map((a) => {
                    const Icon = TIPO_ICON[a.tipo] ?? FileText;
                    const ativa = a.id === aulaAtivaId;
                    return (
                      <li key={a.id}>
                        <button
                          onClick={() => setAulaAtivaId(a.id)}
                          className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${ativa ? "bg-accent" : "hover:bg-accent/50"}`}
                        >
                          {a.concluida ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: TONE.ok }} /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{a.titulo}</span>
                          {a.duracaoMin ? <span className="shrink-0 text-[11px] text-muted-foreground">{a.duracaoMin}min</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo + chat */}
        <div className="space-y-4 lg:col-span-2">
          {aulaAtiva ? (
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold">{aulaAtiva.titulo}</h2>
                {aulaAtiva.concluida ? (
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ color: TONE.ok, background: `color-mix(in oklab, ${TONE.ok} 14%, transparent)` }}>
                    <CheckCircle2 className="h-3 w-3" /> Concluída
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                {aulaAtiva.conteudoUrl && embedUrl(aulaAtiva.conteudoUrl) ? (
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                    <iframe src={embedUrl(aulaAtiva.conteudoUrl)!} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={aulaAtiva.titulo} />
                  </div>
                ) : aulaAtiva.conteudoUrl && isDirectVideoFile(aulaAtiva.conteudoUrl) ? (
                  <video src={aulaAtiva.conteudoUrl} controls className="aspect-video w-full rounded-xl bg-black" />
                ) : aulaAtiva.conteudoUrl ? (
                  <a href={aulaAtiva.conteudoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline">
                    <LinkIcon className="h-4 w-4" /> Abrir conteúdo externo
                  </a>
                ) : null}

                {aulaAtiva.conteudoTexto ? (
                  <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{aulaAtiva.conteudoTexto}</p>
                ) : !aulaAtiva.conteudoUrl ? (
                  <p className="mt-4 text-sm text-muted-foreground">Esta aula ainda não tem conteúdo publicado.</p>
                ) : null}

                {aulaAtiva.materiais.length > 0 ? (
                  <div className="mt-5">
                    <p className="text-xs font-medium text-muted-foreground">Materiais de apoio</p>
                    <ul className="mt-2 space-y-1.5">
                      {aulaAtiva.materiais.map((mat) => (
                        <li key={mat.id} className="flex items-center gap-2 rounded-lg border bg-background/40 px-3 py-2 text-xs">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{mat.nome}</span>
                          <span className="shrink-0 text-muted-foreground">{mat.tamanhoFmt}</span>
                          <button
                            type="button"
                            onClick={() => cursosBoostPortalService.baixarMaterial(mat.id, mat.nome)}
                            className="shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-accent"
                          >
                            <Download className="h-3 w-3" /> Baixar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {erroAcao ? <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{erroAcao}</p> : null}

              <button
                onClick={marcarConcluida}
                disabled={concluindo || aulaAtiva.concluida}
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {aulaAtiva.concluida ? "Aula já concluída" : concluindo ? "Salvando…" : "Marcar como concluída"}
              </button>
            </div>
          ) : (
            <EmptyState icon={Clock} title="Nenhuma aula publicada ainda" description="O instrutor ainda não adicionou conteúdo a este curso." />
          )}

          {/* Chat */}
          <div className="rounded-2xl border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" /> Conversar com o instrutor
            </div>
            <div className="flex h-64 flex-col gap-2 overflow-y-auto p-4">
              {carregandoChat ? (
                <p className="text-center text-xs text-muted-foreground">Carregando conversa…</p>
              ) : mensagens.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>
              ) : (
                mensagens.map((m) => (
                  <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${m.autorTipo === "professor" ? "self-start bg-muted" : "self-end bg-foreground text-background"}`}>
                    <p className="mb-0.5 font-medium opacity-70">{m.autorNome}</p>
                    <p>{m.mensagem}</p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form
              className="flex items-center gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void enviarMensagem();
              }}
            >
              <input
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Escreva uma mensagem…"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button type="submit" disabled={!novaMensagem.trim()} className="rounded-lg bg-foreground p-2 text-background disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

/** O payload do evento `mensagem:nova` é o registro cru do Prisma (mesmo shape de MensagemBack) — normaliza pro tipo "front". */
function normalizaMensagemSocket(raw: unknown, cursoId: string): Mensagem {
  const m = raw as {
    id: string; mensagem: string; criadoEm: string | null;
    boostUsuario?: { nome: string } | null; professor?: { usuario?: { nome: string } } | null;
  };
  const deProfessor = !!m.professor;
  return {
    id: m.id, cursoId, mensagem: m.mensagem, criadoEm: m.criadoEm,
    autorNome: deProfessor ? (m.professor?.usuario?.nome ?? "Instrutor") : (m.boostUsuario?.nome ?? "Aluno"),
    autorTipo: deProfessor ? "professor" : "aluno",
  };
}
