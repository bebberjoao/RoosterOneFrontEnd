// Estado do assistente de dúvidas: conversa do chat e roteiro guiado em execução.
// Fica na raiz da aplicação (e não no AppShell, montado de novo a cada módulo),
// para que a conversa e o roteiro sobrevivam à navegação entre módulos. A conversa
// é descartada ao encerrar a sessão.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, ApiUnavailableError } from "@/services/hub/client";
import {
  assistenteService,
  type AssuntoAssistente,
  type RespostaAssistente,
} from "@/services/mock-api/assistente.service";
import { useAuth } from "../auth-context";
import { TourProvider } from "./tour";

export type MensagemChat =
  | { id: number; autor: "usuario"; texto: string }
  | { id: number; autor: "assistente"; resposta: RespostaAssistente }
  | { id: number; autor: "erro"; texto: string };

/** Remove o identificador de cada variante da união (Omit simples não distribui sobre uniões). */
type SemId<T> = T extends unknown ? Omit<T, "id"> : never;

type AssistenteCtx = {
  aberto: boolean;
  setAberto: (aberto: boolean) => void;
  mensagens: MensagemChat[];
  carregando: boolean;
  /** Tarefas com roteiro guiado que o usuário pode executar (null enquanto não carregadas). */
  sugestoes: AssuntoAssistente[] | null;
  carregarSugestoes: () => void;
  perguntar: (pergunta: string, rotaAtual?: string) => Promise<void>;
  /** Abre um assunto escolhido no chat: roteiro sugerido ou assunto relacionado da documentação. */
  abrirAssunto: (assunto: AssuntoAssistente, tipo: "roteiro" | "entrada") => Promise<void>;
  limpar: () => void;
};

const Ctx = createContext<AssistenteCtx | null>(null);

export function useAssistente(): AssistenteCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAssistente deve ser usado dentro de AssistenteProvider");
  return ctx;
}

function mensagemDeErro(err: unknown): string {
  if (err instanceof ApiUnavailableError)
    return "O assistente está indisponível no momento: não foi possível contatar o servidor.";
  if (err instanceof ApiError) return err.message;
  return "Não foi possível obter a resposta. Tente novamente.";
}

export function AssistenteProvider({ children }: { children: ReactNode }) {
  const { authed } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [sugestoes, setSugestoes] = useState<AssuntoAssistente[] | null>(null);
  const sequencia = useRef(0);
  /** Geração da conversa: respostas que chegam depois de "Nova conversa" ou do logout são descartadas. */
  const geracao = useRef(0);

  const limpar = useCallback(() => {
    geracao.current += 1;
    setMensagens([]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!authed) {
      limpar();
      setAberto(false);
      setSugestoes(null);
    }
  }, [authed, limpar]);

  const acrescentar = useCallback((m: SemId<MensagemChat>) => {
    sequencia.current += 1;
    setMensagens((atual) => [...atual, { ...m, id: sequencia.current } as MensagemChat]);
  }, []);

  const consultar = useCallback(
    async (rotulo: string, chamada: () => Promise<RespostaAssistente>) => {
      const minhaGeracao = geracao.current;
      acrescentar({ autor: "usuario", texto: rotulo });
      setCarregando(true);
      try {
        const resposta = await chamada();
        if (geracao.current === minhaGeracao) acrescentar({ autor: "assistente", resposta });
      } catch (err) {
        if (geracao.current === minhaGeracao)
          acrescentar({ autor: "erro", texto: mensagemDeErro(err) });
      } finally {
        if (geracao.current === minhaGeracao) setCarregando(false);
      }
    },
    [acrescentar],
  );

  const perguntar = useCallback(
    (pergunta: string, rotaAtual?: string) =>
      consultar(pergunta, () => assistenteService.perguntar(pergunta, rotaAtual)),
    [consultar],
  );

  const abrirAssunto = useCallback(
    (assunto: AssuntoAssistente, tipo: "roteiro" | "entrada") =>
      consultar(assunto.titulo, () =>
        tipo === "roteiro"
          ? assistenteService.roteiro(assunto.id)
          : assistenteService.entrada(assunto.id),
      ),
    [consultar],
  );

  const carregarSugestoes = useCallback(() => {
    if (sugestoes !== null) return;
    assistenteService
      .sugestoes()
      .then(setSugestoes)
      .catch(() => setSugestoes([]));
  }, [sugestoes]);

  const value = useMemo<AssistenteCtx>(
    () => ({
      aberto,
      setAberto,
      mensagens,
      carregando,
      sugestoes,
      carregarSugestoes,
      perguntar,
      abrirAssunto,
      limpar,
    }),
    [aberto, mensagens, carregando, sugestoes, carregarSugestoes, perguntar, abrirAssunto, limpar],
  );

  return (
    <Ctx.Provider value={value}>
      <TourProvider>{children}</TourProvider>
    </Ctx.Provider>
  );
}
