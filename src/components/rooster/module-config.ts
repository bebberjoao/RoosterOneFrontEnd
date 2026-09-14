import type { LucideIcon } from "lucide-react";
import {
  Home,
  LifeBuoy,
  GraduationCap,
  BookOpen,
  CalendarRange,
  Package,
  Wallet,
  BookMarked,
  Rocket,
  Users as UsersIcon,
  Shield,
  Building,
  KeyRound,
  LayoutDashboard,
  Ticket,
  Headphones,
  Tags,
  UserCog,
  FileText,
  ClipboardList,
  ScrollText,
  BadgeCheck,
  CalendarDays,
  UserSquare2,
  DoorOpen,
  Building2,
  Layers,
  FlaskConical,
  Dumbbell,
  ListChecks,
  Boxes,
  ArrowLeftRight,
  
  Receipt,
  FileCheck2,
  BarChart3,
  Percent,
  ClipboardCheck,
  Pencil,
  GraduationCap as GradIcon,
  Video,
  FolderOpen,
  UserPlus,
  ClipboardSignature,
  Wrench,
  Settings as SettingsIcon,
  CalendarPlus,
  MessagesSquare,
} from "lucide-react";
import {
  UserCheck,
  NotebookPen,
  Activity,
} from "lucide-react";
import type { Role } from "./role-context";

export type SubItem = {
  id: string;
  title: string;
  to: string;
  icon?: LucideIcon;
  /** Optional per-item role restriction. When omitted, inherits the module roles. */
  roles?: Role[];
};

export type ModuleItem = {
  id: string;
  name: string;
  short: string;
  path: string;
  icon: LucideIcon;
  description: string;
  accent: string;
  roles: Role[] | "all";
  children?: SubItem[];
};

// Standalone item shown at the top of the sidebar
export const HOME_ITEM = {
  id: "inicio",
  name: "Início",
  path: "/",
  icon: Home,
  accent: "oklch(0.55 0.19 265)",
};

export const MODULES: ModuleItem[] = [
  {
    id: "hub",
    name: "Rooster Hub",
    short: "Hub",
    path: "/hub",
    icon: Shield,
    description: "Usuários, setores e controle de acesso (RBAC).",
    accent: "oklch(0.55 0.19 265)",
    roles: ["admin"],
    children: [
      { id: "hub-dash", title: "Dashboard", to: "/hub", icon: LayoutDashboard },
      { id: "users", title: "Usuários", to: "/hub/usuarios", icon: UsersIcon },
      { id: "sectors", title: "Setores", to: "/hub/setores", icon: Building },
      { id: "access", title: "Acessos e Permissões", to: "/hub/acessos", icon: KeyRound },
    ],
  },
  {
    id: "desk",
    name: "Rooster Desk",
    short: "Desk",
    path: "/desk",
    icon: LifeBuoy,
    description: "Chamados, SLA e suporte técnico.",
    accent: "oklch(0.65 0.18 25)",
    roles: ["admin", "professor", "coordenador", "financeiro", "tecnico", "institucional"],
    children: [
      { id: "desk-dash", title: "Dashboard", to: "/desk", icon: LayoutDashboard },
      { id: "desk-tickets", title: "Chamados", to: "/desk/tickets", icon: Ticket },
      { id: "desk-cats", title: "Categorias", to: "/desk/categories", icon: Tags },
      { id: "desk-team", title: "Atendentes", to: "/desk/team", icon: UserCog },
    ],
  },
  {
    id: "student",
    name: "Rooster Student",
    short: "Student",
    path: "/student",
    icon: GraduationCap,
    description: "Portal do aluno: dados, disciplinas, histórico e notas.",
    accent: "oklch(0.68 0.15 195)",
    roles: ["admin", "aluno", "coordenador"],
    children: [
      { id: "st-dash", title: "Dashboard", to: "/student", icon: LayoutDashboard },
      { id: "st-perfil", title: "Perfil acadêmico", to: "/student/profile", icon: UserSquare2 },
      { id: "st-disc", title: "Disciplinas", to: "/student/disciplines", icon: BookOpen },
      { id: "st-ativ", title: "Atividades", to: "/student/activities", icon: ClipboardList },
      { id: "st-notas", title: "Notas e desempenho", to: "/student/grades", icon: ClipboardCheck },
      { id: "st-freq", title: "Frequência", to: "/student/attendance", icon: UserCheck },
      { id: "st-hist", title: "Histórico", to: "/student/history", icon: ScrollText },
      { id: "st-cal", title: "Calendário", to: "/student/calendar", icon: CalendarDays },
      { id: "st-cursos", title: "Cursos", to: "/student/courses", icon: Rocket },
      { id: "st-fin", title: "Financeiro", to: "/student/finance", icon: Wallet },
      { id: "st-res", title: "Reservas", to: "/student/reservations", icon: CalendarRange },
      { id: "st-desk", title: "Chamados", to: "/student/tickets", icon: Ticket },
      { id: "st-docs", title: "Documentos", to: "/student/documents", icon: FileText },
      { id: "st-notif", title: "Notificações", to: "/student/notifications", icon: BadgeCheck },
    ],
  },
  {
    id: "academy",
    name: "Rooster Academy",
    short: "Academy",
    path: "/academy",
    icon: BookOpen,
    description: "Gestão acadêmica: disciplinas, turmas e professores.",
    accent: "oklch(0.7 0.16 145)",
    roles: ["admin", "professor", "coordenador"],
    children: [
      { id: "ac-dash", title: "Dashboard", to: "/academy", icon: LayoutDashboard },
      { id: "ac-gestao", title: "Gestão acadêmica", to: "/academy/manage", icon: BookOpen },
      { id: "ac-freq", title: "Frequência", to: "/academy/attendance", icon: UserCheck },
      { id: "ac-notas", title: "Notas e conteúdos", to: "/academy/grades", icon: ClipboardCheck },
    ],
  },
  {
    id: "rooms",
    name: "Rooster Rooms",
    short: "Rooms",
    path: "/rooms",
    icon: CalendarRange,
    description: "Reservas de salas, laboratórios e equipamentos.",
    accent: "oklch(0.72 0.16 90)",
    roles: ["admin", "professor", "coordenador", "aluno", "tecnico", "institucional"],
    children: [
      { id: "ro-dash", title: "Dashboard", to: "/rooms", icon: LayoutDashboard },
      { id: "ro-reservar", title: "Reservar", to: "/rooms/book", icon: CalendarPlus },
      { id: "ro-res", title: "Minhas reservas", to: "/rooms/reservations", icon: MessagesSquare },
      { id: "ro-manage", title: "Gerenciar reservas", to: "/rooms/manage", icon: CalendarDays, roles: ["admin", "tecnico", "institucional", "coordenador"] },
      { id: "ro-estrutura", title: "Estrutura física", to: "/rooms/structure", icon: Building2, roles: ["admin", "tecnico", "institucional", "coordenador"] },
    ],
  },
  {
    id: "assets",
    name: "Rooster Assets",
    short: "Assets",
    path: "/assets",
    icon: Package,
    description: "Patrimônio, equipamentos e movimentações.",
    accent: "oklch(0.55 0.1 260)",
    roles: ["admin", "tecnico", "coordenador", "financeiro", "institucional"],
    children: [
      { id: "as-dash", title: "Dashboard", to: "/assets", icon: LayoutDashboard },
      { id: "as-pat", title: "Patrimônio", to: "/assets/inventory", icon: Boxes },
    ],
  },
  {
    id: "finance",
    name: "Rooster Finance",
    short: "Finance",
    path: "/finance",
    icon: Wallet,
    description: "ERP financeiro: cobranças, boletos e notas fiscais.",
    accent: "oklch(0.62 0.18 155)",
    roles: ["admin", "financeiro"],
    children: [
      { id: "fi-dash", title: "Dashboard", to: "/finance", icon: LayoutDashboard },
      { id: "fi-cob", title: "Cobranças", to: "/finance/charges", icon: Receipt },
      { id: "fi-men", title: "Mensalidades", to: "/finance/tuitions", icon: CalendarDays },
      { id: "fi-bol", title: "Boletos", to: "/finance/boletos", icon: FileText },
      { id: "fi-prod", title: "Produtos", to: "/finance/products", icon: Package },
      { id: "fi-serv", title: "Serviços", to: "/finance/services", icon: Wrench },
      { id: "fi-nfe", title: "Notas Fiscais", to: "/finance/nfe", icon: FileCheck2 },
      { id: "fi-rep", title: "Relatórios", to: "/finance/reports", icon: BarChart3 },
      { id: "fi-desc", title: "Descontos", to: "/finance/discounts", icon: Percent },
    ],
  },
  {
    id: "learn",
    name: "Rooster Learn",
    short: "Learn",
    path: "/learn",
    icon: BookMarked,
    description: "Ambiente virtual de aprendizagem.",
    accent: "oklch(0.6 0.2 305)",
    roles: ["admin", "professor", "coordenador", "aluno"],
    children: [
      { id: "le-dash", title: "Dashboard", to: "/learn", icon: LayoutDashboard },
      
      { id: "le-classes", title: "Turmas e atividades", to: "/learn/classes", icon: NotebookPen, roles: ["admin", "professor"] },
      { id: "le-student", title: "Minhas atividades", to: "/learn/student", icon: GradIcon, roles: ["admin", "aluno"] },
    ],
  },
  {
    id: "boost",
    name: "Rooster Boost",
    short: "Boost",
    path: "/boost",
    icon: Rocket,
    description: "Cursos extracurriculares, videoaulas e certificados.",
    accent: "oklch(0.68 0.18 40)",
    roles: ["admin", "aluno"],
    children: [
      { id: "bo-dash", title: "Dashboard", to: "/boost", icon: LayoutDashboard },
      { id: "bo-cur", title: "Cursos", to: "/boost", icon: BookMarked },
    ],
  },
];

export const ADMIN_ITEMS = [
  { id: "settings", name: "Configurações", path: "/settings", icon: SettingsIcon },
];

export function moduleAllowed(m: ModuleItem, role: Role): boolean {
  return m.roles === "all" || m.roles.includes(role);
}

export function subItemAllowed(item: SubItem, role: Role): boolean {
  return !item.roles || item.roles.includes(role);
}

export function modulesForRole(role: Role): ModuleItem[] {
  return MODULES.filter((m) => moduleAllowed(m, role)).map((m) => ({
    ...m,
    children: m.children?.filter((c) => subItemAllowed(c, role)),
  }));
}
