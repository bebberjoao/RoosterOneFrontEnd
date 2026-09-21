// Cadastro do portal público Rooster Boost — cria um BoostUsuario novo
// (POST /boost/cadastro), sem nenhuma relação com o cadastro de usuários do
// Hub. Mesmo fluxo de preservação de destino que boost-portal.entrar.tsx.
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BoostApiError, BoostApiUnavailableError, useBoostAuth } from "@/services/boost-portal/auth-context";

export const Route = createFileRoute("/boost-portal/cadastro")({
  validateSearch: (search: Record<string, unknown>) =>
    ({
      slug: typeof search.slug === "string" ? search.slug : undefined,
      matriculaId: typeof search.matriculaId === "string" ? search.matriculaId : undefined,
    }) as { slug?: string; matriculaId?: string },
  head: () => ({ meta: [{ title: "Criar conta — Rooster Boost" }] }),
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const { slug, matriculaId } = Route.useSearch();
  const { cadastro } = useBoostAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function aposCadastro() {
    if (slug) navigate({ to: "/boost-portal/cursos/$slug", params: { slug }, search: { matricular: "1" }, replace: true });
    else if (matriculaId) navigate({ to: "/boost-portal/painel/$matriculaId", params: { matriculaId }, replace: true });
    else navigate({ to: "/boost-portal/painel", replace: true });
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-8">
      <h1 className="text-xl font-semibold">Criar conta no Rooster Boost</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Gratuito. Use para se matricular, acompanhar seu progresso e baixar certificados.</p>

      <form
        className="mt-6 w-full space-y-4 rounded-2xl border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setErro(null);
          if (senha.length < 8) {
            setErro("A senha deve ter pelo menos 8 caracteres.");
            return;
          }
          setEnviando(true);
          cadastro(nome, email, senha)
            .then(aposCadastro)
            .catch((err: unknown) => {
              if (err instanceof BoostApiUnavailableError) setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
              else if (err instanceof BoostApiError && err.status === 409) setErro("Já existe uma conta com este e-mail.");
              else if (err instanceof BoostApiError) setErro(err.message);
              else setErro("Não foi possível criar a conta. Tente novamente.");
            })
            .finally(() => setEnviando(false));
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome</span>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome completo"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
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
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        {erro ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p> : null}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Criando conta…" : "Criar conta"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/boost-portal/entrar" search={{ slug, matriculaId }} className="font-medium text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
