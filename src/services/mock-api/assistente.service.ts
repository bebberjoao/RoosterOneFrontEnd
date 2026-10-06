// Assistente de dúvidas — cliente da API /assistente do backend (src/assistente).
// O backend responde exclusivamente com o conteúdo do Manual do Usuário e dos guias
// (motor de linguagem local, sem serviço externo) e indica, quando houver, o roteiro
// guiado da tarefa. As etapas do roteiro ficam no frontend
// (components/rooster/assistente/roteiros.ts), pois apontam para elementos da interface.
import { request } from "@/services/hub/client";

export type AssuntoAssistente = { id: string; titulo: string };

export type EntradaAssistente = {
  id: string;
  modulo: string;
  titulo: string;
  /** Tela correspondente; nula para telas com parâmetro (ex.: detalhe de um chamado). */
  rota: string | null;
  quemUsa?: string;
  resumo: string;
  passos: string[];
  observacoes: string[];
  efeitos?: string;
};

export type RespostaAssistente =
  | {
      tipo: "saudacao" | "agradecimento" | "nao-encontrado";
      mensagem: string;
      sugestoes: AssuntoAssistente[];
    }
  | {
      tipo: "resposta";
      entrada: EntradaAssistente;
      /** Roteiro guiado da tarefa; `permitido` indica se o usuário possui a permissão exigida para executá-la. */
      roteiro: (AssuntoAssistente & { permitido: boolean }) | null;
      relacionadas: AssuntoAssistente[];
      confianca: number;
    };

export const assistenteService = {
  perguntar(pergunta: string, rotaAtual?: string) {
    return request<RespostaAssistente>("/assistente/perguntas", {
      method: "POST",
      body: { pergunta, rotaAtual },
    });
  },
  /** Tarefas com roteiro guiado que o usuário pode executar. */
  sugestoes() {
    return request<AssuntoAssistente[]>("/assistente/sugestoes");
  },
  entrada(id: string) {
    return request<RespostaAssistente>(`/assistente/entradas/${encodeURIComponent(id)}`);
  },
  roteiro(id: string) {
    return request<RespostaAssistente>(`/assistente/roteiros/${encodeURIComponent(id)}`);
  },
};
