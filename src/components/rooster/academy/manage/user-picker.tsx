// Seletor de Usuario do Hub — usado por Alunos e Professores para vincular
// o cadastro acadêmico a um usuário já existente (nunca cria um novo).
import { useEffect, useMemo, useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { usuariosService, type Usuario } from "@/services/hub";
import { TextInput, Avatar } from "@/components/shared";
import { initialsOf, toneFor } from "@/services/mock-api/academy.service";

export function UserPicker({ value, onChange }: { value: string; onChange: (usuarioId: string, usuario?: Usuario) => void }) {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usuariosService.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  const selected = users.find((u) => u.id === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter((u) => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-accent/30 p-2.5">
        <Avatar initials={initialsOf(selected.nome)} tone={toneFor(selected.id)} size={32} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{selected.nome}</div>
          <div className="truncate text-[11px] text-muted-foreground">{selected.email}</div>
        </div>
        <button type="button" onClick={() => onChange("")} className="shrink-0 rounded-md border px-2 py-1 text-[11px] hover:bg-accent">
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <TextInput className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou e-mail…" />
      </div>
      <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
        {loading && <li className="px-3 py-4 text-center text-xs text-muted-foreground">Carregando usuários…</li>}
        {!loading && filtered.length === 0 && <li className="px-3 py-4 text-center text-xs text-muted-foreground">Nenhum usuário encontrado.</li>}
        {filtered.slice(0, 30).map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => onChange(u.id, u)}
              className="flex w-full items-center gap-3 px-2.5 py-2 text-left hover:bg-accent/60"
            >
              <Avatar initials={initialsOf(u.nome)} tone={toneFor(u.id)} size={28} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{u.nome}</div>
                <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
              </div>
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
