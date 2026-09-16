// Dados iniciais usados apenas no modo offline (API NestJS indisponível).
// Estruturados exatamente com os campos do backend.
import type {
  LogAuditoria, Modulo, Notificacao, Permissao,
  Sessao, Setor, Usuario, UsuarioPermissao, UsuarioSetor,
} from "./types";

const iso = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export const seedUsuarios: Usuario[] = [
  { id: "u-1", nome: "Marina Ribeiro", email: "marina@rooster.edu", cpf: "12345678901", telefone: "(11) 98888-1010", ativo: true, ultimoLogin: iso(0), criadoEm: iso(240), atualizadoEm: iso(3) },
  { id: "u-2", nome: "Bruno Alves", email: "bruno@rooster.edu", cpf: "98765432100", telefone: "(11) 97777-2020", ativo: true, ultimoLogin: iso(1), criadoEm: iso(180), atualizadoEm: iso(9) },
  { id: "u-3", nome: "Camila Souza", email: "camila@rooster.edu", telefone: "(11) 96666-3030", ativo: true, ultimoLogin: iso(2), criadoEm: iso(150) },
  { id: "u-4", nome: "Diego Martins", email: "diego@rooster.edu", cpf: "45678912300", ativo: true, ultimoLogin: iso(6), criadoEm: iso(120) },
  { id: "u-5", nome: "Elisa Ferreira", email: "elisa@rooster.edu", ativo: false, criadoEm: iso(60) },
  { id: "u-6", nome: "Felipe Nunes", email: "felipe@rooster.edu", telefone: "(11) 95555-4040", ativo: false, ultimoLogin: iso(48), criadoEm: iso(300) },
];

export const seedSetores: Setor[] = [
  { id: "s-1", nome: "Acadêmico", descricao: "Coordenações e secretaria acadêmica", ativo: true, criadoEm: iso(300) },
  { id: "s-2", nome: "Financeiro", descricao: "Tesouraria e cobrança", ativo: true, criadoEm: iso(300) },
  { id: "s-3", nome: "Infraestrutura", descricao: "Suporte técnico e patrimônio", ativo: true, criadoEm: iso(280) },
  { id: "s-4", nome: "Diretoria", descricao: null, ativo: true, criadoEm: iso(280) },
];

export const seedModulos: Modulo[] = [
  { id: "m-1", nome: "Rooster Hub", rota: "/hub", icone: "Shield", ativo: true, criadoEm: iso(300) },
  { id: "m-2", nome: "Rooster Desk", rota: "/desk", icone: "LifeBuoy", ativo: true, criadoEm: iso(300) },
  { id: "m-3", nome: "Rooster Student", rota: "/student", icone: "GraduationCap", ativo: true, criadoEm: iso(300) },
  { id: "m-4", nome: "Rooster Academy", rota: "/academy", icone: "BookOpen", ativo: true, criadoEm: iso(300) },
  { id: "m-5", nome: "Rooster Rooms", rota: "/rooms", icone: "CalendarRange", ativo: true, criadoEm: iso(300) },
  { id: "m-6", nome: "Rooster Assets", rota: "/assets", icone: "Package", ativo: true, criadoEm: iso(300) },
  { id: "m-7", nome: "Rooster Finance", rota: "/finance", icone: "Wallet", ativo: true, criadoEm: iso(300) },
  { id: "m-8", nome: "Rooster Learn", rota: "/learn", icone: "BookMarked", ativo: true, criadoEm: iso(300) },
  { id: "m-9", nome: "Rooster Boost", rota: "/boost", icone: "Rocket", ativo: true, criadoEm: iso(300) },
];

export const seedPermissoes: Permissao[] = [
  { id: "pm-1", moduloId: "m-1", nome: "usuarios.listar", descricao: "Listar usuários", recurso: "usuarios", acao: "read", criadoEm: iso(300) },
  { id: "pm-2", moduloId: "m-1", nome: "usuarios.criar", descricao: "Criar usuários", recurso: "usuarios", acao: "create", criadoEm: iso(300) },
  { id: "pm-3", moduloId: "m-1", nome: "usuarios.editar", descricao: "Editar usuários", recurso: "usuarios", acao: "update", criadoEm: iso(300) },
  { id: "pm-4", moduloId: "m-1", nome: "usuarios.remover", descricao: "Remover usuários", recurso: "usuarios", acao: "delete", criadoEm: iso(300) },
  { id: "pm-5", moduloId: "m-2", nome: "chamados.gerenciar", descricao: "Gerenciar chamados", recurso: "chamados", acao: "manage", criadoEm: iso(290) },
  { id: "pm-6", moduloId: "m-4", nome: "notas.lancar", descricao: "Lançar notas", recurso: "notas", acao: "update", criadoEm: iso(290) },
  { id: "pm-7", moduloId: "m-7", nome: "cobrancas.gerenciar", descricao: "Gerenciar cobranças", recurso: "cobrancas", acao: "manage", criadoEm: iso(280) },
  { id: "pm-8", moduloId: null, nome: "auditoria.consultar", descricao: "Consultar logs de auditoria", recurso: "logs", acao: "read", criadoEm: iso(280) },
];

export const seedUsuariosSetores: UsuarioSetor[] = [
  { id: "us-1", usuarioId: "u-1", setorId: "s-1", criadoEm: iso(240) },
  { id: "us-2", usuarioId: "u-2", setorId: "s-1", criadoEm: iso(180) },
  { id: "us-3", usuarioId: "u-4", setorId: "s-3", criadoEm: iso(120) },
  { id: "us-4", usuarioId: "u-5", setorId: "s-4", criadoEm: iso(60) },
];

export const seedNotificacoes: Notificacao[] = [
  { id: "n-1", usuarioId: "u-1", titulo: "Novo usuário aguardando aprovação", mensagem: "Elisa Ferreira solicitou acesso ao Rooster One.", lida: false, criadoEm: iso(0) },
  { id: "n-2", usuarioId: "u-2", titulo: "Permissões atualizadas", mensagem: "Suas permissões individuais foram revisadas pelo administrador.", lida: true, criadoEm: iso(4) },
  { id: "n-3", usuarioId: null, titulo: "Manutenção programada", mensagem: "A plataforma ficará indisponível no domingo às 02h.", lida: false, criadoEm: iso(7) },
];

export const seedSessoes: Sessao[] = [
  { id: "se-1", usuarioId: "u-1", refreshToken: "rt_9f3c...a71", ip: "192.168.0.14", navegador: "Chrome 126 · macOS", expiraEm: new Date(Date.now() + 6 * 86400000).toISOString(), revogada: false, criadoEm: iso(1) },
  { id: "se-2", usuarioId: "u-2", refreshToken: "rt_11ab...4de", ip: "200.132.9.87", navegador: "Firefox 128 · Windows", expiraEm: new Date(Date.now() + 2 * 86400000).toISOString(), revogada: false, criadoEm: iso(3) },
  { id: "se-3", usuarioId: "u-4", refreshToken: "rt_77cd...910", ip: "10.0.4.31", navegador: "Edge 126 · Windows", expiraEm: iso(2), revogada: true, criadoEm: iso(12) },
];

export const seedLogs: LogAuditoria[] = [
  { id: "lg-1", usuarioId: "u-1", modulo: "Rooster Hub", acao: "create", entidade: "usuarios", entidadeId: "u-5", ip: "192.168.0.14", navegador: "Chrome 126 · macOS", criadoEm: iso(0) },
  { id: "lg-2", usuarioId: "u-1", modulo: "Rooster Hub", acao: "update", entidade: "usuarios_permissoes", entidadeId: "u-2", ip: "192.168.0.14", navegador: "Chrome 126 · macOS", criadoEm: iso(1) },
  { id: "lg-3", usuarioId: "u-4", modulo: "Rooster Assets", acao: "delete", entidade: "assets", entidadeId: "a-19", ip: "10.0.4.31", navegador: "Edge 126 · Windows", criadoEm: iso(2) },
  { id: "lg-4", usuarioId: "u-2", modulo: "Rooster Academy", acao: "update", entidade: "notas", entidadeId: "g-88", ip: "200.132.9.87", navegador: "Firefox 128 · Windows", criadoEm: iso(4) },
];
/**
 * Permissões concedidas diretamente a usuários (tela Acessos e permissões).
 * Fonte única de autorização: usuário -> permissão (não existe mais perfil).
 * Vazio por padrão: sem registros próprios, o usuário mantém o comportamento
 * padrão de demonstração definido pelas matrizes de módulo do sistema.
 */
export const seedUsuariosPermissoes: UsuarioPermissao[] = [];
