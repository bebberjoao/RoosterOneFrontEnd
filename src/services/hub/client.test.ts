import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { API_URL, API_VERSION_PREFIX, ApiError, ApiUnavailableError, request } from "./client";
import { session } from "./session";

/**
 * Contrato do cliente HTTP. O caso mais importante aqui é o prefixo `/v1`:
 * a API é versionada por URI e toda rota de negócio existe **apenas** sob
 * /v1 — chamar sem o prefixo responde 404. Isso já foi uma regressão real
 * (o versionamento entrou no backend e o cliente continuou chamando a raiz),
 * e este teste existe para não acontecer de novo.
 */

function respostaOk(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  session.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  session.clear();
});

/** URL efetivamente chamada na última invocação do fetch. */
function urlChamada() {
  return fetchMock.mock.calls.at(-1)?.[0] as string;
}

describe("prefixo de versão", () => {
  it("prefixa toda chamada REST com /v1", async () => {
    fetchMock.mockResolvedValue(respostaOk([]));
    await request("/usuarios");
    expect(urlChamada()).toBe(`${API_URL}/v1/usuarios`);
  });

  it("mantém o prefixo em caminhos com parâmetro e query", async () => {
    fetchMock.mockResolvedValue(respostaOk({}));
    await request("/reservas?ambienteId=abc&pagina=2");
    expect(urlChamada()).toBe(`${API_URL}/v1/reservas?ambienteId=abc&pagina=2`);
  });

  it("não embute o prefixo em API_URL — é ela que abre os WebSockets, que não são versionados", () => {
    // Se /v1 estivesse dentro de API_URL, `io(`${API_URL}/desk`)` viraria
    // `.../v1/desk` e o chat quebraria.
    expect(API_URL).not.toContain("/v1");
    expect(API_VERSION_PREFIX).toBe("/v1");
  });
});

describe("autenticação", () => {
  it("não envia Authorization quando não há sessão", async () => {
    fetchMock.mockResolvedValue(respostaOk([]));
    await request("/usuarios");
    const headers = fetchMock.mock.calls.at(-1)?.[1].headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("anexa o token da sessão automaticamente", async () => {
    session.set("tok-123", { id: "u1", nome: "Fulano", email: "f@x.com" });
    fetchMock.mockResolvedValue(respostaOk([]));
    await request("/usuarios");
    const headers = fetchMock.mock.calls.at(-1)?.[1].headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok-123");
  });

  it("401 limpa a sessão, para o app voltar sozinho ao login", async () => {
    session.set("tok-expirado", { id: "u1", nome: "Fulano", email: "f@x.com" });
    fetchMock.mockResolvedValue(respostaOk({ message: "Unauthorized" }, 401));

    await expect(request("/usuarios")).rejects.toBeInstanceOf(ApiError);
    expect(session.token).toBeNull();
    expect(session.usuario).toBeNull();
  });
});

describe("renovação automática de sessão", () => {
  /** Resposta de POST /auth/refresh. */
  function respostaRefresh(accessToken: string, refreshToken: string) {
    return respostaOk({
      accessToken,
      refreshToken,
      usuario: { id: "u1", nome: "Fulano", email: "f@x.com" },
      acesso: { permissoes: [{ nome: "hub.usuarios.acessar" }] },
    });
  }

  it("renova com o refresh token e repete a chamada, de forma transparente", async () => {
    session.set("tok-velho", { id: "u1", nome: "Fulano", email: "f@x.com" }, [], "refresh-1");
    fetchMock
      .mockResolvedValueOnce(respostaOk({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(respostaRefresh("tok-novo", "refresh-2"))
      .mockResolvedValueOnce(respostaOk([{ id: "1" }]));

    await expect(request("/usuarios")).resolves.toEqual([{ id: "1" }]);

    expect(fetchMock.mock.calls[1][0]).toBe(`${API_URL}/v1/auth/refresh`);
    // A repetição já vai com o token novo.
    const headersDaRepeticao = fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(headersDaRepeticao["Authorization"]).toBe("Bearer tok-novo");
    expect(session.token).toBe("tok-novo");
    expect(session.refreshToken).toBe("refresh-2");
  });

  it("derruba a sessão quando a própria renovação é recusada", async () => {
    session.set("tok-velho", { id: "u1", nome: "Fulano", email: "f@x.com" }, [], "refresh-morto");
    fetchMock
      .mockResolvedValueOnce(respostaOk({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(respostaOk({ message: "Sessão inválida ou expirada." }, 401));

    await expect(request("/usuarios")).rejects.toBeInstanceOf(ApiError);
    expect(session.token).toBeNull();
  });

  it("não tenta renovar quando não há refresh token", async () => {
    session.set("tok-velho", { id: "u1", nome: "Fulano", email: "f@x.com" });
    fetchMock.mockResolvedValue(respostaOk({ message: "Unauthorized" }, 401));

    await expect(request("/usuarios")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(session.token).toBeNull();
  });

  it("mantém a sessão quando a renovação falha por rede, em vez de deslogar", async () => {
    // Backend fora do ar não é o mesmo que sessão inválida — deslogar aqui
    // faria o usuário perder o login por uma oscilação de rede.
    session.set("tok-velho", { id: "u1", nome: "Fulano", email: "f@x.com" }, [], "refresh-1");
    fetchMock
      .mockResolvedValueOnce(respostaOk({ message: "Unauthorized" }, 401))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(request("/usuarios")).rejects.toBeInstanceOf(ApiError);
    expect(session.token).toBe("tok-velho");
  });

  it("compartilha uma única renovação entre chamadas simultâneas", async () => {
    // Sem isso, a primeira renovação rotacionaria o refresh token e a segunda
    // tentaria renovar com um token já revogado, derrubando a sessão recém-salva.
    session.set("tok-velho", { id: "u1", nome: "Fulano", email: "f@x.com" }, [], "refresh-1");
    fetchMock.mockImplementation((url: string) => {
      if (String(url).endsWith("/auth/refresh")) return Promise.resolve(respostaRefresh("tok-novo", "refresh-2"));
      return Promise.resolve(
        session.token === "tok-novo" ? respostaOk([]) : respostaOk({ message: "Unauthorized" }, 401),
      );
    });

    await Promise.all([request("/usuarios"), request("/setores"), request("/modulos")]);

    const chamadasDeRefresh = fetchMock.mock.calls.filter((c) => String(c[0]).endsWith("/auth/refresh"));
    expect(chamadasDeRefresh).toHaveLength(1);
  });
});

describe("tratamento de erro", () => {
  it("propaga a mensagem do backend no ApiError", async () => {
    fetchMock.mockResolvedValue(respostaOk({ message: "Turma já atingiu a capacidade máxima." }, 409));
    await expect(request("/matriculas", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 409,
      message: "Turma já atingiu a capacidade máxima.",
    });
  });

  it("junta o array de mensagens do ValidationPipe numa linha só", async () => {
    fetchMock.mockResolvedValue(
      respostaOk({ message: ["titulo não pode ser vazio", "descricao é obrigatória"] }, 400),
    );
    await expect(request("/chamados", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 400,
      message: "titulo não pode ser vazio, descricao é obrigatória",
    });
  });

  it("cai num texto genérico quando o corpo do erro não traz mensagem", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));
    await expect(request("/usuarios")).rejects.toMatchObject({ status: 500, message: "Erro 500" });
  });

  it("distingue falha de rede (ApiUnavailableError) de erro HTTP (ApiError)", async () => {
    // A interface trata os dois de formas diferentes: "sem conexão com o
    // servidor" não é a mesma coisa que "o servidor recusou a operação".
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(request("/usuarios")).rejects.toBeInstanceOf(ApiUnavailableError);
  });
});

describe("corpo da requisição", () => {
  it("serializa o body em JSON e declara o Content-Type", async () => {
    fetchMock.mockResolvedValue(respostaOk({ id: "1" }, 201));
    await request("/setores", { method: "POST", body: { nome: "Financeiro" } });

    const init = fetchMock.mock.calls.at(-1)?.[1];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ nome: "Financeiro" }));
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("não declara Content-Type quando não há corpo", async () => {
    fetchMock.mockResolvedValue(respostaOk([]));
    await request("/setores");
    const headers = fetchMock.mock.calls.at(-1)?.[1].headers as Record<string, string> | undefined;
    expect(headers?.["Content-Type"]).toBeUndefined();
  });

  it("devolve undefined quando a resposta não tem corpo (ex.: 204)", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 200 }));
    await expect(request("/setores/1", { method: "DELETE" })).resolves.toBeUndefined();
  });
});
