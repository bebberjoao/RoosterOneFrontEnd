import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { NotificationsList } from "@/components/rooster/notifications/notifications-list";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notificações — Rooster One" }, { name: "description", content: "Avisos sobre seus chamados, reservas e cobranças." }] }),
  component: () => (
    <AppShell>
      <NotificationsList />
    </AppShell>
  ),
});
