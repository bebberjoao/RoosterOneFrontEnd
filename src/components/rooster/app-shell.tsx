import { useEffect, type ReactNode } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { useAuth } from "./auth-context";
import { PermissionProvider, RequireAccess } from "./hub/permission-context";
import { GlobalCommandPalette, GlobalSearchProvider } from "./global-command-palette";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { authed, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !authed) navigate({ to: "/login", replace: true });
  }, [ready, authed, navigate]);

  if (!ready || !authed) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-8">
        <div className="mb-8 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <PermissionProvider>
    <GlobalSearchProvider>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <AppTopbar />
        <main className="flex-1 p-6 lg:p-8">
          <div key={pathname} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
            <RequireAccess route={pathname}>{children}</RequireAccess>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
    <GlobalCommandPalette />
    </GlobalSearchProvider>
    </PermissionProvider>
  );
}