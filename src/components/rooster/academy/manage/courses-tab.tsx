import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { academyService, toneFor, type Course, type Discipline, type Student } from "@/services/mock-api/academy.service";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal, ConfirmDialog,
  Field, TextInput, SelectInput, Btn, Select, SectionCard,
} from "@/components/shared";
import { academyCan } from "@/components/rooster/academy/permissions";
import { useRole } from "@/components/rooster/role-context";

type DraftCourse = { name: string; code: string; degree: Course["degree"]; active: boolean };

const EMPTY: DraftCourse = { name: "", code: "", degree: "Graduação", active: true };
const DEGREES: Course["degree"][] = ["Graduação", "Pós-graduação", "Técnico", "Extensão"];

function CourseStatusBadge({ active }: { active: boolean }) {
  const tone = active ? "oklch(0.62 0.18 155)" : "oklch(0.65 0.05 260)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ color: tone, background: `color-mix(in oklab, ${tone} 14%, transparent)`, border: `1px solid color-mix(in oklab, ${tone} 30%, transparent)` }}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

/**
 * Cursos da instituição. O curso é o primeiro cadastro do ciclo acadêmico: o aluno é sempre vinculado a um curso,
 * e a disciplina pode (opcionalmente) pertencer a um.
 */
export function CoursesTab() {
  const { role } = useRole();
  const canManage = academyCan(role, "manageCourses");
  const [rows, setRows] = useState<Course[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("todos");
  const [selected, setSelected] = useState<Course | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftCourse>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    academyService.getCourses()
      .then(setRows)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar cursos"))
      .finally(() => setLoading(false));
    academyService.getAll().then(setDisciplines).catch(() => setDisciplines([]));
    academyService.getStudents().then(setStudents).catch(() => setStudents([]));
  }, [refresh]);

  const filtered = useMemo(() => rows.filter((c) => {
    if (degreeFilter !== "todos" && c.degree !== degreeFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s);
    }
    return true;
  }), [rows, q, degreeFilter]);

  const disciplinesOf = (id: string) => disciplines.filter((d) => d.courseId === id);
  const studentsOf = (id: string) => students.filter((s) => s.courseId === id);

  const columns: Column<Course>[] = [
    { key: "name", header: "Curso", sortValue: (c) => c.name, cell: (c) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklab, ${toneFor(c.id)} 14%, transparent)`, color: toneFor(c.id) }}>
          <GraduationCap className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{c.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{c.code}</div>
        </div>
      </div>
    ) },
    { key: "degree", header: "Grau", sortValue: (c) => c.degree, cell: (c) => <span className="text-xs text-muted-foreground">{c.degree}</span> },
    { key: "disciplines", header: "Disciplinas", cell: (c) => <span className="text-xs">{disciplinesOf(c.id).length}</span> },
    { key: "students", header: "Alunos", cell: (c) => <span className="text-xs">{studentsOf(c.id).length}</span> },
    { key: "status", header: "Status", cell: (c) => <CourseStatusBadge active={c.active} /> },
  ];

  function validate(): boolean {
    if (draft.name.trim().length < 2 || draft.code.trim().length < 2) { setError("Preencha nome e código (ao menos 2 caracteres)."); return false; }
    return true;
  }

  function openNew() { setDraft(EMPTY); setError(null); setModalNew(true); }

  async function saveNew() {
    if (!validate()) return;
    try {
      await academyService.createCourse({ ...draft, name: draft.name.trim(), code: draft.code.trim() });
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Curso criado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar curso";
      setError(message);
      toast.error(message);
    }
  }

  function startEdit(c: Course) {
    setDraft({ name: c.name, code: c.code, degree: c.degree, active: c.active });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected || !validate()) return;
    try {
      const updated = await academyService.updateCourse(selected.id, { ...draft, name: draft.name.trim(), code: draft.code.trim() });
      if (updated) setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Curso atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar curso";
      setError(message);
      toast.error(message);
    }
  }

  async function doDelete() {
    if (!selected) return;
    try {
      await academyService.removeCourse(selected.id);
      setSelected(null);
      setRefresh((r) => r + 1);
      toast.success("Curso excluído com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir curso");
    }
  }

  const selectedDisciplines = selected ? disciplinesOf(selected.id) : [];
  const selectedStudents = selected ? studentsOf(selected.id) : [];
  const inUse = selectedDisciplines.length + selectedStudents.length > 0;

  return (
    <div>
      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por nome ou código…"
        filters={<Select value={degreeFilter} onChange={setDegreeFilter} options={[{ value: "todos", label: "Todos os graus" }, ...DEGREES.map((d) => ({ value: d, label: d }))]} />}
        trailing={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Novo curso</Btn> : undefined}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        onRowClick={(c) => { setSelected(c); setEditing(false); }}
        emptyMessage={loading ? "Carregando…" : rows.length === 0 ? "Nenhum curso cadastrado. Comece por aqui: o aluno é sempre vinculado a um curso." : "Nenhum curso encontrado"}
      />

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.code} · ${selected.degree}` : undefined}
        actions={canManage && selected ? (
          editing ? (
            <>
              <Btn onClick={() => setEditing(false)}>Cancelar</Btn>
              <Btn variant="solid" onClick={saveEdit}>Salvar</Btn>
            </>
          ) : (
            <>
              <Btn onClick={() => setConfirmDelete(true)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> Excluir</Btn>
              <Btn variant="solid" onClick={() => startEdit(selected)}><Pencil className="h-3.5 w-3.5" /> Editar</Btn>
            </>
          )
        ) : undefined}
      >
        {selected && !editing && (
          <div className="space-y-4">
            <SectionCard title="Detalhes">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[11px] text-muted-foreground">Código</dt><dd className="font-mono">{selected.code}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Grau</dt><dd>{selected.degree}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd><CourseStatusBadge active={selected.active} /></dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Alunos</dt><dd>{selectedStudents.length}</dd></div>
              </dl>
            </SectionCard>
            <SectionCard title="Disciplinas do curso" description={`${selectedDisciplines.length} disciplina(s) — o vínculo é definido na aba Disciplinas`}>
              <ul className="space-y-2">
                {selectedDisciplines.map((d) => (
                  <li key={d.id} className="rounded-lg border p-2.5 text-sm">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.code} · {d.workload}h</div>
                  </li>
                ))}
                {selectedDisciplines.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma disciplina vinculada.</li>}
              </ul>
            </SectionCard>
          </div>
        )}
        {selected && editing && <CourseForm draft={draft} setDraft={setDraft} error={error} />}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Novo curso" description="Cadastre um curso oferecido pela instituição." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <CourseForm draft={draft} setDraft={setDraft} error={error} />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        title="Excluir curso"
        description={inUse
          ? "Este curso possui disciplinas ou alunos vinculados e não pode ser excluído enquanto houver vínculos. Para tirá-lo de uso, edite e marque como inativo."
          : "Esta ação removerá o curso do catálogo."}
      />
    </div>
  );
}

function CourseForm({ draft, setDraft, error }: { draft: DraftCourse; setDraft: (d: DraftCourse) => void; error?: string | null }) {
  return (
    <div className="space-y-3">
      <Field label="Nome" required><TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ex. Engenharia de Software" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Código" required hint="Único entre os cursos."><TextInput value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="ENGSOFT" /></Field>
        <Field label="Grau"><SelectInput value={draft.degree} onChange={(e) => setDraft({ ...draft, degree: e.target.value as Course["degree"] })} options={DEGREES.map((d) => ({ value: d, label: d }))} /></Field>
      </div>
      <Field label="Status"><SelectInput value={draft.active ? "ativo" : "inativo"} onChange={(e) => setDraft({ ...draft, active: e.target.value === "ativo" })} options={[{ value: "ativo", label: "Ativo" }, { value: "inativo", label: "Inativo" }]} /></Field>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
