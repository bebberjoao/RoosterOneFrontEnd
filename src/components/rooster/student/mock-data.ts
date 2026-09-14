// Mock data for Rooster Student (portal do aluno)
import { EVENTS, formatDate, today, isoOf } from "../academy/mock-data";

export { EVENTS, formatDate, today, isoOf };

export const shiftDate = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoOf(d);
};

export type Situation = "aprovado" | "reprovado" | "cursando" | "reprovado-falta";

export type StudentDiscipline = {
  id: string;
  code: string;
  name: string;
  teacher: string;
  teacherInitials: string;
  workload: number;
  schedule: string;
  room: string;
  attendance: number; // %
  absences: number;
  classesGiven: number;
  average: number | null;
  situation: Situation;
  accent: string;
  progress: number; // % conteúdo
};

export const PROFILE = {
  name: "Ana Prado",
  initials: "AP",
  ra: "20241000",
  course: "Engenharia de Software",
  degree: "Graduação — Bacharelado",
  semester: "3º semestre",
  term: "2026.1",
  klass: "ENG-SW-301-A · Noturno",
  coordinator: "Camila Souza",
  coordinatorEmail: "camila.souza@modelo.edu",
  email: "ana.prado@modelo.edu",
  personalEmail: "ana.prado@gmail.com",
  phone: "(11) 98877-4410",
  birth: "12/04/2003",
  cpf: "***.456.789-**",
  rg: "44.221.908-7",
  address: "Rua das Acácias, 240 — Apto 71",
  district: "Vila Mariana",
  city: "São Paulo — SP",
  zip: "04117-000",
  enrolledAt: "10/02/2024",
  status: "Matrícula ativa",
  campus: "Campus Central",
  shift: "Noturno",
  emergency: "Marcos Prado · (11) 97744-2210",
  photoTone: "oklch(0.68 0.18 40)",
};

export const EDITABLE_FIELDS = ["personalEmail", "phone", "address", "district", "city", "zip", "emergency"] as const;

export const DISCIPLINES: StudentDiscipline[] = [
  { id: "d1", code: "ENG-SW-301", name: "Engenharia de Software II", teacher: "Rafael Monteiro", teacherInitials: "RM", workload: 80, schedule: "Ter/Qui 19:00-22:30", room: "Sala 402 · Bloco B", attendance: 94, absences: 3, classesGiven: 48, average: 8.6, situation: "cursando", accent: "oklch(0.55 0.19 265)", progress: 62 },
  { id: "d2", code: "ENG-SW-215", name: "Estrutura de Dados", teacher: "Carla Nakamura", teacherInitials: "CN", workload: 80, schedule: "Seg/Qua 08:00-11:30", room: "Laboratório 3 · Bloco C", attendance: 88, absences: 6, classesGiven: 50, average: 7.4, situation: "cursando", accent: "oklch(0.68 0.14 195)", progress: 55 },
  { id: "d3", code: "ENG-SW-402", name: "Inteligência Artificial", teacher: "Sofia Rangel", teacherInitials: "SR", workload: 60, schedule: "Ter/Qui 19:00-22:30", room: "Laboratório 5 · Bloco C", attendance: 76, absences: 9, classesGiven: 38, average: 6.2, situation: "cursando", accent: "oklch(0.68 0.18 40)", progress: 48 },
  { id: "d4", code: "ADM-210", name: "Gestão Estratégica", teacher: "Diego Fontes", teacherInitials: "DF", workload: 60, schedule: "Seg 19:00-22:30", room: "Sala 210 · Bloco A", attendance: 97, absences: 1, classesGiven: 32, average: 9.1, situation: "cursando", accent: "oklch(0.62 0.18 155)", progress: 70 },
  { id: "d5", code: "LET-207", name: "Linguística Aplicada", teacher: "Helena Duarte", teacherInitials: "HD", workload: 60, schedule: "Sex 19:00-22:30", room: "Sala 302 · Bloco B", attendance: 71, absences: 11, classesGiven: 34, average: 5.8, situation: "cursando", accent: "oklch(0.6 0.2 305)", progress: 41 },
  { id: "d6", code: "ENG-SW-330", name: "Banco de Dados", teacher: "Rafael Monteiro", teacherInitials: "RM", workload: 80, schedule: "Qua 19:00-22:30", room: "Laboratório 2 · Bloco C", attendance: 91, absences: 4, classesGiven: 44, average: 8.0, situation: "cursando", accent: "oklch(0.55 0.1 260)", progress: 58 },
];

export const MIN_ATTENDANCE = 75;

export type Assessment = { id: string; disciplineId: string; name: string; weight: number; max: number; value: number | null; date: string; origin: "manual" | "learn" };

export const ASSESSMENTS: Assessment[] = [
  { id: "a1", disciplineId: "d1", name: "Avaliação 1", weight: 0.3, max: 10, value: 8.5, date: shiftDate(-42), origin: "manual" },
  { id: "a2", disciplineId: "d1", name: "Trabalho de arquitetura", weight: 0.3, max: 10, value: 9.0, date: shiftDate(-20), origin: "learn" },
  { id: "a3", disciplineId: "d1", name: "Avaliação 2", weight: 0.4, max: 10, value: null, date: shiftDate(12), origin: "manual" },
  { id: "a4", disciplineId: "d2", name: "Lista de exercícios", weight: 0.2, max: 10, value: 6.8, date: shiftDate(-38), origin: "learn" },
  { id: "a5", disciplineId: "d2", name: "Avaliação 1", weight: 0.4, max: 10, value: 7.6, date: shiftDate(-16), origin: "manual" },
  { id: "a6", disciplineId: "d2", name: "Projeto final", weight: 0.4, max: 10, value: null, date: shiftDate(24), origin: "learn" },
  { id: "a7", disciplineId: "d3", name: "Quiz de fundamentos", weight: 0.2, max: 10, value: 5.5, date: shiftDate(-30), origin: "learn" },
  { id: "a8", disciplineId: "d3", name: "Avaliação 1", weight: 0.4, max: 10, value: 6.5, date: shiftDate(-11), origin: "manual" },
  { id: "a9", disciplineId: "d3", name: "Seminário", weight: 0.4, max: 10, value: null, date: shiftDate(18), origin: "manual" },
  { id: "a10", disciplineId: "d4", name: "Estudo de caso", weight: 0.5, max: 10, value: 9.4, date: shiftDate(-25), origin: "learn" },
  { id: "a11", disciplineId: "d4", name: "Avaliação 1", weight: 0.5, max: 10, value: 8.8, date: shiftDate(-8), origin: "manual" },
  { id: "a12", disciplineId: "d5", name: "Resenha crítica", weight: 0.4, max: 10, value: 5.2, date: shiftDate(-28), origin: "learn" },
  { id: "a13", disciplineId: "d5", name: "Avaliação 1", weight: 0.6, max: 10, value: 6.2, date: shiftDate(-9), origin: "manual" },
  { id: "a14", disciplineId: "d6", name: "Modelagem relacional", weight: 0.4, max: 10, value: 8.2, date: shiftDate(-22), origin: "learn" },
  { id: "a15", disciplineId: "d6", name: "Avaliação 1", weight: 0.6, max: 10, value: 7.9, date: shiftDate(-6), origin: "manual" },
];

export const PERFORMANCE_TREND = [
  { month: "Fev", media: 7.1, turma: 6.8 },
  { month: "Mar", media: 7.6, turma: 6.9 },
  { month: "Abr", media: 7.9, turma: 7.1 },
  { month: "Mai", media: 7.4, turma: 7.0 },
  { month: "Jun", media: 8.2, turma: 7.3 },
  { month: "Jul", media: 8.4, turma: 7.4 },
];

export const ATTENDANCE_TREND = [
  { month: "Fev", freq: 96 },
  { month: "Mar", freq: 92 },
  { month: "Abr", freq: 88 },
  { month: "Mai", freq: 84 },
  { month: "Jun", freq: 87 },
  { month: "Jul", freq: 86 },
];

export type HistoryRow = { id: string; term: string; code: string; name: string; workload: number; grade: number | null; attendance: number; situation: Situation };

export const HISTORY: HistoryRow[] = [
  { id: "h1", term: "2024.1", code: "ENG-SW-110", name: "Lógica de Programação", workload: 80, grade: 9.2, attendance: 96, situation: "aprovado" },
  { id: "h2", term: "2024.1", code: "MAT-101", name: "Cálculo I", workload: 80, grade: 6.4, attendance: 88, situation: "aprovado" },
  { id: "h3", term: "2024.1", code: "ENG-SW-105", name: "Introdução à Computação", workload: 60, grade: 8.7, attendance: 94, situation: "aprovado" },
  { id: "h4", term: "2024.2", code: "MAT-102", name: "Cálculo II", workload: 80, grade: 4.1, attendance: 82, situation: "reprovado" },
  { id: "h5", term: "2024.2", code: "ENG-SW-120", name: "Programação Orientada a Objetos", workload: 80, grade: 8.9, attendance: 91, situation: "aprovado" },
  { id: "h6", term: "2024.2", code: "EST-201", name: "Estatística Aplicada", workload: 60, grade: 7.5, attendance: 90, situation: "aprovado" },
  { id: "h7", term: "2025.1", code: "ENG-SW-201", name: "Engenharia de Software I", workload: 80, grade: 9.0, attendance: 97, situation: "aprovado" },
  { id: "h8", term: "2025.1", code: "RED-100", name: "Redes de Computadores", workload: 60, grade: 7.2, attendance: 85, situation: "aprovado" },
  { id: "h9", term: "2025.1", code: "MAT-102", name: "Cálculo II", workload: 80, grade: 7.0, attendance: 93, situation: "aprovado" },
  { id: "h10", term: "2025.2", code: "ENG-SW-240", name: "Sistemas Operacionais", workload: 80, grade: 8.1, attendance: 89, situation: "aprovado" },
  { id: "h11", term: "2025.2", code: "ENG-SW-260", name: "Interface Humano-Computador", workload: 60, grade: 9.5, attendance: 98, situation: "aprovado" },
  { id: "h12", term: "2025.2", code: "FIL-110", name: "Ética e Sociedade", workload: 40, grade: 3.8, attendance: 58, situation: "reprovado-falta" },
  { id: "h13", term: "2026.1", code: "ENG-SW-301", name: "Engenharia de Software II", workload: 80, grade: null, attendance: 94, situation: "cursando" },
  { id: "h14", term: "2026.1", code: "ENG-SW-215", name: "Estrutura de Dados", workload: 80, grade: null, attendance: 88, situation: "cursando" },
  { id: "h15", term: "2026.1", code: "ENG-SW-402", name: "Inteligência Artificial", workload: 60, grade: null, attendance: 76, situation: "cursando" },
  { id: "h16", term: "2026.1", code: "ADM-210", name: "Gestão Estratégica", workload: 60, grade: null, attendance: 97, situation: "cursando" },
  { id: "h17", term: "2026.1", code: "LET-207", name: "Linguística Aplicada", workload: 60, grade: null, attendance: 71, situation: "cursando" },
  { id: "h18", term: "2026.1", code: "ENG-SW-330", name: "Banco de Dados", workload: 80, grade: null, attendance: 91, situation: "cursando" },
];

export type ActivityKind = "arquivo" | "discursiva" | "quiz" | "video";
export type ActivityStatus = "pendente" | "em-andamento" | "entregue" | "corrigida" | "atrasada";

export type StudentActivity = {
  id: string;
  title: string;
  disciplineId: string;
  teacher: string;
  kind: ActivityKind;
  due: string;
  status: ActivityStatus;
  grade: number | null;
  max: number;
  feedback?: string;
  description: string;
  questions?: { id: string; text: string; options: string[] }[];
  videoTitle?: string;
};

export const ACTIVITIES: StudentActivity[] = [
  { id: "at1", title: "Diagrama de arquitetura em camadas", disciplineId: "d1", teacher: "Rafael Monteiro", kind: "arquivo", due: shiftDate(3), status: "pendente", grade: null, max: 10, description: "Envie o diagrama da arquitetura proposta para o sistema estudado em sala, em PDF ou PNG." },
  { id: "at2", title: "Quiz — Padrões de projeto", disciplineId: "d1", teacher: "Rafael Monteiro", kind: "quiz", due: shiftDate(6), status: "em-andamento", grade: null, max: 10, description: "Questionário de múltipla escolha sobre padrões criacionais e estruturais.", questions: [
    { id: "q1", text: "Qual padrão garante uma única instância de uma classe?", options: ["Factory Method", "Singleton", "Observer", "Adapter"] },
    { id: "q2", text: "O padrão Observer é usado para:", options: ["Notificar dependentes sobre mudanças de estado", "Criar objetos complexos", "Adaptar interfaces incompatíveis", "Encapsular algoritmos"] },
    { id: "q3", text: "Qual padrão é estrutural?", options: ["Strategy", "Builder", "Decorator", "Command"] },
  ] },
  { id: "at3", title: "Análise crítica: complexidade de algoritmos", disciplineId: "d2", teacher: "Carla Nakamura", kind: "discursiva", due: shiftDate(1), status: "pendente", grade: null, max: 10, description: "Escreva uma análise (mín. 300 palavras) comparando complexidade de busca em árvores balanceadas e tabelas hash." },
  { id: "at4", title: "Videoaula complementar: grafos", disciplineId: "d2", teacher: "Carla Nakamura", kind: "video", due: shiftDate(9), status: "pendente", grade: null, max: 10, description: "Assista à videoaula e registre a conclusão.", videoTitle: "Grafos: representação e travessias (28 min)" },
  { id: "at5", title: "Relatório de experimento — regressão", disciplineId: "d3", teacher: "Sofia Rangel", kind: "arquivo", due: shiftDate(-2), status: "atrasada", grade: null, max: 10, description: "Relatório do experimento de regressão linear com dataset fornecido." },
  { id: "at6", title: "Estudo de caso — expansão de mercado", disciplineId: "d4", teacher: "Diego Fontes", kind: "discursiva", due: shiftDate(-6), status: "entregue", grade: null, max: 10, description: "Estudo de caso entregue, aguardando correção do professor." },
  { id: "at7", title: "Trabalho de arquitetura", disciplineId: "d1", teacher: "Rafael Monteiro", kind: "arquivo", due: shiftDate(-20), status: "corrigida", grade: 9.0, max: 10, feedback: "Excelente detalhamento das decisões arquiteturais. Faltou justificar a escolha do banco de dados.", description: "Documento de arquitetura do projeto integrador." },
  { id: "at8", title: "Lista de exercícios 01", disciplineId: "d2", teacher: "Carla Nakamura", kind: "quiz", due: shiftDate(-38), status: "corrigida", grade: 6.8, max: 10, feedback: "Reveja os exercícios de complexidade amortizada.", description: "Exercícios de listas encadeadas e pilhas." },
  { id: "at9", title: "Resenha crítica — texto base", disciplineId: "d5", teacher: "Helena Duarte", kind: "discursiva", due: shiftDate(-28), status: "corrigida", grade: 5.2, max: 10, feedback: "Argumentação superficial; aprofunde as referências teóricas na próxima entrega.", description: "Resenha do capítulo 3 do livro-texto." },
  { id: "at10", title: "Modelagem relacional — normalização", disciplineId: "d6", teacher: "Rafael Monteiro", kind: "arquivo", due: shiftDate(-22), status: "corrigida", grade: 8.2, max: 10, feedback: "Boa modelagem. Atenção à 3ª forma normal em duas tabelas.", description: "Modelo lógico normalizado do sistema proposto." },
];

export type BoostCourse = { id: string; title: string; category: string; hours: number; progress: number; status: "andamento" | "concluido" | "disponivel"; instructor: string; tone: string; certificate?: string };

export const BOOST_COURSES: BoostCourse[] = [
  { id: "b1", title: "Introdução a Data Science", category: "Tecnologia", hours: 24, progress: 68, status: "andamento", instructor: "Sofia Rangel", tone: "oklch(0.55 0.19 265)" },
  { id: "b2", title: "Comunicação e Oratória", category: "Soft skills", hours: 12, progress: 35, status: "andamento", instructor: "Helena Duarte", tone: "oklch(0.6 0.2 305)" },
  { id: "b3", title: "Git e GitHub na prática", category: "Tecnologia", hours: 8, progress: 100, status: "concluido", instructor: "Rafael Monteiro", tone: "oklch(0.68 0.14 195)", certificate: "CERT-2025-8841" },
  { id: "b4", title: "Metodologias Ágeis", category: "Gestão", hours: 16, progress: 100, status: "concluido", instructor: "Diego Fontes", tone: "oklch(0.62 0.18 155)", certificate: "CERT-2025-9120" },
  { id: "b5", title: "Inglês Técnico para TI", category: "Idiomas", hours: 30, progress: 0, status: "disponivel", instructor: "Helena Duarte", tone: "oklch(0.68 0.18 40)" },
  { id: "b6", title: "Segurança da Informação", category: "Tecnologia", hours: 20, progress: 0, status: "disponivel", instructor: "Carla Nakamura", tone: "oklch(0.65 0.18 25)" },
  { id: "b7", title: "Empreendedorismo Universitário", category: "Gestão", hours: 14, progress: 0, status: "disponivel", instructor: "Marco Teixeira", tone: "oklch(0.72 0.16 90)" },
];

export type Charge = { id: string; description: string; due: string; amount: number; status: "pago" | "aberto" | "vencido" | "processando"; method: string; discount?: number; nfe?: string; paidAt?: string };

export const CHARGES: Charge[] = [
  { id: "f1", description: "Mensalidade Julho/2026", due: shiftDate(7), amount: 1290.0, status: "aberto", method: "Boleto", discount: 15 },
  { id: "f2", description: "Mensalidade Junho/2026", due: shiftDate(-23), amount: 1290.0, status: "pago", method: "PIX", discount: 15, nfe: "NFS-e 004512", paidAt: shiftDate(-25) },
  { id: "f3", description: "Mensalidade Maio/2026", due: shiftDate(-53), amount: 1290.0, status: "pago", method: "Boleto", discount: 15, nfe: "NFS-e 004380", paidAt: shiftDate(-55) },
  { id: "f4", description: "Taxa de laboratório 2026.1", due: shiftDate(-12), amount: 180.0, status: "vencido", method: "Boleto" },
  { id: "f5", description: "Mensalidade Abril/2026", due: shiftDate(-84), amount: 1290.0, status: "pago", method: "Cartão", discount: 15, nfe: "NFS-e 004201", paidAt: shiftDate(-84) },
  { id: "f6", description: "Curso Boost — Inglês Técnico", due: shiftDate(15), amount: 240.0, status: "aberto", method: "PIX" },
  { id: "f7", description: "Segunda via de carteirinha", due: shiftDate(-3), amount: 35.0, status: "processando", method: "PIX" },
];

export const SCHOLARSHIP = { name: "Bolsa Mérito Acadêmico", percent: 15, validity: "até 12/2026", note: "Renovação condicionada a CR ≥ 7,5" };

export type Reservation = { id: string; space: string; campus: string; date: string; time: string; purpose: string; status: "confirmada" | "pendente" | "cancelada" | "concluida" };

export const RESERVATIONS: Reservation[] = [
  { id: "r1", space: "Sala de Estudos 04", campus: "Bloco B · Campus Central", date: shiftDate(1), time: "18:00 - 20:00", purpose: "Estudo em grupo — Estrutura de Dados", status: "confirmada" },
  { id: "r2", space: "Laboratório 3", campus: "Bloco C · Campus Central", date: shiftDate(4), time: "14:00 - 16:00", purpose: "Projeto integrador", status: "pendente" },
  { id: "r3", space: "Auditório Menor", campus: "Bloco A · Campus Central", date: shiftDate(-6), time: "19:00 - 21:00", purpose: "Apresentação do grupo de pesquisa", status: "concluida" },
  { id: "r4", space: "Sala de Estudos 02", campus: "Bloco B · Campus Central", date: shiftDate(-14), time: "16:00 - 18:00", purpose: "Monitoria de Cálculo", status: "cancelada" },
];

export const AVAILABLE_SPACES = [
  { id: "sp1", name: "Sala de Estudos 01", capacity: 6, campus: "Bloco B", slots: ["08:00", "10:00", "14:00", "18:00"] },
  { id: "sp2", name: "Sala de Estudos 04", capacity: 8, campus: "Bloco B", slots: ["10:00", "16:00", "20:00"] },
  { id: "sp3", name: "Laboratório 3", capacity: 30, campus: "Bloco C", slots: ["14:00", "16:00"] },
  { id: "sp4", name: "Estúdio de Gravação", capacity: 4, campus: "Bloco D", slots: ["09:00", "13:00", "19:00"] },
];

export type Ticket = { id: string; subject: string; sector: string; priority: "baixa" | "media" | "alta"; status: "aberto" | "em-andamento" | "aguardando" | "resolvido"; created: string; updated: string; messages: { author: string; role: "aluno" | "atendente"; at: string; text: string }[] };

export const TICKETS: Ticket[] = [
  { id: "#4821", subject: "Erro ao acessar boletim no portal", sector: "TI / Suporte", priority: "alta", status: "em-andamento", created: shiftDate(-2), updated: shiftDate(-1), messages: [
    { author: "Ana Prado", role: "aluno", at: shiftDate(-2), text: "Ao abrir o boletim aparece uma tela em branco desde ontem." },
    { author: "Bruno Alves · Suporte TI", role: "atendente", at: shiftDate(-1), text: "Olá Ana! Identificamos o problema e estamos aplicando a correção. Retornamos em até 24h." },
  ] },
  { id: "#4790", subject: "Solicitação de declaração de matrícula", sector: "Secretaria", priority: "media", status: "resolvido", created: shiftDate(-12), updated: shiftDate(-9), messages: [
    { author: "Ana Prado", role: "aluno", at: shiftDate(-12), text: "Preciso de declaração de matrícula para estágio." },
    { author: "Secretaria Acadêmica", role: "atendente", at: shiftDate(-9), text: "Documento emitido e disponível na central de documentos." },
  ] },
  { id: "#4755", subject: "Revisão de lançamento de falta", sector: "Coordenação", priority: "media", status: "aguardando", created: shiftDate(-18), updated: shiftDate(-15), messages: [
    { author: "Ana Prado", role: "aluno", at: shiftDate(-18), text: "Falta lançada em 12/06 em Linguística, mas eu estava presente." },
    { author: "Camila Souza · Coordenação", role: "atendente", at: shiftDate(-15), text: "Encaminhado à professora responsável para verificação." },
  ] },
];

export const SECTORS = ["TI / Suporte", "Secretaria", "Coordenação", "Financeiro", "Biblioteca", "Infraestrutura"];

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

export type Notification = { id: string; title: string; body: string; at: string; kind: "academico" | "financeiro" | "atividade" | "chamado" | "curso" | "institucional"; read: boolean };

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Nova nota lançada em Engenharia de Software II", body: "Trabalho de arquitetura: 9,0. Feedback disponível.", at: shiftDate(0), kind: "academico", read: false },
  { id: "n2", title: "Mensalidade de julho disponível", body: "Vencimento em 7 dias — boleto disponível para download.", at: shiftDate(-1), kind: "financeiro", read: false },
  { id: "n3", title: "Atividade com prazo próximo", body: "Análise crítica de complexidade encerra amanhã às 23:59.", at: shiftDate(-1), kind: "atividade", read: false },
  { id: "n4", title: "Resposta no chamado #4821", body: "Suporte TI respondeu sua solicitação.", at: shiftDate(-1), kind: "chamado", read: true },
  { id: "n5", title: "Novo material em Estrutura de Dados", body: "Videoaula complementar sobre grafos publicada.", at: shiftDate(-2), kind: "academico", read: true },
  { id: "n6", title: "Frequência abaixo do mínimo", body: "Linguística Aplicada está com 71% de presença (mínimo 75%).", at: shiftDate(-3), kind: "academico", read: false },
  { id: "n7", title: "Certificado emitido", body: "Metodologias Ágeis — certificado disponível para download.", at: shiftDate(-6), kind: "curso", read: true },
  { id: "n8", title: "Semana Acadêmica 2026", body: "Inscrições abertas para as oficinas do Campus Central.", at: shiftDate(-8), kind: "institucional", read: true },
];

export const NOTICES = [
  { id: "av1", title: "Semana Acadêmica 2026", text: "Inscrições abertas até sexta-feira para oficinas e palestras.", tone: "oklch(0.55 0.19 265)" },
  { id: "av2", title: "Biblioteca com horário estendido", text: "Durante o período de provas, atendimento até 23h.", tone: "oklch(0.68 0.14 195)" },
  { id: "av3", title: "Renovação de matrícula 2026.2", text: "Período de renovação inicia em 3 semanas.", tone: "oklch(0.72 0.16 90)" },
];

// ---------- Derived helpers ----------
export const disciplineById = (id: string) => DISCIPLINES.find((d) => d.id === id);

export function partialAverage(disciplineId: string) {
  const items = ASSESSMENTS.filter((a) => a.disciplineId === disciplineId && a.value !== null);
  if (!items.length) return null;
  const w = items.reduce((s, a) => s + a.weight, 0);
  return items.reduce((s, a) => s + (a.value as number) * a.weight, 0) / (w || 1);
}

export const overallAverage =
  DISCIPLINES.reduce((s, d) => s + (d.average ?? 0), 0) / DISCIPLINES.filter((d) => d.average !== null).length;

export const overallAttendance =
  DISCIPLINES.reduce((s, d) => s + d.attendance, 0) / DISCIPLINES.length;

export const CR = (() => {
  const done = HISTORY.filter((h) => h.grade !== null);
  const wsum = done.reduce((s, h) => s + h.workload, 0);
  return done.reduce((s, h) => s + (h.grade as number) * h.workload, 0) / (wsum || 1);
})();

export const totalHoursDone = HISTORY.filter((h) => h.situation === "aprovado").reduce((s, h) => s + h.workload, 0);
export const CURRICULUM_HOURS = 3200;

export const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
