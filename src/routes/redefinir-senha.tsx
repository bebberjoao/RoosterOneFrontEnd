import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import logoAsset from "@/assets/rooster-logo.png.asset.json";
import { ApiError, ApiUnavailableError, useAuth } from "@/components/rooster/auth-context";

export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Redefinir senha — Rooster One" },
      { name: "description", content: "Defina uma nova senha para acessar o Rooster One." },
    ],
  }),
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const { token } = Route.useSearch();
  const { resetPassword } = useAuth();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-[oklch(0.19_0.06_265)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logoAsset.url} alt="Rooster One" className="h-16 w-16 brightness-0 invert" />
          <h1 className="mt-4 text-2xl font-semibold text-white">Redefinir senha</h1>
          <p className="mt-1 text-sm text-white/60">Escolha uma nova senha de acesso</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          {!token ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200">
              Link inválido: nenhum token foi informado. Solicite um novo link na tela de login.
            </p>
          ) : ok ? (
            <div className="space-y-4">
              <p className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
                Senha redefinida com sucesso. Você já pode entrar com a nova senha.
              </p>
              <Link
                to="/login"
                className="block w-full rounded-lg bg-white px-3 py-2.5 text-center text-sm font-medium text-[oklch(0.19_0.06_265)] transition-opacity hover:opacity-90"
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setErro(null);
                if (novaSenha.length < 6) {
                  setErro("A senha deve ter pelo menos 6 caracteres.");
                  return;
                }
                if (novaSenha !== confirmar) {
                  setErro("As senhas não coincidem.");
                  return;
                }
                setEnviando(true);
                resetPassword(token, novaSenha)
                  .then(() => setOk(true))
                  .catch((err: unknown) => {
                    if (err instanceof ApiUnavailableError) {
                      setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
                    } else if (err instanceof ApiError) {
                      setErro(err.message);
                    } else {
                      setErro("Não foi possível redefinir a senha. Tente novamente.");
                    }
                  })
                  .finally(() => setEnviando(false));
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/70">Nova senha</span>
                <input
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/70">Confirmar senha</span>
                <input
                  type="password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                />
              </label>
              {erro ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200">{erro}</p> : null}
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-[oklch(0.19_0.06_265)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {enviando ? "Redefinindo…" : "Redefinir senha"}
              </button>
              <Link to="/login" className="block w-full text-center text-xs text-white/60 hover:text-white">
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
