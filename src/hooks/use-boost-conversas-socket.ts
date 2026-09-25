import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/services/hub/client";
import { getApiToken } from "@/services/hub/session";

type Callbacks = {
  /** Mensagem nova na conversa aberta (payload cru do Prisma, mesmo shape do REST). */
  onMensagem: (mensagem: unknown) => void;
  /** Um aluno escreveu em algum curso que o orientador orienta — a caixa de entrada precisa atualizar. */
  onCaixaAtualizada: (info: { conversaId: string; cursoId: string }) => void;
};

/**
 * Tempo real da tela "Conversas" do orientador (namespace `/boost`, token do Hub).
 * Uma única conexão: entra na "caixa" (avisos de todos os cursos que orienta) e, à parte, na sala
 * da conversa aberta — trocar de conversa só sai de uma sala e entra em outra, sem reconectar.
 * O REST continua sendo a fonte da verdade; isto só empurra o que chegou depois.
 */
export function useBoostConversasSocket(conversaId: string | null, callbacks: Callbacks) {
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const conversaRef = useRef(conversaId);
  conversaRef.current = conversaId;

  useEffect(() => {
    let ativo = true;
    (async () => {
      const token = await getApiToken().catch(() => null);
      if (!ativo || !token) return;
      const socket = io(`${API_URL}/boost`, { auth: { token }, transports: ["websocket"] });
      socketRef.current = socket;
      socket.on("connect", () => {
        setConectado(true);
        socket.emit("caixa:entrar");
        if (conversaRef.current) socket.emit("conversa:entrar", { conversaId: conversaRef.current });
      });
      socket.on("disconnect", () => setConectado(false));
      socket.on("mensagem:nova", (payload: { conversaId?: string; mensagem?: unknown }) => {
        if (payload?.conversaId === conversaRef.current && payload.mensagem) callbacksRef.current.onMensagem(payload.mensagem);
      });
      socket.on("caixa:atualizar", (info: { conversaId: string; cursoId: string }) => callbacksRef.current.onCaixaAtualizada(info));
    })();
    return () => {
      ativo = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conectado || !conversaId) return;
    socket.emit("conversa:entrar", { conversaId });
    return () => {
      socket.emit("conversa:sair", { conversaId });
    };
  }, [conversaId, conectado]);

  return { conectado };
}
