// Table: boost_courses — moved from rooster/boost/mock-data.ts (COURSES + módulos/aulas).
import { boostCategories } from "./boostCategories";
import { instructors } from "./instructors";

type ContentType =
  | "texto" | "video-upload" | "youtube" | "vimeo" | "pdf" | "doc"
  | "slide" | "planilha" | "imagem" | "audio" | "link" | "codigo" | "download";

const COVERS = [
  "linear-gradient(135deg, oklch(0.6 0.18 260), oklch(0.68 0.18 305))",
  "linear-gradient(135deg, oklch(0.68 0.18 40), oklch(0.72 0.16 90))",
  "linear-gradient(135deg, oklch(0.62 0.18 155), oklch(0.7 0.16 195))",
  "linear-gradient(135deg, oklch(0.55 0.19 265), oklch(0.6 0.22 305))",
  "linear-gradient(135deg, oklch(0.6 0.22 25), oklch(0.68 0.18 40))",
  "linear-gradient(135deg, oklch(0.7 0.16 145), oklch(0.72 0.14 195))",
];

const BLOCK_TYPES: ContentType[] = ["texto", "video-upload", "youtube", "pdf", "slide", "imagem", "link", "codigo"];

function mkModules(seed: number, count: number) {
  const titles = [
    "Fundamentos e boas-vindas", "Conceitos essenciais", "Prática guiada",
    "Aprofundamento", "Estudo de caso", "Projeto final e avaliação",
  ];
  const lessonTitles = [
    "Introdução ao módulo", "Contexto e aplicações", "Demonstração prática",
    "Exercício guiado", "Estudo dirigido", "Discussão e Q&A", "Checkpoint",
  ];
  return Array.from({ length: count }, (_, m) => ({
    id: `mod-${seed}-${m}`,
    title: `Módulo ${m + 1} — ${titles[(seed + m) % titles.length]}`,
    summary: "Conceitos, prática e checkpoint com material complementar.",
    lessons: Array.from({ length: 3 + ((seed + m) % 3) }, (_, l) => ({
      id: `l-${seed}-${m}-${l}`,
      title: lessonTitles[(seed + m + l) % lessonTitles.length],
      duration: `${8 + ((seed + m + l) % 20)}:${((seed * (l + 1)) % 60).toString().padStart(2, "0")}`,
      blocks: Array.from({ length: 2 + ((seed + l) % 3) }, (_, b) => ({
        type: BLOCK_TYPES[(seed + m + l + b) % BLOCK_TYPES.length],
        label: `Bloco ${b + 1}`,
      })),
      hasQuiz: l === 2 + ((seed + m) % 2),
    })),
  }));
}

export type CourseLevel = "iniciante" | "intermediario" | "avancado";
export type CourseStatus = "publicado" | "rascunho" | "revisao" | "arquivado";
export type CoursePrice = "gratuito" | "restrito";

type CourseSeed = {
  id: string; slug: string; title: string; category: string; description: string;
  objectives: string[]; prerequisites: string[]; audience: string; workload: string;
  students: number; rating: number; reviews: number; level: CourseLevel;
  status: CourseStatus; certificate: boolean; price: CoursePrice;
  publishedAt: string; tags: string[]; completionRate: number;
};

const COURSE_SEED: CourseSeed[] = [
  { id: "c1", slug: "react-institucional", title: "React para plataformas institucionais", category: "tec", description: "Construa interfaces modernas com React, TypeScript e boas práticas de design system.", objectives: ["Dominar componentes e hooks", "Aplicar TypeScript em projetos reais", "Consumir APIs com segurança"], prerequisites: ["HTML/CSS", "JavaScript básico"], audience: "Desenvolvedores e analistas de TI", workload: "40h", students: 312, rating: 4.8, reviews: 128, level: "intermediario" as const, status: "publicado" as const, certificate: true, price: "restrito" as const, publishedAt: "2026-05-12", tags: ["react", "typescript", "frontend"], completionRate: 76 },
  { id: "c2", slug: "avaliacao-por-competencias", title: "Avaliação por competências na sala de aula", category: "ped", description: "Metodologias contemporâneas para desenhar avaliações formativas e por competências.", objectives: ["Planejar avaliações contínuas", "Criar rubricas claras", "Aplicar feedback qualitativo"], prerequisites: ["Experiência docente"], audience: "Professores e coordenadores", workload: "24h", students: 218, rating: 4.7, reviews: 92, level: "iniciante" as const, status: "publicado" as const, certificate: true, price: "gratuito" as const, publishedAt: "2026-04-02", tags: ["avaliação", "didática"], completionRate: 82 },
  { id: "c3", slug: "gestao-financeira-institucional", title: "Gestão financeira institucional", category: "gest", description: "Fundamentos de fluxo de caixa, planejamento orçamentário e indicadores financeiros.", objectives: ["Estruturar orçamento anual", "Interpretar DRE simplificado", "Definir KPIs financeiros"], prerequisites: [], audience: "Coordenadores e diretores", workload: "18h", students: 96, rating: 4.6, reviews: 41, level: "intermediario" as const, status: "publicado" as const, certificate: true, price: "restrito" as const, publishedAt: "2026-03-20", tags: ["financeiro", "gestão"], completionRate: 69 },
  { id: "c4", slug: "comunicacao-institucional", title: "Comunicação institucional e voz da marca", category: "com", description: "Como estruturar uma comunicação clara, consistente e humana em múltiplos canais.", objectives: ["Definir tom de voz", "Padronizar peças", "Medir engajamento"], prerequisites: [], audience: "Marketing e assessoria", workload: "12h", students: 74, rating: 4.5, reviews: 28, level: "iniciante" as const, status: "publicado" as const, certificate: false, price: "gratuito" as const, publishedAt: "2026-06-01", tags: ["marca", "comunicação"], completionRate: 88 },
  { id: "c5", slug: "seguranca-da-informacao", title: "Segurança da informação para servidores", category: "seg", description: "LGPD, boas práticas e simulados de phishing para colaboradores.", objectives: ["Reconhecer ameaças", "Aplicar LGPD", "Reportar incidentes"], prerequisites: [], audience: "Todos os colaboradores", workload: "6h", students: 542, rating: 4.9, reviews: 210, level: "iniciante" as const, status: "publicado" as const, certificate: true, price: "gratuito" as const, publishedAt: "2026-01-15", tags: ["lgpd", "segurança"], completionRate: 91 },
  { id: "c6", slug: "ingles-academico", title: "Inglês acadêmico — writing e reading", category: "idm", description: "Leitura e escrita para publicações e trabalhos acadêmicos em inglês.", objectives: ["Estruturar abstract", "Ler papers com fluência", "Revisar textos"], prerequisites: ["Inglês intermediário"], audience: "Pesquisadores e alunos de pós", workload: "32h", students: 118, rating: 4.7, reviews: 54, level: "avancado" as const, status: "publicado" as const, certificate: true, price: "restrito" as const, publishedAt: "2026-02-10", tags: ["inglês", "acadêmico"], completionRate: 64 },
  { id: "c7", slug: "design-de-aulas-online", title: "Design de aulas online e híbridas", category: "ped", description: "Planeje, produza e conduza aulas híbridas com engajamento consistente.", objectives: ["Roteirizar aulas", "Escolher formatos", "Aplicar ferramentas ativas"], prerequisites: [], audience: "Professores", workload: "20h", students: 0, rating: 0, reviews: 0, level: "intermediario" as const, status: "rascunho" as const, certificate: true, price: "restrito" as const, publishedAt: "", tags: ["metodologia", "híbrido"], completionRate: 0 },
  { id: "c8", slug: "power-bi-para-educacao", title: "Power BI aplicado à educação", category: "tec", description: "Modele dados acadêmicos e crie dashboards executivos.", objectives: ["Modelar dados", "Criar medidas DAX", "Publicar relatórios"], prerequisites: ["Excel intermediário"], audience: "Coordenadores e TI", workload: "28h", students: 0, rating: 0, reviews: 0, level: "intermediario" as const, status: "revisao" as const, certificate: true, price: "restrito" as const, publishedAt: "", tags: ["dados", "bi"], completionRate: 0 },
  { id: "c9", slug: "biblioteconomia-digital", title: "Biblioteconomia digital", category: "gest", description: "Fluxos de curadoria, catalogação e serviços digitais para bibliotecas.", objectives: ["Catalogar recursos digitais", "Automatizar serviços", "Medir uso"], prerequisites: [], audience: "Bibliotecários", workload: "16h", students: 42, rating: 4.4, reviews: 12, level: "intermediario" as const, status: "publicado" as const, certificate: true, price: "restrito" as const, publishedAt: "2025-11-08", tags: ["biblioteca"], completionRate: 71 },
];

export type BoostCourse = CourseSeed & {
  cover: string; categoryColor: string; instructor: (typeof instructors)[number];
  modules: ReturnType<typeof mkModules>; lessonsCount: number;
};

export const boostCourses: BoostCourse[] = COURSE_SEED.map((c, i) => {
  const modules = mkModules(i + 1, 3 + (i % 3));
  const lessonsCount = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const cat = boostCategories.find((x) => x.id === c.category)!;
  return {
    ...c,
    cover: COVERS[i % COVERS.length],
    categoryColor: cat.color,
    instructor: instructors[i % instructors.length],
    modules,
    lessonsCount,
  };
});

export const boostCourseById = (id: string) => boostCourses.find((c) => c.id === id);
