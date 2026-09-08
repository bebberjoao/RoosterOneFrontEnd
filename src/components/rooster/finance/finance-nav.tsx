import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Receipt, CalendarClock, Package, Wrench,
  FileBarChart, FileText, TicketPercent, LineChart, Settings,
} from "lucide-react";
import { useRole } from "@/components/rooster/role-context";
import { financeCan } from "./permissions";

const ALL = [
  { to: "/finance", label: "Dashboard", icon: LayoutDashboard, exact: true, perm: "viewDashboard" as const },
  { to: "/finance/charges", label: "Cobranças", icon: Receipt, perm: "manageCharges" as const },
  { to: "/finance/tuitions", label: "Mensalidades", icon: CalendarClock, perm: "manageCharges" as const },
  { to: "/finance/products", label: "Produtos", icon: Package, perm: "manageProducts" as const },
  { to: "/finance/services", label: "Serviços", icon: Wrench, perm: "manageServices" as const },
  { to: "/finance/boletos", label: "Boletos", icon: FileBarChart, perm: "manageCharges" as const },
  { to: "/finance/nfe", label: "Notas Fiscais", icon: FileText, perm: "manageNfe" as const },
  { to: "/finance/discounts", label: "Descontos e Bolsas", icon: TicketPercent, perm: "manageDiscounts" as const },
  { to: "/finance/reports", label: "Relatórios", icon: LineChart, perm: "viewReports" as const },
  { to: "/finance/settings", label: "Configurações", icon: Settings, perm: "manageSettings" as const },
];

export function FinanceNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useRole();
  const items = ALL.filter((i) => financeCan(role, i.perm));
  return (
    <div className="mb-6 flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-card/40 p-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}