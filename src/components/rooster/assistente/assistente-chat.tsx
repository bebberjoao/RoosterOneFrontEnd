// Chat do assistente de dúvidas: botão flutuante e painel de conversa, presentes
// em todas as telas autenticadas (montado pelo AppShell). As respostas vêm do
// backend (/assistente), com o trecho do Manual do Usuário; quando a tarefa tem
// roteiro guiado e o usuário possui a permissão, "Mostrar na tela" inicia o
// passo a passo sobre a própria interface.
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bot,
  Loader2,
  MessageCircleQuestion,
  MousePointerClick,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssuntoAssistente, RespostaAssistente } from "@/services/mock-api/assistente.service";
import { canAccessRoute, usePermissions } from "../hub/permission-context";
import { useAssistente } from "./assistente-context";
import { roteiroPorId } from "./roteiros";
import { useTour } from "./tour";

/** Limite da pergunta, igual ao validado pela API. */
const TAMANHO_MAXIMO = 300;
/** Telas que só funcionam a partir do link recebido por e-mail: não recebem atalho. */
const ROTAS_SEM_ATALHO = new Set(["/redefinir-senha", "/boost-portal/redefinir-senha"]);

export function AssistenteChat() {
  const {
    aberto,
    setAberto,
    mensagens,
    carregando,
    sugestoes,
    carregarSugestoes,
    perguntar,
    abrirAssunto,
    limpar,
  } = useAssistente();
  const { ativo } = useTour();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [texto, setTexto] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLTextAreaElement>(null);
  const tituloId = useId();

  useEffect(() => {
    if (!aberto) return;
    carregarSugestoes();
    entradaRef.current?.focus();
  }, [aberto, carregarSugestoes]);

  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensagens, carregando, aberto]);

  // Durante um roteiro guiado, o chat fica oculto para não cobrir a tela.
  if (ativo) return null;

  function enviar(e?: FormEvent) {
    e?.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta || carregando) return;
    setTexto("");
    void perguntar(pergunta, pathname);
  }

  function aoTeclar(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <>
      {aberto ? (
        <section
          role="dialog"
          aria-labelledby={tituloId}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAberto(false);
          }}
          className="fixed bottom-20 right-4 z-[60] flex h-[min(620px,calc(100vh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl sm:right-5"
        >
          <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <h2 id={tituloId} className="text-sm font-semibold">
                  Assistente de dúvidas
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Respostas com base no Manual do Usuário
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={limpar}
                disabled={mensagens.length === 0}
                aria-label="Iniciar nova conversa"
                title="Nova conversa"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar assistente"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div
            ref={listaRef}
            role="log"
            aria-live="polite"
            aria-label="Conversa com o assistente"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            <Bolha>
              Olá! Descreva o que deseja fazer no sistema, por exemplo: &quot;como abro um
              chamado?&quot;. Indico o caminho com base no Manual do Usuário e, nas tarefas
              principais, mostro o passo a passo na própria tela.
            </Bolha>
            {sugestoes && sugestoes.length > 0 ? (
              <Sugestoes
                titulo="Tarefas com passo a passo na tela"
                itens={sugestoes}
                onEscolher={(s) => void abrirAssunto(s, "roteiro")}
              />
            ) : null}

            {mensagens.map((m) =>
              m.autor === "usuario" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-foreground px-3 py-2 text-sm text-background">
                    {m.texto}
                  </p>
                </div>
              ) : m.autor === "erro" ? (
                <p
                  key={m.id}
                  role="alert"
                  className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
                >
                  {m.texto}
                </p>
              ) : (
                <Resposta
                  key={m.id}
                  resposta={m.resposta}
                  onAssunto={(a, tipo) => void abrirAssunto(a, tipo)}
                />
              ),
            )}

            {carregando ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando o manual…
              </p>
            ) : null}
          </div>

          <form onSubmit={enviar} className="flex items-end gap-2 border-t p-3">
            <textarea
              ref={entradaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={aoTeclar}
              maxLength={TAMANHO_MAXIMO}
              rows={2}
              aria-label="Sua dúvida"
              placeholder="Digite sua dúvida…"
              className="min-h-[44px] flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="submit"
              disabled={!texto.trim() || carregando}
              aria-label="Enviar pergunta"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar assistente de dúvidas" : "Abrir assistente de dúvidas"}
        title="Assistente de dúvidas"
        className="fixed bottom-5 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 sm:right-5"
      >
        {aberto ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-5 w-5" />}
      </button>
    </>
  );
}

function Bolha({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm">
      {children}
    </div>
  );
}

function Sugestoes({
  titulo,
  itens,
  onEscolher,
}: {
  titulo: string;
  itens: AssuntoAssistente[];
  onEscolher: (a: AssuntoAssistente) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        {itens.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onEscolher(a)}
            className="rounded-full border bg-background px-2.5 py-1 text-left text-xs transition-colors hover:bg-accent"
          >
            {a.titulo}
          </button>
        ))}
      </div>
    </div>
  );
}

function Resposta({
  resposta,
  onAssunto,
}: {
  resposta: RespostaAssistente;
  onAssunto: (a: AssuntoAssistente, tipo: "roteiro" | "entrada") => void;
}) {
  const { setAberto } = useAssistente();
  const { iniciar } = useTour();
  const { granted, hasCustom } = usePermissions();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (resposta.tipo !== "resposta") {
    return (
      <div className="space-y-2">
        <Bolha>{resposta.mensagem}</Bolha>
        {resposta.sugestoes.length > 0 ? (
          <Sugestoes
            titulo="Talvez ajude"
            itens={resposta.sugestoes}
            onEscolher={(s) => onAssunto(s, "roteiro")}
          />
        ) : null}
      </div>
    );
  }

  const { entrada, roteiro, relacionadas } = resposta;
  const passoAPasso = roteiro && roteiro.permitido && roteiroPorId(roteiro.id) ? roteiro : null;
  const rota = entrada.rota;
  const podeAbrir =
    rota !== null &&
    !ROTAS_SEM_ATALHO.has(rota) &&
    rota !== pathname &&
    (!hasCustom || canAccessRoute(rota, granted));

  return (
    <article className="max-w-full rounded-2xl border bg-background p-3.5 text-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {entrada.modulo}
      </p>
      <h3 className="mt-0.5 font-semibold">{entrada.titulo}</h3>
      {entrada.quemUsa ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">Usuários: {entrada.quemUsa}</p>
      ) : null}
      <p className="mt-2 leading-relaxed">{entrada.resumo}</p>
      {entrada.passos.length > 0 ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed">
          {entrada.passos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      ) : null}
      {entrada.observacoes.length > 0 || entrada.efeitos ? (
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none font-medium text-foreground/80">
            Mais detalhes
          </summary>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            {entrada.observacoes.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
            {entrada.efeitos ? <li>Origem e efeitos das informações: {entrada.efeitos}</li> : null}
          </ul>
        </details>
      ) : null}

      {passoAPasso || podeAbrir ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {passoAPasso ? (
            <button
              type="button"
              onClick={() => {
                if (iniciar(passoAPasso.id)) setAberto(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
            >
              <MousePointerClick className="h-3.5 w-3.5" /> Mostrar na tela
            </button>
          ) : null}
          {podeAbrir ? (
            <button
              type="button"
              onClick={() => {
                if (rota) void navigate({ to: rota });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> Abrir a tela
            </button>
          ) : null}
        </div>
      ) : null}
      {roteiro && !roteiro.permitido ? (
        <p
          className={cn(
            "text-[11px] text-muted-foreground",
            passoAPasso || podeAbrir ? "mt-2" : "mt-3",
          )}
        >
          O passo a passo na tela está disponível para quem possui permissão para esta tarefa. Se
          precisar executá-la, solicite a permissão a um administrador do Rooster Hub.
        </p>
      ) : null}

      {relacionadas.length > 0 ? (
        <div className="mt-3 border-t pt-2.5">
          <Sugestoes
            titulo="Assuntos relacionados"
            itens={relacionadas}
            onEscolher={(a) => onAssunto(a, "entrada")}
          />
        </div>
      ) : null}
    </article>
  );
}
