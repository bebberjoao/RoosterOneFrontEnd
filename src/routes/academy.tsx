import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { PageHeader } from "@/components/rooster/page-header";
import { useRole } from "@/components/rooster/role-context";
import { academyHasAccess } from "@/components/rooster/academy/permissions";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Rooster Academy — Gestão acadêmica" },
      { name: "description", content: "Disciplinas, turmas, professores, calendário, frequência, notas e desempenho." },
      { property: "og:title", content: "Rooster Academy — Gestão acadêmica" },
      { property: "og:description", content: "Sistema acadêmico completo integrado ao Rooster One." },
    ],
  }),
  component: AcademyLayout,
});

function AcademyLayout() {
  const { role } = useRole();
  if (!academyHasAccess(role)) {
    return (
      <AppShell>
        <PageHeader eyebrow="Rooster Academy" title="Acesso restrito" description="Seu perfil não possui permissão para acessar a gestão acadêmica." />
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Alunos consultam disciplinas, notas e frequência pelo módulo Rooster Student.
          </p>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}