import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/rooster/page-header";
import { EmptyState, StatCard, Field, TextArea, TextInput, SelectInput, Btn, Modal, LoadingCards } from "@/components/shared";
import { CourseLevelBadge, CourseStatusBadge } from "@/components/rooster/boost/manage/badges";
import { boostService, type BoostCourse, type CourseLevel } from "@/services/mock-api/boost.service";
import { Award, BookMarked, Plus, Rocket, Users } from "lucide-react";

export const Route = createFileRoute("/boost/")({
  head: () => ({
    meta: [
      { title: "Rooster Boost — Meus cursos" },
      { name: "description", content: "Crie, publique e gerencie seus cursos extracurriculares no Rooster Boost." },
    ],
  }),
  component: BoostDashboard,
});

type Draft = {
  title: string; description: string; category: string; level: CourseLevel;
  workloadHours: number; cover: string; certificate: boolean;
};
const EMPTY: Draft = { title: "", description: "", category: "", level: "iniciante", workloadHours: 10, cover: "", certificate: true };

function BoostDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<BoostCourse[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalNew, setModalNew] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    boostService
      .getMyCourses()
      .then(async (list) => {
        if (!alive) return;
        setCourses(list);
        const counts: Record<string, number> = {};
        await Promise.all(
          list.map(async (c) => {
            try {
              counts[c.id] = (await boostService.getStudents(c.id)).length;
            } catch {
              counts[c.id] = 0;
            }
          }),
        );
        if (alive) setStudentCounts(counts);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Falha ao carregar cursos"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function openNew() {
    setDraft(EMPTY);
    setFormError(null);
    setModalNew(true);
  }

  async function saveNew() {
    if (!draft.title.trim() || !draft.workloadHours) {
      setFormError("Preencha ao menos o título e a carga horária.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await boostService.create({
        title: draft.title.trim(),
        description: draft.description || undefined,
        category: draft.category || undefined,
        level: draft.level,
        workloadHours: draft.workloadHours,
        cover: draft.cover || undefined,
        status: "rascunho",
        certificate: draft.certificate,
      });
      setModalNew(false);
      navigate({ to: "/boost/manage/$id", params: { id: created.id } });
      toast.success("Curso criado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar curso";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const totalStudents = Object.values(studentCounts).reduce((s, v) => s + v, 0);
  const published = courses.filter((c) => c.status === "publicado").length;
  const withCertificate = courses.filter((c) => c.certificate).length;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Boost"
        title="Meus cursos"
        description="Cursos extracurriculares dos quais você é o instrutor responsável."
        actions={
          <Btn variant="solid" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo curso
          </Btn>
        }
      />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!loading && courses.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={BookMarked} label="Cursos" value={String(courses.length)} tone="oklch(0.55 0.19 265)" />
          <StatCard icon={Rocket} label="Publicados" value={String(published)} tone="oklch(0.62 0.18 155)" />
          <StatCard icon={Users} label="Alunos matriculados" value={String(totalStudents)} tone="oklch(0.68 0.18 40)" />
          <StatCard icon={Award} label="Emitem certificado" value={String(withCertificate)} tone="oklch(0.72 0.14 90)" />
        </div>
      )}

      {loading ? (
        <LoadingCards />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Você ainda não tem cursos"
          description="Crie seu primeiro curso extracurricular para começar a publicar módulos, aulas e materiais."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate({ to: "/boost/manage/$id", params: { id: c.id } })}
              className="flex flex-col rounded-xl border border-border/60 bg-card p-5 text-left transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug">{c.title}</h3>
                <CourseStatusBadge status={c.status} />
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{c.description || "Sem descrição."}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CourseLevelBadge level={c.level} />
                <span className="text-xs text-muted-foreground">{c.workloadHours}h</span>
                {c.certificate ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    <Award className="h-3 w-3" /> Certificado
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{studentCounts[c.id] ?? 0} aluno(s)</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={modalNew}
        onClose={() => setModalNew(false)}
        title="Novo curso"
        description="O curso é criado como rascunho — publique quando o conteúdo estiver pronto."
        footer={
          <>
            <Btn onClick={() => setModalNew(false)}>Cancelar</Btn>
            <Btn variant="solid" onClick={saveNew} disabled={saving}>{saving ? "Salvando…" : "Criar curso"}</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Título" required>
            <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex. Fundamentos de Lógica de Programação" />
          </Field>
          <Field label="Descrição">
            <TextArea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Do que trata o curso, para quem é indicado…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <TextInput value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Ex. Programação" />
            </Field>
            <Field label="Carga horária (h)" required>
              <TextInput type="number" min={1} value={draft.workloadHours} onChange={(e) => setDraft({ ...draft, workloadHours: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Nível">
            <SelectInput
              value={draft.level}
              onChange={(e) => setDraft({ ...draft, level: e.target.value as CourseLevel })}
              options={[
                { value: "iniciante", label: "Iniciante" },
                { value: "intermediario", label: "Intermediário" },
                { value: "avancado", label: "Avançado" },
              ]}
            />
          </Field>
          <Field label="Capa (URL da imagem)">
            <TextInput value={draft.cover} onChange={(e) => setDraft({ ...draft, cover: e.target.value })} placeholder="https://…" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.certificate} onChange={(e) => setDraft({ ...draft, certificate: e.target.checked })} />
            Emite certificado ao concluir
          </label>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
        </div>
      </Modal>
    </>
  );
}
