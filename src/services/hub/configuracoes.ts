import { request } from "./client";

export type StatusEmail = {
  configurado: boolean;
  host: string | null;
  porta: number | null;
  seguro: boolean;
  remetente: string;
  modoDev: boolean;
};

/** Configurações administrativas — hoje só o status/teste do envio de e-mail (SMTP). */
export const configuracoesService = {
  statusEmail: () => request<StatusEmail>("/configuracoes/email"),
  testarEmail: (destino?: string) =>
    request<{ enviado: boolean; destino: string }>("/configuracoes/email/teste", {
      method: "POST",
      body: destino ? { destino } : {},
    }),
};
