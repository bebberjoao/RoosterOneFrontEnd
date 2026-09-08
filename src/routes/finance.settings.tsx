import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import { Building2, CreditCard, FileText, Bell, Percent } from "lucide-react";

export const Route = createFileRoute("/finance/settings")({ component: FinanceSettings });

const CARDS = [
  { icon: Building2, title: "Dados da instituição", desc: "CNPJ, razão social, endereço fiscal e responsáveis financeiros." },
  { icon: CreditCard, title: "Integração bancária", desc: "Contas, convênios, carteiras e credenciais para emissão de boletos e PIX." },
  { icon: FileText, title: "Integração fiscal", desc: "Provedores de NFS-e e NF-e, certificados digitais A1/A3 e séries." },
  { icon: Percent, title: "Regras padrão", desc: "Juros, multa por atraso, descontos de pontualidade e vencimentos padrão." },
  { icon: Bell, title: "Notificações", desc: "Régua de cobrança por e-mail, SMS e push antes e depois do vencimento." },
];

function FinanceSettings() {
  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Configurações"
        description="Parâmetros do módulo financeiro: emissão, integrações, cobrança e notificações."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c) => (
          <button key={c.title} className="group text-left rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "color-mix(in oklab, oklch(0.62 0.18 155) 12%, transparent)", color: "oklch(0.62 0.18 155)" }}>
              <c.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
          </button>
        ))}
      </div>
    </>
  );
}