// Conferência pública de certificado — a ponta externa do Rooster Boost.
//
// Quem chega aqui normalmente NÃO tem conta: é um empregador ou a secretaria
// de outra instituição conferindo o código impresso num certificado que
// recebeu. Por isso a página não exige login e não depende de nada da sessão.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Search, ShieldAlert, ShieldX } from "lucide-react";
import { cursosBoostPortalService, type CertificadoVerificado } from "@/services/boost-portal/cursos.service";
import { fmtData } from "@/lib/formatacao";

type Resultado =
  | { tipo: "valido"; dados: CertificadoVerificado }
  | { tipo: "invalido" }
  | { tipo: "erro" };

export const Route = createFileRoute("/boost-portal/verificar")({
  head: () => ({
    meta: [
      { title: "Conferir certificado — Rooster Boost" },
      { name: "description", content: "Confira a autenticidade de um certificado do Rooster Boost pelo código impresso nele." },
    ],
  }),
  // O código pode vir na URL (?codigo=RB-2026-XXXX), para o certificado poder
  // trazer um link direto além do código digitável.
  validateSearch: (search: Record<string, unknown>): { codigo?: string } => ({
    codigo: typeof search.codigo === "string" ? search.codigo : undefined,
  }),
  component: VerificarCertificadoPage,
});

function VerificarCertificadoPage() {
  const { codigo: codigoDaUrl } = Route.useSearch();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState(codigoDaUrl ?? "");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [verificando, setVerificando] = useState(false);

  async function verificar(valor: string) {
    const limpo = valor.trim();
    if (!limpo) return;
    setVerificando(true);
    setResultado(null);
    try {
      const dados = await cursosBoostPortalService.verificarCertificado(limpo);
      setResultado(dados ? { tipo: "valido", dados } : { tipo: "invalido" });
    } catch {
      // Falha de rede não é "certificado inválido" — dizer que é seria pior
      // do que não responder: alguém concluiria que o documento é falso.
      setResultado({ tipo: "erro" });
    } finally {
      setVerificando(false);
    }
  }

  // Verifica sozinho quando o código chega pela URL.
  useEffect(() => {
    if (codigoDaUrl) void verificar(codigoDaUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoDaUrl]);

  function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    void navigate({ to: "/boost-portal/verificar", search: { codigo: codigo.trim() || undefined } });
    void verificar(codigo);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Conferir certificado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Digite o código impresso no certificado para confirmar que ele foi emitido pelo Rooster Boost.
        </p>
      </div>

      <form onSubmit={aoEnviar} className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="codigo-certificado">
          Código do certificado
        </label>
        <input
          id="codigo-certificado"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="RB-2026-XXXXXXXX"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="submit"
          disabled={!codigo.trim() || verificando}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          {verificando ? "Conferindo..." : "Conferir"}
        </button>
      </form>

      {/* aria-live: quem usa leitor de tela precisa ser avisado do resultado,
          que aparece sem mudar de página. */}
      <div aria-live="polite" className="mt-6">
        {resultado?.tipo === "valido" && (
          <div className="rounded-2xl border border-emerald-600/30 bg-emerald-50/60 p-5 dark:bg-emerald-950/20">
            <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
              <BadgeCheck className="h-5 w-5" /> Certificado autêntico
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Concluído por</dt>
                <dd className="text-sm font-medium">{resultado.dados.aluno}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Curso</dt>
                <dd className="text-sm font-medium">{resultado.dados.curso}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Carga horária</dt>
                <dd className="text-sm font-medium">{resultado.dados.cargaHoraria}h</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Emitido em</dt>
                <dd className="text-sm font-medium">
                  {resultado.dados.emitidoEm
                    ? fmtData(resultado.dados.emitidoEm)
                    : "—"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 font-mono text-xs text-muted-foreground">{resultado.dados.codigo}</p>
          </div>
        )}

        {resultado?.tipo === "invalido" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="flex items-center gap-2 font-medium text-destructive">
              <ShieldX className="h-5 w-5" /> Certificado não encontrado
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum certificado do Rooster Boost corresponde a esse código. Confira se ele foi digitado corretamente —
              o código tem o formato <span className="font-mono">RB-ANO-XXXXXXXX</span>.
            </p>
          </div>
        )}

        {resultado?.tipo === "erro" && (
          <div className="rounded-2xl border p-5">
            <p className="flex items-center gap-2 font-medium">
              <ShieldAlert className="h-5 w-5" /> Não foi possível conferir agora
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Houve uma falha de comunicação com o servidor. Isso <strong>não</strong> significa que o certificado seja
              inválido — tente novamente em alguns instantes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
