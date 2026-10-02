import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import logoUrl from "@/assets/rooster-logo.png";
import { ApiError, ApiUnavailableError, useAuth } from "@/components/rooster/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Rooster One" },
      { name: "description", content: "Acesse o Rooster One, o ecossistema de gestão para instituições de ensino." },
      { property: "og:title", content: "Entrar — Rooster One" },
      { property: "og:description", content: "Acesse o Rooster One, o ecossistema de gestão para instituições de ensino." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [reset, setReset] = useState(false);
  const [sent, setSent] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-[oklch(0.19_0.06_265)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={logoUrl}
            alt="Rooster One"
            className="h-16 w-16 brightness-0 invert"
          />
          <h1 className="mt-4 text-2xl font-semibold text-white">Rooster One</h1>
          <p className="mt-1 text-sm text-white/60">Ecossistema de gestão institucional</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          {reset ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (sent || enviando) return;
                setEnviando(true);
                requestPasswordReset(email)
                  .then(() => setSent(true))
                  .catch(() => setSent(true)) // resposta genérica mesmo em erro de rede — não expõe detalhes
                  .finally(() => setEnviando(false));
              }}
            >
              <div>
                <h2 className="text-base font-medium text-white">Redefinir senha</h2>
                <p className="mt-1 text-xs text-white/60">
                  Informe seu login e enviaremos as instruções de redefinição.
                </p>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.login@instituicao.edu.br"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
              />
              {sent ? (
                <p className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
                  Se o e-mail existir, você receberá um e-mail com o link de redefinição.
                </p>
              ) : null}
              <button
                type="submit"
                disabled={enviando || sent}
                className="w-full rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-[oklch(0.19_0.06_265)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Enviar instruções"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReset(false);
                  setSent(false);
                }}
                className="w-full text-center text-xs text-white/60 hover:text-white"
              >
                Voltar para o login
              </button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setErro(null);
                setEnviando(true);
                login(email, senha)
                  .then(() => navigate({ to: "/", replace: true }))
                  .catch((err: unknown) => {
                    if (err instanceof ApiUnavailableError) {
                      setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
                    } else if (err instanceof ApiError && err.status === 401) {
                      setErro("Login ou senha inválidos.");
                    } else {
                      setErro("Não foi possível entrar. Tente novamente.");
                    }
                  })
                  .finally(() => setEnviando(false));
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/70">Login</span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.login@instituicao.edu.br"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/70">Senha</span>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                />
              </label>
              {erro ? (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200">{erro}</p>
              ) : null}
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-[oklch(0.19_0.06_265)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {enviando ? "Entrando…" : "Entrar"}
              </button>
              <button
                type="button"
                onClick={() => setReset(true)}
                className="w-full text-center text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
              >
                Esqueci minha senha
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-white/60">
          Cursos livres e certificações:{" "}
          <Link to="/boost-portal" className="font-medium text-white underline-offset-4 hover:underline">
            acessar o Rooster Boost
          </Link>
        </p>
      </div>
    </div>
  );
}