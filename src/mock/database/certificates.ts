// Table: certificates — moved from rooster/boost/mock-data.ts (CERTIFICATES).
export const certificates = [
  { id: "cert1", code: "RB-2026-0001", student: "Ana Prado", course: "Segurança da informação para servidores", workload: "6h", issuedAt: "2026-07-01", status: "emitido" as const },
  { id: "cert2", code: "RB-2026-0002", student: "Igor Ramos", course: "React para plataformas institucionais", workload: "40h", issuedAt: "2026-07-05", status: "emitido" as const },
  { id: "cert3", code: "RB-2026-0003", student: "Júlia Castro", course: "Avaliação por competências na sala de aula", workload: "24h", issuedAt: "2026-07-10", status: "emitido" as const },
  { id: "cert4", code: "RB-2026-0004", student: "Diego Martins", course: "Gestão financeira institucional", workload: "18h", issuedAt: "2026-07-14", status: "pendente" as const },
  { id: "cert5", code: "RB-2026-0005", student: "Helena Duarte", course: "Comunicação institucional e voz da marca", workload: "12h", issuedAt: "2026-07-18", status: "emitido" as const },
  { id: "cert6", code: "RB-2026-0006", student: "Elisa Ferreira", course: "Inglês acadêmico — writing e reading", workload: "32h", issuedAt: "2026-07-20", status: "emitido" as const },
  { id: "cert7", code: "RB-2026-0007", student: "Fábio Nogueira", course: "Segurança da informação para servidores", workload: "6h", issuedAt: "2026-07-22", status: "revogado" as const },
];

export type Certificate = (typeof certificates)[number];
export const certificateById = (id: string) => certificates.find((c) => c.id === id);
