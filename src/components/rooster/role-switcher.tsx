import { UserCog, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole, ROLES, ROLE_META, type Role } from "./role-context";

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const meta = ROLE_META[role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed px-2.5 text-xs font-medium text-muted-foreground shadow-xs transition-colors hover:border-foreground/30 hover:text-foreground"
          title="Alternar perfil (dev)"
        >
          <UserCog className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Perfil:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.tone }} />
            <span className="font-semibold text-foreground">{meta.short}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Alternar perfil (dev)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((r: Role) => {
          const m = ROLE_META[r];
          const active = r === role;
          return (
            <DropdownMenuItem key={r} onClick={() => setRole(r)} className="gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.tone }} />
              <div className="flex flex-1 flex-col">
                <span className="text-sm">{m.label}</span>
                <span className="text-[11px] text-muted-foreground">{m.person.name}</span>
              </div>
              {active ? <Check className="h-3.5 w-3.5 text-foreground" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}