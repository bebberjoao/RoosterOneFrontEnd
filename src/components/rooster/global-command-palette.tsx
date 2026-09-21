import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { HOME_ITEM, ADMIN_ITEMS, modulesForRole } from "./module-config";
import { useRole } from "./role-context";
import { usePermissions } from "./hub/permission-context";
import { ACCESS_ACTION, findScreenByRoute, permissionKey } from "./hub/permission-catalog";

/** Estado de aberto/fechado compartilhado entre o botão do topbar e o atalho de teclado global. */
const GlobalSearchCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <GlobalSearchCtx.Provider value={{ open, setOpen }}>{children}</GlobalSearchCtx.Provider>;
}

export function useGlobalSearch() {
  return useContext(GlobalSearchCtx);
}

/**
 * Busca global (⌘K/Ctrl+K) — antes um botão decorativo sem `onClick` no topbar.
 * Indexa a navegação (módulos + telas), filtrada pela mesma combinação de
 * Visão de demonstração + permissão real que já decide o que aparece na
 * sidebar (`app-sidebar.tsx`) — nunca mostra mais do que o usuário já veria
 * ali, só torna isso pesquisável via teclado de qualquer tela.
 */
export function GlobalCommandPalette() {
  const { open, setOpen } = useGlobalSearch();
  const navigate = useNavigate();
  const { role } = useRole();
  const { granted, hasCustom } = usePermissions();

  const allowsRoute = useMemo(() => {
    return (route: string) => {
      if (!hasCustom) return true;
      const match = findScreenByRoute(route);
      if (!match) return true;
      return granted.has(permissionKey(match.module.id, match.screen.id, ACCESS_ACTION.id));
    };
  }, [granted, hasCustom]);

  const visibleModules = useMemo(() => {
    return modulesForRole(role)
      .map((m) => ({ ...m, children: (m.children ?? []).filter((c) => allowsRoute(c.to)) }))
      .filter((m) => m.children.length > 0 || allowsRoute(m.path));
  }, [role, allowsRoute]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  function go(to: string) {
    setOpen(false);
    navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar módulo ou tela…" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Geral">
          <CommandItem value={HOME_ITEM.name} onSelect={() => go(HOME_ITEM.path)}>
            {HOME_ITEM.name}
          </CommandItem>
          {ADMIN_ITEMS.map((item) => (
            <CommandItem key={item.id} value={item.name} onSelect={() => go(item.path)}>
              {item.name}
            </CommandItem>
          ))}
        </CommandGroup>
        {visibleModules.map((mod) => (
          <CommandGroup key={mod.id} heading={mod.name}>
            {allowsRoute(mod.path) ? (
              <CommandItem value={`${mod.name} Dashboard`} onSelect={() => go(mod.path)}>
                {mod.name} · Dashboard
              </CommandItem>
            ) : null}
            {(mod.children ?? []).map((child) => (
              <CommandItem key={child.id} value={`${mod.name} ${child.title}`} onSelect={() => go(child.to)}>
                {child.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
