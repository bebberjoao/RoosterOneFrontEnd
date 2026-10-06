// Motor dos roteiros guiados do assistente.
//
// Durante um roteiro, a tela é escurecida por uma máscara SVG com recortes sobre
// os elementos do passo (atributo `data-tour`) e sobre as camadas flutuantes
// abertas a partir deles (listas de seleção), e uma legenda posicionada ao lado
// explica o que fazer e por que o campo existe. A máscara não intercepta o mouse
// (a rolagem continua livre); os cliques fora do recorte são descartados na fase
// de captura, de modo que apenas o elemento destacado responde.
//
// O estado fica na raiz da aplicação (e não no AppShell, que é montado de novo a
// cada módulo), para que o roteiro continue ao navegar entre módulos.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Info, Loader2, MousePointerClick, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { roteiroPorId, type RoteiroTela } from "./roteiros";

/** Camadas abertas a partir de um campo (listas de seleção, menus): nunca são escurecidas nem bloqueadas. */
export const SELETOR_FLUTUANTE =
  '[data-camada-flutuante], [data-radix-popper-content-wrapper], [role="listbox"], [role="menu"]';
/** Avisos do sistema (toasts) continuam clicáveis durante o roteiro. */
const SELETOR_SEMPRE_LIVRE = "[data-sonner-toaster]";
/** Controles cujo clique conclui um passo `clicar`, quando o passo não define `avancaEm`. */
const SELETOR_INTERATIVO =
  'a[href], button, input, select, textarea, label, summary, [role="button"], [role="tab"], [role="option"], [role="checkbox"], [tabindex]:not([tabindex="-1"])';
const SELETOR_FOCAVEL =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/** Altura da barra superior fixa do AppShell (h-14), que encobre o topo da página rolada. */
const ALTURA_BARRA_SUPERIOR = 56;
/** Folga do recorte em torno do elemento, em pixels. */
const FOLGA = 6;
/** Tempo máximo de espera pelo elemento do passo (a tela pode estar carregando ou abrindo um formulário). */
const ESPERA_PADRAO_MS = 8000;
/** Passos opcionais dependem do conteúdo da tela: se o elemento não aparecer logo, o passo é pulado. */
const ESPERA_OPCIONAL_MS = 1500;
/** Elemento presente, mas sem o que clicar (lista vazia): espera menor antes de exibir a orientação. */
const ESPERA_SEM_ACAO_MS = 3000;
/** Tolerância para o elemento sumir momentaneamente (nova renderização) antes de ser procurado de novo. */
const TOLERANCIA_SUMICO_MS = 800;
/** Limite de recortes simultâneos (passos cujo alvo se repete em cada linha de uma lista). */
const MAX_RECORTES = 40;
/** Botões da legenda: mesmo tamanho para as ações secundária e principal. */
const BOTAO_SECUNDARIO =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent";
const BOTAO_PRINCIPAL =
  "inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90";

type Situacao = "procurando" | "ativo" | "ausente";
type Caixa = { x: number; y: number; w: number; h: number };
type Posicao = { top: number; left: number };

type TourCtx = {
  /** Roteiro em execução, com o índice do passo atual. */
  ativo: { roteiro: RoteiroTela; indice: number } | null;
  /** Inicia o roteiro; devolve `false` se o identificador não tiver etapas definidas no frontend. */
  iniciar: (id: string) => boolean;
  encerrar: () => void;
};

const Ctx = createContext<TourCtx>({ ativo: null, iniciar: () => false, encerrar: () => {} });

export function useTour() {
  return useContext(Ctx);
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [ativo, setAtivo] = useState<TourCtx["ativo"]>(null);
  const { authed } = useAuth();

  // Encerrar a sessão encerra o roteiro.
  useEffect(() => {
    if (!authed) setAtivo(null);
  }, [authed]);

  const iniciar = useCallback((id: string) => {
    const roteiro = roteiroPorId(id);
    if (!roteiro) return false;
    setAtivo({ roteiro, indice: 0 });
    return true;
  }, []);
  const encerrar = useCallback(() => setAtivo(null), []);
  const irPara = useCallback((indice: number) => {
    setAtivo((atual) => (atual ? { ...atual, indice } : atual));
  }, []);

  const value = useMemo(() => ({ ativo, iniciar, encerrar }), [ativo, iniciar, encerrar]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {ativo ? (
        <TourOverlay
          key={ativo.roteiro.id}
          roteiro={ativo.roteiro}
          indice={ativo.indice}
          irPara={irPara}
          encerrar={encerrar}
        />
      ) : null}
    </Ctx.Provider>
  );
}

/** Elementos do passo que estão renderizados (com caixa de layout). */
function elementosVisiveis(alvo: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${alvo}"]`)).filter(
    (el) => el.getClientRects().length > 0,
  );
}

/** Em passos "clicar", o elemento só serve se houver o que clicar nele (ex.: lista de entregas vazia não serve). */
function acionavel(el: HTMLElement, seletor: string | undefined): boolean {
  const s = seletor ?? SELETOR_INTERATIVO;
  return el.matches(s) || el.querySelector(s) !== null;
}

function caixaDe(el: Element, folga: number): Caixa {
  const r = el.getBoundingClientRect();
  return {
    x: Math.round(r.left - folga),
    y: Math.round(r.top - folga),
    w: Math.round(r.width + folga * 2),
    h: Math.round(r.height + folga * 2),
  };
}

/** Menor caixa que contém todas as outras: referência da legenda quando o passo destaca vários elementos. */
function uniao(caixas: Caixa[]): Caixa | null {
  if (caixas.length === 0) return null;
  const x = Math.min(...caixas.map((c) => c.x));
  const y = Math.min(...caixas.map((c) => c.y));
  const w = Math.max(...caixas.map((c) => c.x + c.w)) - x;
  const h = Math.max(...caixas.map((c) => c.y + c.h)) - y;
  return { x, y, w, h };
}

function naTela(c: Caixa): boolean {
  return c.y + c.h > 0 && c.y < window.innerHeight && c.x + c.w > 0 && c.x < window.innerWidth;
}

/**
 * Posiciona a legenda ao lado do elemento: à direita, à esquerda, abaixo ou acima, nessa ordem de preferência,
 * sempre dentro da tela. Sem espaço livre (elemento muito grande), usa o canto inferior direito.
 */
export function posicionarLegenda(ref: Caixa | null, largura: number, altura: number): Posicao {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margem = 16;
  const distancia = 14;
  const limitarY = (y: number) =>
    Math.round(Math.min(Math.max(margem, y), Math.max(margem, vh - altura - margem)));
  const limitarX = (x: number) =>
    Math.round(Math.min(Math.max(margem, x), Math.max(margem, vw - largura - margem)));
  if (!ref) return { top: limitarY((vh - altura) / 2), left: limitarX((vw - largura) / 2) };
  const centroY = ref.y + ref.h / 2 - altura / 2;
  if (ref.x + ref.w + distancia + largura <= vw - margem)
    return { left: ref.x + ref.w + distancia, top: limitarY(centroY) };
  if (ref.x - distancia - largura >= margem)
    return { left: ref.x - distancia - largura, top: limitarY(centroY) };
  if (ref.y + ref.h + distancia + altura <= vh - margem)
    return { top: ref.y + ref.h + distancia, left: limitarX(ref.x) };
  if (ref.y - distancia - altura >= margem)
    return { top: ref.y - distancia - altura, left: limitarX(ref.x) };
  return { top: limitarY(vh - altura - margem), left: limitarX(vw - largura - margem) };
}

function TourOverlay({
  roteiro,
  indice,
  irPara,
  encerrar,
}: {
  roteiro: RoteiroTela;
  indice: number;
  irPara: (indice: number) => void;
  encerrar: () => void;
}) {
  const passo = roteiro.passos[indice];
  const total = roteiro.passos.length;
  const ultimo = indice === total - 1;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [situacao, setSituacao] = useState<Situacao>("procurando");
  const [recortes, setRecortes] = useState<Caixa[]>([]);
  const [flutuantes, setFlutuantes] = useState<Caixa[]>([]);
  const [posicao, setPosicao] = useState<Posicao | null>(null);

  const legendaRef = useRef<HTMLDivElement>(null);
  const proximoRef = useRef<HTMLButtonElement>(null);
  const elementosRef = useRef<HTMLElement[]>([]);
  const situacaoRef = useRef<Situacao>("procurando");
  /** Sentido da navegação entre passos: passos opcionais ausentes são pulados no mesmo sentido. */
  const sentidoRef = useRef<1 | -1>(1);
  /** Evita avançar duas vezes no mesmo passo (duplo clique no destaque ou no botão "Próximo"). */
  const transicaoRef = useRef(false);

  const idBase = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const idMascara = `tour-mascara-${idBase}`;
  const idTitulo = `tour-titulo-${idBase}`;
  const idTexto = `tour-texto-${idBase}`;

  const concluir = useCallback(() => {
    encerrar();
    toast.success(`Roteiro concluído: ${roteiro.titulo}`);
  }, [encerrar, roteiro.titulo]);

  const avancar = useCallback(() => {
    if (transicaoRef.current) return;
    transicaoRef.current = true;
    sentidoRef.current = 1;
    if (ultimo) concluir();
    else irPara(indice + 1);
  }, [ultimo, concluir, irPara, indice]);

  const voltar = useCallback(() => {
    if (transicaoRef.current) return;
    transicaoRef.current = true;
    sentidoRef.current = -1;
    irPara(Math.max(0, indice - 1));
  }, [irPara, indice]);

  // Leva o usuário à tela do passo, quando ele estiver em outra.
  useEffect(() => {
    if (passo.rota && pathname !== passo.rota) void navigate({ to: passo.rota });
    // Apenas ao iniciar o passo: depois disso, o usuário navega livremente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  // Localiza e acompanha os elementos do passo a cada quadro (rolagem, redimensionamento e animações).
  useEffect(() => {
    let quadro = 0;
    // Tempos medidos pelo relógio dos quadros de animação (o mesmo do parâmetro do callback).
    let inicioBusca: number | null = null;
    let ultimaVez = 0;
    let assinatura = "";
    transicaoRef.current = false;
    situacaoRef.current = "procurando";
    setSituacao("procurando");
    const espera = passo.opcional ? ESPERA_OPCIONAL_MS : ESPERA_PADRAO_MS;

    const aoEncontrar = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const inteiroNaTela =
        r.top >= ALTURA_BARRA_SUPERIOR &&
        r.bottom <= window.innerHeight &&
        r.left >= 0 &&
        r.right <= window.innerWidth;
      if (!inteiroNaTela) {
        const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        // Elemento mais alto que a tela (ex.: lista lateral): alinha pelo topo, para o início ficar visível.
        const alto = r.height > window.innerHeight * 0.7;
        el.scrollIntoView({
          block: alto ? "start" : "center",
          inline: "nearest",
          behavior: reduzir ? "auto" : "smooth",
        });
      }
      // Foco: no próprio controle (teclado e leitores de tela) ou, em passos de observação, no botão "Próximo".
      if (passo.acao === "observar") {
        proximoRef.current?.focus({ preventScroll: true });
        return;
      }
      const seletor =
        passo.acao === "clicar" ? (passo.avancaEm ?? SELETOR_FOCAVEL) : SELETOR_FOCAVEL;
      const candidato = el.matches(SELETOR_FOCAVEL) ? el : el.querySelector<HTMLElement>(seletor);
      if (candidato && candidato.matches(SELETOR_FOCAVEL)) candidato.focus({ preventScroll: true });
    };

    const quadroAQuadro = (agora: number) => {
      inicioBusca ??= agora;
      const encontrados = elementosVisiveis(passo.alvo);
      const elementos =
        passo.acao === "clicar"
          ? encontrados.filter((el) => acionavel(el, passo.avancaEm))
          : encontrados;
      const limite =
        elementos.length === 0 && encontrados.length > 0
          ? Math.min(espera, ESPERA_SEM_ACAO_MS)
          : espera;
      elementosRef.current = elementos;

      if (elementos.length > 0) {
        ultimaVez = agora;
        if (situacaoRef.current !== "ativo") {
          situacaoRef.current = "ativo";
          setSituacao("ativo");
          aoEncontrar(elementos[0]);
        }
      } else if (situacaoRef.current === "ativo" && agora - ultimaVez > TOLERANCIA_SUMICO_MS) {
        situacaoRef.current = "procurando";
        setSituacao("procurando");
        inicioBusca = agora;
      } else if (situacaoRef.current === "procurando" && agora - inicioBusca > limite) {
        if (passo.opcional) {
          // Elemento que depende do conteúdo da tela (ex.: alternativas, só em questões objetivas): pula o passo.
          if (sentidoRef.current === 1) avancar();
          else voltar();
          return;
        }
        situacaoRef.current = "ausente";
        setSituacao("ausente");
      }

      const ativo = situacaoRef.current === "ativo";
      const caixas = ativo
        ? elementos
            .map((el) => caixaDe(el, FOLGA))
            .filter(naTela)
            .slice(0, MAX_RECORTES)
        : [];
      const camadas = ativo
        ? Array.from(document.querySelectorAll(SELETOR_FLUTUANTE))
            .map((el) => caixaDe(el, 2))
            .filter(naTela)
        : [];
      const referencia = ativo
        ? (uniao(caixas) ?? (elementos[0] ? caixaDe(elementos[0], FOLGA) : null))
        : null;
      const legenda = legendaRef.current;
      const pos = posicionarLegenda(
        referencia,
        legenda?.offsetWidth ?? 340,
        legenda?.offsetHeight ?? 240,
      );
      const nova = JSON.stringify([caixas, camadas, pos]);
      if (nova !== assinatura) {
        assinatura = nova;
        setRecortes(caixas);
        setFlutuantes(camadas);
        setPosicao(pos);
      }
      quadro = requestAnimationFrame(quadroAQuadro);
    };

    quadro = requestAnimationFrame(quadroAQuadro);
    return () => cancelAnimationFrame(quadro);
  }, [passo, avancar, voltar]);

  // Cliques: fora do destaque são descartados; no destaque, concluem os passos do tipo "clicar".
  useEffect(() => {
    const livre = (alvo: EventTarget | null) => {
      if (!(alvo instanceof Node)) return true;
      if (legendaRef.current?.contains(alvo)) return true;
      if (elementosRef.current.some((el) => el.contains(alvo))) return true;
      return (
        alvo instanceof Element &&
        alvo.closest(`${SELETOR_FLUTUANTE}, ${SELETOR_SEMPRE_LIVRE}`) !== null
      );
    };
    const bloquear = (e: Event) => {
      // Sem o elemento na tela, nada é bloqueado: o usuário pode precisar navegar até ele.
      if (situacaoRef.current !== "ativo" || livre(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const aoClicar = (e: MouseEvent) => {
      if (situacaoRef.current !== "ativo") return;
      if (!livre(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (passo.acao !== "clicar" || !(e.target instanceof Element)) return;
      const acionado = e.target.closest(passo.avancaEm ?? SELETOR_INTERATIVO);
      if (acionado && elementosRef.current.some((el) => el.contains(acionado))) {
        // Avança depois que a própria tela tratar o clique (abrir o formulário, navegar, selecionar).
        window.setTimeout(avancar, 0);
      }
    };
    const aoTeclar = (e: KeyboardEvent) => {
      // Esc encerra o roteiro; com uma lista de seleção aberta, apenas a fecha (comportamento da própria lista).
      if (e.key !== "Escape" || document.querySelector(SELETOR_FLUTUANTE)) return;
      e.preventDefault();
      e.stopPropagation(); // não fecha o formulário em que o usuário está
      encerrar();
    };
    const eventos = [
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "dblclick",
      "contextmenu",
    ] as const;
    for (const nome of eventos) window.addEventListener(nome, bloquear, true);
    window.addEventListener("click", aoClicar, true);
    window.addEventListener("keydown", aoTeclar, true);
    return () => {
      for (const nome of eventos) window.removeEventListener(nome, bloquear, true);
      window.removeEventListener("click", aoClicar, true);
      window.removeEventListener("keydown", aoTeclar, true);
    };
  }, [passo, avancar, encerrar]);

  const podeVoltar = indice > 0 && roteiro.passos[indice - 1].acao !== "clicar";
  const escurecer = situacao === "ausente" ? 0.35 : 0.6;
  const buracos = situacao === "ativo" ? [...recortes, ...flutuantes] : [];

  return createPortal(
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[9998]"
        aria-hidden="true"
        data-testid="tour-camada"
      >
        <svg width="100%" height="100%" className="block">
          <defs>
            <mask id={idMascara}>
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {buracos.map((c, i) => (
                <rect
                  key={i}
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  rx="10"
                  ry="10"
                  fill="black"
                />
              ))}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="black"
            fillOpacity={escurecer}
            mask={`url(#${idMascara})`}
          />
        </svg>
        {situacao === "ativo"
          ? recortes.map((c, i) => (
              <div
                key={i}
                className="absolute rounded-[10px] ring-2 ring-primary motion-safe:transition-all motion-safe:duration-150"
                style={{
                  left: c.x,
                  top: c.y,
                  width: c.w,
                  height: c.h,
                  boxShadow: "0 0 0 4px color-mix(in oklab, var(--primary) 25%, transparent)",
                }}
              />
            ))
          : null}
      </div>

      <div
        ref={legendaRef}
        // Estado do passo, para inspeção e testes automatizados da interface.
        data-tour-passo={indice}
        data-tour-alvo={passo.alvo}
        data-tour-acao={passo.acao}
        data-tour-avanca={passo.avancaEm}
        data-tour-situacao={situacao}
        role="dialog"
        aria-modal="false"
        aria-labelledby={idTitulo}
        aria-describedby={idTexto}
        className="fixed z-[9999] w-[min(340px,calc(100vw-32px))] rounded-2xl border bg-card p-4 text-card-foreground shadow-2xl motion-safe:transition-[top,left] motion-safe:duration-200"
        style={posicao ?? { top: -9999, left: -9999 }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Passo {indice + 1} de {total}
          </span>
          <button
            type="button"
            onClick={encerrar}
            aria-label="Encerrar roteiro"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-3 mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${((indice + 1) / total) * 100}%` }}
          />
        </div>

        <div aria-live="polite">
          <h2 id={idTitulo} className="text-sm font-semibold">
            {passo.titulo}
          </h2>
          {situacao === "ausente" ? (
            <div
              id={idTexto}
              className="mt-2 flex gap-2 rounded-xl border border-dashed p-2.5 text-xs text-muted-foreground"
            >
              <SearchX className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                {passo.seAusente ?? "O elemento deste passo não está visível na tela atual."} O
                roteiro continua automaticamente assim que ele aparecer.
              </p>
            </div>
          ) : (
            <>
              <p id={idTexto} className="mt-1 text-sm text-foreground/90">
                {passo.texto}
              </p>
              <div className="mt-3 flex gap-2 rounded-xl bg-muted/60 p-2.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  <span className="font-medium text-foreground">Por quê: </span>
                  {passo.porque}
                </p>
              </div>
              {situacao === "procurando" ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Localizando o campo na tela…
                </p>
              ) : passo.acao === "clicar" ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <MousePointerClick className="h-3.5 w-3.5" /> Clique no item destacado para
                  continuar.
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span
            className="min-w-0 truncate text-[11px] text-muted-foreground"
            title={roteiro.titulo}
          >
            {roteiro.titulo}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {podeVoltar ? (
              <button type="button" onClick={voltar} className={BOTAO_SECUNDARIO}>
                Anterior
              </button>
            ) : null}
            {situacao === "ausente" ? (
              <button type="button" onClick={avancar} className={BOTAO_SECUNDARIO}>
                {ultimo ? "Concluir" : "Pular passo"}
              </button>
            ) : passo.acao !== "clicar" ? (
              <button ref={proximoRef} type="button" onClick={avancar} className={BOTAO_PRINCIPAL}>
                {ultimo ? "Concluir" : "Próximo"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
