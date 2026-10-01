// Painel administrativo das contas externas do portal público do Boost
// (BoostUsuario) — gestão entre cursos, por isso tela própria e só para
// admin (ver module-config.ts). O cadastro em si continua livre e público;
// esta tela só dá visibilidade e um jeito de desativar/redefinir senha.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Copy, KeyRound, Users } from "lucide-react";
import { PageHeader } from "@/components/rooster/page-header";
import { Btn, Chip, CrudToolbar, DataTable, EmptyState, LoadingCards, Modal, TONE, type Column } from "@/components/shared";
import { boostService, type ExternalStudent } from "@/services/mock-api/boost.service";
import { fmtData as fmtDataBr } from "@/lib/formatacao";

export const Route = createFileRoute("/boost/students")({
  head: () => ({ meta: [{ title: "Alunos externos — Rooster Boost" }] }),
  component: ExternalStudentsPage,
});

function fmtData(iso: string) {
  return fmtDataBr(iso);
}

function ExternalStudentsPage() {
  const [students, setStudents] = useState<ExternalStudent[] | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ email: string; senha: string } | null>(null);

  const carregar = () => boostService.listExternalStudents().then(setStudents);

  useEffect(() => {
    void carregar();
  }, []);

  async function toggleAtivo(s: ExternalStudent) {
    setBusyId(s.id);
    try {
      await boostService.toggleExternalStudent(s.id, !s.active);
      await carregar();
      toast.success(s.active ? "Conta desativada" : "Conta reativada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar a conta");
    } finally {
      setBusyId(null);
    }
  }

  async function redefinirSenha(s: ExternalStudent) {
    setBusyId(s.id);
    try {
      const { email, temporaryPassword } = await boostService.resetExternalStudentPassword(s.id);
      setSenhaGerada({ email, senha: temporaryPassword });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao redefinir a senha");
    } finally {
      setBusyId(null);
    }
  }

  const filtrados = (students ?? []).filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<ExternalStudent>[] = [
    {
      key: "name",
      header: "Aluno",
      sortValue: (s) => s.name,
      cell: (s) => (
        <div>
          <p className="font-medium">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.email}</p>
        </div>
      ),
    },
    { key: "enrollmentCount", header: "Matrículas", sortValue: (s) => s.enrollmentCount, cell: (s) => <span className="tabular-nums">{s.enrollmentCount}</span> },
    { key: "createdAt", header: "Cadastro", sortValue: (s) => s.createdAt, cell: (s) => <span className="text-xs text-muted-foreground">{fmtData(s.createdAt)}</span> },
    {
      key: "active",
      header: "Situação",
      sortValue: (s) => (s.active ? 1 : 0),
      cell: (s) => <Chip tone={s.active ? TONE.ok : TONE.muted}>{s.active ? "Ativa" : "Desativada"}</Chip>,
    },
    {
      key: "actions",
      header: "Ações",
      cell: (s) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Btn onClick={() => void redefinirSenha(s)} disabled={busyId === s.id}>
            <KeyRound className="h-3.5 w-3.5" /> Redefinir senha
          </Btn>
          <Btn onClick={() => void toggleAtivo(s)} disabled={busyId === s.id} className={s.active ? "text-destructive" : ""}>
            {s.active ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {s.active ? "Desativar" : "Reativar"}
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Rooster Boost"
        title="Alunos externos"
        description="Contas públicas do portal do Boost (cadastro livre, fora do Hub). Desative ou redefina a senha quando necessário — o cadastro em si continua aberto."
      />

      {students === null ? (
        <LoadingCards />
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="Nenhuma conta externa ainda" description="Contas aparecem aqui assim que alguém se cadastra no portal público do Boost." />
      ) : (
        <>
          <CrudToolbar search={search} onSearch={setSearch} placeholder="Buscar por nome ou e-mail..." />
          <DataTable rows={filtrados} columns={columns} emptyMessage="Nenhuma conta encontrada." />
        </>
      )}

      <Modal
        open={!!senhaGerada}
        onClose={() => setSenhaGerada(null)}
        title="Senha temporária gerada"
        description="Copie agora — esta senha não fica salva em lugar nenhum e não será mostrada de novo. Repasse ao aluno por um canal seguro."
        footer={<Btn variant="solid" onClick={() => setSenhaGerada(null)}>Fechar</Btn>}
      >
        {senhaGerada && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{senhaGerada.email}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border bg-muted/40 px-3 py-2 font-mono text-sm">{senhaGerada.senha}</code>
              <Btn
                onClick={() => {
                  void navigator.clipboard.writeText(senhaGerada.senha);
                  toast.success("Senha copiada");
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copiar
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
