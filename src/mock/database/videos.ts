// Table: videos — moved from rooster/boost/mock-data.ts (VIDEOS).
const COVERS = [
  "linear-gradient(135deg, oklch(0.6 0.18 260), oklch(0.68 0.18 305))",
  "linear-gradient(135deg, oklch(0.68 0.18 40), oklch(0.72 0.16 90))",
  "linear-gradient(135deg, oklch(0.62 0.18 155), oklch(0.7 0.16 195))",
  "linear-gradient(135deg, oklch(0.55 0.19 265), oklch(0.6 0.22 305))",
  "linear-gradient(135deg, oklch(0.6 0.22 25), oklch(0.68 0.18 40))",
  "linear-gradient(135deg, oklch(0.7 0.16 145), oklch(0.72 0.14 195))",
];

export const videos = [
  { id: "v1", title: "Boas-vindas ao React", description: "Introdução ao curso e configuração do ambiente.", duration: "08:12", author: "Bruno Alves", category: "tec", thumb: COVERS[0], size: "184 MB", usedIn: 3, uploadedAt: "2026-05-10" },
  { id: "v2", title: "Rubricas de avaliação", description: "Como construir rubricas objetivas.", duration: "14:35", author: "Camila Souza", category: "ped", thumb: COVERS[1], size: "312 MB", usedIn: 2, uploadedAt: "2026-04-01" },
  { id: "v3", title: "Fluxo de caixa mensal", description: "Estruturando um fluxo de caixa institucional.", duration: "22:08", author: "Fábio Nogueira", category: "gest", thumb: COVERS[2], size: "498 MB", usedIn: 1, uploadedAt: "2026-03-18" },
  { id: "v4", title: "Tom de voz institucional", description: "Definindo o tom de voz da marca.", duration: "11:47", author: "Helena Duarte", category: "com", thumb: COVERS[3], size: "244 MB", usedIn: 1, uploadedAt: "2026-05-28" },
  { id: "v5", title: "Phishing na prática", description: "Reconhecendo ataques de phishing.", duration: "09:20", author: "Bruno Alves", category: "seg", thumb: COVERS[4], size: "198 MB", usedIn: 4, uploadedAt: "2026-01-12" },
  { id: "v6", title: "Writing an abstract", description: "Estrutura clássica de um abstract acadêmico.", duration: "17:02", author: "Elisa Ferreira", category: "idm", thumb: COVERS[5], size: "356 MB", usedIn: 2, uploadedAt: "2026-02-08" },
  { id: "v7", title: "Hooks avançados", description: "useMemo, useCallback e useReducer na prática.", duration: "26:44", author: "Bruno Alves", category: "tec", thumb: COVERS[0], size: "612 MB", usedIn: 1, uploadedAt: "2026-06-02" },
  { id: "v8", title: "Feedback qualitativo", description: "Como devolver feedback que gera aprendizado.", duration: "13:18", author: "Camila Souza", category: "ped", thumb: COVERS[1], size: "268 MB", usedIn: 2, uploadedAt: "2026-04-15" },
];

export const videoById = (id: string) => videos.find((v) => v.id === id);
