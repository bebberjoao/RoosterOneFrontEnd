// ============================================================================
// MANIFESTO DE MÓDULOS — mapa "módulo -> arquivos, tabelas e endpoints"
// ============================================================================
// Objetivo: permitir extrair/integrar UM módulo por vez no backend sem caçar
// arquivos. Cada entrada lista tudo que pertence ao módulo:
//   routes    -> arquivos de tela em src/routes
//   services  -> serviços mockados em src/services
//   tables    -> "tabelas" em src/mock/database (chaves de `db`)
//   endpoints -> contrato REST previsto (subconjunto de MOCK_ENDPOINT_MAP)
//   docs      -> documentação interna do módulo
//
// Ao migrar um módulo: implemente os endpoints, troque o corpo dos serviços
// listados por chamadas HTTP e apague as tabelas listadas em `tables`.
// ============================================================================
import { MOCK_ENDPOINT_MAP, type MockEndpointKey } from "./index";

export type ModuleManifest = {
  id: string;
  name: string;
  basePath: string;
  docs: string;
  routes: string[];
  services: string[];
  tables: MockEndpointKey[];
};

export const MODULE_MANIFEST: ModuleManifest[] = [
  {
    id: "hub",
    name: "Rooster Hub",
    basePath: "/hub",
    docs: "docs/modules/hub.md",
    routes: ["hub.tsx", "hub.index.tsx", "hub.usuarios.tsx", "hub.setores.tsx", "hub.acessos.tsx", "hub.modulos.tsx", "hub.auditoria.tsx"],
    services: ["src/services/hub/index.ts", "src/services/hub/client.ts", "src/services/hub/seed.ts", "src/services/mock-api/user.service.ts"],
    tables: ["usuarios", "setores", "modulos", "permissoes", "usuariosSetores", "usuariosPermissoes", "sessoes", "logsAuditoria", "notificacoes"],
  },
  {
    id: "desk",
    name: "Rooster Desk",
    basePath: "/desk",
    docs: "docs/modules/desk.md",
    routes: ["desk.tsx", "desk.index.tsx", "desk.tickets.tsx", "desk.tickets.$id.tsx", "desk.categories.tsx", "desk.categories.index.tsx", "desk.categories.$id.tsx", "desk.team.tsx"],
    services: ["src/services/mock-api/ticket.service.ts", "src/services/mock-api/desk-category.service.ts"],
    tables: ["tickets", "ticketCategories", "deskCategories", "deskSectors", "deskAgents"],
  },
  {
    id: "student",
    name: "Rooster Student",
    basePath: "/student",
    docs: "docs/modules/student.md",
    routes: ["student.tsx", "student.index.tsx", "student.profile.tsx", "student.disciplines.tsx", "student.activities.tsx", "student.grades.tsx", "student.attendance.tsx", "student.history.tsx", "student.calendar.tsx", "student.courses.tsx", "student.finance.tsx", "student.reservations.tsx", "student.tickets.tsx", "student.documents.tsx", "student.notifications.tsx"],
    services: ["src/services/mock-api/student.service.ts", "src/services/mock-api/notification.service.ts"],
    tables: ["students", "enrollments", "grades", "attendance", "academyDocs", "notificacoes"],
  },
  {
    id: "academy",
    name: "Rooster Academy",
    basePath: "/academy",
    docs: "docs/modules/academy.md",
    routes: ["academy.tsx", "academy.index.tsx", "academy.manage.tsx", "academy.attendance.tsx", "academy.grades.tsx"],
    services: ["src/services/mock-api/academy.service.ts"],
    tables: ["courses", "terms", "disciplines", "teachers", "classes", "enrollments", "calendarEvents", "grades", "gradeItems", "attendance", "academyDocs"],
  },
  {
    id: "rooms",
    name: "Rooster Rooms",
    basePath: "/rooms",
    docs: "docs/modules/rooms.md",
    routes: [
      "rooms.tsx", "rooms.index.tsx", "rooms.structure.tsx", "rooms.book.tsx",
      "rooms.reservations.index.tsx", "rooms.reservations.$id.tsx", "rooms.manage.tsx",
    ],
    services: ["src/services/mock-api/room.service.ts"],
    tables: ["campuses", "blocks", "rooms", "reservations"],
  },
  {
    id: "assets",
    name: "Rooster Assets",
    basePath: "/assets",
    docs: "docs/modules/assets.md",
    routes: ["assets.tsx", "assets.index.tsx", "assets.inventory.tsx"],
    services: ["src/services/mock-api/asset.service.ts"],
    tables: ["assetCategories", "assets", "assetMovements"],
  },
  {
    id: "finance",
    name: "Rooster Finance",
    basePath: "/finance",
    docs: "docs/modules/finance.md",
    routes: ["finance.tsx", "finance.index.tsx", "finance.charges.tsx", "finance.tuitions.tsx", "finance.boletos.tsx", "finance.products.tsx", "finance.services.tsx", "finance.nfe.tsx", "finance.reports.tsx", "finance.discounts.tsx", "finance.manage.tsx", "finance.settings.tsx"],
    services: ["src/services/mock-api/finance.service.ts"],
    tables: ["products", "services", "charges", "tuitions", "payments"],
  },
  {
    id: "learn",
    name: "Rooster Learn",
    basePath: "/learn",
    docs: "docs/modules/learn.md",
    routes: ["learn.tsx", "learn.index.tsx", "learn.activities.$id.tsx"],
    services: ["src/services/mock-api/learn.service.ts"],
    tables: ["activities", "submissions", "lessonContents"],
  },
  {
    id: "boost",
    name: "Rooster Boost",
    basePath: "/boost",
    docs: "docs/modules/boost.md",
    routes: ["boost.tsx", "boost.index.tsx", "boost.courses.$id.tsx"],
    services: ["src/services/mock-api/boost.service.ts"],
    tables: ["boostCourses", "certificates"],
  },
];

export const moduleManifestById = (id: string) => MODULE_MANIFEST.find((m) => m.id === id);

/** Endpoints REST previstos para um módulo (tabela -> rota). */
export function endpointsForModule(id: string): Record<string, string> {
  const m = moduleManifestById(id);
  if (!m) return {};
  return Object.fromEntries(m.tables.map((t) => [t, MOCK_ENDPOINT_MAP[t]]));
}
