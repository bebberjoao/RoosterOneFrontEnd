import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { Button } from "@/components/ui/button";
import {
  COURSES,
  categoryName,
  categoryColor,
  formatDate,
  type Course,
  type ContentType,
} from "@/components/rooster/boost/mock-data";
import { LevelBadge, StatusBadge, ProgressBar, RatingStars } from "@/components/rooster/boost/badges";
import {
  ArrowLeft,
  Users,
  Clock,
  PlayCircle,
  Award,
  Copy,
  Archive,
  Trash2,
  Rocket,
  GripVertical,
  Plus,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Type,
  Film,
  Youtube,
  Video,
  FileText,
  Presentation,
  Sheet,
  Image as ImageIcon,
  Music,
  Link as LinkIcon,
  Code,
  Download,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/boost/courses/$id")({
  loader: ({ params }) => {
    const course = COURSES.find((c) => c.id === params.id);
    if (!course) throw notFound();
    return { course };
  },
  component: CourseDetail,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">Curso não encontrado.</p>
      <Link to="/boost" className="mt-3 inline-block text-sm font-medium text-foreground underline">
        Voltar ao catálogo
      </Link>
    </div>
  );
}

const CONTENT_ICON: Record<ContentType, typeof Type> = {
  texto: Type,
  "video-upload": Film,
  youtube: Youtube,
  vimeo: Video,
  pdf: FileText,
  doc: FileText,
  slide: Presentation,
  planilha: Sheet,
  imagem: ImageIcon,
  audio: Music,
  link: LinkIcon,
  codigo: Code,
  download: Download,
};

const CONTENT_LABEL: Record<ContentType, string> = {
  texto: "Texto rico",
  "video-upload": "Vídeo",
  youtube: "YouTube",
  vimeo: "Vimeo",
  pdf: "PDF",
  doc: "Documento",
  slide: "Slides",
  planilha: "Planilha",
  imagem: "Imagem",
  audio: "Áudio",
  link: "Link externo",
  codigo: "Código",
  download: "Download",
};

function CourseDetail() {
  const { course } = Route.useLoaderData() as { course: Course };
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(course.modules.map((m, i) => [m.id, i === 0]))
  );

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <>
      <div className="mb-3">
        <Link to="/boost" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Catálogo
        </Link>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="h-40 w-full" style={{ background: course.cover }} />
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
              style={{ color: categoryColor(course.category), backgroundColor: `color-mix(in oklab, ${categoryColor(course.category)} 12%, transparent)` }}
            >
              {categoryName(course.category)}
            </span>
            <LevelBadge level={course.level} />
            <StatusBadge status={course.status} />
            {course.certificate ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Award className="h-3 w-3" /> Certificado
              </span>
            ) : null}
            <span className="ml-auto text-xs text-muted-foreground">
              {course.publishedAt ? `Publicado em ${formatDate(course.publishedAt)}` : "Não publicado"}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight lg:text-[26px]">{course.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{course.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: `color-mix(in oklab, ${course.categoryColor} 14%, transparent)`, color: course.categoryColor }}
              >
                {course.instructor.avatar}
              </span>
              <div>
                <div className="text-sm font-medium">{course.instructor.name}</div>
                <div className="text-[11px] text-muted-foreground">{course.instructor.role}</div>
              </div>
            </div>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {course.workload}</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><PlayCircle className="h-3.5 w-3.5" /> {course.lessonsCount} aulas</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> {course.students} alunos</span>
            {course.rating > 0 ? (
              <RatingStars value={course.rating} />
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5"><Rocket className="h-4 w-4" /> {course.status === "publicado" ? "Republicar" : "Publicar"}</Button>
            <Button size="sm" variant="outline" className="gap-1.5"><Copy className="h-4 w-4" /> Duplicar</Button>
            <Button size="sm" variant="outline" className="gap-1.5"><Archive className="h-4 w-4" /> Arquivar</Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Excluir</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Estrutura do curso</h2>
              <p className="text-xs text-muted-foreground">Arraste para reordenar módulos e aulas.</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> Novo módulo</Button>
          </div>

          <div className="space-y-2">
            {course.modules.map((m, mi) => (
              <div key={m.id} className="rounded-xl border border-border/60 bg-card">
                <button
                  onClick={() => toggle(m.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <GripVertical className="h-4 w-4 flex-none text-muted-foreground/50" />
                  {expanded[m.id] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{m.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.lessons.length} aulas · {m.summary}</div>
                  </div>
                  <span className="hidden text-[11px] text-muted-foreground md:inline">Módulo {mi + 1}</span>
                </button>

                {expanded[m.id] ? (
                  <div className="border-t border-border/60 px-2 py-2">
                    <ul className="space-y-1">
                      {m.lessons.map((l, li) => (
                        <li key={l.id} className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/40">
                          <GripVertical className="mt-0.5 h-4 w-4 flex-none text-muted-foreground/40" />
                          <span className="mt-0.5 w-6 flex-none text-right text-[11px] tabular-nums text-muted-foreground">{mi + 1}.{li + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{l.title}</span>
                              {l.hasQuiz ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{ color: "oklch(0.68 0.18 40)", backgroundColor: "color-mix(in oklab, oklch(0.68 0.18 40) 12%, transparent)" }}
                                >
                                  <ClipboardList className="h-3 w-3" /> Avaliação
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {l.blocks.map((b, bi) => {
                                const Icon = CONTENT_ICON[b.type];
                                return (
                                  <span
                                    key={bi}
                                    className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                  >
                                    <Icon className="h-3 w-3" /> {CONTENT_LABEL[b.type]}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <span className="flex-none text-[11px] tabular-nums text-muted-foreground">{l.duration}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex gap-2 border-t border-border/60 pt-2">
                      <Button size="sm" variant="ghost" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Aula</Button>
                      <Button size="sm" variant="ghost" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Avaliação</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border/60 bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Objetivos</h3>
            <ul className="space-y-2 text-sm">
              {course.objectives.map((o, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: course.categoryColor }} />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border/60 bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Pré-requisitos</h3>
            {course.prerequisites.length ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {course.prerequisites.map((p, i) => <li key={i}>· {p}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum pré-requisito.</p>
            )}
            <div className="mt-4 border-t border-border/60 pt-4">
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Público-alvo</h4>
              <p className="text-sm">{course.audience}</p>
            </div>
            <div className="mt-3">
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {course.tags.map((t) => (
                  <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">#{t}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Taxa de conclusão</h3>
              <span className="text-xs tabular-nums text-muted-foreground">{course.completionRate}%</span>
            </div>
            <ProgressBar value={course.completionRate} />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">Reviews</div>
                <div className="text-lg font-semibold tabular-nums">{course.reviews}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avaliação</div>
                <div className="text-lg font-semibold tabular-nums">{course.rating > 0 ? course.rating.toFixed(1) : "—"}</div>
              </div>
            </div>
            <Button size="sm" variant="outline" className="mt-4 w-full gap-1.5"><MessageSquare className="h-4 w-4" /> Ver comentários</Button>
          </section>
        </aside>
      </div>
    </>
  );
}
