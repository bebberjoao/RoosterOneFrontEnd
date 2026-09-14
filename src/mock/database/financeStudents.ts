// Table: finance_students — moved from rooster/finance/mock-data.ts (STUDENTS).
// Type kept in the component (Student, in finance/mock-data.ts); this file only
// owns the seed array to avoid duplicated sources of truth.
export const financeStudents = [
  { id: "s1", name: "Ana Prado", email: "ana.prado@rooster.edu", course: "Engenharia de Software", klass: "ENG-3A", registration: "2024001", initials: "AP", scholarship: "50% mérito" },
  { id: "s2", name: "Bruno Alves", email: "bruno.alves@rooster.edu", course: "Direito", klass: "DIR-2B", registration: "2024002", initials: "BA" },
  { id: "s3", name: "Camila Souza", email: "camila.souza@rooster.edu", course: "Medicina", klass: "MED-5A", registration: "2023044", initials: "CS" },
  { id: "s4", name: "Diego Ferreira", email: "diego.f@rooster.edu", course: "Administração", klass: "ADM-1C", registration: "2025011", initials: "DF" },
  { id: "s5", name: "Elisa Ramos", email: "elisa.r@rooster.edu", course: "Arquitetura", klass: "ARQ-4A", registration: "2022087", initials: "ER", scholarship: "Convênio 20%" },
  { id: "s6", name: "Felipe Nunes", email: "felipe.n@rooster.edu", course: "Ciência da Computação", klass: "CC-2A", registration: "2024055", initials: "FN" },
  { id: "s7", name: "Gabriela Lima", email: "gabi.l@rooster.edu", course: "Psicologia", klass: "PSI-3B", registration: "2023102", initials: "GL" },
  { id: "s8", name: "Henrique Castro", email: "h.castro@rooster.edu", course: "Engenharia Civil", klass: "ECV-4A", registration: "2022210", initials: "HC" },
];

export const financeStudentById = (id: string) => financeStudents.find((s) => s.id === id);
