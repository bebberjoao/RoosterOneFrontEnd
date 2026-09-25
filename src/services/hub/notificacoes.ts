import { request } from "./client";
import type { Notificacao } from "./types";

export type CaixaDeEntrada = { itens: Notificacao[]; naoLidas: number };

/** Caixa de entrada do usuário logado — o backend filtra pelo JWT, nunca por parâmetro. */
export const notificacoesService = {
  minhas: () => request<CaixaDeEntrada>("/notificacoes/minhas"),
  marcarLida: (id: string) => request<Notificacao>(`/notificacoes/minhas/${id}/lida`, { method: "PATCH" }),
  marcarTodasLidas: () => request<{ atualizadas: number }>("/notificacoes/minhas/marcar-todas-lidas", { method: "POST" }),
};
