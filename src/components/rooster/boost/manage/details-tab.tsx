import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Btn, ConfirmDialog, Field, SectionCard, SelectInput, TextArea, TextInput } from "@/components/shared";
import {
  boostService,
  type BoostCourseDetail,
  type CourseLevel,
  type CourseStatus,
} from "@/services/mock-api/boost.service";

export function CourseDetailsTab({
  course,
  onSaved,
  onDeleted,
}: {
  course: BoostCourseDetail;
  onSaved: (c: BoostCourseDetail) => void;
  onDeleted: () => void;
}) {
  const [draft, setDraft] = useState({
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    workloadHours: course.workloadHours,
    cover: course.cover,
    status: course.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    if (!draft.title.trim()) {
      setError("O título é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await boostService.update(course.id, draft);
      onSaved({ ...course, ...updated });
      toast.success("Curso atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar curso";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    try {
      await boostService.remove(course.id);
      onDeleted();
      toast.success("Curso excluído com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir curso");
    }
  }

  return (
    <SectionCard
      title="Detalhes do curso"
      description="Essas informações aparecem para os alunos no catálogo público."
      action={
        <Btn onClick={() => setConfirmDelete(true)} className="text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Excluir curso
        </Btn>
      }
    >
      <div className="max-w-2xl space-y-3">
        <Field label="Título" required>
          <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Descrição">
          <TextArea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <TextInput value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          </Field>
          <Field label="Carga horária (h)">
            <TextInput type="number" min={1} value={draft.workloadHours} onChange={(e) => setDraft({ ...draft, workloadHours: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <Field label="Situação">
            <SelectInput
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as CourseStatus })}
              options={[
                { value: "rascunho", label: "Rascunho" },
                { value: "publicado", label: "Publicado" },
                { value: "arquivado", label: "Fora do ar (arquivado)" },
              ]}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Fora do ar: some do catálogo e ninguém novo se matricula, mas quem já está matriculado continua com acesso.
            </p>
          </Field>
        </div>
        <Field label="Capa (URL da imagem)">
          <TextInput value={draft.cover} onChange={(e) => setDraft({ ...draft, cover: e.target.value })} placeholder="https://…" />
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="pt-2">
          <Btn variant="solid" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Btn>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        title="Excluir curso"
        description="Esta ação remove o curso, seus módulos, aulas e materiais. Alunos matriculados perdem o acesso. Não pode ser desfeita."
      />
    </SectionCard>
  );
}
