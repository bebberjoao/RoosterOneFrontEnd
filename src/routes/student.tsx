import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/rooster/app-shell";
import { PageHeader } from "@/components/rooster/page-header";
import { useRole } from "@/components/rooster/role-context";
import { StudentGlobalSearch } from "@/components/rooster/student/global-search";
import { PROFILE } from "@/components/rooster/student/mock-data";
import { Avatar } from "@/components/rooster/student/ui";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Rooster Student — Portal do aluno" },
      { name: "description", content: "Disciplinas, notas, frequência, atividades, financeiro, cursos e documentos em um só lugar." },
      { property: "og:title", content: "Rooster Student — Portal do aluno" },
      { property: "og:description", content: "Portal acadêmico completo integrado ao Rooster One." },
    ],
  }),
  component: StudentLayout,
});

const TABS = [
  { to: "/student", label: "Início", exact: true },
  { to: "/student/profile", label: "Perfil" },
  { to: "/student/disciplines", label: "Disciplinas" },
  { to: "/student/activities", label: "Atividades" },
  { to: "/student/grades", label: "Notas" },
  { to: "/student/attendance", label: "Frequência" },
  { to: "/student/history", label: "Histórico" },
  { to: "/student/calendar", label: "Calendário" },
  { to: "/student/courses", label: "Cursos" },
  { to: "/student/finance", label: "Financeiro" },
  { to: "/student/reservations", label: "Reservas" },
  { to: "/student/tickets", label: "Chamados" },
  { to: "/student/documents", label: "Documentos" },
  { to: "/student/notifications", label: "Notificações" },
];

function StudentLayout() {
  const { role } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (role !== "aluno" && role !== "admin") {
    return (
      <AppShell>
        <PageHeader eyebrow="Rooster Student" title="Acesso restrito" description="O portal do aluno é exclusivo para estudantes e administradores." />
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Troque o perfil para <strong>Aluno</strong> no seletor superior para visualizar o portal.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <Avatar initials={PROFILE.initials} tone={PROFILE.photoTone} size={44} />
          <div>
            <p className="text-sm font-semibold">{PROFILE.name}</p>
            <p className="text-xs text-muted-foreground">
              {PROFILE.course} · {PROFILE.semester} · RA {PROFILE.ra}
            </p>
          </div>
        </div>
        <StudentGlobalSearch />
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </AppShell>
  );
}
