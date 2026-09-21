// Login do portal público Rooster Boost — conta própria (BoostUsuario),
// nada a ver com o login do Hub (src/routes/login.tsx). Preserva "para onde o
// aluno ia" via search params: `slug` (curso que ele tentou matricular) ou
// `matriculaId` (aula que ele tentou abrir), setados por quem redireciona
// pra cá (ver boost-portal.cursos.$slug.tsx e boost-portal.painel.$matriculaId.tsx).
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BoostApiError, BoostApiUnavailableError, useBoostAuth } from "@/services/boost-portal/auth-context";

export const Route = createFileRoute("/boost-portal/entrar")({
  validateSearch: (search: Record<string, unknown>) =>
    ({
      slug: typeof search.slug === "string" ? search.slug : undefined,
      matriculaId: typeof search.matriculaId === "string" ? search.matriculaId : undefined,
    }) as { slug?: string; matriculaId?: string },
  head: () => ({ meta: [{ title: "Entrar — Rooster Boost" }] }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  const { slug, matriculaId } = Route.useSearch();
  const { login } = useBoostAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function aposLogin() {
    if (slug) navigate({ to: "/boost-portal/cursos/$slug", params: { slug }, search: { matricular: "1" }, replace: true });
    else if (matriculaId) navigate({ to: "/boost-portal/painel/$matriculaId", params: { matriculaId }, replace: true });
    else navigate({ to: "/boost-portal/painel", replace: true });
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-8">
      <h1 className="text-xl font-semibold">Entrar no Rooster Boost</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Acesse com a conta que você criou no portal do aluno.</p>

      <form
        className="mt-6 w-full space-y-4 rounded-2xl border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setErro(null);
          setEnviando(true);
          login(email, senha)
            .then(aposLogin)
            .catch((err: unknown) => {
              if (err instanceof BoostApiUnavailableError) setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
              else if (err instanceof BoostApiError && err.status === 401) setErro("E-mail ou senha inválidos.");
              else setErro("Não foi possível entrar. Tente novamente.");
            })
            .finally(() => setEnviando(false));
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Senha</span>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        {erro ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p> : null}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/boost-portal/cadastro" search={{ slug, matriculaId }} className="font-medium text-foreground underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
