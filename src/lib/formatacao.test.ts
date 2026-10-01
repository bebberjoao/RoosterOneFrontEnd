import { describe, expect, it } from "vitest";
import {
  dataLocalIso, fmtData, fmtDataHora, fmtHora, fmtMesAno, fmtMoeda, fmtNumero, fmtNumeroLivre,
  fmtPercentual, fmtTamanho, paraNumero, soData,
} from "./formatacao";

describe("formatação de datas", () => {
  it("exibe data pura em dd/mm/aaaa", () => {
    expect(fmtData("2026-10-03")).toBe("03/10/2026");
  });

  it("não desloca a data pura serializada como meia-noite UTC (coluna @db.Date)", () => {
    // Em fuso negativo (Brasília), new Date() deste valor cairia no dia 02.
    expect(fmtData("2026-10-03T00:00:00.000Z")).toBe("03/10/2026");
  });

  it("usa ano com quatro dígitos para carimbos de data e hora", () => {
    expect(fmtData(new Date(2026, 9, 1, 14, 6))).toBe("01/10/2026");
    expect(fmtDataHora(new Date(2026, 9, 1, 14, 6))).toBe("01/10/2026 · 14:06");
  });

  it("devolve travessão para valor ausente ou inválido, nunca 'Invalid Date'", () => {
    expect(fmtData(null)).toBe("—");
    expect(fmtData("")).toBe("—");
    expect(fmtData("não é data")).toBe("—");
    expect(fmtDataHora(undefined)).toBe("—");
  });

  it("reduz o valor da API ao formato interno aaaa-mm-dd", () => {
    expect(soData("2026-10-03T00:00:00.000Z")).toBe("2026-10-03");
    expect(soData("2026-10-03")).toBe("2026-10-03");
    expect(soData(null)).toBe("");
  });

  it("calcula a data de hoje no fuso local", () => {
    expect(dataLocalIso(new Date(2026, 9, 1, 23, 30))).toBe("2026-10-01");
  });

  it("formata horário sem segundos", () => {
    expect(fmtHora("07:00:00")).toBe("07:00");
    expect(fmtHora("7:05")).toBe("07:05");
  });

  it("formata o título do calendário com minúscula na preposição", () => {
    expect(fmtMesAno(new Date(2026, 9, 1))).toBe("Outubro de 2026");
  });
});

describe("formatação de números", () => {
  it("converte Decimal recebido como texto, sem concatenação", () => {
    expect(paraNumero("4800.00") + paraNumero("5200.00")).toBe(10000);
    expect(paraNumero("abc")).toBe(0);
  });

  it("usa vírgula decimal e ponto de milhar", () => {
    expect(fmtNumero(8.926, 2)).toBe("8,93");
    expect(fmtNumeroLivre(0.4)).toBe("0,4");
    expect(fmtPercentual(33.271)).toBe("33,27%");
    expect(fmtPercentual(0.033, 3)).toBe("0,033%");
    expect(fmtMoeda("13200")).toMatch(/^R\$\s13\.200,00$/);
  });

  it("formata tamanho de arquivo com vírgula decimal", () => {
    expect(fmtTamanho(512)).toBe("512 B");
    expect(fmtTamanho(1536 * 1024)).toBe("1,5 MB");
  });
});
