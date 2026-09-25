// Mock data for Rooster Student (portal do aluno)
export const isoOf = (d: Date) => d.toISOString().slice(0, 10);
export const today = isoOf(new Date());
export const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export const shiftDate = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoOf(d);
};

export type Situation = "aprovado" | "reprovado" | "cursando" | "reprovado-falta" | "trancado";

export type DocItem = { id: string; name: string; kind: "Institucional" | "Enviado" | "Solicitado"; status: "disponivel" | "em-analise" | "aprovado" | "recusado" | "pendente"; updatedAt: string; size?: string; note?: string };

export const DOCUMENTS: DocItem[] = [
  { id: "doc1", name: "Declaração de matrícula 2026.1", kind: "Institucional", status: "disponivel", updatedAt: shiftDate(-9), size: "112 KB" },
  { id: "doc2", name: "Histórico escolar parcial", kind: "Institucional", status: "disponivel", updatedAt: shiftDate(-30), size: "248 KB" },
  { id: "doc3", name: "Contrato de prestação de serviços", kind: "Institucional", status: "disponivel", updatedAt: shiftDate(-160), size: "480 KB" },
  { id: "doc4", name: "Comprovante de residência", kind: "Enviado", status: "aprovado", updatedAt: shiftDate(-45), size: "1,2 MB" },
  { id: "doc5", name: "Certificado de conclusão do ensino médio", kind: "Enviado", status: "em-analise", updatedAt: shiftDate(-3), size: "820 KB" },
  { id: "doc6", name: "Foto 3x4 para carteirinha", kind: "Enviado", status: "recusado", updatedAt: shiftDate(-20), size: "340 KB", note: "Fundo não branco — reenviar." },
  { id: "doc7", name: "Comprovante de vacinação", kind: "Solicitado", status: "pendente", updatedAt: shiftDate(-1), note: "Prazo de envio: 15 dias." },
  { id: "doc8", name: "Termo de estágio assinado", kind: "Solicitado", status: "pendente", updatedAt: shiftDate(-5), note: "Necessário para validação de horas complementares." },
];

export const NOTICES = [
  { id: "av1", title: "Semana Acadêmica 2026", text: "Inscrições abertas até sexta-feira para oficinas e palestras.", tone: "oklch(0.55 0.19 265)" },
  { id: "av2", title: "Biblioteca com horário estendido", text: "Durante o período de provas, atendimento até 23h.", tone: "oklch(0.68 0.14 195)" },
  { id: "av3", title: "Renovação de matrícula 2026.2", text: "Período de renovação inicia em 3 semanas.", tone: "oklch(0.72 0.16 90)" },
];

export const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
