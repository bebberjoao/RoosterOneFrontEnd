import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { DOCUMENTS } from "./mock-data";
import { studentService } from "@/services/mock-api/student.service";
import { learnService } from "@/services/mock-api/learn.service";
import { financeService } from "@/services/mock-api/finance.service";

type Hit = { id: string; label: string; group: string; to: string };

const STATIC_HITS: Hit[] = [
  { id: "p-grades", label: "Boletim e desempenho", group: "Portal", to: "/student/grades" },
  { id: "p-att", label: "Frequência e faltas", group: "Portal", to: "/student/attendance" },
  { id: "p-hist", label: "Histórico acadêmico e CR", group: "Portal", to: "/student/history" },
  { id: "p-cal", label: "Calendário acadêmico", group: "Portal", to: "/student/calendar" },
  { id: "p-prof", label: "Perfil acadêmico", group: "Portal", to: "/student/profile" },
  { id: "p-not", label: "Notificações", group: "Portal", to: "/student/notifications" },
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function StudentGlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<Hit[]>([
    ...DOCUMENTS.map((d) => ({ id: `doc-${d.id}`, label: d.name, group: "Documentos", to: "/student/documents" })),
    ...STATIC_HITS,
  ]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      studentService.getMyEnrollments().catch(() => []),
      learnService.getMyActivities().catch(() => []),
      financeService.me.getCobrancas().catch(() => []),
    ])
      .then(([disciplines, activities, cobrancas]) => {
        setIndex((prev) => [
          ...disciplines.map((d) => ({ id: `d-${d.id}`, label: `${d.code} — ${d.name}`, group: "Disciplinas", to: "/student/disciplines" })),
          ...activities.map((a) => ({ id: `a-${a.id}`, label: a.title, group: "Atividades", to: "/student/activities" })),
          ...cobrancas.map((c) => ({ id: `f-${c.id}`, label: c.descricao, group: "Financeiro", to: "/student/finance" })),
          ...prev,
        ]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return [];
    return index.filter((h) => norm(h.label).includes(n)).slice(0, 10);
  }, [q, index]);

  return (
    <div ref={box} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar disciplinas, atividades, documentos…"
        className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
      />
      {open && q.trim() ? (
        <div className="absolute z-[80] mt-2 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">Nenhum resultado para “{q}”.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    to={r.to}
                    onClick={() => { setOpen(false); setQ(""); }}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="truncate">{r.label}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{r.group}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
