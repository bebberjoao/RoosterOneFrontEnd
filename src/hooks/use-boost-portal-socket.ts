import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/services/boost-portal/client";
import { getBoostApiToken } from "@/services/boost-portal/session";

/**
 * Conecta no gateway do chat do Rooster Boost (`/boost` — o mesmo namespace
 * usado pelo lado instrutor, que aceita tanto token do Hub quanto token
 * Boost) e entra na sala do curso enquanto o componente estiver montado.
 * Espelha src/hooks/use-ticket-socket.ts, mas autentica com o token da
 * sessão Boost (nunca `getApiToken()` do Hub). O REST continua sendo a
 * fonte da verdade — este hook só empurra `onNovaMensagem` quando o servidor
 * avisa que uma mensagem nova chegou.
 *
 * Só roda no cliente (dentro de `useEffect`): em SSR (TanStack Start) este
 * hook nunca executa durante a renderização do servidor.
 */
export function useBoostPortalSocket(cursoId: string, onNovaMensagem: (mensagem: unknown) => void) {
  const [conectado, setConectado] = useState(false);
  const callbackRef = useRef(onNovaMensagem);
  callbackRef.current = onNovaMensagem;

  useEffect(() => {
    let socket: Socket | undefined;
    let ativo = true;

    (async () => {
      const token = await getBoostApiToken().catch(() => null);
      if (!ativo || !token) return;

      socket = io(`${API_URL}/boost`, { auth: { token }, transports: ["websocket"] });

      socket.on("connect", () => {
        setConectado(true);
        socket?.emit("curso:entrar", { cursoId });
      });
      socket.on("disconnect", () => setConectado(false));
      socket.on("mensagem:nova", (mensagem: unknown) => callbackRef.current(mensagem));
    })();

    return () => {
      ativo = false;
      socket?.emit("curso:sair", { cursoId });
      socket?.disconnect();
    };
  }, [cursoId]);

  return { conectado };
}
