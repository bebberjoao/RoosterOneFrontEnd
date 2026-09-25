import { useState } from "react";
import { toast } from "sonner";
import { Award } from "lucide-react";
import { Btn, Field, SectionCard, TextArea, TextInput } from "@/components/shared";
import { useCan } from "@/components/rooster/hub/permission-context";
import { boostService, type BoostCourseDetail } from "@/services/mock-api/boost.service";

const PADRAO =
  "Certificamos que {aluno} concluiu com êxito o curso {curso}, com carga horária de {cargaHoraria} horas.";

/** Preenche o modelo com dados de exemplo — o mesmo troca-campos que o backend aplica no PDF. */
function preencher(modelo: string) {
  const valores: Record<string, string> = {
    aluno: "Maria da Silva",
    curso: "Nome do curso",
    cargaHoraria: "20",
    data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
  };
  return modelo.replace(/\{(\w+)\}/g, (inteiro, chave: string) => valores[chave] ?? inteiro);
}

export function CourseCertificateTab({
  course,
  onSaved,
}: {
  course: BoostCourseDetail;
  onSaved: (c: BoostCourseDetail) => void;
}) {
  const canEdit = useCan("/boost/manage", "certificado");
  const [emits, setEmits] = useState(course.certificate);
  const [text, setText] = useState(course.certificateText);
  const [hours, setHours] = useState(course.workloadHours);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await boostService.updateCertificate(course.id, {
        certificate: emits,
        certificateText: text,
        workloadHours: hours,
      });
      onSaved({ ...course, ...updated });
      toast.success("Certificado atualizado com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar o certificado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="Certificado"
      description="Desligue para cursos que são só material de apoio: o aluno conclui normalmente, mas nenhum certificado é emitido."
    >
      <div className="max-w-2xl space-y-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={emits}
            disabled={!canEdit}
            onChange={(e) => setEmits(e.target.checked)}
          />
          <span>
            <span className="font-medium">Emitir certificado ao concluir</span>
            <span className="block text-xs text-muted-foreground">
              Vale para quem concluir a partir de agora; certificados já emitidos não mudam.
            </span>
          </span>
        </label>

        {emits && (
          <>
            <Field label="Carga horária impressa (h)">
              <TextInput type="number" min={1} value={hours} disabled={!canEdit} onChange={(e) => setHours(Number(e.target.value))} />
            </Field>
            <Field label="Texto do certificado">
              <TextArea
                value={text}
                disabled={!canEdit}
                rows={4}
                onChange={(e) => setText(e.target.value)}
                placeholder={PADRAO}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Campos disponíveis: <code>{"{aluno}"}</code>, <code>{"{curso}"}</code>, <code>{"{cargaHoraria}"}</code> e{" "}
                <code>{"{data}"}</code>. Deixe vazio para usar o modelo padrão.
              </p>
            </Field>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Award className="h-3.5 w-3.5" /> Pré-visualização do texto
              </div>
              <p className="text-sm leading-relaxed">{preencher(text.trim() || PADRAO)}</p>
            </div>
          </>
        )}

        {!canEdit && (
          <p className="text-xs text-muted-foreground">Seu usuário não tem a permissão “Configurar certificado”. Fale com um administrador.</p>
        )}
        <div className="pt-1">
          <Btn variant="solid" onClick={save} disabled={saving || !canEdit}>
            {saving ? "Salvando…" : "Salvar certificado"}
          </Btn>
        </div>
      </div>
    </SectionCard>
  );
}
