// Table: nfes — moved from rooster/finance/mock-data.ts (NFES). FK: studentId.
import { boletos } from "./boletos";

type NfeStatus = "emitida" | "cancelada" | "processando" | "rejeitada";

export const nfes = [
  ...boletos.filter((b) => b.status === "pago").slice(0, 10).map((b, i) => ({
    id: `nfs-${i}`, number: `NFS-2026-${(1000 + i).toString()}`, type: "servico" as const,
    studentId: b.studentId, description: b.description, value: b.value,
    issuedAt: b.paidAt ?? b.emittedAt, status: "emitida" as NfeStatus,
  })),
  { id: "nfp-1", number: "NFP-2026-0044", type: "produto" as const, studentId: "s1", description: "Apostila de Cálculo I", value: 89.9, issuedAt: "2026-07-12", status: "emitida" as NfeStatus },
  { id: "nfp-2", number: "NFP-2026-0045", type: "produto" as const, studentId: "s3", description: "Jaleco Medicina", value: 149.0, issuedAt: "2026-07-14", status: "emitida" as NfeStatus },
  { id: "nfp-3", number: "NFP-2026-0046", type: "produto" as const, studentId: "s5", description: "Uniforme oficial — Camiseta", value: 79.0, issuedAt: "2026-07-15", status: "processando" as NfeStatus },
  { id: "nfp-4", number: "NFP-2026-0047", type: "produto" as const, studentId: "s6", description: "Kit laboratório Química", value: 245.0, issuedAt: "2026-07-16", status: "emitida" as NfeStatus },
  { id: "nfp-5", number: "NFP-2026-0048", type: "produto" as const, studentId: "s2", description: "Livro — Direito Constitucional", value: 189.0, issuedAt: "2026-07-18", status: "cancelada" as NfeStatus },
];

export const nfeById = (id: string) => nfes.find((n) => n.id === id);
