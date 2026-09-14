import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar } from "@/components/shared/tabs";
import { Avatar, Chip, TONE } from "@/components/shared/primitives";
import { HubCrud, type HubField } from "@/components/rooster/hub/crud-panel";
import { useResource } from "@/components/rooster/hub/use-hub";
import { fmtCpf, fmtDateTime, initials } from "@/components/rooster/hub/format";
import {
  perfisService, setoresService, usuariosPerfisService, usuariosService, usuariosSetoresService,
  type Usuario, type UsuarioPerfil, type UsuarioSetor,
} from "@/services/hub";
import { isCpf, isEmail, len } from "@/services/hub/validation";

export const Route = createFileRoute("/hub/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Rooster Hub" },
      { name: "description", content: "Cadastro de usuários, vínculos com perfis de acesso e setores da instituição." },
      { property: "og:title", content: "Usuários — Rooster Hub" },
      { property: "og:description", content: "Gestão de contas, perfis e setores no Rooster One." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const [tab, setTab] = useState("usuarios");
  const perfis = useResource(perfisService);
  const setores = useResource(setoresService);
  const usuarios = useResource(usuariosService);

  const usuarioOptions = useMemo(() => usuarios.rows.map((u) => ({ value: u.id, label: `${u.nome} (${u.email})` })), [usuarios.rows]);
  const perfilOptions = useMemo(() => perfis.rows.map((p) => ({ value: p.id, label: p.nome })), [perfis.rows]);
  const setorOptions = useMemo(() => setores.rows.map((s) => ({ value: s.id, label: s.nome })), [setores.rows]);
  const nomeUsuario = (id: string) => usuarios.rows.find((u) => u.id === id)?.nome ?? id;

  const usuarioFields: HubField<Usuario>[] = [
    { name: "nome", label: "Nome", required: true, validate: (v) => len(v, 3, 120, "Nome") },
    { name: "email", label: "E-mail", type: "email", required: true, validate: isEmail },
    { name: "senhaHash", label: "Senha", type: "password", required: true, createOnly: true, hint: "Enviada como senhaHash na criação (mín. 6 caracteres).", validate: (v) => len(v, 6, 200, "Senha") },
    { name: "cpf", label: "CPF", hint: "Somente números (11 dígitos).", validate: isCpf },
    { name: "telefone", label: "Telefone" },
    { name: "ativo", label: "Ativo", type: "boolean" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Rooster Hub"
        title="Usuários"
        description="Contas da instituição e seus vínculos com perfis de acesso e setores."
      />
      <TabBar
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "usuarios", label: "Usuários", badge: usuarios.rows.length },
          { value: "perfis", label: "Perfis por usuário" },
          { value: "setores", label: "Setores por usuário" },
        ]}
      />

      {tab === "usuarios" ? (
        <HubCrud<Usuario>
          service={usuariosService}
          entityLabel="usuário"
          fields={usuarioFields}
          searchPlaceholder="Buscar por nome, e-mail ou CPF..."
          searchText={(u) => `${u.nome} ${u.email} ${u.cpf ?? ""}`}
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
      ) : null}

      {tab === "perfis" ? (
        <HubCrud<UsuarioPerfil>
          service={usuariosPerfisService}
          entityLabel="vínculo de perfil"
          searchPlaceholder="Buscar vínculo..."
          searchText={(v) => `${nomeUsuario(v.usuarioId)} ${perfis.rows.find((p) => p.id === v.perfilId)?.nome ?? ""}`}
          fields={[
            { name: "usuarioId", label: "Usuário", type: "select", required: true, options: usuarioOptions },
            { name: "perfilId", label: "Perfil", type: "select", required: true, options: perfilOptions },
          ]}
          canEdit={false}
          columns={[
            { key: "usuario", header: "Usuário", sortValue: (v) => nomeUsuario(v.usuarioId), cell: (v) => <span className="font-medium">{nomeUsuario(v.usuarioId)}</span> },
            { key: "perfil", header: "Perfil", cell: (v) => <Chip tone={TONE.purple}>{perfis.rows.find((p) => p.id === v.perfilId)?.nome ?? v.perfilId}</Chip> },
            { key: "criadoEm", header: "Vinculado em", cell: (v) => <span className="text-xs text-muted-foreground">{fmtDateTime(v.criadoEm)}</span> },
          ]}
        />
      ) : null}

      {tab === "setores" ? (
        <HubCrud<UsuarioSetor>
          service={usuariosSetoresService}
          entityLabel="vínculo de setor"
          searchPlaceholder="Buscar vínculo..."
          searchText={(v) => `${nomeUsuario(v.usuarioId)} ${setores.rows.find((s) => s.id === v.setorId)?.nome ?? ""}`}
          fields={[
            { name: "usuarioId", label: "Usuário", type: "select", required: true, options: usuarioOptions },
            { name: "setorId", label: "Setor", type: "select", required: true, options: setorOptions },
          ]}
          canEdit={false}
          columns={[
            { key: "usuario", header: "Usuário", sortValue: (v) => nomeUsuario(v.usuarioId), cell: (v) => <span className="font-medium">{nomeUsuario(v.usuarioId)}</span> },
            { key: "setor", header: "Setor", cell: (v) => <Chip tone={TONE.cyan}>{setores.rows.find((s) => s.id === v.setorId)?.nome ?? v.setorId}</Chip> },
            { key: "criadoEm", header: "Vinculado em", cell: (v) => <span className="text-xs text-muted-foreground">{fmtDateTime(v.criadoEm)}</span> },
          ]}
        />
      ) : null}
    </div>
  );
}