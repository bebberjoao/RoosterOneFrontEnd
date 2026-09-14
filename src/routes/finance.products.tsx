import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { PRODUCTS, PRODUCT_CATEGORIES, brl } from "@/components/rooster/finance/mock-data";
import { Search, Plus, AlertTriangle, Package as PackageIcon } from "lucide-react";
import { SelectInput } from "@/components/shared";

export const Route = createFileRoute("/finance/products")({ component: Products });

function Products() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");

  const items = useMemo(() => PRODUCTS.filter((p) => {
    if (cat !== "todas" && p.category !== cat) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase());
  }), [q, cat]);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Produtos"
        description="Cadastro de produtos físicos comercializados pela instituição — apostilas, uniformes, kits, materiais e mais."
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo produto
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou código…"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <SelectInput value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: "todas", label: "Todas categorias" }, ...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => {
          const low = p.stock < p.minStock;
          return (
            <div key={p.id} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md">
              <div className="relative aspect-[4/3] w-full" style={{ background: `linear-gradient(135deg, ${p.cover}, color-mix(in oklab, ${p.cover} 60%, black))` }}>
                <PackageIcon className="absolute inset-0 m-auto h-10 w-10 text-white/70" />
                <span className="absolute left-2 top-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{p.code}</span>
                {!p.active && <span className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white">Inativo</span>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{p.category}</div>
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{brl(p.price)}</div>
                    <div className="text-[11px] text-muted-foreground">/ {p.unit}</div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={low ? "flex items-center gap-1 font-medium" : "text-muted-foreground"} style={low ? { color: "oklch(0.6 0.22 25)" } : undefined}>
                    {low && <AlertTriangle className="h-3.5 w-3.5" />}
                    Estoque: {p.stock} {p.unit}
                  </span>
                  <span className="text-muted-foreground">mín. {p.minStock}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}