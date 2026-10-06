import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import type { RoteiroTela } from "./roteiros";

/**
 * Motor dos roteiros guiados: localização do elemento, destaque, avanço por clique ou
 * por "Próximo", bloqueio dos cliques fora do destaque, passos opcionais e Esc.
 * O jsdom não calcula layout; as caixas dos elementos são simuladas abaixo.
 */

const navegar = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navegar,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/teste" } }),
}));
vi.mock("../auth-context", () => ({ useAuth: () => ({ authed: true }) }));
const sucesso = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (m: string) => sucesso(m) } }));

const ROTEIRO_TESTE: RoteiroTela = {
  id: "teste",
  titulo: "Roteiro de teste",
  passos: [
    {
      alvo: "botao-abrir",
      rota: "/teste",
      acao: "clicar",
      titulo: "Abrir",
      texto: "Clique em Abrir para começar.",
      porque: "O formulário só aparece depois.",
    },
    {
      alvo: "campo-ausente",
      acao: "preencher",
      opcional: true,
      titulo: "Opcional",
      texto: "Campo que pode não existir.",
      porque: "Depende do conteúdo.",
    },
    {
      alvo: "campo-nome",
      acao: "preencher",
      titulo: "Nome",
      texto: "Informe o nome completo.",
      porque: "Identifica o registro.",
    },
    {
      alvo: "resumo",
      acao: "observar",
      titulo: "Resumo",
      texto: "Confira o resumo antes de salvar.",
      porque: "Evita retrabalho.",
    },
  ],
};
vi.mock("./roteiros", () => ({
  roteiroPorId: (id: string) => (id === "teste" ? ROTEIRO_TESTE : undefined),
}));

const { TourProvider, useTour, posicionarLegenda } = await import("./tour");

beforeAll(() => {
  // Layout simulado: todo elemento renderizado tem uma caixa visível.
  HTMLElement.prototype.getClientRects = function () {
    return [{ x: 100, y: 100, width: 120, height: 32 }] as unknown as DOMRectList;
  };
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      x: 100,
      y: 100,
      left: 100,
      top: 100,
      width: 120,
      height: 32,
      right: 220,
      bottom: 132,
      toJSON: () => ({}),
    } as DOMRect;
  };
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  navegar.mockClear();
  sucesso.mockClear();
});

function Pagina({ iniciar = true }: { iniciar?: boolean }) {
  const tour = useTour();
  useEffect(() => {
    if (iniciar) tour.iniciar("teste");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      <button type="button" data-tour="botao-abrir">
        Abrir
      </button>
      <label data-tour="campo-nome">
        Nome <input />
      </label>
      <p data-tour="resumo">Resumo</p>
      <button type="button" onClick={foraClicado}>
        Fora do destaque
      </button>
      <span data-testid="ativo">{tour.ativo ? `passo ${tour.ativo.indice}` : "inativo"}</span>
    </div>
  );
}
const foraClicado = vi.fn();

/** Aguarda alguns quadros de animação (o motor acompanha os elementos a cada quadro). */
async function quadros(ms = 120) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe("roteiro guiado", () => {
  it("destaca o elemento do passo e explica o que fazer e por quê", async () => {
    render(
      <TourProvider>
        <Pagina />
      </TourProvider>,
    );
    await quadros();
    const legenda = screen.getByRole("dialog");
    expect(legenda).toHaveTextContent("Passo 1 de 4");
    expect(legenda).toHaveTextContent("Clique em Abrir para começar.");
    expect(legenda).toHaveTextContent("Por quê: O formulário só aparece depois.");
    expect(legenda).toHaveAttribute("data-tour-situacao", "ativo");
    expect(screen.getByTestId("tour-camada").querySelectorAll("mask rect").length).toBe(2); // tela inteira + 1 recorte
    expect(navegar).not.toHaveBeenCalled(); // já está na tela do passo
  });

  it("descarta cliques fora do destaque e avança ao clicar no elemento destacado", async () => {
    render(
      <TourProvider>
        <Pagina />
      </TourProvider>,
    );
    await quadros();
    fireEvent.click(screen.getByText("Fora do destaque"));
    expect(foraClicado).not.toHaveBeenCalled();
    expect(screen.getByTestId("ativo")).toHaveTextContent("passo 0");

    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    // O passo opcional sem elemento na tela é pulado; o seguinte é o campo Nome.
    await waitFor(() => expect(screen.getByTestId("ativo")).toHaveTextContent("passo 2"), {
      timeout: 4000,
    });
    expect(screen.getByRole("dialog")).toHaveTextContent("Informe o nome completo.");
  });

  it("avança em Próximo e conclui o roteiro no último passo", async () => {
    render(
      <TourProvider>
        <Pagina />
      </TourProvider>,
    );
    await quadros();
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await waitFor(() => expect(screen.getByTestId("ativo")).toHaveTextContent("passo 2"), {
      timeout: 4000,
    });
    await quadros();
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("Confira o resumo antes de salvar."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await quadros();
    expect(screen.getByTestId("ativo")).toHaveTextContent("inativo");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(sucesso).toHaveBeenCalledWith("Roteiro concluído: Roteiro de teste");
  });

  it("encerra com Esc", async () => {
    render(
      <TourProvider>
        <Pagina />
      </TourProvider>,
    );
    await quadros();
    fireEvent.keyDown(window, { key: "Escape" });
    await quadros();
    expect(screen.getByTestId("ativo")).toHaveTextContent("inativo");
    expect(sucesso).not.toHaveBeenCalled();
  });

  it("não inicia roteiro sem etapas definidas", () => {
    let iniciado: boolean | undefined;
    function Teste() {
      const tour = useTour();
      useEffect(() => {
        iniciado = tour.iniciar("inexistente");
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }
    render(
      <TourProvider>
        <Teste />
      </TourProvider>,
    );
    expect(iniciado).toBe(false);
  });
});

describe("posição da legenda", () => {
  it("prefere a direita do elemento e recorre à esquerda, abaixo e acima, sempre dentro da tela", () => {
    vi.stubGlobal("innerWidth", 1200);
    vi.stubGlobal("innerHeight", 800);
    expect(posicionarLegenda({ x: 100, y: 300, w: 200, h: 40 }, 340, 200).left).toBe(314);
    expect(posicionarLegenda({ x: 800, y: 300, w: 350, h: 40 }, 340, 200).left).toBe(
      800 - 14 - 340,
    );
    expect(posicionarLegenda({ x: 20, y: 100, w: 1160, h: 40 }, 340, 200).top).toBe(154);
    expect(posicionarLegenda({ x: 20, y: 500, w: 1160, h: 280 }, 340, 200).top).toBe(
      500 - 14 - 200,
    );
    const centro = posicionarLegenda(null, 340, 200);
    expect(centro).toEqual({ top: 300, left: 430 });
    vi.unstubAllGlobals();
  });
});
