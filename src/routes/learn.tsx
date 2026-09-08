import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { useRole, learnHasAccess, ROLE_META } from "@/components/rooster/role-context";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Rooster Learn — Ambiente virtual de aprendizagem" },
      { name: "description", content: "Ambiente virtual para criar atividades, avaliar entregas e acompanhar notas — para professores, coordenadores e alunos." },
    ],
  }),
  component: LearnLayout,
});

function LearnLayout() {
  const { role } = useRole();
  if (!learnHasAccess(role)) {
    return (
      <AppShell>
        <NoAccess roleLabel={ROLE_META[role].label} />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function NoAccess({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-dashed bg-card/40 p-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">Sem acesso ao Rooster Learn</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        O perfil <span className="font-medium text-foreground">{roleLabel}</span> não possui permissão para acessar o ambiente virtual de aprendizagem. Solicite acesso ao administrador.
      </p>
    </div>
  );
}