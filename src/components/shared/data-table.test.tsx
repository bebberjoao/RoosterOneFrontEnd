import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type Column } from "./data-table";

/**
 * `DataTable` é o componente de listagem usado por praticamente toda tela de
 * gestão do sistema (chamados, reservas, patrimônio, cobranças...). Ordenação,
 * paginação e estado vazio são lógica de verdade, não só apresentação.
 */

type Linha = { id: string; nome: string; valor: number };

const COLUNAS: Column<Linha>[] = [
  { key: "nome", header: "Nome", cell: (r) => r.nome, sortValue: (r) => r.nome },
  { key: "valor", header: "Valor", cell: (r) => String(r.valor), sortValue: (r) => r.valor },
  { key: "acoes", header: "Ações", cell: () => "—" },
];

function linhas(n: number): Linha[] {
  return Array.from({ length: n }, (_, i) => ({ id: `id-${i}`, nome: `Item ${i}`, valor: i }));
}

/** Nomes renderizados na primeira coluna, na ordem em que aparecem. */
function nomesVisiveis() {
  const corpo = screen.getAllByRole("rowgroup")[1];
  return within(corpo)
    .getAllByRole("row")
    .map((tr) => within(tr).getAllByRole("cell")[0].textContent);
}

describe("estado vazio", () => {
  it("mostra a mensagem de vazio e nenhuma tabela quando não há linhas", () => {
    render(<DataTable rows={[]} columns={COLUNAS} emptyMessage="Nenhuma reserva encontrada." />);
    expect(screen.getByText("Nenhuma reserva encontrada.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("ordenação", () => {
  it("só oferece ordenação nas colunas que definem sortValue", () => {
    render(<DataTable rows={linhas(3)} columns={COLUNAS} />);
    expect(screen.getByRole("button", { name: /Nome/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Valor/ })).toBeInTheDocument();
    // "Ações" não tem sortValue — é texto, não botão.
    expect(screen.queryByRole("button", { name: /Ações/ })).not.toBeInTheDocument();
  });

  it("ordena ascendente no primeiro clique e inverte no segundo", async () => {
    const usuario = userEvent.setup();
    render(<DataTable rows={[...linhas(3)].reverse()} columns={COLUNAS} />);

    await usuario.click(screen.getByRole("button", { name: /Nome/ }));
    expect(nomesVisiveis()).toEqual(["Item 0", "Item 1", "Item 2"]);

    await usuario.click(screen.getByRole("button", { name: /Nome/ }));
    expect(nomesVisiveis()).toEqual(["Item 2", "Item 1", "Item 0"]);
  });

  it("ordena número como número, não como texto", async () => {
    // Ordenação textual colocaria "10" antes de "9" — o erro clássico.
    const usuario = userEvent.setup();
    const dados: Linha[] = [
      { id: "a", nome: "A", valor: 10 },
      { id: "b", nome: "B", valor: 9 },
      { id: "c", nome: "C", valor: 100 },
    ];
    render(<DataTable rows={dados} columns={COLUNAS} />);

    await usuario.click(screen.getByRole("button", { name: /Valor/ }));
    expect(nomesVisiveis()).toEqual(["B", "A", "C"]);
  });

  it("não altera o array de linhas recebido por prop", async () => {
    const usuario = userEvent.setup();
    const dados = [...linhas(3)].reverse();
    const copia = [...dados];
    render(<DataTable rows={dados} columns={COLUNAS} />);

    await usuario.click(screen.getByRole("button", { name: /Nome/ }));
    expect(dados).toEqual(copia);
  });
});

describe("paginação", () => {
  it("mostra apenas uma página por vez", () => {
    render(<DataTable rows={linhas(25)} columns={COLUNAS} pageSize={10} />);
    expect(nomesVisiveis()).toHaveLength(10);
  });

  it("volta para a primeira página ao reordenar", async () => {
    // Sem isso, ordenar estando na página 3 deixaria o usuário olhando um
    // pedaço do meio de uma lista que acabou de mudar de ordem.
    const usuario = userEvent.setup();
    render(<DataTable rows={linhas(25)} columns={COLUNAS} pageSize={10} />);

    await usuario.click(screen.getByRole("button", { name: /Próxima|next|»/i }));
    expect(nomesVisiveis()[0]).not.toBe("Item 0");

    await usuario.click(screen.getByRole("button", { name: /Nome/ }));
    expect(nomesVisiveis()[0]).toBe("Item 0");
  });
});

describe("clique na linha", () => {
  it("dispara onRowClick com a linha correspondente", async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(<DataTable rows={linhas(3)} columns={COLUNAS} onRowClick={aoClicar} />);

    const corpo = screen.getAllByRole("rowgroup")[1];
    await usuario.click(within(corpo).getAllByRole("row")[1]);

    expect(aoClicar).toHaveBeenCalledTimes(1);
    expect(aoClicar.mock.calls[0][0]).toMatchObject({ id: "id-1" });
  });

  it("não quebra ao clicar quando nenhum handler foi passado", async () => {
    const usuario = userEvent.setup();
    render(<DataTable rows={linhas(2)} columns={COLUNAS} />);
    const corpo = screen.getAllByRole("rowgroup")[1];
    await expect(usuario.click(within(corpo).getAllByRole("row")[0])).resolves.not.toThrow();
  });
});
