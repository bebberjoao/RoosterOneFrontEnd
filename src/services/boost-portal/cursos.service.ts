// Serviço de catálogo/matrícula/progresso do portal público Rooster Boost.
// Fala com os endpoints do BoostPortalController (ver backend
// src/rooster-boost-portal/boost-portal.controller.ts) — parte pública
// (catálogo) não exige token; o resto exige o JWT da sessão Boost (ver
// client.ts, que já injeta o Authorization automaticamente).
//
// Segue o padrão de tipos "*Back" (DTO cru do backend, português) -> tipos
// "front" (nomes mais diretos pras telas) de src/services/mock-api/academy.service.ts.
import { request, requestBlob, BoostApiError, API_URL, API_VERSION_PREFIX } from "./client";
import { fmtNumeroLivre } from "@/lib/formatacao";

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
  if (bytes < 1024 * 1024) return `${fmtNumeroLivre(bytes / 1024, 0)} KB`;
  return `${fmtNumeroLivre(bytes / 1024 / 1024, 1)} MB`;
}
export { fmtTamanho };

// ================= Tipos "back" (payload cru da API) =================
type OrientadorBack = { professor?: { id?: string; usuario?: { id: string; nome: string } | null } | null };
type CursoCatalogoBack = {
  id: string; titulo: string; slug: string; descricao: string | null; categoria: string | null;
  nivel: string; cargaHoraria: number; capa: string | null;
  orientadores?: OrientadorBack[];
  _count?: { matriculas?: number; modulos?: number };
};
type AulaResumoBack = { id: string; titulo: string; tipo: string; duracaoMin: number | null };
type ModuloResumoBack = { id: string; titulo: string; ordem: number; aulas: AulaResumoBack[] };
type CursoDetalhePublicoBack = CursoCatalogoBack & { modulos: ModuloResumoBack[] };

type MaterialBack = { id: string; nome: string; tipo: string | null; tamanho: number | null; caminho: string };
type AulaCompletaBack = AulaResumoBack & {
  conteudoUrl: string | null; conteudoTexto: string | null; materiais: MaterialBack[];
  videoArquivo?: string | null; videoMimeType?: string | null;
};
type ModuloCompletoBack = { id: string; titulo: string; ordem: number; aulas: AulaCompletaBack[] };
type CursoNoMatriculaBack = {
  id: string; titulo: string; slug: string; descricao: string | null; categoria: string | null;
  nivel: string; cargaHoraria: number; capa: string | null; emiteCertificado?: boolean;
  orientadores?: OrientadorBack[];
  modulos?: ModuloCompletoBack[];
};
type CertificadoBack = { id: string; codigo: string; caminhoPdf: string; emitidoEm: string | null };
type ProgressoAulaBack = {
  id: string; aulaId: string; concluidoEm: string | null;
  posicaoSeg?: number | null; percentualAssistido?: number | null;
};
type MatriculaBack = {
  id: string; boostUsuarioId: string; cursoId: string; status: string; progressoPct: number;
  matriculadoEm: string | null; concluidoEm: string | null;
  curso: CursoNoMatriculaBack;
  certificado: CertificadoBack | null;
  progresso?: ProgressoAulaBack[];
};
type MensagemBack = {
  id: string; mensagem: string; criadoEm: string | null;
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
  /** Posição (segundos) e maior % já assistido — para o player retomar de onde parou. */
  posicaoSeg: number;
  percentualAssistido: number;
  /** Presente só quando o instrutor enviou um arquivo de vídeo (em vez de link externo). */
  hostedVideo?: { mimeType: string };
};
export type ModuloCompleto = { id: string; titulo: string; ordem: number; aulas: AulaCompleta[] };
export type Certificado = { id: string; codigo: string; emitidoEm: string | null };

/** Resposta da conferência pública de certificado (`GET /certificados-boost/verificar/:codigo`). */
export type CertificadoVerificado = {
  valido: true;
  codigo: string;
  aluno: string;
  curso: string;
  cargaHoraria: number;
  emitidoEm: string | null;
};

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
/** Nomes dos orientadores do curso (a gestão do curso não tem "instrutor único"). */
function professorNome(orientadores?: OrientadorBack[]): string {
  const nomes = (orientadores ?? []).map((o) => o.professor?.usuario?.nome).filter((n): n is string => !!n);
  return nomes.length ? nomes.join(", ") : "Orientação do curso";
}
function cursoCatalogoToFront(b: CursoCatalogoBack): CursoCatalogo {
  return {
    id: b.id, titulo: b.titulo, slug: b.slug, descricao: b.descricao, categoria: b.categoria,
    nivel: (b.nivel as Nivel) ?? "iniciante", cargaHoraria: b.cargaHoraria, capa: b.capa,
    professorNome: professorNome(b.orientadores),
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
      categoria: b.curso.categoria, nivel: (b.curso.nivel as Nivel) ?? "iniciante", professorNome: professorNome(b.curso.orientadores),
    },
    certificado: b.certificado ? { id: b.certificado.id, codigo: b.certificado.codigo, emitidoEm: b.certificado.emitidoEm } : null,
  };
}
function matriculaDetalheToFront(b: MatriculaBack): MatriculaDetalhe {
  const progressoPorAula = new Map((b.progresso ?? []).map((p) => [p.aulaId, p]));
  const base = matriculaToFront(b);
  return {
    ...base,
    curso: {
      ...base.curso,
      descricao: b.curso.descricao,
      emiteCertificado: b.curso.emiteCertificado ?? true,
      modulos: (b.curso.modulos ?? []).map((m) => ({
        id: m.id, titulo: m.titulo, ordem: m.ordem,
        aulas: m.aulas.map((a) => {
          const progresso = progressoPorAula.get(a.id);
          return {
            ...aulaResumoToFront(a),
            conteudoUrl: a.conteudoUrl, conteudoTexto: a.conteudoTexto,
            materiais: a.materiais.map(materialToFront),
            concluida: !!progresso?.concluidoEm, concluidoEm: progresso?.concluidoEm ?? null,
            posicaoSeg: progresso?.posicaoSeg ?? 0,
            percentualAssistido: progresso?.percentualAssistido ?? 0,
            hostedVideo: a.videoArquivo && a.videoMimeType ? { mimeType: a.videoMimeType } : undefined,
          };
        }),
      })),
    },
  };
}

export type Mensagem = { id: string; mensagem: string; criadoEm: string | null; autorNome: string; autorTipo: "aluno" | "professor" };
export function mensagemToFront(b: MensagemBack): Mensagem {
  const deProfessor = !!b.professor;
  return {
    id: b.id, mensagem: b.mensagem, criadoEm: b.criadoEm,
    autorNome: deProfessor ? (b.professor?.usuario?.nome ?? "Orientador") : (b.boostUsuario?.nome ?? "Você"),
    autorTipo: deProfessor ? "professor" : "aluno",
  };
}

/** A conversa contínua do aluno com os orientadores do curso. */
export type Conversa = { conversaId: string; orientadores: { id: string; nome: string }[]; mensagens: Mensagem[] };

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

  // ---------- Vídeo hospedado (progresso real) ----------
  /** Token de 5 min para o `<video src>` — a tag não anexa Authorization, então precisa desse token na própria URL. */
  async getStreamToken(aulaId: string): Promise<string> {
    const { token } = await request<{ token: string }>(`/boost/aulas/${aulaId}/stream-token`);
    return token;
  },
  /** Monta a URL completa de streaming a partir do token — usada direto no `src` do `<video>`. */
  streamUrl(aulaId: string, token: string): string {
    return `${API_URL}${API_VERSION_PREFIX}/boost/aulas/${aulaId}/video?token=${token}`;
  },
  /** Reporta posição/percentual assistido; o backend completa a aula sozinho ao cruzar o limiar (~90%). */
  async reportarProgresso(aulaId: string, posicaoSeg: number, percentualAssistido: number): Promise<{ concluida: boolean }> {
    const res = await request<{ concluida: boolean }>(`/boost/aulas/${aulaId}/progresso`, {
      method: "PATCH",
      body: { posicaoSeg, percentualAssistido },
    });
    return { concluida: res.concluida };
  },

  // ---------- Conversa com o orientador (exige login Boost + matrícula no curso) ----------
  async getConversa(cursoId: string): Promise<Conversa> {
    const c = await request<{ conversaId: string; orientadores: { id: string; nome: string }[]; mensagens: MensagemBack[] }>(`/boost/cursos/${cursoId}/conversa`);
    return { conversaId: c.conversaId, orientadores: c.orientadores, mensagens: c.mensagens.map(mensagemToFront) };
  },
  async enviarMensagem(cursoId: string, mensagem: string): Promise<Mensagem> {
    const created = await request<MensagemBack>(`/boost/cursos/${cursoId}/conversa/mensagens`, { method: "POST", body: { mensagem } });
    return mensagemToFront(created);
  },
  async marcarConversaLida(cursoId: string): Promise<void> {
    await request(`/boost/cursos/${cursoId}/conversa/lida`, { method: "PATCH" });
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
  /**
   * Confere a autenticidade de um certificado pelo código impresso nele.
   * Rota pública: quem confere (empregador, outra instituição) não tem conta
   * no Boost. Devolve `null` quando o código não existe — não é erro de
   * aplicação, é a resposta "esse certificado não confere".
   */
  async verificarCertificado(codigo: string): Promise<CertificadoVerificado | null> {
    try {
      return await request<CertificadoVerificado>(`/certificados-boost/verificar/${encodeURIComponent(codigo)}`);
    } catch (err) {
      if (err instanceof BoostApiError && err.status === 404) return null;
      throw err;
    }
  },

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
