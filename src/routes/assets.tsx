import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { PageHeader } from "@/components/rooster/page-header";
import { useRole } from "@/components/rooster/role-context";
import { assetsHasAccess } from "@/components/rooster/assets/permissions";
import { AssetsProvider } from "@/components/rooster/assets/store";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Rooster Assets — Patrimônio e equipamentos" },
      { name: "description", content: "Cadastro, situação, movimentações e histórico do patrimônio da instituição." },
      { property: "og:title", content: "Rooster Assets — Patrimônio e equipamentos" },
      { property: "og:description", content: "Gestão patrimonial simples e integrada ao Rooster One." },
    ],
  }),
  component: AssetsLayout,
});

function AssetsLayout() {
  const { role } = useRole();
  if (!assetsHasAccess(role)) {
    return (
      <AppShell>
        <PageHeader eyebrow="Rooster Assets" title="Acesso restrito" description="Seu perfil não possui permissão para acessar a gestão patrimonial." />
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Solicite acesso ao administrador pelo Rooster Hub.
          </p>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <AssetsProvider>
        <Outlet />
      </AssetsProvider>
    </AppShell>
  );
}
