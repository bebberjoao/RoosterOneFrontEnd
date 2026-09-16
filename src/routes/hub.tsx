import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";

export const Route = createFileRoute("/hub")({
  head: () => ({
    meta: [
      { title: "Rooster Hub — Núcleo da plataforma" },
      { name: "description", content: "Usuários, setores, módulos, permissões individuais, sessões e auditoria do Rooster One." },
      { property: "og:title", content: "Rooster Hub — Núcleo da plataforma" },
      { property: "og:description", content: "Gestão de identidade e acessos do ecossistema Rooster One." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});