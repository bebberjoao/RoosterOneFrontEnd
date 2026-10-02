// Recuperação de senha da conta do portal Rooster Boost (aluno externo). Solicita o envio do link de
// redefinição por e-mail (POST /boost/esqueci-senha). A resposta é sempre a mesma, exista ou não a conta,
// para não revelar quais e-mails estão cadastrados. O aluno da instituição recupera a senha no sistema
// principal (/login), pois acessa o portal com a conta institucional.
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { BoostApiUnavailableError, request } from "@/services/boost-portal/client";

export const Route = createFileRoute("/boost-portal/esqueci-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — Rooster Boost" }] }),
  component: EsqueciSenhaPage,
});

function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-8">
      <h1 className="text-xl font-semibold">Recuperar senha</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Conta de aluno externo do Rooster Boost.</p>

      <div className="mt-6 w-full rounded-2xl border bg-card p-6">
        {enviado ? (
          <div className="space-y-3 text-center">
            <MailCheck className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="text-sm">
              Se o e-mail estiver cadastrado, as instruções de redefinição foram enviadas. O link é válido por 1 hora e pode
              ser utilizado uma única vez.
            </p>
            <p className="text-xs text-muted-foreground">Verifique também a caixa de spam.</p>
            <Link to="/boost-portal/entrar" search={{ modo: "externo" }} className="inline-block text-sm font-medium underline-offset-4 hover:underline">
              Voltar para Entrar
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setErro(null);
              setEnviando(true);
              request("/boost/esqueci-senha", { method: "POST", body: { email } })
                .then(() => setEnviado(true))
                .catch((err: unknown) => {
                  if (err instanceof BoostApiUnavailableError) setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
                  else setEnviado(true); // resposta genérica, sem expor detalhes
                })
                .finally(() => setEnviando(false));
            }}
          >
            <p className="text-xs text-muted-foreground">
              Informe o e-mail da conta do portal. Será enviado um link para a definição de nova senha.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            {erro ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p> : null}
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Enviar link de redefinição"}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Aluno da instituição?{" "}
              <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                Recupere a senha no sistema da instituição
              </Link>
            </p>
            <p className="text-center text-xs">
              <Link to="/boost-portal/entrar" search={{ modo: "externo" }} className="text-muted-foreground underline-offset-4 hover:underline">
                Voltar para Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
