import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { PageHeader } from "@/components/rooster/page-header";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/rooster/theme-context";

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm md:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Aparência</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ative o tema escuro para reduzir o cansaço visual. A preferência fica salva neste dispositivo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="dark-mode" className="text-sm text-muted-foreground">
            Tema escuro
          </Label>
          <Switch
            id="dark-mode"
            checked={isDark}
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            aria-label="Ativar tema escuro"
          />
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — Rooster Hub" }, { name: "description", content: "Configurações da instituição no Rooster One." }] }),
  component: () => (
    <AppShell>
      <div>
        <PageHeader eyebrow="Rooster Hub" title="Configurações" description="Preferências da instituição, identidade e integrações." />
        <div className="grid gap-4 md:grid-cols-2">
          <AppearanceCard />
          {[
            { t: "Identidade da instituição", d: "Nome, logo, cores e domínio institucional." },
            { t: "Módulos contratados", d: "Habilite ou desabilite módulos conforme o plano." },
            { t: "Integrações", d: "SSO, e-mail, SMS, gateways de pagamento e webhooks." },
            { t: "Segurança", d: "Políticas de senha, MFA e auditoria de acesso." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="text-sm font-semibold text-foreground">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  ),
});