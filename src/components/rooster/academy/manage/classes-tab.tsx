import { useEffect, useMemo, useState } from "react";
import { Users, Pencil, Trash2, Plus, UserPlus, UserMinus, Search, FileText, Upload } from "lucide-react";
import { academyService } from "@/services/mock-api";
import type { SchoolClass } from "@/mock/database/classes";
import type { Discipline, Term } from "@/mock/database/disciplines";
import type { Teacher } from "@/mock/database/teachers";
import type { Student } from "@/mock/database/students";
import type { AcademyDoc } from "@/mock/database/academyDocs";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, Btn, Select, SectionCard, TabBar, ProgressBar,
} from "@/components/shared";
import { KlassStatusBadge } from "@/components/rooster/academy/badges";
import { academyCan } from "@/components/rooster/academy/permissions";
import { useRole } from "@/components/rooster/role-context";

type DraftClass = {
  code: string; disciplineId: string; termId: string; shift: SchoolClass["shift"]; capacity: number;
  teacherId: string; roomLabel: string; schedule: string; status: SchoolClass["status"]; studentIds: string[];
};

const EMPTY: DraftClass = { code: "", disciplineId: "", termId: "", shift: "Matutino", capacity: 40, teacherId: "", roomLabel: "", schedule: "", status: "aberta", studentIds: [] };

export function ClassesTab() {
  const { role } = useRole();
  const canManage = academyCan(role, "manageClasses");
  const canEnroll = academyCan(role, "manageEnrollments");
  const canDocs = academyCan(role, "manageDocuments");

  const [rows, setRows] = useState<SchoolClass[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [docs, setDocs] = useState<AcademyDoc[]>([]);
  const [q, setQ] = useState("");
  const [shiftFilter, setShiftFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selected, setSelected] = useState<SchoolClass | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftClass>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [innerTab, setInnerTab] = useState("detalhes");
  const [studentQuery, setStudentQuery] = useState("");
  const [newDocName, setNewDocName] = useState("");

  useEffect(() => {
    academyService.getClasses().then(setRows);
    academyService.getAll().then(setDisciplines);
    academyService.getTerms().then(setTerms);
    academyService.getTeachers().then(setTeachers);
    academyService.getStudents().then(setStudents);
    academyService.getDocs().then(setDocs);
  }, [refresh]);

  const disciplineById = (id: string) => disciplines.find((d) => d.id === id);
  const teacherById = (id: string) => teachers.find((t) => t.id === id);
  const termById = (id: string) => terms.find((t) => t.id === id);

  const filtered = useMemo(() => rows.filter((k) => {
    if (shiftFilter !== "todos" && k.shift !== shiftFilter) return false;
    if (statusFilter !== "todos" && k.status !== statusFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      const d = disciplineById(k.disciplineId);
      return k.code.toLowerCase().includes(s) || (d?.name.toLowerCase().includes(s) ?? false);
    }
    return true;
  }), [rows, q, shiftFilter, statusFilter, disciplines]);

  const columns: Column<SchoolClass>[] = [
    { key: "code", header: "Turma", sortValue: (k) => k.code, cell: (k) => {
      const d = disciplineById(k.disciplineId);
      return (
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{k.code}</div>
          <div className="truncate text-[11px] text-muted-foreground">{d?.code} · {d?.name}</div>
        </div>
      );
    } },
    { key: "teacher", header: "Professor", cell: (k) => { const t = teacherById(k.teacherId); return <span className="text-xs">{t ? `${t.title} ${t.name}` : "—"}</span>; } },
    { key: "schedule", header: "Horário", cell: (k) => <span className="text-xs text-muted-foreground">{k.schedule} · {k.shift}</span> },
    { key: "occupancy", header: "Ocupação", sortValue: (k) => k.studentIds.length, cell: (k) => (
      <div className="w-32">
        <div className="mb-1 text-[11px] text-muted-foreground">{k.studentIds.length}/{k.capacity}</div>
        <ProgressBar value={Math.round((k.studentIds.length / k.capacity) * 100)} />
      </div>
    ) },
    { key: "status", header: "Status", cell: (k) => <KlassStatusBadge status={k.status} /> },
  ];

  function openNew() { setDraft(EMPTY); setModalNew(true); }

  async function saveNew() {
    await academyService.createClass(draft as Omit<SchoolClass, "id">);
    setModalNew(false);
    setRefresh((r) => r + 1);
  }

  function startEdit(k: SchoolClass) {
    setDraft({ code: k.code, disciplineId: k.disciplineId, termId: k.termId, shift: k.shift, capacity: k.capacity, teacherId: k.teacherId, roomLabel: k.roomLabel, schedule: k.schedule, status: k.status, studentIds: k.studentIds });
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    const updated = await academyService.updateClass(selected.id, draft);
    if (updated) setSelected(updated);
    setEditing(false);
    setRefresh((r) => r + 1);
  }

  async function doDelete() {
    if (!selected) return;
    await academyService.removeClass(selected.id);
    setSelected(null);
    setRefresh((r) => r + 1);
  }

  async function enroll(studentId: string) {
    if (!selected) return;
    await academyService.enrollStudent(selected.id, studentId);
    const updated = await academyService.getClassById(selected.id);
    if (updated) setSelected(updated);
    setRefresh((r) => r + 1);
  }

  async function unenroll(studentId: string) {
    if (!selected) return;
    await academyService.unenrollStudent(selected.id, studentId);
    const updated = await academyService.getClassById(selected.id);
    if (updated) setSelected(updated);
    setRefresh((r) => r + 1);
  }

  async function addDoc() {
    if (!selected || !newDocName.trim()) return;
    await academyService.createDoc({
      name: newDocName.trim(), kind: "Plano de ensino", disciplineId: selected.disciplineId,
      updatedAt: new Date().toISOString().slice(0, 10), size: "—", author: "Você",
    });
    setNewDocName("");
    setRefresh((r) => r + 1);
  }

  async function removeDoc(id: string) {
    await academyService.removeDoc(id);
    setRefresh((r) => r + 1);
  }

  const roster = selected ? students.filter((s) => selected.studentIds.includes(s.id)) : [];
  const available = selected ? students.filter((s) => !selected.studentIds.includes(s.id) && (studentQuery ? s.name.toLowerCase().includes(studentQuery.toLowerCase()) || s.ra.includes(studentQuery) : true)) : [];
  const classDocs = selected ? docs.filter((d) => d.disciplineId === selected.disciplineId) : [];

  return (
    <div>
      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por turma ou disciplina…"
        filters={
          <>
            <Select value={shiftFilter} onChange={setShiftFilter} options={[{ value: "todos", label: "Todos turnos" }, { value: "Matutino", label: "Matutino" }, { value: "Vespertino", label: "Vespertino" }, { value: "Noturno", label: "Noturno" }]} />
            <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "todos", label: "Todos status" }, { value: "aberta", label: "Aberta" }, { value: "em-andamento", label: "Em andamento" }, { value: "encerrada", label: "Encerrada" }]} />
          </>
        }
        trailing={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Nova turma</Btn> : undefined}
      />

      <DataTable rows={filtered} columns={columns} onRowClick={(k) => { setSelected(k); setEditing(false); setInnerTab("detalhes"); }} emptyMessage="Nenhuma turma encontrada" />

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected ? `Turma ${selected.code}` : ""}
        subtitle={selected ? disciplineById(selected.disciplineId)?.name : undefined}
        width={640}
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
            <TabBar
              value={innerTab}
              onChange={setInnerTab}
              tabs={[
                { value: "detalhes", label: "Detalhes" },
                { value: "matriculas", label: "Matrículas", badge: selected.studentIds.length },
                { value: "documentos", label: "Documentos", badge: classDocs.length },
              ]}
            />

            {innerTab === "detalhes" && (
              <SectionCard title="Detalhes da turma">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-[11px] text-muted-foreground">Turno</dt><dd>{selected.shift}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Horário</dt><dd>{selected.schedule}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Sala</dt><dd>{selected.roomLabel}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Período letivo</dt><dd>{termById(selected.termId)?.name}</dd></div>
                  <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Professor</dt><dd>{teacherById(selected.teacherId)?.title} {teacherById(selected.teacherId)?.name}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd><KlassStatusBadge status={selected.status} /></dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Ocupação</dt><dd>{selected.studentIds.length}/{selected.capacity}</dd></div>
                </dl>
              </SectionCard>
            )}

            {innerTab === "matriculas" && (
              <div className="grid gap-4">
                <SectionCard title={`Matriculados (${roster.length})`}>
                  <ul className="max-h-64 divide-y overflow-y-auto">
                    {roster.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{s.initials}</div>
                        <div className="min-w-0 flex-1"><div className="truncate text-sm">{s.name}</div><div className="text-[11px] text-muted-foreground">RA {s.ra}</div></div>
                        {canEnroll && <Btn onClick={() => unenroll(s.id)}><UserMinus className="h-3.5 w-3.5" /> Remover</Btn>}
                      </li>
                    ))}
                    {roster.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nenhum aluno matriculado.</li>}
                  </ul>
                </SectionCard>
                {canEnroll && (
                  <SectionCard title="Matricular aluno" description={`${selected.capacity - selected.studentIds.length} vaga(s) disponível(is)`}>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <TextInput className="pl-9" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Buscar por nome ou RA…" />
                    </div>
                    <ul className="max-h-56 divide-y overflow-y-auto">
                      {available.slice(0, 30).map((s) => (
                        <li key={s.id} className="flex items-center gap-3 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{s.initials}</div>
                          <div className="min-w-0 flex-1"><div className="truncate text-sm">{s.name}</div><div className="text-[11px] text-muted-foreground">RA {s.ra}</div></div>
                          <Btn variant="solid" onClick={() => enroll(s.id)} className="disabled:opacity-40" ><UserPlus className="h-3.5 w-3.5" /> Matricular</Btn>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}
              </div>
            )}

            {innerTab === "documentos" && (
              <SectionCard title="Documentos da disciplina" description="Planos de ensino, ementas e materiais.">
                <ul className="space-y-2">
                  {classDocs.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FileText className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{d.name}</div><div className="text-[11px] text-muted-foreground">{d.kind} · {d.updatedAt}</div></div>
                      {canDocs && <button onClick={() => removeDoc(d.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </li>
                  ))}
                  {classDocs.length === 0 && <li className="text-sm text-muted-foreground">Nenhum documento vinculado.</li>}
                </ul>
                {canDocs && (
                  <div className="mt-4 flex gap-2">
                    <TextInput value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="Nome do documento" />
                    <Btn variant="solid" onClick={addDoc}><Upload className="h-3.5 w-3.5" /> Adicionar</Btn>
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}
        {selected && editing && (
          <ClassForm draft={draft} setDraft={setDraft} disciplines={disciplines} terms={terms} teachers={teachers} />
        )}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nova turma" description="Crie uma turma vinculada a uma disciplina." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <ClassForm draft={draft} setDraft={setDraft} disciplines={disciplines} terms={terms} teachers={teachers} />
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir turma" description="Esta ação removerá a turma e suas matrículas." />
    </div>
  );
}

function ClassForm({ draft, setDraft, disciplines, terms, teachers }: {
  draft: DraftClass; setDraft: (d: DraftClass) => void; disciplines: Discipline[]; terms: Term[]; teachers: Teacher[];
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Identificação"><TextInput value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="ENG-SW-301-A" /></Field>
        <Field label="Vagas"><TextInput type="number" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Disciplina"><SelectInput value={draft.disciplineId} onChange={(e) => setDraft({ ...draft, disciplineId: e.target.value })} options={disciplines.map((d) => ({ value: d.id, label: `${d.code} · ${d.name}` }))} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Período letivo"><SelectInput value={draft.termId} onChange={(e) => setDraft({ ...draft, termId: e.target.value })} options={terms.map((t) => ({ value: t.id, label: t.name }))} /></Field>
        <Field label="Turno"><SelectInput value={draft.shift} onChange={(e) => setDraft({ ...draft, shift: e.target.value as SchoolClass["shift"] })} options={[{ value: "Matutino", label: "Matutino" }, { value: "Vespertino", label: "Vespertino" }, { value: "Noturno", label: "Noturno" }]} /></Field>
      </div>
      <Field label="Professor responsável"><SelectInput value={draft.teacherId} onChange={(e) => setDraft({ ...draft, teacherId: e.target.value })} options={teachers.map((t) => ({ value: t.id, label: `${t.title} ${t.name}` }))} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Horário"><TextInput value={draft.schedule} onChange={(e) => setDraft({ ...draft, schedule: e.target.value })} placeholder="Seg/Qua 19:00-22:30" /></Field>
        <Field label="Sala"><TextInput value={draft.roomLabel} onChange={(e) => setDraft({ ...draft, roomLabel: e.target.value })} placeholder="Sala 402 · Bloco B" /></Field>
      </div>
      <Field label="Status"><SelectInput value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SchoolClass["status"] })} options={[{ value: "aberta", label: "Aberta" }, { value: "em-andamento", label: "Em andamento" }, { value: "encerrada", label: "Encerrada" }]} /></Field>
    </div>
  );
}
