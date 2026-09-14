import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { useRole } from "@/components/rooster/role-context";
import { financeHasAccess } from "@/components/rooster/finance/permissions";
import { PageHeader } from "@/components/rooster/page-header";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Rooster Finance — ERP financeiro" },
      { name: "description", content: "Gestão financeira completa: mensalidades, boletos, notas fiscais e relatórios." },
      { property: "og:title", content: "Rooster Finance — ERP financeiro" },
      { property: "og:description", content: "Cobranças, mensalidades, boletos, notas fiscais, bolsas e relatórios integrados." },
    ],
  }),
  component: FinanceLayout,
});

function FinanceLayout() {
  const { role } = useRole();
  if (!financeHasAccess(role)) {
    return (
      <AppShell>
        <PageHeader eyebrow="Rooster Finance" title="Acesso restrito" description="Seu perfil não possui permissão para acessar o módulo financeiro." />
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Solicite acesso ao administrador do sistema para visualizar dados financeiros.
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