import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { useRole, useCurrentPerson, ROLE_META } from "@/components/rooster/role-context";
import { useNotificacoes } from "@/components/rooster/notifications/use-notificacoes";
import { Bell } from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Rooster One" },
      {
        name: "description",
        content:
          "Rooster One — plataforma modular de gestão institucional. Acesse rapidamente os módulos disponíveis para o seu acesso.",
      },
      { property: "og:title", content: "Início — Rooster One" },
      { property: "og:description", content: "Ecossistema integrado de gestão para instituições de ensino." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AppShell>
      <InicioPage />
    </AppShell>
  ),
});

function InicioPage() {
  const { role } = useRole();
  const person = useCurrentPerson();
  const { naoLidas } = useNotificacoes();

  return (
    <div className="mx-auto max-w-6xl">
      {/* Banner institucional */}
      <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div
          aria-hidden
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(1200px 400px at 10% 0%, oklch(0.55 0.19 265 / 0.15), transparent 60%), radial-gradient(900px 400px at 90% 100%, oklch(0.68 0.15 195 / 0.18), transparent 60%), linear-gradient(135deg, oklch(0.98 0.005 260), oklch(0.96 0.01 250))",
          }}
        />
        <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <span className="text-lg font-semibold">R</span>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Universidade Modelo
                </div>
                <div className="text-sm font-medium text-foreground">Rooster One</div>
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Bem-vindo(a), {person.name.split(" ")[0]}.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Este é o seu ponto de partida no ecossistema institucional. Use o menu lateral para acessar os módulos
              disponíveis para o seu perfil <span className="font-medium text-foreground">{ROLE_META[role].label}</span>.
            </p>

            <Link
              to="/notifications"
              className="mt-6 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur hover:text-foreground"
            >
              <Bell className="h-3.5 w-3.5" style={{ color: ROLE_META[role].tone }} />
              {naoLidas > 0 ? `${naoLidas} notificação(ões) não lida(s)` : "Nenhuma notificação nova"}
            </Link>
          </div>

          <div className="hidden shrink-0 md:block">
            <div
              className="flex h-40 w-40 items-center justify-center rounded-3xl border shadow-sm"
              style={{
                background: `conic-gradient(from 220deg, ${ROLE_META[role].tone}, oklch(0.7 0.16 195), oklch(0.6 0.2 305), ${ROLE_META[role].tone})`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-2xl bg-background/95 text-center shadow-inner">
                <span className="text-2xl font-semibold tracking-tight text-foreground">R1</span>
                <span className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  ecosystem
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
