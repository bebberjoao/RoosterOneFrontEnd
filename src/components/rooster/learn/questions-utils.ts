// Funções auxiliares das questões do Rooster Learn, separadas dos componentes (questions.tsx)
// para preservar o recarregamento rápido (fast refresh) do Vite.
import { OBJECTIVE_TYPES, type Question } from "@/services/mock-api/learn.service";

/** Descarrega um Blob como arquivo, com o nome informado. */
export function salvarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type AnswerState = { optionIds: string[]; text: string; file: File | null };

export function emptyAnswer(): AnswerState {
  return { optionIds: [], text: "", file: null };
}

/** Indica se a questão obrigatória ficou sem resposta. */
export function answerMissing(question: Question, a: AnswerState | undefined) {
  if (!question.required) return false;
  if (OBJECTIVE_TYPES.has(question.type)) return !a || a.optionIds.length === 0;
  if (question.type === "discursiva") return !a || !a.text.trim();
  return !a?.file;
}
