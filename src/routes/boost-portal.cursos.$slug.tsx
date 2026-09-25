// Preview público de um curso do Rooster Boost — acessível SEM login
// (GET /cursos-boost-publicos/:slug). O botão "Matricular" só exige login
// quando clicado; se o aluno ainda não tinha conta, ele é mandado pra
// entrar/cadastro preservando o slug (ver boost-portal.entrar.tsx) e, ao
// voltar autenticado, a matrícula é concluída automaticamente (efeito
// abaixo, disparado por `search.matricular === "1"`).
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, FileText, Layers, Link as LinkIcon, PlayCircle, Users } from "lucide-react";
import { cursosBoostPortalService, nivelLabel, type CursoDetalhePublico, type TipoAula } from "@/services/boost-portal/cursos.service";
import { BoostApiError, useBoostAuth } from "@/services/boost-portal/auth-context";
import { EmptyState, LoadingBlock } from "@/components/shared";

export const Route = createFileRoute("/boost-portal/cursos/$slug")({
  validateSearch: (search: Record<string, unknown>) =>
    ({
      matricular: typeof search.matricular === "string" ? search.matricular : undefined,
    }) as { matricular?: string },
  head: () => ({ meta: [{ title: "Curso — Rooster Boost" }] }),
  component: CursoPage,
});

const TIPO_ICON: Record<TipoAula, typeof PlayCircle> = { video: PlayCircle, texto: FileText, pdf: FileText, link: LinkIcon };

function CursoPage() {
  const { slug } = Route.useParams();
  const { matricular: autoMatricular } = Route.useSearch();
  const navigate = useNavigate();
  const { authed, ready } = useBoostAuth();

  const [curso, setCurso] = useState<CursoDetalhePublico | null | undefined>(undefined);
  const [matriculando, setMatriculando] = useState(false);
  const [erroMatricula, setErroMatricula] = useState<string | null>(null);
  const [jaTentouAuto, setJaTentouAuto] = useState(false);

  useEffect(() => {
    let alive = true;
    setCurso(undefined);
    cursosBoostPortalService
      .getPorSlug(slug)
      .then((c) => {
        if (alive) setCurso(c);
      })
      .catch(() => {
        if (alive) setCurso(null);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  async function handleMatricular() {
    if (!curso) return;
    if (!ready) return;
    if (!authed) {
      navigate({ to: "/boost-portal/entrar", search: { slug } });
      return;
    }
    setErroMatricula(null);
    setMatriculando(true);
    try {
      const matricula = await cursosBoostPortalService.matricular(curso.id);
      navigate({ to: "/boost-portal/painel/$matriculaId", params: { matriculaId: matricula.id } });
    } catch (err) {
      setErroMatricula(err instanceof BoostApiError ? err.message : "Não foi possível concluir a matrícula. Tente novamente.");
    } finally {
      setMatriculando(false);
    }
  }

  // Voltou autenticado de /entrar ou /cadastro com a intenção de se matricular.
  useEffect(() => {
    if (autoMatricular === "1" && authed && ready && curso && !jaTentouAuto) {
      setJaTentouAuto(true);
      void handleMatricular();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMatricular, authed, ready, curso, jaTentouAuto]);

  if (curso === undefined) {
    return <LoadingBlock className="py-4" />;
  }

  if (curso === null) {
    return (
      <>
        <EmptyState icon={BookOpen} title="Curso não encontrado" description="O curso que você está procurando não existe ou não está mais publicado." />
        <div className="mt-6 text-center">
          <Link to="/boost-portal" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao catálogo
          </Link>
        </div>
      </>
    );
  }

  const totalAulas = curso.modulos.reduce((s, m) => s + m.aulas.length, 0);

  return (
    <>
      <Link to="/boost-portal" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Catálogo
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div
            className="mb-4 h-40 w-full rounded-2xl sm:h-56"
            style={{ background: curso.capa ? `url(${curso.capa}) center/cover` : "linear-gradient(135deg, oklch(0.55 0.19 265), oklch(0.68 0.18 40))" }}
          />
          {curso.categoria && <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{curso.categoria}</span>}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{curso.titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{curso.professorNome}</p>
          <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{curso.descricao || "Sem descrição."}</p>

          <div className="mt-8">
            <h2 className="text-sm font-semibold">Conteúdo do curso</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {curso.modulos.length} módulo(s) · {totalAulas} aula(s)
            </p>
            {curso.modulos.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum módulo publicado ainda.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {curso.modulos.map((m) => (
                  <div key={m.id} className="rounded-xl border bg-card">
                    <div className="border-b px-4 py-2.5 text-sm font-medium">{m.titulo}</div>
                    <ul className="divide-y">
                      {m.aulas.map((a) => {
                        const Icon = TIPO_ICON[a.tipo] ?? FileText;
                        return (
                          <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">{a.titulo}</span>
                            {a.duracaoMin ? <span className="text-xs">{a.duracaoMin} min</span> : null}
                          </li>
                        );
                      })}
                      {m.aulas.length === 0 && <li className="px-4 py-2.5 text-sm text-muted-foreground">Nenhuma aula neste módulo ainda.</li>}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-2xl border bg-card p-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> {curso.cargaHoraria}h</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Layers className="h-4 w-4" /> {curso.totalModulos} módulos</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> {curso.totalMatriculas} alunos</div>
              <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> {nivelLabel(curso.nivel)}</div>
            </div>
            {erroMatricula ? <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{erroMatricula}</p> : null}
            <button
              onClick={handleMatricular}
              disabled={matriculando || !ready}
              className="mt-4 w-full rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {matriculando ? "Matriculando…" : authed ? "Começar curso" : "Matricular-se gratuitamente"}
            </button>
            {!authed && ready ? <p className="mt-2 text-center text-[11px] text-muted-foreground">Você precisará entrar ou criar uma conta.</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
