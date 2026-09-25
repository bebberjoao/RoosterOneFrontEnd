import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Clock, Layers, Search, Users } from "lucide-react";
import { cursosBoostPortalService, nivelLabel, type CursoCatalogo } from "@/services/boost-portal/cursos.service";
import { EmptyState, LoadingCards } from "@/components/shared";

export const Route = createFileRoute("/boost-portal/")({ component: CatalogoPage });

function CatalogoPage() {
  const [cursos, setCursos] = useState<CursoCatalogo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");

  useEffect(() => {
    let alive = true;
    cursosBoostPortalService
      .getCatalogo()
      .then((rows) => {
        if (alive) setCursos(rows);
      })
      .catch(() => {
        if (alive) setErro(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const categorias = useMemo(() => {
    const set = new Set((cursos ?? []).map((c) => c.categoria).filter((c): c is string => !!c));
    return [...set].sort();
  }, [cursos]);

  const filtrados = useMemo(() => {
    if (!cursos) return [];
    const q = busca.trim().toLowerCase();
    return cursos.filter((c) => {
      const bateBusca = !q || c.titulo.toLowerCase().includes(q) || c.professorNome.toLowerCase().includes(q);
      const bateCategoria = !categoria || c.categoria === categoria;
      return bateBusca && bateCategoria;
    });
  }, [cursos, busca, categoria]);

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Catálogo de cursos</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Cursos livres, treinamentos e certificações abertos ao público. Navegue sem login — a matrícula é gratuita e rápida.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por curso ou instrutor…"
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        {categorias.length > 0 && (
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {erro ? (
        <EmptyState icon={BookOpen} title="Não foi possível carregar o catálogo" description="Verifique sua conexão e tente novamente em instantes." />
      ) : cursos === null ? (
        <LoadingCards />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={cursos.length === 0 ? "Nenhum curso publicado no momento" : "Nenhum curso encontrado"}
          description={cursos.length === 0 ? "Volte em breve — novos cursos são publicados regularmente." : "Tente ajustar a busca ou a categoria."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c) => (
            <Link
              key={c.id}
              to="/boost-portal/cursos/$slug"
              params={{ slug: c.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/30"
            >
              <div
                className="h-28 w-full"
                style={{ background: c.capa ? `url(${c.capa}) center/cover` : "linear-gradient(135deg, oklch(0.55 0.19 265), oklch(0.68 0.18 40))" }}
              />
              <div className="flex flex-1 flex-col p-4">
                {c.categoria && <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{c.categoria}</span>}
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold group-hover:underline">{c.titulo}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{c.descricao ?? ""}</p>
                <p className="mt-2 text-xs text-muted-foreground">{c.professorNome}</p>
                <div className="mt-3 flex items-center gap-3 border-t pt-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.cargaHoraria}h</span>
                  <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {c.totalModulos} módulo(s)</span>
                  <span className="ml-auto inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.totalMatriculas}</span>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {nivelLabel(c.nivel)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
