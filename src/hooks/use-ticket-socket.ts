import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/services/hub/client";
import { getApiToken } from "@/services/hub/session";

/**
 * Conecta no gateway do Desk (`/desk`) e entra na sala do chamado enquanto o
 * componente estiver montado. O REST continua sendo a fonte da verdade — este
 * hook só empurra `onNovaMensagem` quando o servidor avisa que uma mensagem
 * nova chegou, pra tela atualizar sem precisar recarregar.
 *
 * Só roda no cliente (dentro de `useEffect`): em SSR (TanStack Start) este
 * hook nunca executa durante a renderização do servidor.
 */
export function useTicketSocket(ticketId: string, onNovaMensagem: (mensagem: unknown) => void) {
  const [conectado, setConectado] = useState(false);
  const callbackRef = useRef(onNovaMensagem);
  callbackRef.current = onNovaMensagem;

  useEffect(() => {
    let socket: Socket | undefined;
    let ativo = true;

    (async () => {
      const token = await getApiToken().catch(() => null);
      if (!ativo || !token) return;

      socket = io(`${API_URL}/desk`, { auth: { token }, transports: ["websocket"] });

      socket.on("connect", () => {
        setConectado(true);
        socket?.emit("chamado:entrar", { ticketId });
      });
      socket.on("disconnect", () => setConectado(false));
      socket.on("mensagem:nova", (mensagem: unknown) => callbackRef.current(mensagem));
    })();

    return () => {
      ativo = false;
      socket?.emit("chamado:sair", { ticketId });
      socket?.disconnect();
    };
  }, [ticketId]);

  return { conectado };
}
