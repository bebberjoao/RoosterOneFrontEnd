import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs, TabBar } from "@/components/shared";
import { CourseLevelBadge, CourseStatusBadge } from "@/components/rooster/boost/manage/badges";
import { CourseDetailsTab } from "@/components/rooster/boost/manage/details-tab";
import { CourseContentTab } from "@/components/rooster/boost/manage/content-tab";
import { CourseStudentsTab } from "@/components/rooster/boost/manage/students-tab";
import { CourseCertificateTab } from "@/components/rooster/boost/manage/certificate-tab";
import { CourseOrientatorsTab } from "@/components/rooster/boost/manage/orientators-tab";
import { useCan } from "@/components/rooster/hub/permission-context";
import { boostService, type BoostCourseDetail } from "@/services/mock-api/boost.service";

export const Route = createFileRoute("/boost/manage/$id")({
  loader: async ({ params }) => {
    const course = await boostService.getById(params.id);
    return { course };
  },
  component: BoostCourseManage,
});


function BoostCourseManage() {
  const { course: initial } = Route.useLoaderData();
  const navigate = useNavigate();
  const [course, setCourse] = useState<BoostCourseDetail | undefined>(initial);
  const canCourses = useCan("/boost/manage", "gerenciar-cursos");
  const canContent = useCan("/boost/manage", "gerenciar-conteudo");
  const canProgress = useCan("/boost/manage", "ver-progresso");

  // Cada aba respeita a sua própria permissão — não existe mais "dono" do curso.
  const tabs = useMemo(
    () => [
      ...(canCourses ? [{ value: "detalhes", label: "Detalhes" }] : []),
      ...(canContent ? [{ value: "conteudo", label: "Conteúdo" }] : []),
      { value: "certificado", label: "Certificado" },
      { value: "orientadores", label: "Orientadores" },
      ...(canProgress ? [{ value: "alunos", label: "Alunos" }] : []),
    ],
    [canCourses, canContent, canProgress],
  );
  const [tabEscolhida, setTab] = useState("");
  const tab = tabs.some((t) => t.value === tabEscolhida) ? tabEscolhida : (tabs[0]?.value ?? "certificado");

  if (!course) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
        <p className="text-sm font-medium">Curso não encontrado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ele pode ter sido excluído, ou seu usuário não tem permissão para gerenciar cursos do Boost.
        </p>
        <Link to="/boost" className="mt-3 inline-block text-sm font-medium text-foreground underline">
          Voltar para os cursos
        </Link>
      </div>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Rooster Boost", onClick: () => navigate({ to: "/boost" }) },
          { label: "Cursos", onClick: () => navigate({ to: "/boost" }) },
          { label: course.title },
        ]}
      />

      <div className="mb-5">
        <Link to="/boost" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Cursos
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          <CourseStatusBadge status={course.status} />
          <CourseLevelBadge level={course.level} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{course.workloadHours}h · {course.category || "Sem categoria"}</p>
      </div>

      <TabBar tabs={tabs} value={tab} onChange={setTab} className="mb-4" />

      {tab === "detalhes" && (
        <CourseDetailsTab
          course={course}
          onSaved={(updated) => setCourse(updated)}
          onDeleted={() => navigate({ to: "/boost" })}
        />
      )}
      {tab === "conteudo" && <CourseContentTab courseId={course.id} initialModules={course.modules} />}
      {tab === "certificado" && <CourseCertificateTab course={course} onSaved={(updated) => setCourse(updated)} />}
      {tab === "orientadores" && <CourseOrientatorsTab courseId={course.id} />}
      {tab === "alunos" && <CourseStudentsTab courseId={course.id} />}
    </>
  );
}
