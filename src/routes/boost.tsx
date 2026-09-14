import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";

export const Route = createFileRoute("/boost")({
  head: () => ({
    meta: [
      { title: "Rooster Boost — Plataforma de cursos e certificações" },
      { name: "description", content: "Crie, publique e gerencie cursos online, treinamentos e certificações integradas ao Rooster One." },
    ],
  }),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
