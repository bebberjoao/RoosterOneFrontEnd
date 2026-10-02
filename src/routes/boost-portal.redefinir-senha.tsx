// Definição de nova senha da conta do portal Rooster Boost a partir do link recebido por e-mail
// (POST /boost/redefinir-senha). O token é de uso único e válido por 1 hora.
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { BoostApiError, BoostApiUnavailableError, request } from "@/services/boost-portal/client";

export const Route = createFileRoute("/boost-portal/redefinir-senha")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({ meta: [{ title: "Redefinir senha — Rooster Boost" }] }),
  component: RedefinirSenhaBoostPage,
});

function RedefinirSenhaBoostPage() {
  const { token } = Route.useSearch();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-8">
      <h1 className="text-xl font-semibold">Redefinir senha</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Defina a nova senha da conta do portal.</p>

      <div className="mt-6 w-full rounded-2xl border bg-card p-6">
        {!token ? (
          <div className="space-y-3 text-center">
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">
              Link inválido: o token de redefinição não foi informado.
            </p>
            <Link to="/boost-portal/esqueci-senha" className="text-sm font-medium underline-offset-4 hover:underline">
              Solicitar novo link
            </Link>
          </div>
        ) : ok ? (
          <div className="space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="text-sm">Senha redefinida com sucesso.</p>
            <Link
              to="/boost-portal/entrar"
              search={{ modo: "externo" }}
              className="inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              Entrar com a nova senha
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setErro(null);
              if (novaSenha.length < 8) return setErro("A senha deve ter no mínimo 8 caracteres.");
              if (novaSenha !== confirmar) return setErro("A confirmação não corresponde à nova senha.");
              setEnviando(true);
              request("/boost/redefinir-senha", { method: "POST", body: { token, novaSenha } })
                .then(() => setOk(true))
                .catch((err: unknown) => {
                  if (err instanceof BoostApiUnavailableError) setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
                  else if (err instanceof BoostApiError && err.status === 400) setErro("Link de redefinição inválido ou expirado. Solicite um novo link.");
                  else setErro("Não foi possível redefinir a senha. Tente novamente.");
                })
                .finally(() => setEnviando(false));
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nova senha</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">Mínimo de 8 caracteres.</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirmar nova senha</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            {erro ? (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">
                {erro}{" "}
                {erro.startsWith("Link") && (
                  <Link to="/boost-portal/esqueci-senha" className="font-medium underline">Solicitar novo link</Link>
                )}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? "Salvando…" : "Redefinir senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
