import { Search, Bell, Settings, Command, Moon, Sun, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useRouterState, Link, useNavigate } from "@tanstack/react-router";
import { HOME_ITEM, MODULES, ADMIN_ITEMS } from "./module-config";
import { RoleSwitcher } from "./role-switcher";
import { useRole, ROLE_META } from "./role-context";
import { useTheme } from "./theme-context";
import { useAuth } from "./auth-context";
import { useGlobalSearch } from "./global-command-palette";

function useBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return HOME_ITEM.name;
  const all = [
    ...MODULES.filter((m) => m.path !== "/"),
    ...ADMIN_ITEMS.map((a) => ({ path: a.path, name: a.name })),
  ];
  const match = all.find((m) => pathname.startsWith(m.path));
  return match?.name ?? "Rooster One";
}

export function AppTopbar() {
  const current = useBreadcrumb();
  const navigate = useNavigate();
  const { role } = useRole();
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const { setOpen: setSearchOpen } = useGlobalSearch();
  const person = ROLE_META[role].person;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      <nav className="hidden items-center gap-1.5 text-sm md:flex">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          Rooster One
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-foreground">{current}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group hidden h-9 w-72 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:border-foreground/20 hover:text-foreground md:flex"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Buscar em toda a plataforma...</span>
          <kbd className="pointer-events-none flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[oklch(0.65_0.2_25)] ring-2 ring-background" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggle}
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link to="/settings" title="Configurações">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        <RoleSwitcher />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
          style={{ background: `linear-gradient(135deg, ${ROLE_META[role].tone}, oklch(0.7 0.16 195))` }}
          title={person.name}
        >
          {person.initials}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleLogout}
          title="Sair"
          aria-label="Sair da plataforma"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}