// Login do portal Rooster Boost, com duas formas de acesso:
// - aluno da instituição: e-mail e senha do Rooster One (POST /boost/login-institucional); a conta do
//   portal é criada ou vinculada automaticamente, e o token emitido continua sendo do portal;
// - aluno externo: conta própria do portal (POST /boost/login), criada no cadastro público ou pela
//   administração.
// Preserva o destino do aluno pelos parâmetros `slug` (curso a matricular) e `matriculaId` (aula a
// abrir), definidos por boost-portal.cursos.$slug.tsx e boost-portal.painel.$matriculaId.tsx.
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, UserRound } from "lucide-react";
import { BoostApiError, BoostApiUnavailableError, useBoostAuth } from "@/services/boost-portal/auth-context";

type Modo = "institucional" | "externo";

export const Route = createFileRoute("/boost-portal/entrar")({
  validateSearch: (search: Record<string, unknown>) =>
    ({
      slug: typeof search.slug === "string" ? search.slug : undefined,
      matriculaId: typeof search.matriculaId === "string" ? search.matriculaId : undefined,
      modo: search.modo === "externo" || search.modo === "institucional" ? search.modo : undefined,
    }) as { slug?: string; matriculaId?: string; modo?: Modo },
  head: () => ({ meta: [{ title: "Entrar — Rooster Boost" }] }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  const { slug, matriculaId, modo: modoInicial } = Route.useSearch();
  const { login, loginInstitucional } = useBoostAuth();
  const [modo, setModo] = useState<Modo>(modoInicial ?? "institucional");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function aposLogin() {
    if (slug) navigate({ to: "/boost-portal/cursos/$slug", params: { slug }, search: { matricular: "1" }, replace: true });
    else if (matriculaId) navigate({ to: "/boost-portal/painel/$matriculaId", params: { matriculaId }, replace: true });
    else navigate({ to: "/boost-portal/painel", replace: true });
  }

  const institucional = modo === "institucional";

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-8">
      <h1 className="text-xl font-semibold">Entrar no Rooster Boost</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Escolha a forma de acesso.</p>

      <div role="tablist" aria-label="Forma de acesso" className="mt-6 grid w-full grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1">
        {([
          { id: "institucional", label: "Aluno da instituição", icon: Building2 },
          { id: "externo", label: "Aluno externo", icon: UserRound },
        ] as const).map((op) => (
          <button
            key={op.id}
            type="button"
            role="tab"
            aria-selected={modo === op.id}
            onClick={() => { setModo(op.id); setErro(null); }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
              modo === op.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <op.icon className="h-3.5 w-3.5" /> {op.label}
          </button>
        ))}
      </div>

      <form
        className="mt-3 w-full space-y-4 rounded-2xl border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setErro(null);
          setEnviando(true);
          (institucional ? loginInstitucional(email, senha) : login(email, senha))
            .then(aposLogin)
            .catch((err: unknown) => {
              if (err instanceof BoostApiUnavailableError) setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
              else if (err instanceof BoostApiError && err.status === 401) {
                setErro(
                  err.message && err.message !== "E-mail ou senha inválidos."
                    ? err.message
                    : institucional
                      ? "E-mail ou senha inválidos. Utilize o mesmo login do sistema da instituição."
                      : "E-mail ou senha inválidos. Alunos da instituição devem utilizar a opção \"Aluno da instituição\".",
                );
              } else setErro("Não foi possível entrar. Tente novamente.");
            })
            .finally(() => setEnviando(false));
        }}
      >
        <p className="text-xs text-muted-foreground">
          {institucional
            ? "Utilize o mesmo e-mail e a mesma senha do sistema da instituição. Não é necessário criar conta no portal."
            : "Utilize a conta criada no cadastro do portal ou fornecida pela instituição."}
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={institucional ? "seu.login@instituicao.edu.br" : "nome@email.com"}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Senha</span>
          <input
            type="password"
            required
            autoComplete="current-password"
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
        {institucional ? (
          <p className="text-center text-xs text-muted-foreground">
            Esqueceu a senha?{" "}
            <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Recupere no sistema da instituição
            </Link>
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Ainda não possui conta?{" "}
            <Link to="/boost-portal/cadastro" search={{ slug, matriculaId }} className="font-medium text-foreground underline-offset-4 hover:underline">
              Criar conta
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
