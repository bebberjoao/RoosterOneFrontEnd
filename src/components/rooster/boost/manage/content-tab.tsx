import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Download, FileText, Link as LinkIcon, Loader2,
  Pencil, Plus, Trash2, Upload, Video, X,
} from "lucide-react";
import { Btn, ConfirmDialog, Field, Modal, SelectInput, TextArea, TextInput } from "@/components/shared";
import { API_URL, API_VERSION_PREFIX } from "@/services/hub/client";
import {
  boostService,
  LESSON_TYPE_LABEL,
  type BoostLesson,
  type BoostModule,
  type LessonType,
} from "@/services/mock-api/boost.service";

const LESSON_ICON: Record<LessonType, typeof Video> = { video: Video, texto: FileText, pdf: FileText, link: LinkIcon };

function fmtSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type ModuleDraft = { title: string; order: number };
type LessonDraft = { title: string; order: number; type: LessonType; contentUrl: string; contentText: string; durationMin: number };

const EMPTY_MODULE: ModuleDraft = { title: "", order: 1 };
const EMPTY_LESSON: LessonDraft = { title: "", order: 1, type: "video", contentUrl: "", contentText: "", durationMin: 0 };

export function CourseContentTab({ courseId, initialModules }: { courseId: string; initialModules: BoostModule[] }) {
  const [modules, setModules] = useState<BoostModule[]>(initialModules);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialModules.map((m, i) => [m.id, i === 0])),
  );
  const [error, setError] = useState<string | null>(null);

  const [moduleModal, setModuleModal] = useState<{ editing?: BoostModule } | null>(null);
  const [moduleDraft, setModuleDraft] = useState<ModuleDraft>(EMPTY_MODULE);
  const [moduleDeleteTarget, setModuleDeleteTarget] = useState<BoostModule | null>(null);

  const [lessonModal, setLessonModal] = useState<{ moduleId: string; editing?: BoostLesson } | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(EMPTY_LESSON);
  const [lessonDeleteTarget, setLessonDeleteTarget] = useState<{ moduleId: string; lesson: BoostLesson } | null>(null);

  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Vídeo hospedado, dentro do modal de edição de aula — só disponível para
  // aula já salva (precisa de um id pra enviar o arquivo).
  const [videoMode, setVideoMode] = useState<"link" | "file">("link");
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function openNewModule() {
    setModuleDraft({ title: "", order: modules.length + 1 });
    setModuleModal({});
  }
  function openEditModule(m: BoostModule) {
    setModuleDraft({ title: m.title, order: m.order });
    setModuleModal({ editing: m });
  }
  async function saveModule() {
    if (!moduleDraft.title.trim()) {
      setError("O título do módulo é obrigatório.");
      return;
    }
    try {
      if (moduleModal?.editing) {
        const updated = await boostService.updateModule(moduleModal.editing.id, moduleDraft);
        setModules((ms) => ms.map((m) => (m.id === updated.id ? { ...m, ...updated, lessons: m.lessons } : m)).sort((a, b) => a.order - b.order));
      } else {
        const created = await boostService.createModule(courseId, moduleDraft);
        setModules((ms) => [...ms, { ...created, lessons: [] }].sort((a, b) => a.order - b.order));
        setExpanded((e) => ({ ...e, [created.id]: true }));
      }
      setModuleModal(null);
      setError(null);
      toast.success(moduleModal?.editing ? "Módulo atualizado com sucesso" : "Módulo criado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar módulo";
      setError(message);
      toast.error(message);
    }
  }
  async function deleteModule() {
    if (!moduleDeleteTarget) return;
    try {
      await boostService.removeModule(moduleDeleteTarget.id);
      setModules((ms) => ms.filter((m) => m.id !== moduleDeleteTarget.id));
      setModuleDeleteTarget(null);
      toast.success("Módulo excluído com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir módulo");
    }
  }

  function openNewLesson(moduleId: string) {
    const mod = modules.find((m) => m.id === moduleId);
    setLessonDraft({ ...EMPTY_LESSON, order: (mod?.lessons.length ?? 0) + 1 });
    setLessonModal({ moduleId });
    setVideoMode("link");
    setVideoPreviewUrl(null);
  }
  function openEditLesson(moduleId: string, lesson: BoostLesson) {
    setLessonDraft({
      title: lesson.title, order: lesson.order, type: lesson.type,
      contentUrl: lesson.contentUrl ?? "", contentText: lesson.contentText ?? "", durationMin: lesson.durationMin ?? 0,
    });
    setLessonModal({ moduleId, editing: lesson });
    setVideoMode(lesson.hostedVideo ? "file" : "link");
    setVideoPreviewUrl(null);
  }
  async function saveLesson() {
    if (!lessonModal || !lessonDraft.title.trim()) {
      setError("O título da aula é obrigatório.");
      return;
    }
    const dto = {
      title: lessonDraft.title, order: lessonDraft.order, type: lessonDraft.type,
      contentUrl: lessonDraft.contentUrl || undefined, contentText: lessonDraft.contentText || undefined,
      durationMin: lessonDraft.durationMin || undefined,
    };
    try {
      if (lessonModal.editing) {
        const updated = await boostService.updateLesson(lessonModal.editing.id, dto);
        setModules((ms) =>
          ms.map((m) =>
            m.id !== lessonModal.moduleId
              ? m
              : { ...m, lessons: m.lessons.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)).sort((a, b) => a.order - b.order) },
          ),
        );
      } else {
        const created = await boostService.createLesson(lessonModal.moduleId, dto);
        setModules((ms) =>
          ms.map((m) => (m.id !== lessonModal.moduleId ? m : { ...m, lessons: [...m.lessons, created].sort((a, b) => a.order - b.order) })),
        );
      }
      setLessonModal(null);
      setError(null);
      toast.success(lessonModal.editing ? "Aula atualizada com sucesso" : "Aula criada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar aula";
      setError(message);
      toast.error(message);
    }
  }
  async function deleteLesson() {
    if (!lessonDeleteTarget) return;
    try {
      await boostService.removeLesson(lessonDeleteTarget.lesson.id);
      setModules((ms) =>
        ms.map((m) =>
          m.id !== lessonDeleteTarget.moduleId ? m : { ...m, lessons: m.lessons.filter((l) => l.id !== lessonDeleteTarget.lesson.id) },
        ),
      );
      setLessonDeleteTarget(null);
      toast.success("Aula excluída com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir aula");
    }
  }

  async function handleUpload(moduleId: string, lessonId: string, file: File) {
    setUploadingLessonId(lessonId);
    try {
      const material = await boostService.uploadMaterial(lessonId, file);
      setModules((ms) =>
        ms.map((m) =>
          m.id !== moduleId ? m : { ...m, lessons: m.lessons.map((l) => (l.id !== lessonId ? l : { ...l, materials: [...l.materials, material] })) },
        ),
      );
      toast.success("Material enviado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao enviar material";
      setError(message);
      toast.error(message);
    } finally {
      setUploadingLessonId(null);
    }
  }
  async function handleRemoveMaterial(moduleId: string, lessonId: string, materialId: string) {
    try {
      await boostService.removeMaterial(materialId);
      setModules((ms) =>
        ms.map((m) =>
          m.id !== moduleId
            ? m
            : { ...m, lessons: m.lessons.map((l) => (l.id !== lessonId ? l : { ...l, materials: l.materials.filter((mm) => mm.id !== materialId) })) },
        ),
      );
      toast.success("Material removido com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao remover material");
    }
  }

  /** Atualiza a aula em `modules` com o retorno do backend, sem depender de refetch. */
  function patchLessonInState(moduleId: string, updated: BoostLesson) {
    setModules((ms) =>
      ms.map((m) =>
        m.id !== moduleId ? m : { ...m, lessons: m.lessons.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)) },
      ),
    );
  }

  async function handleUploadVideo(file: File) {
    if (!lessonModal?.editing) return;
    const { moduleId, editing } = lessonModal;
    setVideoProgress(0);
    setVideoPreviewUrl(null);
    try {
      const updated = await boostService.uploadVideo(editing.id, file, setVideoProgress);
      patchLessonInState(moduleId, updated);
      setLessonModal({ moduleId, editing: updated });
      toast.success("Vídeo enviado com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar vídeo");
    } finally {
      setVideoProgress(null);
    }
  }

  async function handleRemoveVideo() {
    if (!lessonModal?.editing) return;
    const { moduleId, editing } = lessonModal;
    try {
      const updated = await boostService.removeVideo(editing.id);
      patchLessonInState(moduleId, updated);
      setLessonModal({ moduleId, editing: updated });
      setVideoPreviewUrl(null);
      toast.success("Vídeo removido com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao remover vídeo");
    }
  }

  /** Busca um token de stream de 5 min e monta a URL de prévia — só quando o instrutor pede, não a cada abertura do modal. */
  async function handleLoadPreview() {
    if (!lessonModal?.editing) return;
    try {
      const token = await boostService.getStreamToken(lessonModal.editing.id);
      setVideoPreviewUrl(`${API_URL}${API_VERSION_PREFIX}/aulas-boost/${lessonModal.editing.id}/video?token=${token}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar prévia do vídeo");
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Estrutura do curso</h2>
          <p className="text-xs text-muted-foreground">Módulos e aulas — use o campo "ordem" para reordenar.</p>
        </div>
        <Btn variant="solid" onClick={openNewModule}><Plus className="h-4 w-4" /> Novo módulo</Btn>
      </div>

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      {modules.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background/40 p-8 text-center text-sm text-muted-foreground">
          Nenhum módulo ainda. Crie o primeiro módulo para começar a estruturar o curso.
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((m) => (
            <div key={m.id} className="rounded-xl border border-border/60 bg-card">
              <div className="flex w-full items-center gap-2 px-4 py-3">
                <button type="button" onClick={() => toggle(m.id)} className="flex flex-1 items-center gap-3 text-left">
                  {expanded[m.id] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{m.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.lessons.length} aula(s) · ordem {m.order}</div>
                  </div>
                </button>
                <Btn onClick={() => openEditModule(m)}><Pencil className="h-3.5 w-3.5" /></Btn>
                <Btn onClick={() => setModuleDeleteTarget(m)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>

              {expanded[m.id] ? (
                <div className="border-t border-border/60 px-2 py-2">
                  <ul className="space-y-1">
                    {m.lessons.map((l) => {
                      const Icon = LESSON_ICON[l.type];
                      return (
                        <li key={l.id} className="rounded-lg px-2 py-2 hover:bg-muted/40">
                          <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">{l.title}</span>
                                <span className="rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {LESSON_TYPE_LABEL[l.type]}
                                </span>
                                {l.hostedVideo && (
                                  <span className="rounded-md border border-emerald-600/30 bg-emerald-50/60 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                                    hospedado ({fmtSize(l.hostedVideo.size)})
                                  </span>
                                )}
                                {l.durationMin ? <span className="text-[11px] text-muted-foreground">{l.durationMin} min</span> : null}
                                <span className="text-[11px] text-muted-foreground">ordem {l.order}</span>
                              </div>
                              {l.materials.length > 0 && (
                                <ul className="mt-1.5 space-y-1">
                                  {l.materials.map((mat) => (
                                    <li key={mat.id} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                      <FileText className="h-3 w-3" />
                                      <span className="truncate">{mat.fileName}</span>
                                      <span>{fmtSize(mat.size)}</span>
                                      <button type="button" className="hover:text-foreground" onClick={() => boostService.downloadMaterial(mat.id, mat.fileName)}>
                                        <Download className="h-3 w-3" />
                                      </button>
                                      <button type="button" className="text-destructive hover:opacity-80" onClick={() => handleRemoveMaterial(m.id, l.id, mat.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="flex flex-none items-center gap-1">
                              <input
                                ref={(el) => { fileInputs.current[l.id] = el; }}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (file) handleUpload(m.id, l.id, file);
                                }}
                              />
                              <button
                                type="button"
                                title="Enviar material"
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                                disabled={uploadingLessonId === l.id}
                                onClick={() => fileInputs.current[l.id]?.click()}
                              >
                                {uploadingLessonId === l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                              </button>
                              <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" onClick={() => openEditLesson(m.id, l)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" className="rounded-md p-1.5 text-destructive hover:bg-accent" onClick={() => setLessonDeleteTarget({ moduleId: m.id, lesson: l })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-2 border-t border-border/60 pt-2">
                    <Btn onClick={() => openNewLesson(m.id)}><Plus className="h-3.5 w-3.5" /> Nova aula</Btn>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!moduleModal}
        onClose={() => setModuleModal(null)}
        title={moduleModal?.editing ? "Editar módulo" : "Novo módulo"}
        footer={<><Btn onClick={() => setModuleModal(null)}>Cancelar</Btn><Btn variant="solid" onClick={saveModule}>Salvar</Btn></>}
      >
        <div className="space-y-3">
          <Field label="Título" required><TextInput value={moduleDraft.title} onChange={(e) => setModuleDraft({ ...moduleDraft, title: e.target.value })} /></Field>
          <Field label="Ordem"><TextInput type="number" min={1} value={moduleDraft.order} onChange={(e) => setModuleDraft({ ...moduleDraft, order: Number(e.target.value) })} /></Field>
        </div>
      </Modal>

      <Modal
        open={!!lessonModal}
        onClose={() => setLessonModal(null)}
        title={lessonModal?.editing ? "Editar aula" : "Nova aula"}
        size="lg"
        footer={<><Btn onClick={() => setLessonModal(null)}>Cancelar</Btn><Btn variant="solid" onClick={saveLesson}>Salvar</Btn></>}
      >
        <div className="space-y-3">
          <Field label="Título" required><TextInput value={lessonDraft.title} onChange={(e) => setLessonDraft({ ...lessonDraft, title: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tipo">
              <SelectInput
                value={lessonDraft.type}
                onChange={(e) => setLessonDraft({ ...lessonDraft, type: e.target.value as LessonType })}
                options={Object.entries(LESSON_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
              />
            </Field>
            <Field label="Ordem"><TextInput type="number" min={1} value={lessonDraft.order} onChange={(e) => setLessonDraft({ ...lessonDraft, order: Number(e.target.value) })} /></Field>
            <Field label="Duração (min)"><TextInput type="number" min={0} value={lessonDraft.durationMin} onChange={(e) => setLessonDraft({ ...lessonDraft, durationMin: Number(e.target.value) })} /></Field>
          </div>
          {lessonDraft.type === "texto" ? (
            <Field label="Conteúdo (texto)"><TextArea value={lessonDraft.contentText} onChange={(e) => setLessonDraft({ ...lessonDraft, contentText: e.target.value })} /></Field>
          ) : lessonDraft.type === "video" ? (
            <div className="space-y-3">
              <div className="flex gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setVideoMode("link")}
                  className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${videoMode === "link" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Link externo (YouTube/Vimeo)
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode("file")}
                  className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${videoMode === "file" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Enviar arquivo de vídeo
                </button>
              </div>

              {videoMode === "link" ? (
                <Field label="URL do vídeo" hint="YouTube, Vimeo ou link direto de arquivo de vídeo.">
                  <TextInput value={lessonDraft.contentUrl} onChange={(e) => setLessonDraft({ ...lessonDraft, contentUrl: e.target.value })} placeholder="https://…" />
                </Field>
              ) : !lessonModal?.editing ? (
                <p className="rounded-lg border border-dashed bg-background/40 p-3 text-xs text-muted-foreground">
                  Salve a aula primeiro (com um título) para poder enviar o arquivo de vídeo.
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  {lessonModal.editing.hostedVideo ? (
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-medium">
                          <Video className="h-3.5 w-3.5" /> {lessonModal.editing.hostedVideo.fileName}
                          <span className="font-normal text-muted-foreground">({fmtSize(lessonModal.editing.hostedVideo.size)})</span>
                        </p>
                        <div className="flex items-center gap-1">
                          <Btn onClick={handleLoadPreview}>Carregar prévia</Btn>
                          <Btn onClick={handleRemoveVideo} className="text-destructive"><X className="h-3.5 w-3.5" /> Remover</Btn>
                        </div>
                      </div>
                      {videoPreviewUrl && (
                        // eslint-disable-next-line jsx-a11y/media-has-caption -- prévia interna do instrutor, sem legenda cadastrada ainda
                        <video src={videoPreviewUrl} controls className="mt-2 aspect-video w-full rounded-lg bg-black" />
                      )}
                      <p className="mt-2 text-[11px] text-muted-foreground">Enviar outro arquivo substitui este vídeo.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum vídeo enviado ainda para esta aula.</p>
                  )}

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) handleUploadVideo(file);
                    }}
                  />
                  <Btn onClick={() => videoInputRef.current?.click()} disabled={videoProgress !== null}>
                    {videoProgress !== null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {videoProgress !== null ? `Enviando... ${videoProgress}%` : "Escolher arquivo (até 2GB — mp4, webm ou mov)"}
                  </Btn>
                  {videoProgress !== null && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-foreground transition-all" style={{ width: `${videoProgress}%` }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Field label={lessonDraft.type === "link" ? "URL do link" : "URL do conteúdo"} hint="PDF hospedado externamente — materiais para download ficam na seção de materiais, abaixo.">
              <TextInput value={lessonDraft.contentUrl} onChange={(e) => setLessonDraft({ ...lessonDraft, contentUrl: e.target.value })} placeholder="https://…" />
            </Field>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!moduleDeleteTarget}
        onClose={() => setModuleDeleteTarget(null)}
        onConfirm={deleteModule}
        title="Excluir módulo"
        description="As aulas e materiais deste módulo também serão removidos."
      />
      <ConfirmDialog
        open={!!lessonDeleteTarget}
        onClose={() => setLessonDeleteTarget(null)}
        onConfirm={deleteLesson}
        title="Excluir aula"
        description="Os materiais desta aula também serão removidos."
      />
    </div>
  );
}
