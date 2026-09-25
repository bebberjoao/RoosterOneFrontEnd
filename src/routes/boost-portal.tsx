// Layout público do portal Rooster Boost — para alunos externos, SEM
// nenhum vínculo com o Hub. Propositalmente NÃO usa <AppShell> (sidebar/menu
// interno do Rooster One): tem cabeçalho e navegação próprios, como
// src/routes/login.tsx. Todas as rotas "/boost-portal/*" ficam dentro do
// <BoostAuthProvider>, que fala com a sessão Boost (localStorage próprio,
// completamente separada da sessão do Hub — ver services/boost-portal/session.ts).
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { GraduationCap, LogOut, User } from "lucide-react";
import logoAsset from "@/assets/rooster-logo.png.asset.json";
import { BoostAuthProvider, useBoostAuth } from "@/services/boost-portal/auth-context";

export const Route = createFileRoute("/boost-portal")({
  head: () => ({
    meta: [
      { title: "Rooster Boost — Cursos e certificações" },
      { name: "description", content: "Aprenda no seu ritmo: cursos livres, certificações e acompanhamento com instrutores no Rooster Boost." },
      { property: "og:title", content: "Rooster Boost — Cursos e certificações" },
      { property: "og:description", content: "Catálogo público de cursos, matrícula e certificados do Rooster Boost." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <BoostAuthProvider>
      <BoostPortalLayout />
    </BoostAuthProvider>
  ),
});

function BoostPortalLayout() {
  const { authed, ready, usuario, logout } = useBoostAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/boost-portal" className="flex items-center gap-2.5">
            <img src={logoAsset.url} alt="Rooster One" className="h-8 w-8" />
            <div className="leading-tight">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                Rooster Boost <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              </p>
              <p className="text-[11px] text-muted-foreground">Cursos e certificações</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/boost-portal"
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${pathname === "/boost-portal" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              Catálogo
            </Link>
            {/* Visível para todo mundo, logado ou não: quem confere um
                certificado costuma não ter conta no portal. */}
            <Link
              to="/boost-portal/verificar"
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${pathname.startsWith("/boost-portal/verificar") ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              Conferir certificado
            </Link>
            {!ready ? null : authed ? (
              <>
                <Link
                  to="/boost-portal/painel"
                  className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${pathname.startsWith("/boost-portal/painel") ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                >
                  Meu painel
                </Link>
                <span className="mx-1 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <User className="h-3.5 w-3.5" /> {usuario?.nome}
                </span>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/boost-portal/entrar" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  Entrar
                </Link>
                <Link to="/boost-portal/cadastro" className="rounded-lg bg-foreground px-3 py-1.5 font-medium text-background transition-opacity hover:opacity-90">
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t bg-card py-4 text-center text-xs text-muted-foreground">
        Rooster Boost — parte do ecossistema Rooster One.
      </footer>
    </div>
  );
}
