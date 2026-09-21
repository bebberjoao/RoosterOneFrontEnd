import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/rooster/page-header";
import { Avatar, Btn, Chip, TONE } from "@/components/shared/primitives";
import { HubCrud, type HubField, OfflineBanner } from "@/components/rooster/hub/crud-panel";
import { fmtCpf, fmtDateTime, initials } from "@/components/rooster/hub/format";
import { Field, TextInput } from "@/components/shared/form";
import { Modal } from "@/components/shared/overlays";
import { usuariosService, type Usuario } from "@/services/hub";
import { isCpf, isEmail, len } from "@/services/hub/validation";

export const Route = createFileRoute("/hub/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Rooster Hub" },
      { name: "description", content: "Cadastro de usuários da instituição: dados pessoais, contato e situação da conta." },
      { property: "og:title", content: "Usuários — Rooster Hub" },
      { property: "og:description", content: "Cadastro e manutenção das contas de usuário no Rooster One." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsuariosPage,
});

// Somente dados próprios do usuário. Vínculos de setor são geridos em /hub/setores
// e as permissões em /hub/acessos.
const usuarioFields: HubField<Usuario>[] = [
  { name: "nome", label: "Nome", required: true, validate: (v) => len(v, 3, 120, "Nome") },
  { name: "email", label: "E-mail", type: "email", required: true, validate: isEmail },
  { name: "senhaHash", label: "Senha", type: "password", required: true, createOnly: true, hint: "Enviada como senhaHash na criação (mín. 6 caracteres).", validate: (v) => len(v, 6, 200, "Senha") },
  { name: "cpf", label: "CPF", hint: "Somente números (11 dígitos).", validate: isCpf },
  { name: "telefone", label: "Telefone" },
  { name: "ativo", label: "Ativo", type: "boolean" },
];

function ResetPasswordAction({ user }: { user: Usuario }) {
  const [open, setOpen] = useState(false);
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function close() {
    setOpen(false);
    setSenha("");
    setError(undefined);
    setSaving(false);
  }

  async function submit() {
    const msg = len(senha, 6, 200, "Senha");
    if (msg) {
      setError(msg);
      return;
    }
    setSaving(true);
    try {
      await usuariosService.update(user.id, { senhaHash: senha });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao redefinir a senha");
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Redefinir senha de ${user.nome}`}
        title="Redefinir senha"
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <KeyRound className="h-3.5 w-3.5" />
      </button>
      <Modal
        open={open}
        onClose={close}
        title={`Redefinir senha — ${user.nome}`}
        description="Define uma nova senha para o usuário. Ele não é notificado automaticamente; informe a nova senha por um canal seguro."
        footer={
          <>
            <Btn onClick={close}>Cancelar</Btn>
            <Btn variant="solid" onClick={() => void submit()}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Redefinir
            </Btn>
          </>
        }
      >
        <Field label="Nova senha" required hint={error ?? "Mínimo de 6 caracteres."}>
          <TextInput type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}

function UsuariosPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Rooster Hub"
        title="Usuários"
        description="Contas da instituição. Os setores são definidos na tela de Setores e as permissões em Acessos e permissões."
      />
      <OfflineBanner />
      <HubCrud<Usuario>
        service={usuariosService}
        entityLabel="usuário"
        fields={usuarioFields}
        searchPlaceholder="Buscar por nome, e-mail ou CPF..."
        searchText={(u) => `${u.nome} ${u.email} ${u.cpf ?? ""}`}
        rowExtra={(u) => <ResetPasswordAction user={u} />}
        columns={[
          {
            key: "nome",
            header: "Usuário",
            sortValue: (u) => u.nome,
            cell: (u) => (
              <div className="flex items-center gap-3">
                <Avatar initials={initials(u.nome)} size={32} />
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.nome}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                </div>
              </div>
            ),
          },
          { key: "cpf", header: "CPF", cell: (u) => <span className="text-muted-foreground">{fmtCpf(u.cpf)}</span> },
          { key: "telefone", header: "Telefone", cell: (u) => <span className="text-muted-foreground">{u.telefone ?? "—"}</span> },
          {
            key: "ativo",
            header: "Situação",
            sortValue: (u) => (u.ativo === false ? 0 : 1),
            cell: (u) => <Chip tone={u.ativo === false ? TONE.muted : TONE.ok}>{u.ativo === false ? "Inativo" : "Ativo"}</Chip>,
          },
          { key: "ultimoLogin", header: "Último login", sortValue: (u) => u.ultimoLogin ?? "", cell: (u) => <span className="text-xs text-muted-foreground">{fmtDateTime(u.ultimoLogin)}</span> },
        ]}
      />
    </div>
  );
}
