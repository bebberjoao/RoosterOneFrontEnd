import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooster Rooms — Reservas e ambientes" },
      { name: "description", content: "Gestão de campus, blocos, ambientes e reservas integrada ao Rooster One." },
    ],
  }),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});