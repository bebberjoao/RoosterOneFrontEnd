import { useEffect, useMemo, useState } from "react";
import { Mail, Clock3, BookOpen, Users, Pencil, Trash2, Plus } from "lucide-react";
import { academyService } from "@/services/mock-api";
import type { Teacher } from "@/mock/database/teachers";
import type { Discipline } from "@/mock/database/disciplines";
import type { SchoolClass } from "@/mock/database/classes";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal, ConfirmDialog,
  Field, TextInput, SelectInput, Btn, Select, SectionCard, Avatar,
} from "@/components/shared";
import { TeacherStatusBadge } from "@/components/rooster/academy/badges";
import { academyCan } from "@/components/rooster/academy/permissions";
import { useRole } from "@/components/rooster/role-context";

type DraftTeacher = {
  name: string; initials: string; email: string; title: string; department: string;
  weeklyHours: number; status: Teacher["status"]; tone: string;
};

const EMPTY: DraftTeacher = { name: "", initials: "", email: "", title: "Prof.", department: "", weeklyHours: 12, status: "ativo", tone: "oklch(0.55 0.19 265)" };

export function TeachersTab() {
  const { role } = useRole();
  const canManage = academyCan(role, "manageTeachers");
  const [rows, setRows] = useState<Teacher[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState("todos");
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftTeacher>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    academyService.getTeachers().then(setRows);
    academyService.getAll().then(setDisciplines);
    academyService.getClasses().then(setClasses);
  }, [refresh]);

  const depts = useMemo(() => Array.from(new Set(rows.map((t) => t.department))), [rows]);

  const filtered = useMemo(() => rows.filter((t) => {
    if (deptFilter !== "todos" && t.department !== deptFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      return t.name.toLowerCase().includes(s) || t.email.toLowerCase().includes(s);
    }
    return true;
  }), [rows, q, deptFilter]);

  const columns: Column<Teacher>[] = [
    { key: "name", header: "Professor", sortValue: (t) => t.name, cell: (t) => (
      <div className="flex items-center gap-3">
        <Avatar initials={t.initials} tone={t.tone} size={32} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{t.title} {t.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{t.department}</div>
        </div>
      </div>
    ) },
    { key: "email", header: "E-mail", cell: (t) => <span className="text-xs text-muted-foreground">{t.email}</span> },
    { key: "disciplines", header: "Disciplinas", cell: (t) => <span className="text-xs">{disciplines.filter((d) => d.teacherId === t.id).length}</span> },
    { key: "classes", header: "Turmas", cell: (t) => <span className="text-xs">{classes.filter((k) => k.teacherId === t.id).length}</span> },
    { key: "weeklyHours", header: "CH semanal", sortValue: (t) => t.weeklyHours, cell: (t) => <span className="text-xs">{t.weeklyHours}h</span> },
    { key: "status", header: "Status", cell: (t) => <TeacherStatusBadge status={t.status} /> },
  ];

  function openNew() { setDraft(EMPTY); setModalNew(true); }

  async function saveNew() {
    await academyService.createTeacher(draft as Omit<Teacher, "id" | "userId">);
    setModalNew(false);
    setRefresh((r) => r + 1);
  }

  function startEdit(t: Teacher) {
    setDraft({ name: t.name, initials: t.initials, email: t.email, title: t.title, department: t.department, weeklyHours: t.weeklyHours, status: t.status, tone: t.tone });
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    const updated = await academyService.updateTeacher(selected.id, draft);
    if (updated) setSelected(updated);
    setEditing(false);
    setRefresh((r) => r + 1);
  }

  async function doDelete() {
    if (!selected) return;
    await academyService.removeTeacher(selected.id);
    setSelected(null);
    setRefresh((r) => r + 1);
  }

  const teacherDisciplines = selected ? disciplines.filter((d) => d.teacherId === selected.id) : [];
  const teacherClasses = selected ? classes.filter((k) => k.teacherId === selected.id) : [];

  return (
    <div>
      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por nome ou e-mail…"
        filters={<Select value={deptFilter} onChange={setDeptFilter} options={[{ value: "todos", label: "Todos departamentos" }, ...depts.map((d) => ({ value: d, label: d }))]} />}
        trailing={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Novo professor</Btn> : undefined}
      />

      <DataTable rows={filtered} columns={columns} onRowClick={(t) => { setSelected(t); setEditing(false); }} emptyMessage="Nenhum professor encontrado" />

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected ? `${selected.title} ${selected.name}` : ""}
        subtitle={selected?.department}
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
            <SectionCard title="Contato">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><dd>{selected.email}</dd></div>
                <div className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" /><dd>{selected.weeklyHours}h/semana</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd><TeacherStatusBadge status={selected.status} /></dd></div>
              </dl>
            </SectionCard>
            <SectionCard title="Disciplinas ministradas" description={`${teacherDisciplines.length} disciplina(s)`}>
              <ul className="space-y-2">
                {teacherDisciplines.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm"><BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> {d.code} · {d.name}</li>
                ))}
                {teacherDisciplines.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma disciplina vinculada.</li>}
              </ul>
            </SectionCard>
            <SectionCard title="Turmas atribuídas" description={`${teacherClasses.length} turma(s)`}>
              <ul className="space-y-2">
                {teacherClasses.map((k) => (
                  <li key={k.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm"><Users className="h-3.5 w-3.5 text-muted-foreground" /> {k.code} · {k.schedule}</li>
                ))}
                {teacherClasses.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma turma vinculada.</li>}
              </ul>
            </SectionCard>
          </div>
        )}
        {selected && editing && <TeacherForm draft={draft} setDraft={setDraft} />}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Novo professor" description="Cadastre um membro do corpo docente." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <TeacherForm draft={draft} setDraft={setDraft} />
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir professor" description="Esta ação removerá o professor do corpo docente." />
    </div>
  );
}

function TeacherForm({ draft, setDraft }: { draft: DraftTeacher; setDraft: (d: DraftTeacher) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Título"><TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Prof. Dr." /></Field>
        <Field label="Iniciais"><TextInput value={draft.initials} onChange={(e) => setDraft({ ...draft, initials: e.target.value })} placeholder="AB" /></Field>
      </div>
      <Field label="Nome"><TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nome completo" /></Field>
      <Field label="E-mail"><TextInput type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="nome@instituicao.edu" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Departamento"><TextInput value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} /></Field>
        <Field label="CH semanal"><TextInput type="number" value={draft.weeklyHours} onChange={(e) => setDraft({ ...draft, weeklyHours: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Status"><SelectInput value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Teacher["status"] })} options={[{ value: "ativo", label: "Ativo" }, { value: "afastado", label: "Afastado" }, { value: "inativo", label: "Inativo" }]} /></Field>
    </div>
  );
}
