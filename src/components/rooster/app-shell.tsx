import { useEffect, type ReactNode } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { useAuth } from "./auth-context";
import { PermissionProvider, RequireAccess } from "./hub/permission-context";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { authed, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !authed) navigate({ to: "/login", replace: true });
  }, [ready, authed, navigate]);

  if (!ready || !authed) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <PermissionProvider>
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
    </PermissionProvider>
  );
}