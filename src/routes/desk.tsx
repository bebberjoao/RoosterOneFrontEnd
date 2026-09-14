import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";

export const Route = createFileRoute("/desk")({
  head: () => ({
    meta: [
      { title: "Rooster Desk — Chamados internos" },
      { name: "description", content: "Sistema de tickets, SLA e suporte técnico do Rooster One." },
    ],
  }),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});