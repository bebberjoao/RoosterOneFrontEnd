// Table: boost_enrollments — moved from rooster/boost/mock-data.ts (ENROLLMENTS). Matrículas Boost.
export const boostEnrollments = [
  { id: "e1", student: "Ana Prado", studentSector: "Engenharia", course: "React para plataformas institucionais", progress: 62, lastAccess: "2026-07-22", status: "ativo" as const, grade: 8.4 },
  { id: "e2", student: "Igor Ramos", studentSector: "Medicina", course: "Inglês acadêmico — writing e reading", progress: 100, lastAccess: "2026-07-20", status: "concluido" as const, grade: 9.1 },
  { id: "e3", student: "Júlia Castro", studentSector: "Extensão", course: "Avaliação por competências na sala de aula", progress: 100, lastAccess: "2026-07-10", status: "concluido" as const, grade: 9.6 },
  { id: "e4", student: "Fábio Nogueira", studentSector: "Financeiro", course: "Gestão financeira institucional", progress: 41, lastAccess: "2026-07-08", status: "atrasado" as const, grade: null },
  { id: "e5", student: "Diego Martins", studentSector: "Computação", course: "Power BI aplicado à educação", progress: 12, lastAccess: "2026-07-19", status: "ativo" as const, grade: null },
  { id: "e6", student: "Helena Duarte", studentSector: "Letras", course: "Comunicação institucional e voz da marca", progress: 100, lastAccess: "2026-07-05", status: "concluido" as const, grade: 9.3 },
  { id: "e7", student: "Camila Souza", studentSector: "Acadêmico", course: "Design de aulas online e híbridas", progress: 0, lastAccess: "—", status: "cancelado" as const, grade: null },
  { id: "e8", student: "Bruno Alves", studentSector: "TI", course: "Segurança da informação para servidores", progress: 88, lastAccess: "2026-07-23", status: "ativo" as const, grade: 8.9 },
  { id: "e9", student: "Elisa Ferreira", studentSector: "Direito", course: "Biblioteconomia digital", progress: 55, lastAccess: "2026-07-17", status: "ativo" as const, grade: null },
  { id: "e10", student: "Gustavo Lima", studentSector: "Manutenção", course: "Segurança da informação para servidores", progress: 100, lastAccess: "2026-07-11", status: "concluido" as const, grade: 9.7 },
];

export const boostEnrollmentById = (id: string) => boostEnrollments.find((e) => e.id === id);
