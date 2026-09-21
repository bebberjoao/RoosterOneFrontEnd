import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { academyService, type Discipline, type Course, type SchoolClass } from "@/services/mock-api/academy.service";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, Btn, Select, SectionCard,
} from "@/components/shared";
import { DisciplineStatusBadge } from "@/components/rooster/academy/badges";
import { academyCan } from "@/components/rooster/academy/permissions";
import { useRole } from "@/components/rooster/role-context";

type DraftDiscipline = {
  name: string; code: string; description: string; courseId: string; workload: number; status: Discipline["status"];
};

const EMPTY: DraftDiscipline = { name: "", code: "", description: "", courseId: "", workload: 60, status: "ativa" };

export function DisciplinesTab() {
  const { role } = useRole();
  const canManage = academyCan(role, "manageDisciplines");
  const [rows, setRows] = useState<Discipline[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [q, setQ] = useState("");
  const [courseFilter, setCourseFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selected, setSelected] = useState<Discipline | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftDiscipline>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    academyService.getAll().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar disciplinas"));
    academyService.getCourses().then(setCourses);
    academyService.getClasses().then(setClasses);
  }, [refresh]);

  const courseById = (id: string) => courses.find((c) => c.id === id);

  const filtered = useMemo(() => rows.filter((d) => {
    if (courseFilter !== "todos" && d.courseId !== courseFilter) return false;
    if (statusFilter !== "todos" && d.status !== statusFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      return d.name.toLowerCase().includes(s) || d.code.toLowerCase().includes(s);
    }
    return true;
  }), [rows, q, courseFilter, statusFilter]);

  const columns: Column<Discipline>[] = [
    { key: "name", header: "Disciplina", sortValue: (d) => d.name, cell: (d) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklab, ${d.accent} 14%, transparent)`, color: d.accent }}>
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{d.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{d.code}</div>
        </div>
      </div>
    ) },
    { key: "course", header: "Curso", cell: (d) => <span className="text-xs text-muted-foreground">{courseById(d.courseId)?.name}</span> },
    { key: "workload", header: "CH", sortValue: (d) => d.workload, cell: (d) => <span className="text-xs">{d.workload}h</span> },
    { key: "classes", header: "Turmas", cell: (d) => <span className="text-xs text-muted-foreground">{classes.filter((k) => k.disciplineId === d.id).length}</span> },
    { key: "status", header: "Status", cell: (d) => <DisciplineStatusBadge status={d.status} /> },
  ];

  function openNew() {
    setDraft(EMPTY);
    setError(null);
    setModalNew(true);
  }

  async function saveNew() {
    if (!draft.name.trim() || !draft.code.trim() || !draft.courseId) { setError("Preencha nome, código e curso."); return; }
    try {
      await academyService.create(draft);
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Disciplina criada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar disciplina";
      setError(message);
      toast.error(message);
    }
  }

  function startEdit(d: Discipline) {
    setDraft({ name: d.name, code: d.code, description: d.description, courseId: d.courseId, workload: d.workload, status: d.status });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      const updated = await academyService.update(selected.id, draft);
      if (updated) setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Disciplina atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar disciplina";
      setError(message);
      toast.error(message);
    }
  }

  async function doDelete() {
    if (!selected) return;
    try {
      await academyService.remove(selected.id);
      setSelected(null);
      setRefresh((r) => r + 1);
      toast.success("Disciplina excluída com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir disciplina");
    }
  }

  const disciplineClasses = selected ? classes.filter((k) => k.disciplineId === selected.id) : [];

  return (
    <div>
      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por nome ou código…"
        filters={
          <>
            <Select value={courseFilter} onChange={setCourseFilter} options={[{ value: "todos", label: "Todos os cursos" }, ...courses.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "todos", label: "Todos status" }, { value: "ativa", label: "Ativa" }, { value: "arquivada", label: "Arquivada" }, { value: "inativa", label: "Inativa" }]} />
          </>
        }
        trailing={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Nova disciplina</Btn> : undefined}
      />

      <DataTable rows={filtered} columns={columns} onRowClick={(d) => { setSelected(d); setEditing(false); }} emptyMessage="Nenhuma disciplina encontrada" />

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.code} · ${courseById(selected.courseId)?.name}` : undefined}
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
                <div><dt className="text-[11px] text-muted-foreground">Carga horária</dt><dd>{selected.workload}h</dd></div>
                <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Curso</dt><dd>{courseById(selected.courseId)?.name}</dd></div>
                <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Descrição</dt><dd className="text-muted-foreground">{selected.description || "—"}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd><DisciplineStatusBadge status={selected.status} /></dd></div>
              </dl>
            </SectionCard>
            <SectionCard title="Turmas vinculadas" description={`${disciplineClasses.length} turma(s) — o período letivo e o professor são definidos por turma`}>
              <ul className="space-y-2">
                {disciplineClasses.map((k) => (
                  <li key={k.id} className="rounded-lg border p-2.5 text-sm">
                    <div className="font-medium">{k.code}</div>
                    <div className="text-[11px] text-muted-foreground">{k.schedule || "Horário a definir"} · {k.enrolledCount}/{k.capacity} alunos</div>
                  </li>
                ))}
                {disciplineClasses.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma turma vinculada.</li>}
              </ul>
            </SectionCard>
          </div>
        )}
        {selected && editing && (
          <DisciplineForm draft={draft} setDraft={setDraft} courses={courses} error={error} />
        )}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nova disciplina" description="Cadastre uma disciplina no catálogo acadêmico." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <DisciplineForm draft={draft} setDraft={setDraft} courses={courses} error={error} />
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir disciplina" description="Esta ação removerá a disciplina do catálogo. Turmas vinculadas não serão excluídas." />
    </div>
  );
}

function DisciplineForm({ draft, setDraft, courses, error }: {
  draft: DraftDiscipline; setDraft: (d: DraftDiscipline) => void; courses: Course[]; error?: string | null;
}) {
  return (
    <div className="space-y-3">
      <Field label="Nome"><TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ex. Estrutura de Dados" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Código"><TextInput value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="ENG-SW-215" /></Field>
        <Field label="Carga horária"><TextInput type="number" value={draft.workload} onChange={(e) => setDraft({ ...draft, workload: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Descrição"><TextArea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Ementa resumida da disciplina." /></Field>
      <Field label="Curso"><SelectInput value={draft.courseId} onChange={(e) => setDraft({ ...draft, courseId: e.target.value })} options={courses.map((c) => ({ value: c.id, label: c.name }))} /></Field>
      <Field label="Status"><SelectInput value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Discipline["status"] })} options={[{ value: "ativa", label: "Ativa" }, { value: "arquivada", label: "Arquivada" }, { value: "inativa", label: "Inativa" }]} /></Field>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
