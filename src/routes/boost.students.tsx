// Cadastro das contas do portal do Rooster Boost (BoostUsuario): criação, edição, ativação e
// desativação, exclusão de conta sem matrícula e redefinição de senha. Gestão entre cursos, por isso
// tela própria, restrita ao administrador (ver module-config.ts). As contas vinculadas à conta
// institucional (alunos internos) são exibidas para consulta e desativação, mas nome, e-mail e senha
// são mantidos no Rooster Hub.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, Building2, CheckCircle2, Copy, KeyRound, Pencil, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/rooster/page-header";
import {
  Btn, Chip, ConfirmDialog, CrudToolbar, DataTable, EmptyState, Field, LoadingCards, Modal, TextInput, TONE, type Column,
} from "@/components/shared";
import { boostService, type ExternalStudent } from "@/services/mock-api/boost.service";
import { fmtData } from "@/lib/formatacao";

export const Route = createFileRoute("/boost/students")({
  head: () => ({ meta: [{ title: "Alunos do portal — Rooster Boost" }] }),
  component: ExternalStudentsPage,
});

type Formulario = { id?: string; nome: string; email: string; senha: string };
const FORM_VAZIO: Formulario = { nome: "", email: "", senha: "" };

function mensagemDeErro(err: unknown, padrao: string) {
  return err instanceof Error && err.message ? err.message : padrao;
}

function ExternalStudentsPage() {
  const [students, setStudents] = useState<ExternalStudent[] | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ email: string; senha: string; titulo: string } | null>(null);
  const [form, setForm] = useState<Formulario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState<ExternalStudent | null>(null);

  const carregar = () =>
    boostService
      .listExternalStudents()
      .then(setStudents)
      .catch((err) => {
        setStudents([]);
        toast.error(mensagemDeErro(err, "Falha ao carregar as contas"));
      });

  useEffect(() => {
    void carregar();
  }, []);

  async function toggleAtivo(s: ExternalStudent) {
    setBusyId(s.id);
    try {
      await boostService.updateExternalStudent(s.id, { active: !s.active });
      await carregar();
      toast.success(s.active ? "Conta desativada" : "Conta reativada");
    } catch (err) {
      toast.error(mensagemDeErro(err, "Falha ao atualizar a conta"));
    } finally {
      setBusyId(null);
    }
  }

  async function redefinirSenha(s: ExternalStudent) {
    setBusyId(s.id);
    try {
      const { email, temporaryPassword } = await boostService.resetExternalStudentPassword(s.id);
      setSenhaGerada({ email, senha: temporaryPassword, titulo: "Senha temporária gerada" });
    } catch (err) {
      toast.error(mensagemDeErro(err, "Falha ao redefinir a senha"));
    } finally {
      setBusyId(null);
    }
  }

  async function salvar() {
    if (!form) return;
    const nome = form.nome.trim();
    const email = form.email.trim();
    if (nome.length < 2) return toast.error("Informe o nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Informe um e-mail válido.");
    if (!form.id && form.senha && form.senha.length < 8) return toast.error("A senha deve ter no mínimo 8 caracteres.");
    setSalvando(true);
    try {
      if (form.id) {
        await boostService.updateExternalStudent(form.id, { name: nome, email });
        toast.success("Conta atualizada");
      } else {
        const { temporaryPassword } = await boostService.createExternalStudent({ name: nome, email, password: form.senha || undefined });
        toast.success("Aluno cadastrado");
        if (temporaryPassword) setSenhaGerada({ email: email.toLowerCase(), senha: temporaryPassword, titulo: "Conta criada — senha temporária" });
      }
      setForm(null);
      await carregar();
    } catch (err) {
      toast.error(mensagemDeErro(err, "Falha ao salvar a conta"));
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao(s: ExternalStudent) {
    setBusyId(s.id);
    try {
      await boostService.removeExternalStudent(s.id);
      toast.success("Conta excluída");
      await carregar();
    } catch (err) {
      toast.error(mensagemDeErro(err, "Falha ao excluir a conta"));
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
    {
      key: "institutional",
      header: "Tipo de conta",
      sortValue: (s) => (s.institutional ? 1 : 0),
      cell: (s) =>
        s.institutional ? (
          <Chip tone={TONE.info}><Building2 className="mr-1 inline h-3 w-3" />Institucional</Chip>
        ) : (
          <Chip tone={TONE.muted}>Externa</Chip>
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
        <div className="flex flex-wrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!s.institutional && (
            <>
              <Btn onClick={() => setForm({ id: s.id, nome: s.name, email: s.email, senha: "" })} disabled={busyId === s.id} aria-label={`Editar ${s.name}`}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Btn>
              <Btn onClick={() => void redefinirSenha(s)} disabled={busyId === s.id}>
                <KeyRound className="h-3.5 w-3.5" /> Redefinir senha
              </Btn>
            </>
          )}
          <Btn onClick={() => void toggleAtivo(s)} disabled={busyId === s.id} className={s.active ? "text-destructive" : ""}>
            {s.active ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {s.active ? "Desativar" : "Reativar"}
          </Btn>
          {s.enrollmentCount === 0 && (
            <Btn onClick={() => setExcluir(s)} disabled={busyId === s.id} className="text-destructive" aria-label={`Excluir ${s.name}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Rooster Boost"
        title="Alunos do portal"
        description="Contas de acesso ao portal do Boost. Alunos externos podem ser cadastrados aqui ou pelo cadastro público; alunos da instituição entram com a conta institucional, e sua conta do portal é criada automaticamente."
        actions={
          <Btn variant="solid" onClick={() => setForm({ ...FORM_VAZIO })}>
            <Plus className="h-4 w-4" /> Novo aluno externo
          </Btn>
        }
      />

      {students === null ? (
        <LoadingCards />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhuma conta cadastrada"
          description="Cadastre um aluno externo ou aguarde o primeiro cadastro no portal público do Boost."
        />
      ) : (
        <>
          <CrudToolbar search={search} onSearch={setSearch} placeholder="Buscar por nome ou e-mail..." />
          <DataTable rows={filtrados} columns={columns} emptyMessage="Nenhuma conta encontrada." />
        </>
      )}

      <Modal
        open={!!form}
        onClose={() => (salvando ? undefined : setForm(null))}
        title={form?.id ? "Editar aluno externo" : "Novo aluno externo"}
        description={
          form?.id
            ? "Altere o nome ou o e-mail de login. A senha é alterada pela opção \"Redefinir senha\"."
            : "O e-mail é utilizado como login no portal. Sem senha informada, o sistema gera uma senha temporária, exibida uma única vez."
        }
        footer={
          <>
            <Btn onClick={() => setForm(null)} disabled={salvando}>Cancelar</Btn>
            <Btn variant="solid" onClick={() => void salvar()} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Btn>
          </>
        }
      >
        {form && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void salvar();
            }}
          >
            <Field label="Nome completo" required>
              <TextInput value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={150} autoFocus />
            </Field>
            <Field label="E-mail (login)" required>
              <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={180} />
            </Field>
            {!form.id && (
              <Field label="Senha inicial" hint="Opcional. Mínimo de 8 caracteres. Em branco, o sistema gera uma senha temporária.">
                <TextInput type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} autoComplete="new-password" />
              </Field>
            )}
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={() => excluir && void confirmarExclusao(excluir)}
        title="Excluir conta"
        description={excluir ? `A conta de ${excluir.name} (${excluir.email}) será excluída. Esta ação não poderá ser desfeita.` : undefined}
      />

      <Modal
        open={!!senhaGerada}
        onClose={() => setSenhaGerada(null)}
        title={senhaGerada?.titulo ?? "Senha temporária"}
        description="Copie a senha agora: ela não é armazenada e não será exibida novamente. Repasse-a ao aluno por canal seguro."
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
