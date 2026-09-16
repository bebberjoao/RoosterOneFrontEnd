import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Shield, Users as UsersIcon, Building, Bell, Monitor } from "lucide-react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatCard, TONE, Chip, Avatar } from "@/components/shared/primitives";
import { OfflineBanner } from "@/components/rooster/hub/crud-panel";
import { useResource } from "@/components/rooster/hub/use-hub";
import { fmtDateTime, initials } from "@/components/rooster/hub/format";
import {
  logsAuditoriaService, modulosService, notificacoesService,
  permissoesService, sessoesService, setoresService, usuariosService,
  usuariosPermissoesService,
} from "@/services/hub";

export const Route = createFileRoute("/hub/")({
  head: () => ({
    meta: [
      { title: "Painel do Rooster Hub" },
      { name: "description", content: "Visão geral de identidade, acessos e auditoria da plataforma Rooster One." },
      { property: "og:title", content: "Painel do Rooster Hub" },
      { property: "og:description", content: "Indicadores de usuários, setores, permissões, sessões e auditoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HubDashboard,
});

const LINKS = [
  { to: "/hub/usuarios", label: "Usuários", icon: UsersIcon, tone: TONE.info },
  { to: "/hub/setores", label: "Setores", icon: Building, tone: TONE.cyan },
  { to: "/hub/acessos", label: "Acessos e permissões", icon: Shield, tone: TONE.purple },
] as const;

function HubDashboard() {
  const usuarios = useResource(usuariosService);
  const setores = useResource(setoresService);
  const modulos = useResource(modulosService);
  const permissoes = useResource(permissoesService);
  const concedidas = useResource(usuariosPermissoesService);
  const sessoes = useResource(sessoesService);
  const logs = useResource(logsAuditoriaService);
  const notificacoes = useResource(notificacoesService);

  const ativos = usuarios.rows.filter((u) => u.ativo !== false).length;
  const sessoesAtivas = sessoes.rows.filter((s) => !s.revogada && (!s.expiraEm || Date.parse(s.expiraEm) > Date.now())).length;
  const naoLidas = notificacoes.rows.filter((n) => !n.lida).length;
  const nomeUsuario = (id?: string | null) => usuarios.rows.find((u) => u.id === id)?.nome ?? "Sistema";

  return (
    <div>
      <PageHeader
        eyebrow="Rooster Hub"
        title="Núcleo da plataforma"
        description="Identidade, acessos e rastreabilidade de todo o ecossistema Rooster One."
      />
      <OfflineBanner />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuários" value={String(usuarios.rows.length)} hint={`${ativos} ativos`} icon={UsersIcon} tone={TONE.info} />
        <StatCard label="Permissões individuais" value={String(concedidas.rows.length)} hint={`${permissoes.rows.length} permissões catalogadas`} icon={Shield} tone={TONE.purple} />
        <StatCard label="Setores" value={String(setores.rows.length)} hint={`${modulos.rows.length} módulos ativos`} icon={Building} tone={TONE.cyan} />
        <StatCard label="Sessões ativas" value={String(sessoesAtivas)} hint={`${naoLidas} notificações não lidas`} icon={Monitor} tone={TONE.ok} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="group rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/40"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in oklab, ${l.tone} 14%, transparent)`, color: l.tone }}
            >
              <l.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm font-medium">{l.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Atividade recente" description="Últimos registros de auditoria" className="lg:col-span-2">
          <ul className="space-y-2.5">
            {logs.rows.slice(0, 6).map((l) => (
              <li key={l.id} className="flex items-start gap-3 rounded-lg border bg-background/40 p-2.5">
                <Avatar initials={initials(nomeUsuario(l.usuarioId))} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{nomeUsuario(l.usuarioId)}</span>
                    <Chip tone={l.acao === "delete" ? TONE.danger : l.acao === "create" ? TONE.ok : TONE.info}>{l.acao ?? "—"}</Chip>
                    <span className="text-xs text-muted-foreground">{l.modulo}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {l.entidade}
                    {l.entidadeId ? ` · ${l.entidadeId}` : ""} · {fmtDateTime(l.criadoEm)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Notificações" description="Central de avisos do Hub">
          <ul className="space-y-2.5">
            {notificacoes.rows.slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-lg border bg-background/40 p-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{n.titulo}</span>
                  {!n.lida ? <Chip tone={TONE.warn}>nova</Chip> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.mensagem}</p>
              </li>
            ))}
          </ul>
          <Link to="/hub/acessos" className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <KeyRound className="h-3.5 w-3.5" /> Ver acessos e permissões
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}