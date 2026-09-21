import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs, TabBar } from "@/components/shared";
import { CourseLevelBadge, CourseStatusBadge } from "@/components/rooster/boost/manage/badges";
import { CourseDetailsTab } from "@/components/rooster/boost/manage/details-tab";
import { CourseContentTab } from "@/components/rooster/boost/manage/content-tab";
import { CourseStudentsChatTab } from "@/components/rooster/boost/manage/students-chat-tab";
import { boostService, type BoostCourseDetail } from "@/services/mock-api/boost.service";

export const Route = createFileRoute("/boost/manage/$id")({
  loader: async ({ params }) => {
    const course = await boostService.getById(params.id);
    return { course };
  },
  component: BoostCourseManage,
});

const TABS = [
  { value: "detalhes", label: "Detalhes" },
  { value: "conteudo", label: "Conteúdo" },
  { value: "alunos", label: "Alunos e chat" },
];

function BoostCourseManage() {
  const { course: initial } = Route.useLoaderData();
  const navigate = useNavigate();
  const [course, setCourse] = useState<BoostCourseDetail | undefined>(initial);
  const [tab, setTab] = useState("detalhes");

  if (!course) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
        <p className="text-sm font-medium">Curso não encontrado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ou este curso não pertence a você — apenas o instrutor responsável pode gerenciá-lo.
        </p>
        <Link to="/boost" className="mt-3 inline-block text-sm font-medium text-foreground underline">
          Voltar para meus cursos
        </Link>
      </div>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Rooster Boost", onClick: () => navigate({ to: "/boost" }) },
          { label: "Meus cursos", onClick: () => navigate({ to: "/boost" }) },
          { label: course.title },
        ]}
      />

      <div className="mb-5">
        <Link to="/boost" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Meus cursos
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          <CourseStatusBadge status={course.status} />
          <CourseLevelBadge level={course.level} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{course.workloadHours}h · {course.category || "Sem categoria"}</p>
      </div>

      <TabBar tabs={TABS} value={tab} onChange={setTab} className="mb-4" />

      {tab === "detalhes" && (
        <CourseDetailsTab
          course={course}
          onSaved={(updated) => setCourse(updated)}
          onDeleted={() => navigate({ to: "/boost" })}
        />
      )}
      {tab === "conteudo" && <CourseContentTab courseId={course.id} initialModules={course.modules} />}
      {tab === "alunos" && <CourseStudentsChatTab courseId={course.id} />}
    </>
  );
}
