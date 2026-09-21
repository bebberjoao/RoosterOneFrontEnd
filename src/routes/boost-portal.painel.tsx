// "Meu painel" — matrículas do aluno logado (GET /boost/me/matriculas).
// Rota protegida pela sessão Boost: sem sessão, redireciona para o login
// preservando a intenção de voltar aqui.
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Award, BookOpen, Download } from "lucide-react";
import { cursosBoostPortalService, type MinhaMatricula } from "@/services/boost-portal/cursos.service";
import { useBoostAuth } from "@/services/boost-portal/auth-context";
import { EmptyState, ProgressBar, SectionCard, TONE, LoadingCards } from "@/components/shared/primitives";

export const Route = createFileRoute("/boost-portal/painel")({
  head: () => ({ meta: [{ title: "Meu painel — Rooster Boost" }] }),
  component: PainelPage,
});

function PainelPage() {
  const { authed, ready } = useBoostAuth();
  const navigate = useNavigate();
  const [matriculas, setMatriculas] = useState<MinhaMatricula[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!authed) {
      navigate({ to: "/boost-portal/entrar", replace: true });
      return;
    }
    let alive = true;
    cursosBoostPortalService
      .getMinhasMatriculas()
      .then((rows) => {
        if (alive) setMatriculas(rows);
      })
      .catch(() => {
        if (alive) setErro(true);
      });
    return () => {
      alive = false;
    };
  }, [authed, ready, navigate]);

  if (!ready || !authed) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Verificando sessão…</p>;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Meu painel</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seus cursos, progresso e certificados.</p>

      <div className="mt-6">
        {erro ? (
          <EmptyState icon={BookOpen} title="Não foi possível carregar suas matrículas" description="Tente novamente em instantes." />
        ) : matriculas === null ? (
          <LoadingCards />
        ) : matriculas.length === 0 ? (
          <EmptyState icon={BookOpen} title="Você ainda não está matriculado em nenhum curso" description="Explore o catálogo e comece a aprender agora." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {matriculas.map((m) => (
              <SectionCard
                key={m.id}
                title={m.curso.titulo}
                description={m.curso.professorNome}
                action={
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      color: m.status === "concluida" ? TONE.ok : TONE.info,
                      background: `color-mix(in oklab, ${m.status === "concluida" ? TONE.ok : TONE.info} 14%, transparent)`,
                    }}
                  >
                    {m.status === "concluida" ? "Concluído" : m.status === "cancelada" ? "Cancelado" : "Em andamento"}
                  </span>
                }
              >
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Progresso</span>
                    <span>{m.progressoPct}%</span>
                  </div>
                  <ProgressBar value={m.progressoPct} tone={m.status === "concluida" ? TONE.ok : TONE.info} />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to="/boost-portal/painel/$matriculaId"
                    params={{ matriculaId: m.id }}
                    className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium hover:bg-accent"
                  >
                    {m.status === "concluida" ? "Revisar curso" : "Continuar"}
                  </Link>
                  {m.certificado ? (
                    <button
                      onClick={() => cursosBoostPortalService.baixarCertificado(m.certificado!.id, `certificado-${m.certificado!.codigo}.pdf`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent"
                      title="Baixar certificado"
                    >
                      <Award className="h-3.5 w-3.5" /> <Download className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
