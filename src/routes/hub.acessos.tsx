import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar } from "@/components/shared/tabs";
import { Chip, TONE } from "@/components/shared/primitives";
import { HubCrud, type HubField } from "@/components/rooster/hub/crud-panel";
import { useResource } from "@/components/rooster/hub/use-hub";
import { fmtDateTime } from "@/components/rooster/hub/format";
import {
  perfisPermissoesService, perfisService, permissoesService,
  usuariosPerfisService, usuariosService,
  type Perfil, type PerfilPermissao, type Permissao, type UsuarioPerfil,
} from "@/services/hub";
import { len } from "@/services/hub/validation";

export const Route = createFileRoute("/hub/acessos")({
  head: () => ({
    meta: [
      { title: "Acessos e RBAC — Rooster Hub" },
      { name: "description", content: "Perfis, permissões e vínculos de usuários que definem o controle de acesso do Rooster One." },
      { property: "og:title", content: "Acessos e RBAC — Rooster Hub" },
      { property: "og:description", content: "Configuração de perfis, permissões e atribuições de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcessosPage,
});

const perfilFields: HubField<Perfil>[] = [
  { name: "nome", label: "Nome", required: true, validate: (v) => len(v, 3, 80, "Nome") },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "ativo", label: "Ativo", type: "boolean" },
];

function AcessosPage() {
  const [tab, setTab] = useState("perfis");
  const perfis = useResource(perfisService);
  const permissoes = useResource(permissoesService);
  const vinculos = useResource(perfisPermissoesService);
  const usuarios = useResource(usuariosService);
  const usuariosPerfis = useResource(usuariosPerfisService);

  const perfilOptions = useMemo(() => perfis.rows.map((p) => ({ value: p.id, label: p.nome })), [perfis.rows]);
  const permissaoOptions = useMemo(() => permissoes.rows.map((p) => ({ value: p.id, label: p.nome })), [permissoes.rows]);
  const usuarioOptions = useMemo(() => usuarios.rows.map((u) => ({ value: u.id, label: u.nome })), [usuarios.rows]);

  const nomePerfil = (id: string) => perfis.rows.find((p) => p.id === id)?.nome ?? id;
  const nomePermissao = (id: string) => permissoes.rows.find((p) => p.id === id)?.nome ?? id;
  const nomeUsuario = (id: string) => usuarios.rows.find((u) => u.id === id)?.nome ?? id;
  const countPerms = (perfilId: string) => vinculos.rows.filter((v) => v.perfilId === perfilId).length;

  return (
    <div>
      <PageHeader
        eyebrow="Rooster Hub"
        title="Acessos e permissões"
        description="Controle de acesso baseado em papéis: perfis agrupam permissões, e cada usuário recebe um ou mais perfis."
      />
      <TabBar
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "perfis", label: "Perfis", badge: perfis.rows.length },
          { value: "permissoes", label: "Permissões", badge: permissoes.rows.length },
          { value: "matriz", label: "Permissões por perfil", badge: vinculos.rows.length },
          { value: "usuarios", label: "Perfis por usuário", badge: usuariosPerfis.rows.length },
        ]}
      />

      {tab === "perfis" ? (
        <HubCrud<Perfil>
          service={perfisService}
          entityLabel="perfil"
          fields={perfilFields}
          searchPlaceholder="Buscar perfil..."
          searchText={(p) => `${p.nome} ${p.descricao ?? ""}`}
          columns={[
            { key: "nome", header: "Perfil", sortValue: (p) => p.nome, cell: (p) => <span className="font-medium">{p.nome}</span> },
            { key: "descricao", header: "Descrição", cell: (p) => <span className="text-muted-foreground">{p.descricao ?? "—"}</span> },
            { key: "perms", header: "Permissões", cell: (p) => <Chip tone={TONE.purple}>{countPerms(p.id)}</Chip> },
            { key: "ativo", header: "Situação", cell: (p) => <Chip tone={p.ativo === false ? TONE.muted : TONE.ok}>{p.ativo === false ? "Inativo" : "Ativo"}</Chip> },
          ]}
        />
      ) : tab === "permissoes" ? (
        <HubCrud<Permissao>
          service={permissoesService}
          entityLabel="permissão"
          searchPlaceholder="Buscar permissão..."
          searchText={(p) => `${p.nome} ${p.recurso ?? ""} ${p.acao ?? ""}`}
          fields={[
            { name: "nome", label: "Nome", required: true, validate: (v) => len(v, 3, 80, "Nome") },
            { name: "recurso", label: "Recurso" },
            { name: "acao", label: "Ação" },
            { name: "descricao", label: "Descrição", type: "textarea" },
          ]}
          columns={[
            { key: "nome", header: "Permissão", sortValue: (p) => p.nome, cell: (p) => <span className="font-medium">{p.nome}</span> },
            { key: "recurso", header: "Recurso", cell: (p) => <span className="text-muted-foreground">{p.recurso ?? "—"}</span> },
            { key: "acao", header: "Ação", cell: (p) => <Chip tone={TONE.info}>{p.acao ?? "—"}</Chip> },
            { key: "descricao", header: "Descrição", cell: (p) => <span className="text-muted-foreground">{p.descricao ?? "—"}</span> },
          ]}
        />
      ) : tab === "matriz" ? (
        <HubCrud<PerfilPermissao>
          service={perfisPermissoesService}
          entityLabel="permissão do perfil"
          canEdit={false}
          searchPlaceholder="Buscar por perfil ou permissão..."
          searchText={(v) => `${nomePerfil(v.perfilId)} ${nomePermissao(v.permissaoId)}`}
          fields={[
            { name: "perfilId", label: "Perfil", type: "select", required: true, options: perfilOptions },
            { name: "permissaoId", label: "Permissão", type: "select", required: true, options: permissaoOptions },
          ]}
          columns={[
            { key: "perfil", header: "Perfil", sortValue: (v) => nomePerfil(v.perfilId), cell: (v) => <span className="font-medium">{nomePerfil(v.perfilId)}</span> },
            { key: "permissao", header: "Permissão", cell: (v) => <Chip tone={TONE.info}>{nomePermissao(v.permissaoId)}</Chip> },
            { key: "criadoEm", header: "Concedida em", cell: (v) => <span className="text-xs text-muted-foreground">{fmtDateTime(v.criadoEm)}</span> },
          ]}
        />
      ) : (
        <HubCrud<UsuarioPerfil>
          service={usuariosPerfisService}
          entityLabel="perfil do usuário"
          canEdit={false}
          searchPlaceholder="Buscar por usuário ou perfil..."
          searchText={(v) => `${nomeUsuario(v.usuarioId)} ${nomePerfil(v.perfilId)}`}
          fields={[
            { name: "usuarioId", label: "Usuário", type: "select", required: true, options: usuarioOptions },
            { name: "perfilId", label: "Perfil", type: "select", required: true, options: perfilOptions },
          ]}
          columns={[
            { key: "usuario", header: "Usuário", sortValue: (v) => nomeUsuario(v.usuarioId), cell: (v) => <span className="font-medium">{nomeUsuario(v.usuarioId)}</span> },
            { key: "perfil", header: "Perfil", cell: (v) => <Chip tone={TONE.purple}>{nomePerfil(v.perfilId)}</Chip> },
            { key: "criadoEm", header: "Atribuído em", cell: (v) => <span className="text-xs text-muted-foreground">{fmtDateTime(v.criadoEm)}</span> },
          ]}
        />
      )}
    </div>
  );
}
