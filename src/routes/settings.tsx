import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/rooster/app-shell";
import { PageHeader } from "@/components/rooster/page-header";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/rooster/theme-context";
import { useCan } from "@/components/rooster/hub/permission-context";
import { configuracoesService, type StatusEmail } from "@/services/hub/configuracoes";

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

/**
 * Status/teste do envio de e-mail (SMTP) — só admin vê (permissão
 * `hub.configuracoes.acessar`). Host/porta/usuário/senha do SMTP continuam só
 * no `.env` do servidor; aqui é só leitura de status + um botão de teste real,
 * de propósito, pra não guardar segredo de e-mail no banco.
 */
function EmailConfigCard() {
  const [status, setStatus] = useState<StatusEmail | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    configuracoesService
      .statusEmail()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setCarregando(false));
  }, []);

  async function enviarTeste() {
    setEnviando(true);
    try {
      const res = await configuracoesService.testarEmail();
      toast.success(`E-mail de teste enviado para ${res.destino}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar o e-mail de teste.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm md:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">E-mail (SMTP)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Usado para enviar o link de redefinição de senha e outros avisos por e-mail.
            </p>
          </div>
        </div>
      </div>

      {carregando ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando status…</p>
      ) : !status ? (
        <p className="mt-4 text-sm text-muted-foreground">Não foi possível consultar o status agora.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status.configurado
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {status.configurado ? "Configurado" : "Não configurado"}
            </span>
            {status.modoDev && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Ambiente de desenvolvimento
              </span>
            )}
          </div>

          {status.configurado ? (
            <p className="text-sm text-muted-foreground">
              Servidor <span className="font-medium text-foreground">{status.host}</span>
              {status.porta ? `:${status.porta}` : ""} — remetente{" "}
              <span className="font-medium text-foreground">{status.remetente}</span>.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum servidor SMTP definido no ambiente do servidor.{" "}
              {status.modoDev
                ? "Em desenvolvimento, o link de redefinição de senha aparece no log do servidor em vez de ser enviado por e-mail."
                : "Defina SMTP_HOST no servidor para habilitar o envio."}
            </p>
          )}

          <Button size="sm" variant="outline" disabled={!status.configurado || enviando} onClick={enviarTeste}>
            {enviando ? "Enviando…" : "Enviar e-mail de teste"}
          </Button>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — Rooster Hub" }, { name: "description", content: "Configurações da instituição no Rooster One." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const podeVerConfiguracoesAdmin = useCan("/hub/configuracoes", "acessar");
  return (
    <AppShell>
      <div>
        <PageHeader eyebrow="Rooster Hub" title="Configurações" description="Preferências da instituição, identidade e integrações." />
        <div className="grid gap-4 md:grid-cols-2">
          <AppearanceCard />
          {podeVerConfiguracoesAdmin && <EmailConfigCard />}
          {[
            { t: "Identidade da instituição", d: "Nome, logo, cores e domínio institucional." },
            { t: "Módulos contratados", d: "Habilite ou desabilite módulos conforme o plano." },
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
  );
}