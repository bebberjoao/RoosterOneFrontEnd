import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { modulesForRole } from "@/components/rooster/module-config";
import { useRole, ROLE_META } from "@/components/rooster/role-context";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Rooster One" },
      {
        name: "description",
        content:
          "Rooster One — plataforma modular de gestão institucional. Acesse rapidamente os módulos disponíveis para o seu perfil.",
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
  const person = ROLE_META[role].person;
  const modules = modulesForRole(role);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Banner institucional */}
      <div className="relative min-h-[390px] overflow-hidden rounded-3xl border bg-card shadow-sm md:min-h-[360px]">
        <img
          src="/capa.jpeg"
          alt="Entrada do Centro Universitário FAG"
          className="absolute inset-0 h-full w-full object-cover object-[center_58%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5"
          style={{
            background: "linear-gradient(90deg, rgb(0 0 0 / 0.72), rgb(0 0 0 / 0.3) 58%, transparent)",
          }}
        />
        <div className="relative flex min-h-[390px] flex-col justify-between gap-6 p-8 md:min-h-[360px] md:flex-row md:items-center md:p-12">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-md">
                <span className="text-lg font-semibold">R</span>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/75">
                  Centro Universitário FAG
                </div>
                <div className="text-sm font-medium text-white">Rooster One</div>
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
              Bem-vindo(a), {person.name.split(" ")[0]}.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-white/85">
              Este é o seu ponto de partida no ecossistema institucional. Acesse os módulos disponíveis
              para o seu perfil <span className="font-medium text-white">{ROLE_META[role].label}</span> e
              continue de onde parou — tudo em um único lugar.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" style={{ color: ROLE_META[role].tone }} />
              {modules.length} módulos disponíveis para o seu perfil
            </div>
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

      {/* Atalhos rápidos */}
      <div className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Atalhos rápidos</h2>
            <p className="text-sm text-muted-foreground">Módulos aos quais você tem acesso.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.id}
              to={m.path as string}
              className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: m.accent }}
              />
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: `color-mix(in oklab, ${m.accent} 14%, transparent)`,
                    color: m.accent,
                  }}
                >
                  <m.icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold text-foreground">{m.name}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {modules.length === 0 && (
          <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhum módulo disponível para este perfil.
          </div>
        )}
      </div>
    </div>
  );
}
