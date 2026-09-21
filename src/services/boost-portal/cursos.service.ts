// Serviço de catálogo/matrícula/progresso do portal público Rooster Boost.
// Fala com os endpoints do BoostPortalController (ver backend
// src/rooster-boost-portal/boost-portal.controller.ts) — parte pública
// (catálogo) não exige token; o resto exige o JWT da sessão Boost (ver
// client.ts, que já injeta o Authorization automaticamente).
//
// Segue o padrão de tipos "*Back" (DTO cru do backend, português) -> tipos
// "front" (nomes mais diretos pras telas) de src/services/mock-api/academy.service.ts.
import { request, requestBlob } from "./client";

export type Nivel = "iniciante" | "intermediario" | "avancado";
export type StatusMatricula = "ativa" | "concluida" | "cancelada";
export type TipoAula = "video" | "texto" | "pdf" | "link";

const NIVEL_LABEL: Record<Nivel, string> = { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado" };
export function nivelLabel(n: string): string {
  return NIVEL_LABEL[n as Nivel] ?? n;
}

function fmtTamanho(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
export { fmtTamanho };

// ================= Tipos "back" (payload cru da API) =================
type ProfessorBack = { usuario?: { id: string; nome: string } | null };
type CursoCatalogoBack = {
  id: string; titulo: string; slug: string; descricao: string | null; categoria: string | null;
  nivel: string; cargaHoraria: number; capa: string | null;
  professor?: ProfessorBack | null;
  _count?: { matriculas?: number; modulos?: number };
};
type AulaResumoBack = { id: string; titulo: string; tipo: string; duracaoMin: number | null };
type ModuloResumoBack = { id: string; titulo: string; ordem: number; aulas: AulaResumoBack[] };
type CursoDetalhePublicoBack = CursoCatalogoBack & { modulos: ModuloResumoBack[] };

type MaterialBack = { id: string; nome: string; tipo: string | null; tamanho: number | null; caminho: string };
type AulaCompletaBack = AulaResumoBack & { conteudoUrl: string | null; conteudoTexto: string | null; materiais: MaterialBack[] };
type ModuloCompletoBack = { id: string; titulo: string; ordem: number; aulas: AulaCompletaBack[] };
type CursoNoMatriculaBack = {
  id: string; titulo: string; slug: string; descricao: string | null; categoria: string | null;
  nivel: string; cargaHoraria: number; capa: string | null; emiteCertificado?: boolean;
  professor?: ProfessorBack | null;
  modulos?: ModuloCompletoBack[];
};
type CertificadoBack = { id: string; codigo: string; caminhoPdf: string; emitidoEm: string | null };
type ProgressoAulaBack = { id: string; aulaId: string; concluidoEm: string | null };
type MatriculaBack = {
  id: string; boostUsuarioId: string; cursoId: string; status: string; progressoPct: number;
  matriculadoEm: string | null; concluidoEm: string | null;
  curso: CursoNoMatriculaBack;
  certificado: CertificadoBack | null;
  progresso?: ProgressoAulaBack[];
};
type MensagemBack = {
  id: string; cursoId: string; mensagem: string; criadoEm: string | null;
  boostUsuario?: { id: string; nome: string } | null;
  professor?: { id: string; usuario?: { id: string; nome: string } } | null;
};

// ================= Tipos "front" =================
export type CursoCatalogo = {
  id: string; titulo: string; slug: string; descricao: string | null; categoria: string | null;
  nivel: Nivel; cargaHoraria: number; capa: string | null; professorNome: string;
  totalMatriculas: number; totalModulos: number;
};
export type AulaResumo = { id: string; titulo: string; tipo: TipoAula; duracaoMin: number | null };
export type ModuloResumo = { id: string; titulo: string; ordem: number; aulas: AulaResumo[] };
export type CursoDetalhePublico = CursoCatalogo & { modulos: ModuloResumo[] };

export type Material = { id: string; nome: string; tipo: string | null; tamanho: number | null; tamanhoFmt: string };
export type AulaCompleta = AulaResumo & {
  conteudoUrl: string | null; conteudoTexto: string | null; materiais: Material[];
  concluida: boolean; concluidoEm: string | null;
};
export type ModuloCompleto = { id: string; titulo: string; ordem: number; aulas: AulaCompleta[] };
export type Certificado = { id: string; codigo: string; emitidoEm: string | null };

export type MinhaMatricula = {
  id: string; cursoId: string; status: StatusMatricula; progressoPct: number;
  matriculadoEm: string | null; concluidoEm: string | null;
  curso: { titulo: string; slug: string; capa: string | null; cargaHoraria: number; categoria: string | null; nivel: Nivel; professorNome: string };
  certificado: Certificado | null;
};
export type MatriculaDetalhe = MinhaMatricula & {
  curso: MinhaMatricula["curso"] & { descricao: string | null; emiteCertificado: boolean; modulos: ModuloCompleto[] };
};

// ================= Mapeadores =================
function professorNome(p?: ProfessorBack | null): string {
  return p?.usuario?.nome ?? "Instrutor";
}
function cursoCatalogoToFront(b: CursoCatalogoBack): CursoCatalogo {
  return {
    id: b.id, titulo: b.titulo, slug: b.slug, descricao: b.descricao, categoria: b.categoria,
    nivel: (b.nivel as Nivel) ?? "iniciante", cargaHoraria: b.cargaHoraria, capa: b.capa,
    professorNome: professorNome(b.professor),
    totalMatriculas: b._count?.matriculas ?? 0, totalModulos: b._count?.modulos ?? 0,
  };
}
function aulaResumoToFront(b: AulaResumoBack): AulaResumo {
  return { id: b.id, titulo: b.titulo, tipo: (b.tipo as TipoAula) ?? "texto", duracaoMin: b.duracaoMin };
}
function cursoDetalhePublicoToFront(b: CursoDetalhePublicoBack): CursoDetalhePublico {
  return {
    ...cursoCatalogoToFront(b),
    modulos: (b.modulos ?? []).map((m) => ({ id: m.id, titulo: m.titulo, ordem: m.ordem, aulas: m.aulas.map(aulaResumoToFront) })),
  };
}
function materialToFront(b: MaterialBack): Material {
  return { id: b.id, nome: b.nome, tipo: b.tipo, tamanho: b.tamanho, tamanhoFmt: fmtTamanho(b.tamanho) };
}
function matriculaToFront(b: MatriculaBack): MinhaMatricula {
  return {
    id: b.id, cursoId: b.cursoId, status: (b.status as StatusMatricula) ?? "ativa", progressoPct: b.progressoPct,
    matriculadoEm: b.matriculadoEm, concluidoEm: b.concluidoEm,
    curso: {
      titulo: b.curso.titulo, slug: b.curso.slug, capa: b.curso.capa, cargaHoraria: b.curso.cargaHoraria,
      categoria: b.curso.categoria, nivel: (b.curso.nivel as Nivel) ?? "iniciante", professorNome: professorNome(b.curso.professor),
    },
    certificado: b.certificado ? { id: b.certificado.id, codigo: b.certificado.codigo, emitidoEm: b.certificado.emitidoEm } : null,
  };
}
function matriculaDetalheToFront(b: MatriculaBack): MatriculaDetalhe {
  const concluidas = new Map((b.progresso ?? []).map((p) => [p.aulaId, p.concluidoEm]));
  const base = matriculaToFront(b);
  return {
    ...base,
    curso: {
      ...base.curso,
      descricao: b.curso.descricao,
      emiteCertificado: b.curso.emiteCertificado ?? true,
      modulos: (b.curso.modulos ?? []).map((m) => ({
        id: m.id, titulo: m.titulo, ordem: m.ordem,
        aulas: m.aulas.map((a) => ({
          ...aulaResumoToFront(a),
          conteudoUrl: a.conteudoUrl, conteudoTexto: a.conteudoTexto,
          materiais: a.materiais.map(materialToFront),
          concluida: concluidas.has(a.id), concluidoEm: concluidas.get(a.id) ?? null,
        })),
      })),
    },
  };
}

export type Mensagem = { id: string; cursoId: string; mensagem: string; criadoEm: string | null; autorNome: string; autorTipo: "aluno" | "professor" };
function mensagemToFront(b: MensagemBack): Mensagem {
  const deProfessor = !!b.professor;
  return {
    id: b.id, cursoId: b.cursoId, mensagem: b.mensagem, criadoEm: b.criadoEm,
    autorNome: deProfessor ? (b.professor?.usuario?.nome ?? "Instrutor") : (b.boostUsuario?.nome ?? "Você"),
    autorTipo: deProfessor ? "professor" : "aluno",
  };
}

export const cursosBoostPortalService = {
  // ---------- Catálogo público (sem login) ----------
  async getCatalogo(): Promise<CursoCatalogo[]> {
    const rows = await request<CursoCatalogoBack[]>("/cursos-boost-publicos");
    return rows.map(cursoCatalogoToFront);
  },
  async getPorSlug(slug: string): Promise<CursoDetalhePublico> {
    const curso = await request<CursoDetalhePublicoBack>(`/cursos-boost-publicos/${encodeURIComponent(slug)}`);
    return cursoDetalhePublicoToFront(curso);
  },

  // ---------- Matrícula/progresso (exigem login Boost) ----------
  async matricular(cursoId: string): Promise<MinhaMatricula> {
    const created = await request<MatriculaBack>(`/cursos-boost/${cursoId}/matricular`, { method: "POST" });
    return matriculaToFront(created);
  },
  async getMinhasMatriculas(): Promise<MinhaMatricula[]> {
    const rows = await request<MatriculaBack[]>("/boost/me/matriculas");
    return rows.map(matriculaToFront);
  },
  async getMatricula(id: string): Promise<MatriculaDetalhe> {
    const b = await request<MatriculaBack>(`/boost/me/matriculas/${id}`);
    return matriculaDetalheToFront(b);
  },
  async concluirAula(aulaId: string): Promise<{ progressoPct: number; status: StatusMatricula }> {
    const res = await request<{ progressoPct: number; status: string }>(`/boost/aulas/${aulaId}/concluir`, { method: "PATCH" });
    return { progressoPct: res.progressoPct, status: (res.status as StatusMatricula) ?? "ativa" };
  },

  // ---------- Chat (exige login Boost + matrícula no curso) ----------
  async getMensagens(cursoId: string): Promise<Mensagem[]> {
    const rows = await request<MensagemBack[]>(`/boost/cursos/${cursoId}/mensagens`);
    return rows.map(mensagemToFront);
  },
  async enviarMensagem(cursoId: string, mensagem: string): Promise<Mensagem> {
    const created = await request<MensagemBack>(`/boost/cursos/${cursoId}/mensagens`, { method: "POST", body: { mensagem } });
    return mensagemToFront(created);
  },

  // ---------- Material de apoio ----------
  /** Baixa um material de apoio (autenticado, só quem está matriculado no curso da aula) e dispara o download no navegador. */
  async baixarMaterial(materialId: string, nomeArquivo: string): Promise<void> {
    const blob = await requestBlob(`/boost/materiais/${materialId}/arquivo`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // ---------- Certificado ----------
  /** Baixa o PDF do certificado (autenticado, só o dono) e dispara o download no navegador. */
  async baixarCertificado(certificadoId: string, nomeArquivo: string): Promise<void> {
    const blob = await requestBlob(`/boost/certificados/${certificadoId}/arquivo`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
