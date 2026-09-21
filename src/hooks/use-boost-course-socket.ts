import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/services/hub/client";
import { getApiToken } from "@/services/hub/session";

/**
 * Conecta no gateway do Boost (`/boost`) e entra na sala do curso enquanto o
 * componente estiver montado — mesmo padrão de `use-ticket-socket.ts` (Desk). O
 * REST continua sendo a fonte da verdade (histórico via GET /cursos-boost/:id/mensagens);
 * este hook só empurra `onNovaMensagem` quando o gateway avisa que uma mensagem nova
 * chegou (enviada pelo instrutor ou por um aluno no portal público), pra tela atualizar
 * sem precisar recarregar. O JWT do Hub é aceito pelo gateway (ele também aceita o token
 * do portal do aluno) — não é preciso nenhuma troca de sessão aqui.
 *
 * Só roda no cliente (dentro de `useEffect`): em SSR (TanStack Start) este
 * hook nunca executa durante a renderização do servidor.
 */
export function useBoostCourseSocket(courseId: string, onNovaMensagem: (mensagem: unknown) => void) {
  const [conectado, setConectado] = useState(false);
  const callbackRef = useRef(onNovaMensagem);
  callbackRef.current = onNovaMensagem;

  useEffect(() => {
    let socket: Socket | undefined;
    let ativo = true;

    (async () => {
      const token = await getApiToken().catch(() => null);
      if (!ativo || !token) return;

      socket = io(`${API_URL}/boost`, { auth: { token }, transports: ["websocket"] });

      socket.on("connect", () => {
        setConectado(true);
        socket?.emit("curso:entrar", { cursoId: courseId });
      });
      socket.on("disconnect", () => setConectado(false));
      socket.on("mensagem:nova", (mensagem: unknown) => callbackRef.current(mensagem));
    })();

    return () => {
      ativo = false;
      socket?.emit("curso:sair", { cursoId: courseId });
      socket?.disconnect();
    };
  }, [courseId]);

  return { conectado };
}
