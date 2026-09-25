import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cursosBoostPortalService } from "./cursos.service";
import { API_URL } from "./client";

/**
 * Conferência pública de certificado.
 *
 * O ponto delicado é a distinção entre "não confere" e "não deu para
 * conferir": um 404 significa que aquele código não existe (resposta
 * legítima, `null`), enquanto falha de rede tem que propagar como erro — se
 * virasse `null`, a tela diria "certificado não encontrado" para um
 * documento possivelmente autêntico, o que é pior do que não responder.
 */

function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const certificado = {
  valido: true,
  codigo: "RB-2026-A1B2C3D4",
  aluno: "Maria Souza",
  curso: "Introdução a Redes",
  cargaHoraria: 20,
  emitidoEm: "2026-09-20T12:00:00.000Z",
};

describe("verificarCertificado", () => {
  it("devolve os dados quando o código confere", async () => {
    fetchMock.mockResolvedValue(resposta(certificado));
    await expect(cursosBoostPortalService.verificarCertificado("RB-2026-A1B2C3D4")).resolves.toEqual(certificado);
  });

  it("chama a rota pública, sob o prefixo de versão", async () => {
    fetchMock.mockResolvedValue(resposta(certificado));
    await cursosBoostPortalService.verificarCertificado("RB-2026-A1B2C3D4");
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_URL}/v1/certificados-boost/verificar/RB-2026-A1B2C3D4`);
  });

  it("escapa o código na URL, em vez de montar caminho quebrado", async () => {
    fetchMock.mockResolvedValue(resposta({ message: "Certificado não encontrado." }, 404));
    await cursosBoostPortalService.verificarCertificado("RB/2026 A1");
    expect(fetchMock.mock.calls[0][0]).toContain(encodeURIComponent("RB/2026 A1"));
  });

  it("devolve null quando o código não existe (404 é resposta, não falha)", async () => {
    fetchMock.mockResolvedValue(resposta({ message: "Certificado não encontrado." }, 404));
    await expect(cursosBoostPortalService.verificarCertificado("RB-2026-INVALIDO")).resolves.toBeNull();
  });

  it("propaga falha de rede em vez de dizer que o certificado não confere", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(cursosBoostPortalService.verificarCertificado("RB-2026-A1B2C3D4")).rejects.toBeTruthy();
  });

  it("propaga erro do servidor (500) em vez de tratar como inválido", async () => {
    fetchMock.mockResolvedValue(resposta({ message: "Erro interno" }, 500));
    await expect(cursosBoostPortalService.verificarCertificado("RB-2026-A1B2C3D4")).rejects.toBeTruthy();
  });
});
