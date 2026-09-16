// Rooster Hub — tipos espelhando exatamente o schema Prisma / DTOs do backend.
// Nenhum campo além dos documentados na especificação foi adicionado.

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senhaHash?: string;
  cpf?: string | null;
  telefone?: string | null;
  ativo?: boolean;
  ultimoLogin?: string | null;
  criadoEm?: string | null;
  atualizadoEm?: string | null;
}

export interface Setor {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
  criadoEm?: string | null;
}

export interface Modulo {
  id: string;
  nome: string;
  rota?: string | null;
  icone?: string | null;
  ativo?: boolean;
  criadoEm?: string | null;
}

export interface Permissao {
  id: string;
  moduloId?: string | null;
  nome: string;
  descricao?: string | null;
  recurso?: string | null;
  acao?: string | null;
  criadoEm?: string | null;
}

export interface UsuarioSetor {
  id: string;
  usuarioId: string;
  setorId: string;
  criadoEm?: string | null;
}

export interface Notificacao {
  id: string;
  usuarioId?: string | null;
  titulo?: string | null;
  mensagem?: string | null;
  lida?: boolean;
  criadoEm?: string | null;
}

export interface Sessao {
  id: string;
  usuarioId?: string | null;
  refreshToken?: string | null;
  ip?: string | null;
  navegador?: string | null;
  expiraEm?: string | null;
  revogada?: boolean;
  criadoEm?: string | null;
}

export interface LogAuditoria {
  id: string;
  usuarioId?: string | null;
  modulo?: string | null;
  acao?: string | null;
  entidade?: string | null;
  entidadeId?: string | null;
  ip?: string | null;
  navegador?: string | null;
  criadoEm?: string | null;
}
/** Permissão concedida diretamente a um usuário (RBAC por tela/ação). */
export interface UsuarioPermissao {
  id: string;
  usuarioId: string;
  permissaoId: string;
  criadoEm?: string | null;
}
