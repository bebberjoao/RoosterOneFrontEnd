import { useCallback, useEffect, useSyncExternalStore } from "react";
import { notificacoesService, type CaixaDeEntrada } from "@/services/hub/notificacoes";
import { session } from "@/services/hub/session";

const INTERVALO_MS = 30_000;

// Um único estado compartilhado: o sino da barra superior e a página de notificações
// mostram sempre o mesmo número, sem cada um consultar a API por conta própria.
type Estado = CaixaDeEntrada & { carregando: boolean; erro: boolean };
let estado: Estado = { itens: [], naoLidas: 0, carregando: false, erro: false };
const ouvintes = new Set<() => void>();
let assinantes = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function publicar(novo: Partial<Estado>) {
  estado = { ...estado, ...novo };
  ouvintes.forEach((l) => l());
}

export async function recarregarNotificacoes() {
  if (!session.token) {
    publicar({ itens: [], naoLidas: 0, erro: false });
    return;
  }
  publicar({ carregando: true });
  try {
    const caixa = await notificacoesService.minhas();
    publicar({ ...caixa, carregando: false, erro: false });
  } catch {
    // Mantém o que já estava na tela; só sinaliza a falha.
    publicar({ carregando: false, erro: true });
  }
}

function aoVoltarAoFoco() {
  if (document.visibilityState === "visible") void recarregarNotificacoes();
}

function iniciar() {
  void recarregarNotificacoes();
  timer = setInterval(aoVoltarAoFoco, INTERVALO_MS);
  document.addEventListener("visibilitychange", aoVoltarAoFoco);
  window.addEventListener("focus", aoVoltarAoFoco);
}

function parar() {
  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", aoVoltarAoFoco);
  window.removeEventListener("focus", aoVoltarAoFoco);
}

function assinar(listener: () => void) {
  ouvintes.add(listener);
  return () => {
    ouvintes.delete(listener);
  };
}

export function useNotificacoes() {
  const snapshot = useSyncExternalStore(assinar, () => estado, () => estado);

  useEffect(() => {
    assinantes += 1;
    if (assinantes === 1) iniciar();
    else void recarregarNotificacoes();
    // Trocar de usuário (logout/login) precisa zerar a caixa do anterior.
    const sair = session.subscribe(() => {
      if (!session.token) publicar({ itens: [], naoLidas: 0 });
      else void recarregarNotificacoes();
    });
    return () => {
      sair();
      assinantes -= 1;
      if (assinantes === 0) parar();
    };
  }, []);

  const marcarLida = useCallback(async (id: string) => {
    const alvo = estado.itens.find((n) => n.id === id);
    if (!alvo || alvo.lida) return;
    publicar({
      itens: estado.itens.map((n) => (n.id === id ? { ...n, lida: true } : n)),
      naoLidas: Math.max(0, estado.naoLidas - 1),
    });
    try {
      await notificacoesService.marcarLida(id);
    } catch {
      await recarregarNotificacoes();
    }
  }, []);

  const marcarTodasLidas = useCallback(async () => {
    publicar({ itens: estado.itens.map((n) => ({ ...n, lida: true })), naoLidas: 0 });
    try {
      await notificacoesService.marcarTodasLidas();
    } catch {
      await recarregarNotificacoes();
    }
  }, []);

  return { ...snapshot, recarregar: recarregarNotificacoes, marcarLida, marcarTodasLidas };
}

/** "há 5 min", "ontem", ou a data — suficiente para uma lista de avisos. */
export function tempoRelativo(iso?: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  const min = Math.round((Date.now() - data.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ontem";
  if (d < 7) return `há ${d} dias`;
  return data.toLocaleDateString("pt-BR");
}
