import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Search, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HOME_ITEM, MODULES, ADMIN_ITEMS, modulesForRole, type ModuleItem, type SubItem } from "./module-config";
import { useRole, ROLE_META } from "./role-context";
import { useAuth } from "./auth-context";
import { usePermissions } from "./hub/permission-context";
import { ACCESS_ACTION, findScreenByRoute, permissionKey } from "./hub/permission-catalog";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "rooster.sidebar.expanded";

function useExpandedState(role: string, autoOpen: string | null) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setExpanded(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (autoOpen) {
      setExpanded((s) => (s[autoOpen] ? s : { ...s, [autoOpen]: true }));
    }
  }, [autoOpen, role]);

  const toggle = (id: string) => {
    setExpanded((s) => {
      const next = { ...s, [id]: !s[id] };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { expanded, toggle };
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useRole();
  const person = ROLE_META[role].person;
  const { usuario } = useAuth();
  const displayName = usuario?.nome ?? person.name;
  const displayInitials = usuario
    ? usuario.nome.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase()
    : person.initials;
  const [query, setQuery] = useState("");

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

  const activeModule = useMemo(() => {
    return visibleModules.find((m) => m.path !== "/" && pathname.startsWith(m.path))?.id ?? null;
  }, [pathname, visibleModules]);

  const { expanded, toggle } = useExpandedState(role, activeModule);

  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;

  const filteredModules = useMemo(() => {
    if (!isSearching) return visibleModules;
    return visibleModules
      .map((m) => {
        const nameMatch = m.name.toLowerCase().includes(q) || m.short.toLowerCase().includes(q);
        const childMatches = (m.children ?? []).filter((c) => c.title.toLowerCase().includes(q));
        if (nameMatch || childMatches.length > 0) {
          return { ...m, children: nameMatch ? m.children : childMatches };
        }
        return null;
      })
      .filter(Boolean) as ModuleItem[];
  }, [visibleModules, q, isSearching]);

  const inicioMatches = !isSearching || "início".includes(q) || "inicio".includes(q) || "home".includes(q);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b gap-2">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <span className="text-sm font-semibold tracking-tight">R</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[oklch(0.65_0.2_265)] ring-2 ring-sidebar" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">Rooster One</span>
            <span className="text-[11px] text-muted-foreground">Universidade Modelo</span>
          </div>
        </Link>

        <div className="relative px-2 pb-1 group-data-[collapsible=icon]:hidden">
          <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulos, páginas..."
            className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar-accent/30 pl-7 pr-7 text-xs text-sidebar-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-sidebar-ring focus:bg-background"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1.5 py-2">
        {inicioMatches && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/"}
                tooltip="Início"
                className="h-9 rounded-lg data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium"
              >
                <Link to="/">
                  <HOME_ITEM.icon className="h-4 w-4" style={{ color: HOME_ITEM.accent }} />
                  <span>Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <div className="flex flex-col gap-1">
              {filteredModules.map((m) => (
                <ModuleAccordion
                  key={m.id}
                  module={m}
                  pathname={pathname}
                  open={!!expanded[m.id] || isSearching}
                  onToggle={() => toggle(m.id)}
                />
              ))}
              {isSearching && filteredModules.length === 0 && !inicioMatches && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  Nenhum resultado
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "admin" && !isSearching && (
          <SidebarGroup className="mt-2 border-t pt-3 px-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_ITEMS.map((m) => (
                  <SidebarMenuItem key={m.id}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(m.path)} tooltip={m.name} className="h-9 rounded-lg">
                      <Link to={m.path}>
                        <m.icon className="h-4 w-4" />
                        <span>{m.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
            style={{ background: `linear-gradient(135deg, ${ROLE_META[role].tone}, oklch(0.7 0.16 195))` }}
          >
            {displayInitials}
          </div>
          <div className="flex flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-medium text-sidebar-foreground">{displayName}</span>
            <span className="truncate text-[11px] text-muted-foreground">{person.caption}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function ModuleAccordion({
  module: m,
  pathname,
  open,
  onToggle,
}: {
  module: ModuleItem;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const isModuleActive = m.path !== "/" && pathname.startsWith(m.path);
  const Icon = m.icon;

  return (
    <div className="group-data-[collapsible=icon]:contents">
      {/* Collapsed (icon-only) view */}
      <div className="hidden group-data-[collapsible=icon]:block">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isModuleActive}
              tooltip={m.name}
              className="h-9 rounded-lg"
            >
              <Link to={m.path as string}>
                <Icon className="h-4 w-4" style={{ color: m.accent }} />
                <span>{m.short}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>

      {/* Expanded view */}
      <div className="group-data-[collapsible=icon]:hidden">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
            isModuleActive
              ? "bg-sidebar-accent/60 text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/40",
          )}
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{
              background: `color-mix(in oklab, ${m.accent} 14%, transparent)`,
              color: m.accent,
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="flex-1 truncate text-[13px] font-medium">{m.name}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90",
            )}
          />
        </button>

        <div
          className={cn(
            "grid transition-all duration-200 ease-out",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <ul className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border/70 pl-2 pb-1">
              {(m.children ?? []).map((child) => (
                <SubNavLink key={child.id} item={child} pathname={pathname} accent={m.accent} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubNavLink({ item, pathname, accent }: { item: SubItem; pathname: string; accent: string }) {
  const active = pathname === item.to;
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.to as string}
        className={cn(
          "group/link flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
        )}
      >
        <span
          className="h-1.5 w-1.5 rounded-full transition-colors"
          style={{ background: active ? accent : "currentColor", opacity: active ? 1 : 0.35 }}
        />
        {Icon ? <Icon className="h-3.5 w-3.5 opacity-70" /> : null}
        <span className="truncate">{item.title}</span>
      </Link>
    </li>
  );
}
