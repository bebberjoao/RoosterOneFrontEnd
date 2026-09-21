// Rooster Finance — 100% ligado ao backend real via client HTTP compartilhado
// (sem fallback para dado mockado — mesma decisão de academy.service.ts: se a
// API estiver fora do ar, a tela mostra erro/vazio, nunca dado fake). Boleto,
// PIX e nota fiscal são controle 100% interno (sem banco/PSP/SEFAZ reais) —
// decisão já confirmada com o usuário, não é limitação a "corrigir" aqui.
import { request, requestBlob } from "@/services/hub/client";

/** Campos Decimal do Prisma (preco, valorOriginal, valorDesconto, multa, juros, valorPago) chegam como string no JSON. */
function num(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function numOrUndef(v: number | string | null | undefined): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function qs(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v);
  if (!entries.length) return "";
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join("&")}`;
}

// ================= Tipos "front" usados pelas telas =================

export type FrequenciaServico = "unico" | "mensal" | "anual" | "semestral";
export type TipoDesconto = "bolsa-integral" | "bolsa-parcial" | "desc-percent" | "desc-fixo" | "convenio" | "promocao";
export type UnidadeDesconto = "percent" | "fixo";
export type TipoCobranca = "mensalidade" | "produto" | "servico" | "taxa";
export type StatusCobranca = "aberto" | "pago" | "vencido" | "negociado" | "cancelado" | "processando";
export type StatusNotaFiscal = "emitida" | "cancelada";

export type Produto = {
  id: string; codigo: string; nome: string; categoria: string; descricao: string;
  preco: number; estoque: number; estoqueMinimo: number; unidade: string; ativo: boolean;
  criadoEm: string; atualizadoEm: string;
};

export type Servico = {
  id: string; nome: string; descricao: string; preco: number; categoria: string;
  frequencia: FrequenciaServico; ativo: boolean; criadoEm: string; atualizadoEm: string;
};

export type Desconto = {
  id: string; nome: string; tipo: TipoDesconto; valor: number; unidade: UnidadeDesconto;
  motivo: string; responsavel: string; vigenciaInicio: string; vigenciaFim: string;
  ativo: boolean;
  /** Sempre calculado pelo backend a partir de DescontoAluno — nunca editável. Ausente em GET /descontos/:id. */
  beneficiarios: number;
};

export type AlunoResumo = { id: string; ra: string; cursoId: string; usuario: { id: string; nome: string; email: string } };

export type Cobranca = {
  id: string; alunoId: string; tipo: TipoCobranca; descricao: string; competencia?: string;
  produtoId?: string; servicoId?: string; descontoId?: string;
  valorOriginal: number; valorDesconto: number; multa: number; juros: number; valorPago?: number;
  vencimento: string;
  /** Computado no backend: "vencido" aparece sozinho quando vencimento < hoje. Nunca confiar em um valor antigo do cliente. */
  status: StatusCobranca;
  formaPagamento?: string;
  nossoNumero?: string; linhaDigitavel?: string; pixCopiaECola?: string;
  emitidoEm?: string; pagoEm?: string; negociadoEm?: string; motivoCancelamento?: string;
  aluno?: AlunoResumo;
  produto?: Produto;
  servico?: Servico;
  desconto?: Desconto;
  notaFiscal?: { id: string; numero: string; status: StatusNotaFiscal } | null;
};

export type NotaFiscal = {
  id: string; numero: string; tipo: "produto" | "servico"; cobrancaId: string;
  status: StatusNotaFiscal; emitidoEm: string;
  aluno: { id: string; nome: string; email: string };
  descricao: string;
  /** valorOriginal - valorDesconto da cobrança vinculada. */
  valor: number;
};

export type AlertaEstoqueBaixo = { id: string; nome: string; estoque: number; estoqueMinimo: number };
export type ReceitaMensal = { mes: string; previsto: number; recebido: number };
export type FluxoCaixaMes = { mes: string; entradas: number; pendente: number };
export type Inadimplencia = { taxaInadimplencia: number; valorVencido: number; alunosInadimplentes: number };

export type DashboardFinanceiro = {
  previsto: number; recebido: number; atrasadas: number; inadimplentes: number; boletosVencidos: number;
  alertasEstoqueBaixo: AlertaEstoqueBaixo[];
  receitaPorMes: ReceitaMensal[];
  ultimasMensalidades: Cobranca[];
  ultimosPagamentos: Cobranca[];
  proximosVencimentos: Cobranca[];
};

export type GerarLoteResultado = { geradas: number; ignoradas: number; cobrancas: Cobranca[] };

// ================= Tipos "back" (DTOs em português do backend NestJS) =================

type ProdutoBack = {
  id: string; codigo: string; nome: string; categoria?: string | null; descricao?: string | null;
  preco: number | string; estoque: number; estoqueMinimo: number; unidade: string; ativo: boolean;
  criadoEm?: string | null; atualizadoEm?: string | null;
};
function produtoToFront(b: ProdutoBack): Produto {
  return {
    id: b.id, codigo: b.codigo, nome: b.nome, categoria: b.categoria ?? "", descricao: b.descricao ?? "",
    preco: num(b.preco), estoque: b.estoque, estoqueMinimo: b.estoqueMinimo, unidade: b.unidade, ativo: b.ativo,
    criadoEm: b.criadoEm ?? "", atualizadoEm: b.atualizadoEm ?? "",
  };
}
function produtoToDto(f: Partial<Produto>) {
  return {
    ...(f.codigo !== undefined && { codigo: f.codigo }),
    ...(f.nome !== undefined && { nome: f.nome }),
    ...(f.categoria !== undefined && { categoria: f.categoria }),
    ...(f.descricao !== undefined && { descricao: f.descricao }),
    ...(f.preco !== undefined && { preco: f.preco }),
    ...(f.estoque !== undefined && { estoque: f.estoque }),
    ...(f.estoqueMinimo !== undefined && { estoqueMinimo: f.estoqueMinimo }),
    ...(f.unidade !== undefined && { unidade: f.unidade }),
    ...(f.ativo !== undefined && { ativo: f.ativo }),
  };
}

type ServicoBack = {
  id: string; nome: string; descricao?: string | null; preco: number | string; categoria?: string | null;
  frequencia: FrequenciaServico; ativo: boolean; criadoEm?: string | null; atualizadoEm?: string | null;
};
function servicoToFront(b: ServicoBack): Servico {
  return {
    id: b.id, nome: b.nome, descricao: b.descricao ?? "", preco: num(b.preco), categoria: b.categoria ?? "",
    frequencia: b.frequencia, ativo: b.ativo, criadoEm: b.criadoEm ?? "", atualizadoEm: b.atualizadoEm ?? "",
  };
}
function servicoToDto(f: Partial<Servico>) {
  return {
    ...(f.nome !== undefined && { nome: f.nome }),
    ...(f.descricao !== undefined && { descricao: f.descricao }),
    ...(f.preco !== undefined && { preco: f.preco }),
    ...(f.categoria !== undefined && { categoria: f.categoria }),
    ...(f.frequencia !== undefined && { frequencia: f.frequencia }),
    ...(f.ativo !== undefined && { ativo: f.ativo }),
  };
}

type DescontoBack = {
  id: string; nome: string; tipo: TipoDesconto; valor: number | string; unidade: UnidadeDesconto;
  motivo?: string | null; responsavel?: string | null; vigenciaInicio?: string | null; vigenciaFim?: string | null;
  ativo: boolean; beneficiarios?: number;
};
function descontoToFront(b: DescontoBack): Desconto {
  return {
    id: b.id, nome: b.nome, tipo: b.tipo, valor: num(b.valor), unidade: b.unidade,
    motivo: b.motivo ?? "", responsavel: b.responsavel ?? "", vigenciaInicio: b.vigenciaInicio ?? "", vigenciaFim: b.vigenciaFim ?? "",
    ativo: b.ativo, beneficiarios: b.beneficiarios ?? 0,
  };
}
function descontoToDto(f: Partial<Desconto>) {
  return {
    ...(f.nome !== undefined && { nome: f.nome }),
    ...(f.tipo !== undefined && { tipo: f.tipo }),
    ...(f.valor !== undefined && { valor: f.valor }),
    ...(f.unidade !== undefined && { unidade: f.unidade }),
    ...(f.motivo !== undefined && { motivo: f.motivo }),
    ...(f.responsavel !== undefined && { responsavel: f.responsavel }),
    ...(f.vigenciaInicio !== undefined && { vigenciaInicio: f.vigenciaInicio || undefined }),
    ...(f.vigenciaFim !== undefined && { vigenciaFim: f.vigenciaFim || undefined }),
    ...(f.ativo !== undefined && { ativo: f.ativo }),
  };
}

type AlunoBack = { id: string; ra: string; cursoId: string; usuario?: { id: string; nome: string; email: string } };
function alunoToResumo(b?: AlunoBack | null): AlunoResumo | undefined {
  if (!b) return undefined;
  return { id: b.id, ra: b.ra, cursoId: b.cursoId, usuario: { id: b.usuario?.id ?? "", nome: b.usuario?.nome ?? "—", email: b.usuario?.email ?? "" } };
}

type CobrancaBack = {
  id: string; alunoId: string; tipo: TipoCobranca; descricao: string; competencia?: string | null;
  produtoId?: string | null; servicoId?: string | null; descontoId?: string | null;
  valorOriginal: number | string; valorDesconto: number | string; multa: number | string; juros: number | string;
  valorPago?: number | string | null;
  vencimento: string; status: StatusCobranca; formaPagamento?: string | null;
  nossoNumero?: string | null; linhaDigitavel?: string | null; pixCopiaECola?: string | null;
  emitidoEm?: string | null; pagoEm?: string | null; negociadoEm?: string | null; motivoCancelamento?: string | null;
  aluno?: AlunoBack | null; produto?: ProdutoBack | null; servico?: ServicoBack | null; desconto?: DescontoBack | null;
  notaFiscal?: { id: string; numero: string; status: StatusNotaFiscal } | null;
};
function cobrancaToFront(b: CobrancaBack): Cobranca {
  return {
    id: b.id, alunoId: b.alunoId, tipo: b.tipo, descricao: b.descricao, competencia: b.competencia ?? undefined,
    produtoId: b.produtoId ?? undefined, servicoId: b.servicoId ?? undefined, descontoId: b.descontoId ?? undefined,
    valorOriginal: num(b.valorOriginal), valorDesconto: num(b.valorDesconto), multa: num(b.multa), juros: num(b.juros),
    valorPago: numOrUndef(b.valorPago),
    vencimento: b.vencimento, status: b.status, formaPagamento: b.formaPagamento ?? undefined,
    nossoNumero: b.nossoNumero ?? undefined, linhaDigitavel: b.linhaDigitavel ?? undefined, pixCopiaECola: b.pixCopiaECola ?? undefined,
    emitidoEm: b.emitidoEm ?? undefined, pagoEm: b.pagoEm ?? undefined, negociadoEm: b.negociadoEm ?? undefined,
    motivoCancelamento: b.motivoCancelamento ?? undefined,
    aluno: alunoToResumo(b.aluno),
    produto: b.produto ? produtoToFront(b.produto) : undefined,
    servico: b.servico ? servicoToFront(b.servico) : undefined,
    desconto: b.desconto ? descontoToFront(b.desconto) : undefined,
    notaFiscal: b.notaFiscal ?? undefined,
  };
}

type NotaFiscalBack = {
  id: string; numero: string; tipo: "produto" | "servico"; cobrancaId: string;
  status: StatusNotaFiscal; emitidoEm?: string | null;
  cobranca?: {
    descricao: string; valorOriginal: number | string; valorDesconto: number | string;
    aluno?: { usuario?: { id: string; nome: string; email: string } };
  } | null;
};
function notaFiscalToFront(b: NotaFiscalBack): NotaFiscal {
  const usuario = b.cobranca?.aluno?.usuario;
  return {
    id: b.id, numero: b.numero, tipo: b.tipo, cobrancaId: b.cobrancaId, status: b.status, emitidoEm: b.emitidoEm ?? "",
    aluno: { id: usuario?.id ?? "", nome: usuario?.nome ?? "—", email: usuario?.email ?? "" },
    descricao: b.cobranca?.descricao ?? "",
    valor: b.cobranca ? num(b.cobranca.valorOriginal) - num(b.cobranca.valorDesconto) : 0,
  };
}

type DashboardBack = {
  previsto: number | string; recebido: number | string; atrasadas: number; inadimplentes: number; boletosVencidos: number;
  alertasEstoqueBaixo: AlertaEstoqueBaixo[];
  receitaPorMes: ReceitaMensal[];
  ultimasMensalidades: CobrancaBack[]; ultimosPagamentos: CobrancaBack[]; proximosVencimentos: CobrancaBack[];
};

// ================= Serviço =================

export const financeService = {
  // ---------- Produtos ----------
  produtos: {
    async getAll(): Promise<Produto[]> {
      const rows = await request<ProdutoBack[]>("/produtos-financeiros");
      return rows.map(produtoToFront);
    },
    async getById(id: string): Promise<Produto | undefined> {
      try {
        return produtoToFront(await request<ProdutoBack>(`/produtos-financeiros/${id}`));
      } catch {
        return undefined;
      }
    },
    async create(dto: Omit<Produto, "id" | "criadoEm" | "atualizadoEm">): Promise<Produto> {
      return produtoToFront(await request<ProdutoBack>("/produtos-financeiros", { method: "POST", body: produtoToDto(dto) }));
    },
    async update(id: string, dto: Partial<Produto>): Promise<Produto> {
      return produtoToFront(await request<ProdutoBack>(`/produtos-financeiros/${id}`, { method: "PATCH", body: produtoToDto(dto) }));
    },
    async remove(id: string): Promise<boolean> {
      await request<void>(`/produtos-financeiros/${id}`, { method: "DELETE" });
      return true;
    },
  },

  // ---------- Serviços ----------
  servicos: {
    async getAll(): Promise<Servico[]> {
      const rows = await request<ServicoBack[]>("/servicos-financeiros");
      return rows.map(servicoToFront);
    },
    async getById(id: string): Promise<Servico | undefined> {
      try {
        return servicoToFront(await request<ServicoBack>(`/servicos-financeiros/${id}`));
      } catch {
        return undefined;
      }
    },
    async create(dto: Omit<Servico, "id" | "criadoEm" | "atualizadoEm">): Promise<Servico> {
      return servicoToFront(await request<ServicoBack>("/servicos-financeiros", { method: "POST", body: servicoToDto(dto) }));
    },
    async update(id: string, dto: Partial<Servico>): Promise<Servico> {
      return servicoToFront(await request<ServicoBack>(`/servicos-financeiros/${id}`, { method: "PATCH", body: servicoToDto(dto) }));
    },
    async remove(id: string): Promise<boolean> {
      await request<void>(`/servicos-financeiros/${id}`, { method: "DELETE" });
      return true;
    },
  },

  // ---------- Descontos ----------
  descontos: {
    async getAll(): Promise<Desconto[]> {
      const rows = await request<DescontoBack[]>("/descontos");
      return rows.map(descontoToFront);
    },
    async getById(id: string): Promise<Desconto | undefined> {
      try {
        return descontoToFront(await request<DescontoBack>(`/descontos/${id}`));
      } catch {
        return undefined;
      }
    },
    async create(dto: Omit<Desconto, "id" | "beneficiarios">): Promise<Desconto> {
      return descontoToFront(await request<DescontoBack>("/descontos", { method: "POST", body: descontoToDto(dto) }));
    },
    async update(id: string, dto: Partial<Desconto>): Promise<Desconto> {
      return descontoToFront(await request<DescontoBack>(`/descontos/${id}`, { method: "PATCH", body: descontoToDto(dto) }));
    },
    async remove(id: string): Promise<boolean> {
      await request<void>(`/descontos/${id}`, { method: "DELETE" });
      return true;
    },
    async atribuir(id: string, alunoId: string): Promise<void> {
      await request(`/descontos/${id}/atribuir`, { method: "POST", body: { alunoId } });
    },
    async remover(id: string, alunoId: string): Promise<void> {
      await request<void>(`/descontos/${id}/atribuir/${alunoId}`, { method: "DELETE" });
    },
  },

  // ---------- Cobranças ----------
  cobrancas: {
    async getAll(filters?: { status?: string; alunoId?: string; tipo?: string }): Promise<Cobranca[]> {
      const rows = await request<CobrancaBack[]>(`/cobrancas${qs({ status: filters?.status, alunoId: filters?.alunoId, tipo: filters?.tipo })}`);
      return rows.map(cobrancaToFront);
    },
    async getById(id: string): Promise<Cobranca | undefined> {
      try {
        return cobrancaToFront(await request<CobrancaBack>(`/cobrancas/${id}`));
      } catch {
        return undefined;
      }
    },
    async create(dto: {
      alunoId: string; tipo: TipoCobranca; descricao: string; competencia?: string;
      produtoId?: string; servicoId?: string; descontoId?: string;
      valorOriginal: number; valorDesconto?: number; vencimento: string; formaPagamento?: string;
    }): Promise<Cobranca> {
      return cobrancaToFront(await request<CobrancaBack>("/cobrancas", { method: "POST", body: dto }));
    },
    async update(id: string, dto: {
      descricao?: string; valorOriginal?: number; valorDesconto?: number; vencimento?: string; formaPagamento?: string;
    }): Promise<Cobranca> {
      return cobrancaToFront(await request<CobrancaBack>(`/cobrancas/${id}`, { method: "PATCH", body: dto }));
    },
    async marcarPago(id: string, dto?: { valorPago?: number; formaPagamento?: string; pagoEm?: string }): Promise<Cobranca> {
      return cobrancaToFront(await request<CobrancaBack>(`/cobrancas/${id}/marcar-pago`, { method: "POST", body: dto ?? {} }));
    },
    async negociar(id: string, dto: { novoVencimento?: string; novoValor?: number; motivo: string }): Promise<Cobranca> {
      return cobrancaToFront(await request<CobrancaBack>(`/cobrancas/${id}/negociar`, { method: "POST", body: dto }));
    },
    async cancelar(id: string, motivo: string): Promise<Cobranca> {
      return cobrancaToFront(await request<CobrancaBack>(`/cobrancas/${id}/cancelar`, { method: "POST", body: { motivo } }));
    },
    async gerarLote(dto: { competencia: string; servicoId: string; vencimento: string; turmaId?: string }): Promise<GerarLoteResultado> {
      const res = await request<{ geradas: number; ignoradas: number; cobrancas: CobrancaBack[] }>("/cobrancas/gerar-lote", { method: "POST", body: dto });
      return { geradas: res.geradas, ignoradas: res.ignoradas, cobrancas: res.cobrancas.map(cobrancaToFront) };
    },
    async exportarCsv(filters?: { status?: string; alunoId?: string; tipo?: string }): Promise<Blob> {
      return requestBlob(`/cobrancas/exportar${qs({ status: filters?.status, alunoId: filters?.alunoId, tipo: filters?.tipo })}`);
    },
    async emitirBoleto(id: string): Promise<Cobranca> {
      return cobrancaToFront(await request<CobrancaBack>(`/cobrancas/${id}/emitir-boleto`, { method: "POST" }));
    },
    async baixarBoletoPdf(id: string): Promise<Blob> {
      return requestBlob(`/cobrancas/${id}/boleto`);
    },
  },

  // ---------- Notas fiscais ----------
  notasFiscais: {
    async getAll(filters?: { status?: string }): Promise<NotaFiscal[]> {
      const rows = await request<NotaFiscalBack[]>(`/notas-fiscais${qs({ status: filters?.status })}`);
      return rows.map(notaFiscalToFront);
    },
    async emitir(cobrancaId: string): Promise<void> {
      await request(`/cobrancas/${cobrancaId}/nota-fiscal`, { method: "POST" });
    },
    async baixarPdf(id: string): Promise<Blob> {
      return requestBlob(`/notas-fiscais/${id}/arquivo`);
    },
    async baixarXml(id: string): Promise<Blob> {
      return requestBlob(`/notas-fiscais/${id}/xml`);
    },
  },

  // ---------- Dashboard ----------
  async getDashboard(): Promise<DashboardFinanceiro> {
    const b = await request<DashboardBack>("/financeiro/dashboard");
    return {
      previsto: num(b.previsto), recebido: num(b.recebido), atrasadas: b.atrasadas,
      inadimplentes: b.inadimplentes, boletosVencidos: b.boletosVencidos,
      alertasEstoqueBaixo: b.alertasEstoqueBaixo,
      receitaPorMes: b.receitaPorMes,
      ultimasMensalidades: b.ultimasMensalidades.map(cobrancaToFront),
      ultimosPagamentos: b.ultimosPagamentos.map(cobrancaToFront),
      proximosVencimentos: b.proximosVencimentos.map(cobrancaToFront),
    };
  },

  // ---------- Relatórios ----------
  relatorios: {
    async receitaMensal(): Promise<ReceitaMensal[]> {
      return request<ReceitaMensal[]>("/financeiro/relatorios/receita-mensal");
    },
    async fluxoCaixa(): Promise<FluxoCaixaMes[]> {
      return request<FluxoCaixaMes[]>("/financeiro/relatorios/fluxo-caixa");
    },
    async inadimplencia(): Promise<Inadimplencia> {
      return request<Inadimplencia>("/financeiro/relatorios/inadimplencia");
    },
    async exportarCsv(): Promise<Blob> {
      return requestBlob("/financeiro/relatorios/exportar");
    },
  },

  // ---------- Portal do aluno (`/student/finance`) ----------
  me: {
    async getCobrancas(): Promise<Cobranca[]> {
      const rows = await request<CobrancaBack[]>("/financeiro/me/cobrancas");
      return rows.map(cobrancaToFront);
    },
    async getDesconto(): Promise<Desconto | null> {
      const b = await request<DescontoBack | null>("/financeiro/me/desconto");
      return b ? descontoToFront(b) : null;
    },
    async baixarBoletoPdf(cobrancaId: string): Promise<Blob> {
      return requestBlob(`/financeiro/me/cobrancas/${cobrancaId}/boleto`);
    },
    async baixarNotaFiscalPdf(cobrancaId: string): Promise<Blob> {
      return requestBlob(`/financeiro/me/cobrancas/${cobrancaId}/nota-fiscal`);
    },
  },
};
