// Player do curso — exige sessão Boost + matrícula (GET /boost/me/matriculas/:id
// já garante isso no backend: 404 se o id não existe ou não pertence ao
// aluno logado). Lista de aulas com status de conclusão, conteúdo da aula
// selecionada, ação "marcar como concluída" e a conversa do aluno com os
// orientadores do curso (REST + WebSocket via useBoostPortalSocket).
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Award, BookOpen, CheckCircle2, Circle, Clock, Download, FileText, Link as LinkIcon,
  MessageSquare, PlayCircle, Send, ArrowLeft,
} from "lucide-react";
import {
  cursosBoostPortalService, mensagemToFront, type AulaCompleta, type MatriculaDetalhe, type Mensagem, type TipoAula,
} from "@/services/boost-portal/cursos.service";
import { useBoostAuth } from "@/services/boost-portal/auth-context";
import { useBoostPortalSocket } from "@/hooks/use-boost-portal-socket";
import { EmptyState, ProgressBar, TONE, LoadingBlock } from "@/components/shared";

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

  const [conversaId, setConversaId] = useState("");
  const [orientadores, setOrientadores] = useState<{ id: string; nome: string }[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [carregandoChat, setCarregandoChat] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Vídeo hospedado: token de stream (curto, 5min) + player com progresso real.
  const [videoStreamUrl, setVideoStreamUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ultimoReporteRef = useRef(0);
  const posicaoAplicadaRef = useRef<string | null>(null);

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
      .getConversa(cursoId)
      .then((c) => {
        if (!alive) return;
        setConversaId(c.conversaId);
        setOrientadores(c.orientadores);
        setMensagens(c.mensagens);
        // abrir a conversa conta como leitura das respostas do orientador
        void cursosBoostPortalService.marcarConversaLida(cursoId).catch(() => {});
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setCarregandoChat(false);
      });
    return () => {
      alive = false;
    };
  }, [cursoId]);

  useBoostPortalSocket(conversaId, (msg) => {
    const nova = mensagemToFront(msg as Parameters<typeof mensagemToFront>[0]);
    setMensagens((prev) => (prev.some((p) => p.id === nova.id) ? prev : [...prev, nova]));
    if (nova.autorTipo === "professor" && cursoId) void cursosBoostPortalService.marcarConversaLida(cursoId).catch(() => {});
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  const todasAulas = useMemo(() => matricula?.curso.modulos.flatMap((m) => m.aulas) ?? [], [matricula]);
  const aulaAtiva: AulaCompleta | undefined = todasAulas.find((a) => a.id === aulaAtivaId);

  // Busca o token de stream sempre que a aula ativa (com vídeo hospedado) muda — token
  // de 5 min, então não faz sentido buscar antes de precisar nem reaproveitar entre aulas.
  useEffect(() => {
    setVideoStreamUrl(null);
    posicaoAplicadaRef.current = null;
    if (!aulaAtiva?.hostedVideo) return;
    let ativo = true;
    cursosBoostPortalService
      .getStreamToken(aulaAtiva.id)
      .then((token) => {
        if (ativo) setVideoStreamUrl(cursosBoostPortalService.streamUrl(aulaAtiva.id, token));
      })
      .catch(() => {
        if (ativo) setErroAcao("Não foi possível carregar o vídeo. Tente novamente.");
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaAtiva?.id, aulaAtiva?.hostedVideo]);

  /** Retoma de onde o aluno parou, uma vez por aula (não a cada re-render). */
  function aoCarregarMetadadosDoVideo() {
    const video = videoRef.current;
    if (!video || !aulaAtiva || posicaoAplicadaRef.current === aulaAtiva.id) return;
    if (aulaAtiva.posicaoSeg > 0 && aulaAtiva.posicaoSeg < video.duration) video.currentTime = aulaAtiva.posicaoSeg;
    posicaoAplicadaRef.current = aulaAtiva.id;
  }

  /**
   * Reporta posição/percentual assistido, no máximo uma vez a cada ~8s (via
   * `onTimeUpdate`, que dispara várias vezes por segundo — sem o throttle
   * seria uma chamada à API a cada tick). `forcar` ignora o intervalo, usado
   * no fim do vídeo. O backend decide sozinho se isso completa a aula
   * (limiar de ~90% assistido); quando completa, recarrega a matrícula para
   * refletir progresso/certificado sem exigir o botão manual.
   */
  async function reportarProgressoVideo(forcar = false) {
    const video = videoRef.current;
    if (!video || !aulaAtiva?.hostedVideo || !video.duration) return;
    const agora = Date.now();
    if (!forcar && agora - ultimoReporteRef.current < 8000) return;
    ultimoReporteRef.current = agora;
    const percentual = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
    try {
      const { concluida } = await cursosBoostPortalService.reportarProgresso(aulaAtiva.id, Math.floor(video.currentTime), percentual);
      if (concluida) await carregarMatricula();
    } catch {
      // Progresso de vídeo é silencioso de propósito — um erro pontual a
      // cada poucos segundos não deve interromper a experiência de assistir.
    }
  }

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
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.");
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
                {aulaAtiva.hostedVideo ? (
                  videoStreamUrl ? (
                    // Vídeo enviado pelo instrutor, sem legenda cadastrada (o projeto não utiliza o plugin jsx-a11y).
                    <video
                      key={aulaAtiva.id}
                      ref={videoRef}
                      src={videoStreamUrl}
                      controls
                      onLoadedMetadata={aoCarregarMetadadosDoVideo}
                      onTimeUpdate={() => void reportarProgressoVideo()}
                      onPause={() => void reportarProgressoVideo(true)}
                      onEnded={() => void reportarProgressoVideo(true)}
                      className="aspect-video w-full rounded-xl bg-black"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black text-xs text-white/60">
                      Carregando vídeo…
                    </div>
                  )
                ) : aulaAtiva.conteudoUrl && embedUrl(aulaAtiva.conteudoUrl) ? (
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
                ) : !aulaAtiva.conteudoUrl && !aulaAtiva.hostedVideo ? (
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
              <MessageSquare className="h-4 w-4" /> Fale com seu orientador
              {orientadores.length > 0 && (
                <span className="ml-auto truncate text-[11px] font-normal text-muted-foreground">{orientadores.map((o) => o.nome).join(", ")}</span>
              )}
            </div>
            <div className="flex h-64 flex-col gap-2 overflow-y-auto p-4">
              {carregandoChat ? (
                <p className="text-center text-xs text-muted-foreground">Carregando conversa…</p>
              ) : mensagens.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground">
                  {orientadores.length === 0
                    ? "Este curso ainda não tem orientador para responder suas dúvidas."
                    : "Nenhuma mensagem ainda. Tire sua dúvida — um orientador responde por aqui."}
                </p>
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
                placeholder={orientadores.length === 0 ? "Sem orientador disponível no momento" : "Escreva sua dúvida…"}
                disabled={orientadores.length === 0}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button type="submit" disabled={!novaMensagem.trim() || orientadores.length === 0} className="rounded-lg bg-foreground p-2 text-background disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
