import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import type { AxeResults } from "axe-core";
import { Field, TextInput, TextArea, SelectInput } from "./form";
import { Btn, EmptyState, ProgressBar, Pagination, Table } from "./primitives";
import { DataTable, type Column } from "./data-table";
import { Inbox } from "lucide-react";

/**
 * Auditoria automatizada de acessibilidade (axe-core) sobre os componentes
 * compartilhados — são eles que se repetem em praticamente toda tela, então
 * um problema aqui se multiplica pelo sistema inteiro.
 *
 * O que isto cobre: regras que dá para verificar na árvore renderizada —
 * campo sem rótulo associado, botão sem nome acessível, contraste declarado
 * em estilo inline, papel ARIA inválido, tabela mal estruturada.
 *
 * O que isto NÃO cobre, e continua dependendo de verificação manual: ordem
 * de foco e navegação real por teclado, comportamento de leitor de tela, e
 * contraste resolvido por CSS externo (o jsdom não aplica a folha de estilo
 * do Tailwind, então a regra de contraste do axe não tem o que medir aqui).
 */

/**
 * Roda o axe e devolve as violações encontradas.
 *
 * `color-contrast` fica desligada de propósito: ela precisa de canvas e da
 * folha de estilo aplicada para medir cor de fato, e o jsdom não tem nem uma
 * coisa nem outra — mantê-la ligada só produziria aviso de canvas não
 * implementado e um resultado sem significado. Contraste continua sendo
 * verificação manual/visual.
 */
async function violacoes(container: HTMLElement) {
  const resultado = (await axe(container, { rules: { "color-contrast": { enabled: false } } })) as AxeResults;
  return resultado.violations;
}

/** Mensagem legível quando falha, em vez de só "esperava 0". */
function descrever(lista: Awaited<ReturnType<typeof violacoes>>) {
  return lista.map((v) => `${v.id}: ${v.help}`).join(" | ");
}

describe("campos de formulário", () => {
  it("Field associa o rótulo ao controle que envolve", async () => {
    // `Field` embrulha o controle num <label>, então a associação é
    // implícita — sem isso, leitor de tela anuncia "caixa de edição" sem dizer
    // do quê.
    const { container } = render(
      <Field label="Título do evento">
        <TextInput defaultValue="" />
      </Field>,
    );
    expect(screen.getByLabelText(/Título do evento/)).toBeInTheDocument();

    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("Field com hint e obrigatoriedade continua acessível", async () => {
    const { container } = render(
      <Field label="Repetir até" required hint="Cada ocorrência é verificada individualmente.">
        <TextInput type="date" defaultValue="2026-10-15" />
      </Field>,
    );
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("TextArea dentro de Field é acessível", async () => {
    const { container } = render(
      <Field label="Mensagem para o setor de reservas">
        <TextArea rows={4} defaultValue="" />
      </Field>,
    );
    expect(screen.getByLabelText(/Mensagem para o setor/)).toBeInTheDocument();
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("SelectInput dentro de Field é acessível", async () => {
    const { container } = render(
      <Field label="Finalidade">
        <SelectInput
          value="aula"
          onChange={() => {}}
          options={[
            { value: "aula", label: "Aula" },
            { value: "reuniao", label: "Reunião" },
          ]}
        />
      </Field>,
    );
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("formulário completo, como aparece numa tela real, não acumula violações", async () => {
    const { container } = render(
      <form>
        <Field label="Título do evento">
          <TextInput defaultValue="" />
        </Field>
        <Field label="Participantes">
          <TextInput type="number" defaultValue="20" />
        </Field>
        <Field label="Observações" hint="Opcional.">
          <TextArea defaultValue="" />
        </Field>
        <Btn variant="solid">Enviar solicitação</Btn>
      </form>,
    );
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });
});

describe("componentes de exibição", () => {
  it("Btn tem nome acessível", async () => {
    const { container } = render(<Btn>Aprovar</Btn>);
    expect(screen.getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("ProgressBar é acessível", async () => {
    const { container } = render(<ProgressBar value={42} />);
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("EmptyState é acessível", async () => {
    const { container } = render(<EmptyState icon={Inbox} title="Nenhuma reserva encontrada" description="Ajuste os filtros." />);
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("Pagination é acessível", async () => {
    const { container } = render(<Pagination page={2} pages={5} onPage={() => {}} total={48} />);
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("Table tem cabeçalho estruturado", async () => {
    const { container } = render(
      <Table head={["Código", "Reserva", "Status"]}>
        <tr>
          <td>RS-000001</td>
          <td>Defesa de TCC</td>
          <td>Confirmada</td>
        </tr>
      </Table>,
    );
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });
});

describe("DataTable", () => {
  type Linha = { id: string; nome: string };
  const colunas: Column<Linha>[] = [
    { key: "nome", header: "Nome", cell: (r) => r.nome, sortValue: (r) => r.nome },
    { key: "acoes", header: "Ações", cell: () => <Btn>Abrir</Btn> },
  ];

  it("a tabela de listagem é acessível com dados", async () => {
    const linhas = Array.from({ length: 3 }, (_, i) => ({ id: `id-${i}`, nome: `Item ${i}` }));
    const { container } = render(<DataTable rows={linhas} columns={colunas} />);
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });

  it("o estado vazio também é acessível", async () => {
    const { container } = render(<DataTable rows={[]} columns={colunas} emptyMessage="Nenhum registro." />);
    const lista = await violacoes(container);
    expect(lista, descrever(lista)).toHaveLength(0);
  });
});
