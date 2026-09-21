import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Users, Pencil, Trash2, Plus, UserPlus, UserMinus, Search, FileText, Upload } from "lucide-react";
import {
  academyService, type SchoolClass, type Discipline, type Term, type Teacher,
  type Student, type AcademyDoc, type Enrollment,
} from "@/services/mock-api/academy.service";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal, ConfirmDialog,
  Field, TextInput, SelectInput, Btn, Select, SectionCard, TabBar, ProgressBar,
} from "@/components/shared";
import { KlassStatusBadge } from "@/components/rooster/academy/badges";
import { academyCan } from "@/components/rooster/academy/permissions";
import { useRole } from "@/components/rooster/role-context";

type DraftClass = {
  code: string; disciplineId: string; termId: string; shift: SchoolClass["shift"]; capacity: number;
  teacherId: string; roomLabel: string; schedule: string; status: SchoolClass["status"];
};

const EMPTY: DraftClass = { code: "", disciplineId: "", termId: "", shift: "Matutino", capacity: 40, teacherId: "", roomLabel: "", schedule: "", status: "aberta" };

const DOC_KIND_OPTIONS: { value: AcademyDoc["kind"]; label: string }[] = [
  { value: "Plano de ensino", label: "Plano de ensino" },
  { value: "Ementa", label: "Ementa" },
  { value: "Regulamento", label: "Regulamento" },
  { value: "Institucional", label: "Institucional" },
];

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
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
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
  const [docKind, setDocKind] = useState<AcademyDoc["kind"]>("Plano de ensino");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    academyService.getClasses().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar turmas"));
    academyService.getAll().then(setDisciplines);
    academyService.getTerms().then(setTerms);
    academyService.getTeachers().then(setTeachers);
    academyService.getStudents().then(setStudents);
  }, [refresh]);

  useEffect(() => {
    if (!selected) { setEnrollments([]); setDocs([]); return; }
    academyService.getEnrollmentsByClass(selected.id).then(setEnrollments);
    academyService.getDocs({ disciplineId: selected.disciplineId }).then(setDocs);
  }, [selected?.id, refresh]);

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
    { key: "teacher", header: "Professor", cell: (k) => { const t = k.teacherId ? teacherById(k.teacherId) : undefined; return <span className="text-xs">{t ? `${t.title} ${t.name}` : "—"}</span>; } },
    { key: "schedule", header: "Horário", cell: (k) => <span className="text-xs text-muted-foreground">{k.schedule || "—"} · {k.shift}</span> },
    { key: "occupancy", header: "Ocupação", sortValue: (k) => k.enrolledCount, cell: (k) => (
      <div className="w-32">
        <div className="mb-1 text-[11px] text-muted-foreground">{k.enrolledCount}/{k.capacity}</div>
        <ProgressBar value={Math.round((k.enrolledCount / k.capacity) * 100)} />
      </div>
    ) },
    { key: "status", header: "Status", cell: (k) => <KlassStatusBadge status={k.status} /> },
  ];

  function openNew() { setDraft(EMPTY); setError(null); setModalNew(true); }

  async function saveNew() {
    if (!draft.code.trim() || !draft.disciplineId || !draft.termId) { setError("Preencha identificação, disciplina e período letivo."); return; }
    try {
      await academyService.createClass({ ...draft, teacherId: draft.teacherId || undefined });
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Turma criada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar turma";
      setError(message);
      toast.error(message);
    }
  }

  function startEdit(k: SchoolClass) {
    setDraft({ code: k.code, disciplineId: k.disciplineId, termId: k.termId, shift: k.shift, capacity: k.capacity, teacherId: k.teacherId ?? "", roomLabel: k.roomLabel, schedule: k.schedule, status: k.status });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      const updated = await academyService.updateClass(selected.id, { ...draft, teacherId: draft.teacherId || undefined });
      if (updated) setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Turma atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar turma";
      setError(message);
      toast.error(message);
    }
  }

  async function doDelete() {
    if (!selected) return;
    try {
      await academyService.removeClass(selected.id);
      setSelected(null);
      setRefresh((r) => r + 1);
      toast.success("Turma excluída com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir turma");
    }
  }

  async function enroll(studentId: string) {
    if (!selected) return;
    try {
      await academyService.enrollStudent(selected.id, studentId);
      setRefresh((r) => r + 1);
      toast.success("Aluno matriculado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao matricular aluno";
      setError(message);
      toast.error(message);
    }
  }

  async function unenroll(matriculaId: string) {
    try {
      await academyService.unenrollStudent(matriculaId);
      setRefresh((r) => r + 1);
      toast.success("Matrícula removida com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao remover matrícula");
    }
  }

  async function addDoc() {
    if (!selected || !docFile) return;
    try {
      await academyService.createDoc({ file: docFile, kind: docKind, disciplineId: selected.disciplineId });
      setDocFile(null);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Documento enviado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao enviar documento";
      setError(message);
      toast.error(message);
    }
  }

  async function removeDoc(id: string) {
    try {
      await academyService.removeDoc(id);
      setRefresh((r) => r + 1);
      toast.success("Documento removido com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao remover documento");
    }
  }

  const enrolledIds = new Set(enrollments.map((e) => e.studentId));
  const roster = enrollments;
  const available = selected ? students.filter((s) => !enrolledIds.has(s.id) && (studentQuery ? s.name.toLowerCase().includes(studentQuery.toLowerCase()) || s.ra.includes(studentQuery) : true)) : [];
  const classDocs = docs;

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

      <DataTable rows={filtered} columns={columns} onRowClick={(k) => { setSelected(k); setEditing(false); setInnerTab("detalhes"); setStudentQuery(""); setError(null); }} emptyMessage="Nenhuma turma encontrada" />

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
                { value: "matriculas", label: "Matrículas", badge: roster.length },
                { value: "documentos", label: "Documentos", badge: classDocs.length },
              ]}
            />

            {innerTab === "detalhes" && (
              <SectionCard title="Detalhes da turma">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-[11px] text-muted-foreground">Turno</dt><dd>{selected.shift}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Horário</dt><dd>{selected.schedule || "—"}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Sala</dt><dd>{selected.roomLabel || "—"}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Período letivo</dt><dd>{termById(selected.termId)?.name ?? "—"}</dd></div>
                  <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Professor</dt><dd>{selected.teacherId ? (() => { const t = teacherById(selected.teacherId!); return t ? `${t.title} ${t.name}` : "—"; })() : "Não atribuído"}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd><KlassStatusBadge status={selected.status} /></dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Ocupação</dt><dd>{selected.enrolledCount}/{selected.capacity}</dd></div>
                </dl>
              </SectionCard>
            )}

            {innerTab === "matriculas" && (
              <div className="grid gap-4">
                <SectionCard title={`Matriculados (${roster.length})`}>
                  <ul className="max-h-64 divide-y overflow-y-auto">
                    {roster.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{e.student?.initials ?? "—"}</div>
                        <div className="min-w-0 flex-1"><div className="truncate text-sm">{e.student?.name ?? e.studentId}</div><div className="text-[11px] text-muted-foreground">RA {e.student?.ra ?? "—"}</div></div>
                        {canEnroll && <Btn onClick={() => unenroll(e.id)}><UserMinus className="h-3.5 w-3.5" /> Remover</Btn>}
                      </li>
                    ))}
                    {roster.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nenhum aluno matriculado.</li>}
                  </ul>
                </SectionCard>
                {canEnroll && (
                  <SectionCard title="Matricular aluno" description={`${Math.max(selected.capacity - roster.length, 0)} vaga(s) disponível(is)`}>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <TextInput className="pl-9" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Buscar por nome ou RA…" />
                    </div>
                    <ul className="max-h-56 divide-y overflow-y-auto">
                      {available.slice(0, 30).map((s) => (
                        <li key={s.id} className="flex items-center gap-3 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{s.initials}</div>
                          <div className="min-w-0 flex-1"><div className="truncate text-sm">{s.name}</div><div className="text-[11px] text-muted-foreground">RA {s.ra}</div></div>
                          <Btn variant="solid" onClick={() => enroll(s.id)}><UserPlus className="h-3.5 w-3.5" /> Matricular</Btn>
                        </li>
                      ))}
                      {available.length === 0 && <li className="py-4 text-center text-xs text-muted-foreground">Nenhum aluno disponível.</li>}
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
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{d.name}</div><div className="text-[11px] text-muted-foreground">{d.kind} · {d.updatedAt} · {d.size}</div></div>
                      {canDocs && <button onClick={() => removeDoc(d.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </li>
                  ))}
                  {classDocs.length === 0 && <li className="text-sm text-muted-foreground">Nenhum documento vinculado.</li>}
                </ul>
                {canDocs && (
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <SelectInput className="w-44" value={docKind} onChange={(e) => setDocKind(e.target.value as AcademyDoc["kind"])} options={DOC_KIND_OPTIONS} />
                      <input
                        type="file"
                        onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                        className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                      />
                      <Btn variant="solid" onClick={addDoc} disabled={!docFile}><Upload className="h-3.5 w-3.5" /> Adicionar</Btn>
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}
        {selected && editing && (
          <ClassForm draft={draft} setDraft={setDraft} disciplines={disciplines} terms={terms} teachers={teachers} error={error} />
        )}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nova turma" description="Crie uma turma vinculada a uma disciplina." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <ClassForm draft={draft} setDraft={setDraft} disciplines={disciplines} terms={terms} teachers={teachers} error={error} />
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir turma" description="Esta ação removerá a turma e suas matrículas." />
    </div>
  );
}

function ClassForm({ draft, setDraft, disciplines, terms, teachers, error }: {
  draft: DraftClass; setDraft: (d: DraftClass) => void; disciplines: Discipline[]; terms: Term[]; teachers: Teacher[]; error?: string | null;
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
      <Field label="Professor (opcional)"><SelectInput value={draft.teacherId} onChange={(e) => setDraft({ ...draft, teacherId: e.target.value })} placeholder="Sem professor atribuído" options={teachers.map((t) => ({ value: t.id, label: `${t.title} ${t.name}` }))} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Horário"><TextInput value={draft.schedule} onChange={(e) => setDraft({ ...draft, schedule: e.target.value })} placeholder="Seg/Qua 19:00-22:30" /></Field>
        <Field label="Sala"><TextInput value={draft.roomLabel} onChange={(e) => setDraft({ ...draft, roomLabel: e.target.value })} placeholder="Sala 402 · Bloco B" /></Field>
      </div>
      <Field label="Status"><SelectInput value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SchoolClass["status"] })} options={[{ value: "aberta", label: "Aberta" }, { value: "em-andamento", label: "Em andamento" }, { value: "encerrada", label: "Encerrada" }]} /></Field>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
