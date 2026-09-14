// Table: submissions — fonte única de dados (array movido de
// rooster/learn/mock-data.ts). Reexportada por learn/mock-data.ts (SUBMISSIONS)
// para não quebrar o frontend. FK: activityId, studentId.
import { activitiesKlassShape } from "./activities";

export type SubmissionStatus = "pendente" | "enviada" | "corrigida" | "reenvio" | "atrasada";

export type Submission = {
  id: string;
  activityId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  grade: number | null;
  feedback?: string;
};

/** Réplica mínima de rooster/learn/mock-data.ts (STUDENTS): apenas id/klassId, suficiente para gerar as entregas. */
const NAMES_COUNT = 8;
const KLASS_IDS = ["k-eng3a", "k-eng3b", "k-let2a", "k-com1a", "k-com1b", "k-dir4a"];
const STUDENT_REFS: { id: string; klassId: string }[] = KLASS_IDS.flatMap((klassId) =>
  Array.from({ length: NAMES_COUNT }, (_, i) => ({ id: `${klassId}-s${i}`, klassId })),
);

// Feedbacks variados usados nas correções do aluno logado (s0), para a área do
// aluno exibir diferentes pareceres do professor.
const S0_FEEDBACKS = [
  "Excelente desenvolvimento! A justificativa da questão discursiva ficou muito bem fundamentada.",
  "Boa resposta, mas faltou aprofundar o segundo ponto do enunciado. Revise o material da aula 4.",
  "Correto. Apenas atenção à ortografia técnica dos termos na resposta discursiva.",
  "Parcialmente correto: o raciocínio está certo, mas a conclusão diverge do esperado. Vale refazer a questão 2.",
  "Muito bom! Demonstrou domínio do conteúdo e usou exemplos adequados.",
];

export const submissions: Submission[] = activitiesKlassShape.flatMap((a, ai) => {
  const students = STUDENT_REFS.filter((s) => s.klassId === a.klassId);
  return students.map((s, i) => {
    let status: SubmissionStatus;
    if (a.status === "rascunho" || a.status === "agendada") {
      status = "pendente";
    } else if (i === 0) {
      // Aluno logado (s0): mistura determinística de realizadas corrigidas,
      // enviadas aguardando correção e algumas pendentes.
      status = ai % 4 === 0 ? "pendente" : ai % 4 === 2 ? "enviada" : "corrigida";
    } else {
      status = i % 6 === 0 ? "pendente" : i % 5 === 0 ? "atrasada" : i % 3 === 0 ? "enviada" : "corrigida";
    }
    const grade =
      status === "corrigida"
        ? i === 0
          ? [7.5, 9, 6.5, 8.5, 5.5][ai % 5]
          : Math.round((5 + ((i * 1.7) % 5)) * 10) / 10
        : null;
    return {
      id: `sub-${a.id}-${s.id}`,
      activityId: a.id,
      studentId: s.id,
      status,
      submittedAt: status === "pendente" ? null : new Date(new Date(a.dueAt).getTime() - i * 3600_000).toISOString(),
      grade,
      feedback:
        status === "corrigida"
          ? i === 0
            ? S0_FEEDBACKS[ai % S0_FEEDBACKS.length]
            : "Boa análise. Cuidado com a justificativa da questão 3."
          : undefined,
    };
  });
});

export const submissionById = (id: string) => submissions.find((s) => s.id === id);
export const submissionsByActivity = (activityId: string) => submissions.filter((s) => s.activityId === activityId);
export const submissionsByStudent = (studentId: string) => submissions.filter((s) => s.studentId === studentId);
