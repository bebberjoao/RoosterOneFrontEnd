// Regras acadêmicas de exibição, em um único lugar, para que a tela do professor e o portal do aluno mostrem
// sempre os mesmos números. O cálculo oficial da média é o do backend (`AcademyService.calcularMediaTurma`);
// `mediaPonderada` é a réplica usada na tela de lançamento, que recalcula a média enquanto o professor digita.
//
// O sistema não aprova nem reprova ninguém automaticamente (RN022 e RN023): a nota de referência e a frequência
// mínima abaixo servem apenas para destacar, com cores e rótulos, quem está abaixo delas.

/** Escala da média: toda nota é convertida para 0–10 pela nota máxima do item antes de ser ponderada. */
export const ESCALA_MEDIA = 10;
/** Média de referência (na escala 0–10) a partir da qual a situação é exibida como "Aprovado". */
export const NOTA_APROVACAO = 6;
/** Abaixo desta média de referência, a nota é destacada como insuficiente. */
export const NOTA_ATENCAO = 4;
/** Percentual mínimo de presença usado como referência nos alertas de frequência. */
export const FREQUENCIA_MINIMA = 75;

export type Presenca = "presente" | "falta" | "atraso" | "justificado";

/** Presente, atraso e falta justificada contam como presença; somente "falta" conta como ausência. */
export function contaComoPresenca(presenca: Presenca): boolean {
  return presenca !== "falta";
}

/** Percentual de presença (0–100, arredondado) de uma lista de registros; `null` quando não há registros. */
export function percentualPresenca(registros: readonly Presenca[]): number | null {
  if (registros.length === 0) return null;
  return Math.round((registros.filter(contaComoPresenca).length / registros.length) * 100);
}

/** Converte a nota de um item para a escala 0–10, pela nota máxima do item. */
export function notaNaEscala(valor: number, notaMaxima: number): number {
  if (!(notaMaxima > 0)) return 0;
  return (valor / notaMaxima) * ESCALA_MEDIA;
}

export type ItemDaMedia = { peso: number; notaMaxima: number; nota: number | null | undefined };

/**
 * Média ponderada na escala 0–10, com duas casas. Itens sem nota lançada não entram no cálculo (não valem zero);
 * sem nenhum item com nota e peso, o resultado é `null`.
 */
export function mediaPonderada(itens: readonly ItemDaMedia[]): number | null {
  let somaPesos = 0;
  let somaPonderada = 0;
  for (const item of itens) {
    if (item.nota == null || !(item.notaMaxima > 0)) continue;
    somaPesos += item.peso;
    somaPonderada += notaNaEscala(item.nota, item.notaMaxima) * item.peso;
  }
  if (somaPesos === 0) return null;
  return +(somaPonderada / somaPesos).toFixed(2);
}

export type FaixaDeNota = "suficiente" | "atencao" | "insuficiente";

/** Faixa de uma nota já na escala 0–10 (use `notaNaEscala` para a nota de um item). */
export function faixaDaNota(notaEscala: number): FaixaDeNota {
  if (notaEscala >= NOTA_APROVACAO) return "suficiente";
  if (notaEscala >= NOTA_ATENCAO) return "atencao";
  return "insuficiente";
}

/** Peso (fração de 0 a 1) como percentual para exibição: 0,4 → "40%". */
export function pesoEmPercentual(peso: number): string {
  return `${(Math.round(peso * 1000) / 10).toLocaleString("pt-BR")}%`;
}
