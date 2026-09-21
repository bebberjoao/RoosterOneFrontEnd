import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { academyService, type Student, type Course } from "@/services/mock-api/academy.service";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal, ConfirmDialog,
  Field, TextInput, SelectInput, Btn, Select, SectionCard, Avatar,
} from "@/components/shared";
import { academyCan } from "@/components/rooster/academy/permissions";
import { useRole } from "@/components/rooster/role-context";
import { UserPicker } from "./user-picker";

const STATUS_LABEL: Record<Student["status"], string> = { ativo: "Ativo", trancado: "Trancado", formado: "Formado", inativo: "Inativo" };
const STATUS_TONE: Record<Student["status"], string> = {
  ativo: "oklch(0.62 0.18 155)", trancado: "oklch(0.72 0.14 90)", formado: "oklch(0.55 0.19 265)", inativo: "oklch(0.65 0.05 260)",
};

function StudentStatusBadge({ status }: { status: Student["status"] }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ color: STATUS_TONE[status], background: `color-mix(in oklab, ${STATUS_TONE[status]} 14%, transparent)`, border: `1px solid color-mix(in oklab, ${STATUS_TONE[status]} 30%, transparent)` }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

type Draft = { usuarioId: string; ra: string; courseId: string; semester: number; status: Student["status"] };
const EMPTY: Draft = { usuarioId: "", ra: "", courseId: "", semester: 1, status: "ativo" };

export function StudentsTab() {
  const { role } = useRole();
  const canManage = academyCan(role, "manageStudents");

  const [rows, setRows] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [q, setQ] = useState("");
  const [courseFilter, setCourseFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selected, setSelected] = useState<Student | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([academyService.getStudents(), academyService.getCourses()])
      .then(([students, courseList]) => { setRows(students); setCourses(courseList); })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar alunos"))
      .finally(() => setLoading(false));
  }, [refresh]);

  const courseById = (id: string) => courses.find((c) => c.id === id);

  const filtered = useMemo(() => rows.filter((s) => {
    if (courseFilter !== "todos" && s.courseId !== courseFilter) return false;
    if (statusFilter !== "todos" && s.status !== statusFilter) return false;
    if (q) {
      const query = q.toLowerCase();
      return s.name.toLowerCase().includes(query) || s.ra.includes(query) || s.email.toLowerCase().includes(query);
    }
    return true;
  }), [rows, q, courseFilter, statusFilter]);

  const columns: Column<Student>[] = [
    { key: "name", header: "Aluno", sortValue: (s) => s.name, cell: (s) => (
      <div className="flex items-center gap-3">
        <Avatar initials={s.initials} tone="oklch(0.55 0.19 265)" size={32} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{s.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">RA {s.ra} · {s.email}</div>
        </div>
      </div>
    ) },
    { key: "course", header: "Curso", cell: (s) => <span className="text-xs text-muted-foreground">{courseById(s.courseId)?.name ?? "—"}</span> },
    { key: "semester", header: "Semestre", sortValue: (s) => s.semester, cell: (s) => <span className="text-xs">{s.semester}º</span> },
    { key: "status", header: "Situação", cell: (s) => <StudentStatusBadge status={s.status} /> },
  ];

  function openNew() { setDraft(EMPTY); setError(null); setModalNew(true); }

  async function saveNew() {
    if (!draft.usuarioId || !draft.ra.trim() || !draft.courseId) { setError("Selecione um usuário, informe o RA e o curso."); return; }
    try {
      await academyService.createStudent({ usuarioId: draft.usuarioId, ra: draft.ra.trim(), courseId: draft.courseId, semester: draft.semester, status: draft.status });
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Aluno cadastrado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao cadastrar aluno";
      setError(message);
      toast.error(message);
    }
  }

  function startEdit(s: Student) {
    setDraft({ usuarioId: s.usuarioId, ra: s.ra, courseId: s.courseId, semester: s.semester, status: s.status });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      const updated = await academyService.updateStudent(selected.id, { ra: draft.ra, courseId: draft.courseId, semester: draft.semester, status: draft.status });
      if (updated) setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Aluno atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar alterações";
      setError(message);
      toast.error(message);
    }
  }

  async function toggleActive(s: Student) {
    const nextStatus: Student["status"] = s.status === "ativo" ? "inativo" : "ativo";
    try {
      const updated = await academyService.updateStudent(s.id, { status: nextStatus });
      if (updated && selected?.id === s.id) setSelected(updated);
      setRefresh((r) => r + 1);
      toast.success(nextStatus === "ativo" ? "Aluno ativado com sucesso" : "Aluno desativado com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao alterar situação do aluno");
    }
  }

  async function doDelete() {
    if (!selected) return;
    try {
      await academyService.removeStudent(selected.id);
      setSelected(null);
      setRefresh((r) => r + 1);
      toast.success("Aluno excluído com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir aluno");
    }
  }

  return (
    <div>
      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por nome, RA ou e-mail…"
        filters={
          <>
            <Select value={courseFilter} onChange={setCourseFilter} options={[{ value: "todos", label: "Todos os cursos" }, ...courses.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "todos", label: "Todas situações" }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))]} />
          </>
        }
        trailing={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Novo aluno</Btn> : undefined}
      />

      <DataTable rows={filtered} columns={columns} onRowClick={(s) => { setSelected(s); setEditing(false); }} emptyMessage={loading ? "Carregando…" : "Nenhum aluno encontrado"} />

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected?.name ?? ""}
        subtitle={selected ? `RA ${selected.ra} · ${courseById(selected.courseId)?.name ?? "—"}` : undefined}
        actions={canManage && selected ? (
          editing ? (
            <>
              <Btn onClick={() => setEditing(false)}>Cancelar</Btn>
              <Btn variant="solid" onClick={saveEdit}>Salvar</Btn>
            </>
          ) : (
            <>
              <Btn onClick={() => setConfirmDelete(true)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> Excluir</Btn>
              <Btn onClick={() => toggleActive(selected)}><Power className="h-3.5 w-3.5" /> {selected.status === "ativo" ? "Desativar" : "Ativar"}</Btn>
              <Btn variant="solid" onClick={() => startEdit(selected)}><Pencil className="h-3.5 w-3.5" /> Editar</Btn>
            </>
          )
        ) : undefined}
      >
        {selected && !editing && (
          <div className="space-y-4">
            <SectionCard title="Detalhes acadêmicos">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[11px] text-muted-foreground">RA</dt><dd className="font-mono">{selected.ra}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Semestre</dt><dd>{selected.semester}º</dd></div>
                <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Curso</dt><dd>{courseById(selected.courseId)?.name ?? "—"}</dd></div>
                <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">E-mail (Hub)</dt><dd>{selected.email}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Situação</dt><dd><StudentStatusBadge status={selected.status} /></dd></div>
              </dl>
            </SectionCard>
          </div>
        )}
        {selected && editing && <StudentForm draft={draft} setDraft={setDraft} courses={courses} error={error} lockUser />}
      </Drawer>

      <Modal
        open={modalNew}
        onClose={() => setModalNew(false)}
        title="Novo aluno"
        description="Vincule um usuário já existente do Hub ao cadastro acadêmico do aluno."
        footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}
      >
        <StudentForm draft={draft} setDraft={setDraft} courses={courses} error={error} />
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir aluno" description="Esta ação removerá o cadastro acadêmico do aluno (o usuário do Hub não é excluído)." />
    </div>
  );
}

function StudentForm({ draft, setDraft, courses, error, lockUser }: {
  draft: Draft; setDraft: (d: Draft) => void; courses: Course[]; error?: string | null; lockUser?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Field label="Usuário do Hub" required hint={lockUser ? "O vínculo com o usuário não pode ser alterado após o cadastro." : "Busque por nome ou e-mail de um usuário já cadastrado no Hub."}>
        {lockUser ? (
          <div className="rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
            <GraduationCap className="mr-1 inline h-3.5 w-3.5" /> Vínculo mantido — para trocar, exclua e recadastre o aluno.
          </div>
        ) : (
          <UserPicker value={draft.usuarioId} onChange={(usuarioId) => setDraft({ ...draft, usuarioId })} />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="RA" required><TextInput value={draft.ra} onChange={(e) => setDraft({ ...draft, ra: e.target.value })} placeholder="2026001" /></Field>
        <Field label="Semestre"><TextInput type="number" min={1} value={draft.semester} onChange={(e) => setDraft({ ...draft, semester: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Curso" required><SelectInput value={draft.courseId} onChange={(e) => setDraft({ ...draft, courseId: e.target.value })} options={courses.map((c) => ({ value: c.id, label: c.name }))} /></Field>
      <Field label="Situação"><SelectInput value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Student["status"] })} options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} /></Field>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
