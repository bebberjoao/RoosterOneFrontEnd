import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Award, Building2, Search, UserPlus, Users, XCircle } from "lucide-react";
import { Avatar, Btn, Chip, ConfirmDialog, DataTable, EmptyState, Modal, ProgressBar, TONE, type Column } from "@/components/shared";
import { useCan } from "@/components/rooster/hub/permission-context";
import { boostService, type BoostEnrollment, type EnrollmentCandidates } from "@/services/mock-api/boost.service";
import { toneFor, initialsOf } from "@/services/mock-api/academy.service";
import { fmtData } from "@/lib/formatacao";

const STATUS_LABEL: Record<string, string> = {
  ativa: "Ativa", concluida: "Concluída", cancelada: "Cancelada",
  ativo: "Ativo", concluido: "Concluído", cancelado: "Cancelado", trancado: "Trancado",
};

function mensagemDeErro(err: unknown, padrao: string) {
  return err instanceof Error && err.message ? err.message : padrao;
}

/**
 * Alunos matriculados no curso, com progresso. Com a permissão `matricular`, a gestão matricula alunos
 * da instituição (a conta do portal é criada e vinculada automaticamente) ou contas externas, e cancela
 * matrículas não concluídas. A conversa com os alunos é do orientador (tela "Conversas").
 */
export function CourseStudentsTab({ courseId }: { courseId: string }) {
  const canEnroll = useCan("/boost/manage", "matricular");
  const [students, setStudents] = useState<BoostEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [cancelar, setCancelar] = useState<BoostEnrollment | null>(null);

  const carregar = () =>
    boostService
      .getStudents(courseId)
      .then((rows) => {
        setStudents(rows);
        setError(null);
      })
      .catch((err) => setError(mensagemDeErro(err, "Falha ao carregar alunos")))
      .finally(() => setLoading(false));

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function confirmarCancelamento(e: BoostEnrollment) {
    try {
      await boostService.cancelEnrollment(e.id);
      toast.success("Matrícula cancelada");
      await carregar();
    } catch (err) {
      toast.error(mensagemDeErro(err, "Falha ao cancelar a matrícula"));
    }
  }

  const columns: Column<BoostEnrollment>[] = [
    {
      key: "student", header: "Aluno", sortValue: (s) => s.studentName,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar initials={initialsOf(s.studentName)} tone={toneFor(s.id)} size={32} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{s.studentName}</div>
            <div className="truncate text-[11px] text-muted-foreground">{s.studentEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type", header: "Tipo", sortValue: (s) => (s.institutional ? 1 : 0),
      cell: (s) => (s.institutional ? <Chip tone={TONE.info}>Instituição</Chip> : <Chip tone={TONE.muted}>Externo</Chip>),
    },
    {
      key: "progress", header: "Progresso", sortValue: (s) => s.progressPct,
      cell: (s) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={s.progressPct} className="w-24" tone="oklch(0.68 0.18 40)" />
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{s.progressPct}%</span>
        </div>
      ),
    },
    { key: "enrolledAt", header: "Matrícula", sortValue: (s) => s.enrolledAt, cell: (s) => <span className="text-xs text-muted-foreground">{fmtData(s.enrolledAt)}</span> },
    { key: "status", header: "Status", cell: (s) => <span className="text-xs">{STATUS_LABEL[s.status] ?? s.status}</span> },
    {
      key: "certificate", header: "Certificado",
      cell: (s) =>
        s.certificateIssued ? (
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "oklch(0.62 0.18 155)" }}>
            <Award className="h-3.5 w-3.5" /> Emitido
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    ...(canEnroll
      ? [{
          key: "actions", header: "Ações",
          cell: (s: BoostEnrollment) =>
            s.status === "ativa" ? (
              <div className="flex justify-end" onClick={(ev) => ev.stopPropagation()}>
                <Btn onClick={() => setCancelar(s)} className="text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> Cancelar matrícula
                </Btn>
              </div>
            ) : null,
        } satisfies Column<BoostEnrollment>]
      : []),
  ];

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Alunos matriculados</h2>
        <span className="text-xs text-muted-foreground">({students.length})</span>
        {canEnroll && (
          <Btn variant="solid" className="ml-auto" onClick={() => setModalAberto(true)}>
            <UserPlus className="h-4 w-4" /> Matricular aluno
          </Btn>
        )}
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {!loading && students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno matriculado"
          description={canEnroll
            ? "Matricule alunos da instituição ou contas externas pelo botão \"Matricular aluno\", ou aguarde as matrículas feitas pelo portal."
            : "As matrículas feitas pelo portal do aluno aparecem aqui, com o progresso de cada um."}
        />
      ) : (
        <DataTable rows={students} columns={columns} emptyMessage={loading ? "Carregando…" : "Nenhum aluno encontrado"} />
      )}

      {modalAberto && (
        <MatricularModal
          courseId={courseId}
          onClose={() => setModalAberto(false)}
          onEnrolled={() => void carregar()}
        />
      )}

      <ConfirmDialog
        open={!!cancelar}
        onClose={() => setCancelar(null)}
        onConfirm={() => cancelar && void confirmarCancelamento(cancelar)}
        title="Cancelar matrícula"
        description={cancelar ? `A matrícula de ${cancelar.studentName} será cancelada, e o aluno perderá o acesso ao curso. A matrícula pode ser refeita posteriormente.` : undefined}
        confirmLabel="Cancelar matrícula"
      />
    </section>
  );
}

function MatricularModal({ courseId, onClose, onEnrolled }: { courseId: string; onClose: () => void; onEnrolled: () => void }) {
  const [busca, setBusca] = useState("");
  const [candidatos, setCandidatos] = useState<EnrollmentCandidates | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const t = setTimeout(() => {
      boostService
        .getEnrollmentCandidates(courseId, busca)
        .then((c) => vivo && setCandidatos(c))
        .catch((err) => {
          if (!vivo) return;
          setCandidatos({ external: [], internal: [] });
          toast.error(mensagemDeErro(err, "Falha ao carregar os candidatos"));
        });
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [courseId, busca]);

  async function matricular(chave: string, alvo: { boostUserId: string } | { userId: string }, nome: string) {
    setEnviando(chave);
    try {
      await boostService.enrollStudent(courseId, alvo);
      toast.success(`${nome} matriculado(a)`);
      setCandidatos((c) =>
        c && {
          external: c.external.filter((e) => !("boostUserId" in alvo) || e.boostUserId !== alvo.boostUserId),
          internal: c.internal.filter((i) => !("userId" in alvo) || i.userId !== alvo.userId),
        },
      );
      onEnrolled();
    } catch (err) {
      toast.error(mensagemDeErro(err, "Falha ao matricular"));
    } finally {
      setEnviando(null);
    }
  }

  const vazio = candidatos && candidatos.internal.length === 0 && candidatos.external.length === 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Matricular aluno"
      description={"Alunos da instituição acessam o portal com a conta institucional; a conta do portal é criada automaticamente. Contas externas são cadastradas em “Alunos do portal”."}
      footer={<Btn onClick={onClose}>Fechar</Btn>}
    >
      <div className="space-y-4">
        <label className="relative block">
          <span className="sr-only">Buscar aluno</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            autoFocus
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>

        {candidatos === null ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : vazio ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhum aluno disponível{busca ? " para a busca informada" : ""}. Alunos já matriculados não são listados.
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            {candidatos.internal.length > 0 && (
              <Grupo titulo="Alunos da instituição" icone={<Building2 className="h-3.5 w-3.5" />}>
                {candidatos.internal.map((i) => (
                  <Linha
                    key={i.userId}
                    nome={i.name}
                    detalhe={`${i.email}${i.ra ? ` · RA ${i.ra}` : ""}`}
                    carregando={enviando === i.userId}
                    desabilitado={enviando !== null}
                    onClick={() => void matricular(i.userId, { userId: i.userId }, i.name)}
                  />
                ))}
              </Grupo>
            )}
            {candidatos.external.length > 0 && (
              <Grupo titulo="Alunos externos" icone={<Users className="h-3.5 w-3.5" />}>
                {candidatos.external.map((e) => (
                  <Linha
                    key={e.boostUserId}
                    nome={e.name}
                    detalhe={e.email}
                    carregando={enviando === e.boostUserId}
                    desabilitado={enviando !== null}
                    onClick={() => void matricular(e.boostUserId, { boostUserId: e.boostUserId }, e.name)}
                  />
                ))}
              </Grupo>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Grupo({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icone} {titulo}
      </p>
      <ul className="divide-y rounded-xl border">{children}</ul>
    </div>
  );
}

function Linha({ nome, detalhe, carregando, desabilitado, onClick }: {
  nome: string; detalhe: string; carregando: boolean; desabilitado: boolean; onClick: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{nome}</p>
        <p className="truncate text-xs text-muted-foreground">{detalhe}</p>
      </div>
      <Btn onClick={onClick} disabled={desabilitado}>
        <UserPlus className="h-3.5 w-3.5" /> {carregando ? "Matriculando…" : "Matricular"}
      </Btn>
    </li>
  );
}
