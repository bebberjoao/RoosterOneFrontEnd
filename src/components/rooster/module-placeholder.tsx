import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { ModuleItem } from "./module-config";

export function ModulePlaceholder({ module }: { module: ModuleItem }) {
  return (
    <div>
      <PageHeader
        eyebrow={module.short}
        title={module.name}
        description={module.description}
        actions={
          <Button size="sm" variant="outline" className="gap-1.5">
            Documentação <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      <div className="relative overflow-hidden rounded-2xl border bg-card p-10 shadow-sm">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${module.accent}, transparent)` }}
        />
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: `color-mix(in oklab, ${module.accent} 12%, transparent)`, color: module.accent }}
          >
            <module.icon className="h-6 w-6" />
          </div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Em construção
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {module.name} chega em breve
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Este módulo faz parte do ecossistema Rooster One. A estrutura, permissões e navegação já estão prontas — a experiência completa está sendo desenhada.
          </p>
          <div className="mt-6 flex gap-2">
            <Button size="sm" style={{ background: module.accent }} className="text-white hover:opacity-90">
              Solicitar acesso antecipado
            </Button>
            <Button size="sm" variant="ghost">
              Ver roadmap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}