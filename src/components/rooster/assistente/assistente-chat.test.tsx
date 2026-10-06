import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import type { AxeResults } from "axe-core";
import type { RespostaAssistente } from "@/services/mock-api/assistente.service";
import { ApiUnavailableError } from "@/services/hub/client";

/**
 * Chat do assistente: pergunta → cartão de resposta com o trecho do manual, botão
 * "Mostrar na tela" apenas quando o usuário pode executar a tarefa, atalho para a tela,
 * mensagens de erro e acessibilidade do painel.
 */

const navegar = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navegar,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/" } }),
}));
vi.mock("../auth-context", () => ({ useAuth: () => ({ authed: true }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("../hub/permission-context", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../hub/permission-context")>()),
  usePermissions: () => ({
    granted: new Set(["desk.tickets.acessar", "desk.tickets.criar"]),
    hasCustom: true,
  }),
}));
const servico = {
  perguntar: vi.fn(),
  sugestoes: vi.fn(),
  entrada: vi.fn(),
  roteiro: vi.fn(),
};
vi.mock("@/services/mock-api/assistente.service", () => ({ assistenteService: servico }));

const { AssistenteProvider } = await import("./assistente-context");
const { AssistenteChat } = await import("./assistente-chat");

function resposta(permitido: boolean, rota = "/desk/tickets"): RespostaAssistente {
  return {
    tipo: "resposta",
    entrada: {
      id: "desk-tickets",
      modulo: "Rooster Desk",
      titulo: "Chamados",
      rota,
      quemUsa: "Solicitantes e equipe de atendimento.",
      resumo: "Relação dos chamados abertos pelo usuário.",
      passos: ['Selecionar "Novo chamado" e preencher o formulário.'],
      observacoes: ["A categoria define o setor de destino."],
    },
    roteiro: { id: "abrir-chamado", titulo: "Abrir um chamado de suporte", permitido },
    relacionadas: [{ id: "desk-tickets-id", titulo: "Detalhe do chamado" }],
    confianca: 0.8,
  };
}

function montar() {
  return render(
    <AssistenteProvider>
      <AssistenteChat />
    </AssistenteProvider>,
  );
}

async function perguntar(texto: string) {
  fireEvent.click(screen.getByRole("button", { name: "Abrir assistente de dúvidas" }));
  const campo = screen.getByLabelText("Sua dúvida");
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.keyDown(campo, { key: "Enter" });
}

beforeEach(() => {
  navegar.mockClear();
  for (const f of Object.values(servico)) f.mockReset();
  servico.sugestoes.mockResolvedValue([
    { id: "abrir-chamado", titulo: "Abrir um chamado de suporte" },
  ]);
});

describe("chat do assistente", () => {
  it("responde com o trecho do manual, o passo a passo na tela e o atalho para a tela", async () => {
    servico.perguntar.mockResolvedValue(resposta(true));
    montar();
    await perguntar("como abro um chamado?");
    expect(await screen.findByRole("heading", { name: "Chamados" })).toBeInTheDocument();
    expect(servico.perguntar).toHaveBeenCalledWith("como abro um chamado?", "/");
    expect(screen.getByText("Relação dos chamados abertos pelo usuário.")).toBeInTheDocument();
    expect(
      screen.getByText('Selecionar "Novo chamado" e preencher o formulário.'),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir um chamado de suporte" })).toBeInTheDocument(); // sugestão inicial

    fireEvent.click(screen.getByRole("button", { name: "Abrir a tela" }));
    expect(navegar).toHaveBeenCalledWith({ to: "/desk/tickets" });

    // "Mostrar na tela" fecha o chat e inicia o roteiro, que leva o usuário à tela da tarefa.
    fireEvent.click(screen.getByRole("button", { name: "Mostrar na tela" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /assistente de dúvidas/ })).toBeNull(),
    );
    expect(navegar).toHaveBeenLastCalledWith({ to: "/desk/tickets" });
  });

  it("sem a permissão da tarefa, não oferece o passo a passo e orienta a solicitá-la", async () => {
    servico.perguntar.mockResolvedValue(resposta(false));
    montar();
    await perguntar("como abro um chamado?");
    await screen.findByRole("heading", { name: "Chamados" });
    expect(screen.queryByRole("button", { name: "Mostrar na tela" })).toBeNull();
    expect(screen.getByText(/solicite a permissão a um administrador/)).toBeInTheDocument();
  });

  it("abre assuntos relacionados e informa quando a dúvida não está no manual", async () => {
    servico.perguntar.mockResolvedValue({
      tipo: "nao-encontrado",
      mensagem: "Não encontrei esse assunto no Manual do Usuário.",
      sugestoes: [{ id: "abrir-chamado", titulo: "Abrir um chamado de suporte" }],
    });
    montar();
    await perguntar("qual a capital da França");
    expect(
      await screen.findByText("Não encontrei esse assunto no Manual do Usuário."),
    ).toBeInTheDocument();
    expect(screen.getByText("Talvez ajude")).toBeInTheDocument();

    servico.roteiro.mockResolvedValue(resposta(true));
    fireEvent.click(screen.getAllByRole("button", { name: "Abrir um chamado de suporte" })[1]);
    expect(await screen.findByRole("heading", { name: "Chamados" })).toBeInTheDocument();
    expect(servico.roteiro).toHaveBeenCalledWith("abrir-chamado");
  });

  it("avisa quando o servidor está indisponível", async () => {
    servico.perguntar.mockRejectedValue(new ApiUnavailableError());
    montar();
    await perguntar("como reservo uma sala?");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O assistente está indisponível no momento",
    );
  });

  it("painel aberto, com resposta, sem violações de acessibilidade", async () => {
    servico.perguntar.mockResolvedValue(resposta(true));
    const { container } = montar();
    await perguntar("como abro um chamado?");
    await screen.findByRole("heading", { name: "Chamados" });
    const resultado = (await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    })) as AxeResults;
    expect(resultado.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
