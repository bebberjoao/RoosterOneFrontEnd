import { describe, expect, it } from "vitest";
import {
  contaComoPresenca, faixaDaNota, mediaPonderada, notaNaEscala, percentualPresenca, pesoEmPercentual,
} from "./regras-academicas";

describe("mediaPonderada — mesma regra do backend (calcularMediaTurma)", () => {
  it("converte cada nota para a escala 0–10 antes de ponderar", () => {
    // Prova valendo 10 (nota 8) e trabalho valendo 100 (nota 90), com o mesmo peso: (8 + 9) / 2.
    expect(mediaPonderada([
      { peso: 0.5, notaMaxima: 10, nota: 8 },
      { peso: 0.5, notaMaxima: 100, nota: 90 },
    ])).toBe(8.5);
  });

  it("nota máxima em um item valendo 5 vale 10 na média, e não 5", () => {
    expect(mediaPonderada([{ peso: 1, notaMaxima: 5, nota: 5 }])).toBe(10);
  });

  it("desconsidera os itens sem nota, em vez de tratá-los como zero", () => {
    expect(mediaPonderada([
      { peso: 0.6, notaMaxima: 10, nota: 7 },
      { peso: 0.4, notaMaxima: 10, nota: null },
    ])).toBe(7);
  });

  it("respeita os pesos mesmo quando a soma não é 1", () => {
    expect(mediaPonderada([
      { peso: 0.2, notaMaxima: 10, nota: 10 },
      { peso: 0.6, notaMaxima: 10, nota: 5 },
    ])).toBe(6.25);
  });

  it("devolve null sem nenhuma nota lançada", () => {
    expect(mediaPonderada([{ peso: 1, notaMaxima: 10, nota: null }])).toBeNull();
    expect(mediaPonderada([])).toBeNull();
  });
});

describe("frequência", () => {
  it("atraso e falta justificada contam como presença; só a falta é ausência", () => {
    expect(contaComoPresenca("presente")).toBe(true);
    expect(contaComoPresenca("atraso")).toBe(true);
    expect(contaComoPresenca("justificado")).toBe(true);
    expect(contaComoPresenca("falta")).toBe(false);
  });

  it("calcula o percentual de presença e devolve null sem registros", () => {
    expect(percentualPresenca(["presente", "atraso", "justificado", "falta"])).toBe(75);
    expect(percentualPresenca([])).toBeNull();
  });
});

describe("faixas e formatação", () => {
  it("classifica a nota pela escala 0–10, e não pelo valor bruto do item", () => {
    expect(faixaDaNota(notaNaEscala(70, 100))).toBe("suficiente");
    expect(faixaDaNota(notaNaEscala(4.5, 5))).toBe("suficiente");
    expect(faixaDaNota(notaNaEscala(5, 10))).toBe("atencao");
    expect(faixaDaNota(notaNaEscala(3, 10))).toBe("insuficiente");
  });

  it("exibe o peso como percentual", () => {
    expect(pesoEmPercentual(0.4)).toBe("40%");
    expect(pesoEmPercentual(0.125)).toBe("12,5%");
  });
});
