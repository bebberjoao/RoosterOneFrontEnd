import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import { Chip, TONE } from "@/components/shared/primitives";
import { HubCrud, type HubField } from "@/components/rooster/hub/crud-panel";
import { useResource } from "@/components/rooster/hub/use-hub";
import { fmtDate } from "@/components/rooster/hub/format";
import { setoresService, usuariosSetoresService, type Setor } from "@/services/hub";
import { len } from "@/services/hub/validation";

export const Route = createFileRoute("/hub/setores")({
  head: () => ({
    meta: [
      { title: "Setores — Rooster Hub" },
      { name: "description", content: "Setores institucionais e quantidade de usuários vinculados a cada um." },
      { property: "og:title", content: "Setores — Rooster Hub" },
      { property: "og:description", content: "Cadastro de setores da instituição no Rooster One." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetoresPage,
});

const fields: HubField<Setor>[] = [
  { name: "nome", label: "Nome", required: true, validate: (v) => len(v, 3, 80, "Nome") },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "ativo", label: "Ativo", type: "boolean" },
];

function SetoresPage() {
  const vinculos = useResource(usuariosSetoresService);
  const membros = (setorId: string) => vinculos.rows.filter((v) => v.setorId === setorId).length;

  return (
    <div>
      <PageHeader
        eyebrow="Rooster Hub"
        title="Setores"
        description="Estrutura organizacional usada para roteamento de chamados, permissões e relatórios."
      />
      <HubCrud<Setor>
        service={setoresService}
        entityLabel="setor"
        fields={fields}
        searchPlaceholder="Buscar setor..."
        searchText={(s) => `${s.nome} ${s.descricao ?? ""}`}
        columns={[
          { key: "nome", header: "Setor", sortValue: (s) => s.nome, cell: (s) => <span className="font-medium">{s.nome}</span> },
          { key: "descricao", header: "Descrição", cell: (s) => <span className="text-muted-foreground">{s.descricao ?? "—"}</span> },
          { key: "membros", header: "Usuários", cell: (s) => <Chip tone={TONE.cyan}>{membros(s.id)}</Chip> },
          { key: "ativo", header: "Situação", cell: (s) => <Chip tone={s.ativo === false ? TONE.muted : TONE.ok}>{s.ativo === false ? "Inativo" : "Ativo"}</Chip> },
          { key: "criadoEm", header: "Criado em", cell: (s) => <span className="text-xs text-muted-foreground">{fmtDate(s.criadoEm)}</span> },
        ]}
      />
    </div>
  );
}