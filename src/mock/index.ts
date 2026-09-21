// ============================================================================
// ROOSTER ONE — PONTO ÚNICO DE ENTRADA DOS DADOS MOCKADOS
// ============================================================================
// Hub, Desk, Rooms e Assets já estão ligados ao backend real (sem fallback
// de dado mockado — ver docs/integracao-backend.md). O que resta aqui serve
// só aos módulos ainda sem backend: Academy, Learn, Finance, Boost, Student.
//
// Organização:
//   src/mock/database/*      -> "tabelas" do banco mockado (arrays tipados)
//   src/mock/index.ts        -> este arquivo: agrega tudo em `mockDatabase`
//   src/services/mock-api/*  -> serviços (getAll/getById/create/update/remove)
//     dos módulos pendentes; Hub/Desk/Rooms/Assets usam
//     src/services/hub/client.ts (HTTP real) em vez desta pasta.
//
// Como integrar com o backend (para os módulos pendentes):
//   1. Nenhuma tela importa dados daqui diretamente — sempre via serviços.
//   2. Para migrar um recurso, troque o corpo do serviço correspondente em
//      src/services/mock-api/<recurso>.service.ts por chamadas HTTP,
//      seguindo o padrão já usado em ticket.service.ts/room.service.ts/
//      asset.service.ts. A assinatura pública deve permanecer igual.
//   3. O mapa MOCK_ENDPOINT_MAP abaixo indica o endpoint REST previsto para
//      cada "tabela", servindo de contrato para o time de backend.
//   4. Quando todos os recursos estiverem integrados, esta pasta inteira
//      (src/mock) pode ser removida sem alterar nenhuma tela.
//
// Regra: NADA aqui é exibido na interface como documentação. É código/dado.
// ============================================================================

export * from "./database";
import { db, type Database } from "./database";

/**
 * Todas as "tabelas" mockadas dos módulos operacionais. Hub, Desk, Rooms e
 * Assets não usam mais isso em tempo de execução (ligados ao backend real,
 * sem fallback de dado mockado) — o que resta aqui é só para os módulos
 * ainda sem backend (Academy, Learn, Finance, Boost, Student).
 */
export const mockDatabase = db;
export type MockDatabase = Database;

/**
 * Contrato de integração: nome lógico da tabela -> endpoint REST esperado.
 * Mantenha sincronizado com o backend NestJS ao criar novos recursos.
 */
export const MOCK_ENDPOINT_MAP = {
  // Hub (já espelhado em src/services/hub/index.ts)
  usuarios: "/usuarios",
  setores: "/setores",
  modulos: "/modulos",
  permissoes: "/permissoes",
  usuariosSetores: "/usuarios-setores",
  usuariosPermissoes: "/usuarios-permissoes",
  notificacoes: "/notificacoes",
  sessoes: "/sessoes",
  logsAuditoria: "/logs-auditoria",
  // Academy
  disciplines: "/disciplinas",
  courses: "/cursos",
  terms: "/periodos-letivos",
  teachers: "/professores",
  students: "/alunos",
  classes: "/turmas",
  enrollments: "/matriculas",
  calendarEvents: "/calendario-eventos",
  grades: "/notas",
  gradeItems: "/notas-itens",
  attendance: "/frequencias",
  academyDocs: "/documentos-academicos",
  // Learn
  activities: "/atividades",
  submissions: "/entregas",
  lessonContents: "/conteudos-aula",
  // Rooms
  campuses: "/campus",
  blocks: "/blocos",
  rooms: "/ambientes",
  reservations: "/reservas",
  // Assets
  assetCategories: "/patrimonio-categorias",
  assetSectors: "/patrimonio-setores",
  assets: "/patrimonio",
  assetMovements: "/patrimonio-movimentacoes",
  // Desk
  tickets: "/chamados",
  ticketCategories: "/chamados-categorias",
  deskCategories: "/chamados-categorias",
  deskSectors: "/chamados-setores",
  deskAgents: "/chamados-atendentes",
  // Boost
  boostCourses: "/boost-cursos",
  certificates: "/certificados",
} as const satisfies Record<string, string>;

export type MockEndpointKey = keyof typeof MOCK_ENDPOINT_MAP;

/** Manifesto por módulo (rotas, serviços, tabelas e endpoints de cada módulo). */
export * from "./modules";
